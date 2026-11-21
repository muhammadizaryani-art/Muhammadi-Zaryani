import { InvoiceData, DomicileRecord, CVRecord } from '../types';
import { auth, db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getCurrentUserId = (): string => {
  if (auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  try {
    const localUser = localStorage.getItem('mads_local_user');
    if (localUser) {
      return localUser;
    }
  } catch (e) {}
  return 'local-default-user';
};

const DB_NAME = 'MADigitalStoreDB';
const STORE_NAME = 'invoices';
const CUSTOMER_STORE_NAME = 'customers';
const PRODUCT_STORE_NAME = 'products';
const DOMICILE_STORE_NAME = 'domicile_applicants';
const CV_STORE_NAME = 'cv_records';
const DB_VERSION = 5;

export interface StoredInvoice extends InvoiceData {
  id?: number;
  createdAt: number;
  userId?: string;
}

export interface CustomerRecord {
  id?: number;
  name: string;
  phone: string;
  address: string;
  createdAt: number;
  userId?: string;
}

export interface ProductRecord {
  id?: number;
  name: string;
  defaultPrice?: number;
  createdAt: number;
}

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'invoiceNo' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(CUSTOMER_STORE_NAME)) {
        const cStore = db.createObjectStore(CUSTOMER_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        cStore.createIndex('phone', 'phone', { unique: false });
        cStore.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains(PRODUCT_STORE_NAME)) {
        const pStore = db.createObjectStore(PRODUCT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        pStore.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains(DOMICILE_STORE_NAME)) {
        const dStore = db.createObjectStore(DOMICILE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        dStore.createIndex('cnic', 'cnic', { unique: false });
        dStore.createIndex('applicantName', 'applicantName', { unique: false });
      }
      if (!db.objectStoreNames.contains(CV_STORE_NAME)) {
        const cvStore = db.createObjectStore(CV_STORE_NAME, { keyPath: 'id' });
        cvStore.createIndex('createdAt', 'createdAt', { unique: false });
        cvStore.createIndex('fullName', 'fullName', { unique: false });
      }
    };
  });
};


export const seedDefaultProducts = async (): Promise<void> => {
  const existing = await getAllProductsFromDB();
  if (existing.length === 0) {
    const defaults = [
      'Mobile Accessories',
      'Online Services',
      'Printing',
      'Photocopy',
      'Passport Photos',
      'PVC Cards',
      'Scanning',
      'Internet Services'
    ];
    for (const name of defaults) {
      await saveProductToDB({ name, defaultPrice: 0 });
    }
  }
};

export const saveProductToDB = async (product: { name: string; defaultPrice?: number; id?: number }): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PRODUCT_STORE_NAME);
    const record: any = {
      name: product.name,
      defaultPrice: product.defaultPrice || 0,
      createdAt: product.id ? (product as any).createdAt || Date.now() : Date.now(),
    };
    if (product.id) {
      record.id = product.id;
    }
    const request = product.id ? store.put(record) : store.add(record);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllProductsFromDB = async (): Promise<ProductRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(PRODUCT_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as ProductRecord[];
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteProductFromDB = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PRODUCT_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveCustomerToDB = async (customer: { name: string; phone: string; address: string; id?: number }): Promise<void> => {
  const dbLocal = await openDB();
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;
  const recordId = customer.id || Date.now();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = dbLocal.transaction(CUSTOMER_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CUSTOMER_STORE_NAME);
      const record: any = {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        createdAt: (customer as any).createdAt || Date.now(),
        userId: userId || null,
        id: recordId,
      };
      const request = customer.id ? store.put(record) : store.add(record);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CUSTOMER_STORE_NAME);
  }

  if (uid && db) {
    try {
      const docId = String(recordId);
      const firestoreRecord = {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        createdAt: (customer as any).createdAt || Date.now(),
        userId: uid,
        id: recordId
      };
      await setDoc(doc(db, 'users', uid, 'customers', docId), firestoreRecord, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/customers`);
    }
  }
};

export const getAllCustomersFromDB = async (): Promise<CustomerRecord[]> => {
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  if (uid && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'users', uid, 'customers'));
      const cloudRecords: CustomerRecord[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as CustomerRecord;
        cloudRecords.push(data);
      });

      if (cloudRecords.length > 0) {
        cloudRecords.sort((a, b) => b.createdAt - a.createdAt);
        const dbLocal = await openDB();
        const tx = dbLocal.transaction(CUSTOMER_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CUSTOMER_STORE_NAME);
        for (const rec of cloudRecords) {
          store.put({ ...rec, userId: uid });
        }
        return cloudRecords;
      } else {
        const localRecords = await getAllCustomersFromLocalDB(userId);
        if (localRecords.length > 0) {
          for (const rec of localRecords) {
            const docId = String(rec.id || Date.now());
            await setDoc(doc(db, 'users', uid, 'customers', docId), {
              ...rec,
              userId: uid
            }, { merge: true });
          }
          return localRecords;
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/customers`);
    }
  }

  return getAllCustomersFromLocalDB(userId);
};

const getAllCustomersFromLocalDB = async (userId: string): Promise<CustomerRecord[]> => {
  const dbLocal = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbLocal.transaction(CUSTOMER_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CUSTOMER_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      let results = request.result as CustomerRecord[];
      if (userId) {
        results = results.filter(c => c.userId === userId || (userId === 'local-default-user' && !c.userId));
      } else {
        results = results.filter(c => !c.userId);
      }
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteCustomerFromDB = async (id: number): Promise<void> => {
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  const dbLocal = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = dbLocal.transaction(CUSTOMER_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CUSTOMER_STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result as CustomerRecord;
        if (record) {
          if (userId && record.userId && record.userId !== userId) {
            reject(new Error('Unauthorized to delete another user\'s customer'));
            return;
          }
          const delReq = store.delete(id);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => reject(delReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, CUSTOMER_STORE_NAME);
  }

  if (uid && db) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'customers', String(id)));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/customers`);
    }
  }
};

export const saveInvoiceToDB = async (invoice: InvoiceData & { createdAt?: number; userId?: string }): Promise<void> => {
  const dbLocal = await openDB();
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = dbLocal.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record: StoredInvoice = {
        ...invoice,
        createdAt: (invoice as StoredInvoice).createdAt || Date.now(),
        userId: userId || invoice.userId || null,
      };
      const request = store.put(record);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, STORE_NAME);
  }

  if (uid && db) {
    try {
      const docId = String(invoice.invoiceNo);
      const firestoreRecord = {
        ...invoice,
        createdAt: (invoice as StoredInvoice).createdAt || Date.now(),
        userId: uid
      };
      await setDoc(doc(db, 'users', uid, 'invoices', docId), firestoreRecord, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/invoices`);
    }
  }
};

export const getAllInvoicesFromDB = async (): Promise<StoredInvoice[]> => {
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  if (uid && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'users', uid, 'invoices'));
      const cloudRecords: StoredInvoice[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as StoredInvoice;
        cloudRecords.push(data);
      });

      if (cloudRecords.length > 0) {
        cloudRecords.sort((a, b) => {
          const timeA = a.createdAt || 0;
          const timeB = b.createdAt || 0;
          if (timeB !== timeA) return timeB - timeA;
          return b.invoiceNo.localeCompare(a.invoiceNo, undefined, { numeric: true });
        });
        const dbLocal = await openDB();
        const tx = dbLocal.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const rec of cloudRecords) {
          store.put({ ...rec, userId: uid });
        }
        return cloudRecords;
      } else {
        const localRecords = await getAllInvoicesFromLocalDB(userId);
        if (localRecords.length > 0) {
          for (const rec of localRecords) {
            const docId = String(rec.invoiceNo);
            await setDoc(doc(db, 'users', uid, 'invoices', docId), {
              ...rec,
              userId: uid
            }, { merge: true });
          }
          return localRecords;
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/invoices`);
    }
  }

  return getAllInvoicesFromLocalDB(userId);
};

const getAllInvoicesFromLocalDB = async (userId: string): Promise<StoredInvoice[]> => {
  const dbLocal = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbLocal.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      let results = request.result as StoredInvoice[];
      if (userId) {
        results = results.filter(r => r.userId === userId || (userId === 'local-default-user' && !r.userId));
      } else {
        results = results.filter(r => !r.userId);
      }
      results.sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        if (timeB !== timeA) return timeB - timeA;
        return b.invoiceNo.localeCompare(a.invoiceNo, undefined, { numeric: true });
      });
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteInvoiceFromDB = async (invoiceNo: string): Promise<void> => {
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  const dbLocal = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = dbLocal.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(invoiceNo);
      getReq.onsuccess = () => {
        const record = getReq.result as StoredInvoice;
        if (record) {
          if (userId && record.userId && record.userId !== userId) {
            reject(new Error('Unauthorized to delete another user\'s invoice'));
            return;
          }
          const delReq = store.delete(invoiceNo);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => reject(delReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, STORE_NAME);
  }

  if (uid && db) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'invoices', invoiceNo));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/invoices`);
    }
  }
};

export const getInvoiceByNoFromDB = async (invoiceNo: string): Promise<StoredInvoice | null> => {
  const db = await openDB();
  const userId = getCurrentUserId();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(invoiceNo);
    request.onsuccess = () => {
      const record = request.result as StoredInvoice;
      if (!record) {
        resolve(null);
        return;
      }
      if (userId && record.userId && record.userId !== userId) {
        resolve(null);
        return;
      }
      resolve(record);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getNextInvoiceNo = async (): Promise<string> => {
  try {
    const invoices = await getAllInvoicesFromDB();
    if (invoices.length === 0) {
      return 'INV-0001';
    }
    let maxNum = 0;
    for (const inv of invoices) {
      const match = inv.invoiceNo.match(/(?:INV|MADS)-?(\d+)/i) || inv.invoiceNo.match(/(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    return `INV-${String(nextNum).padStart(4, '0')}`;
  } catch (e) {
    return 'INV-0001';
  }
};

export interface BackupData {
  backupVersion: number;
  appName: string;
  createdAt: string;
  invoices: StoredInvoice[];
  customers: CustomerRecord[];
  products: ProductRecord[];
}

export const exportAppData = async (): Promise<BackupData> => {
  const invoices = await getAllInvoicesFromDB();
  const customers = await getAllCustomersFromDB();
  const products = await getAllProductsFromDB();
  return {
    backupVersion: 1,
    appName: 'MA DIGITAL STORE',
    createdAt: new Date().toISOString(),
    invoices,
    customers,
    products,
  };
};

export const importAppData = async (rawData: any): Promise<void> => {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Invalid backup file format: not a valid JSON object.');
  }
  if (rawData.appName !== 'MA DIGITAL STORE' || typeof rawData.backupVersion !== 'number') {
    throw new Error('Invalid backup file: missing or incorrect MA DIGITAL STORE metadata.');
  }
  if (!Array.isArray(rawData.invoices) || !Array.isArray(rawData.customers) || !Array.isArray(rawData.products)) {
    throw new Error('Invalid backup file: missing required data arrays (invoices, customers, or products).');
  }

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME, CUSTOMER_STORE_NAME, PRODUCT_STORE_NAME], 'readwrite');
    const invStore = transaction.objectStore(STORE_NAME);
    const custStore = transaction.objectStore(CUSTOMER_STORE_NAME);
    const prodStore = transaction.objectStore(PRODUCT_STORE_NAME);

    const clearInv = invStore.clear();
    clearInv.onerror = () => reject(clearInv.error);

    const clearCust = custStore.clear();
    clearCust.onerror = () => reject(clearCust.error);

    const clearProd = prodStore.clear();
    clearProd.onerror = () => reject(clearProd.error);

    transaction.oncomplete = () => {
      const writeTx = db.transaction([STORE_NAME, CUSTOMER_STORE_NAME, PRODUCT_STORE_NAME], 'readwrite');
      const wInv = writeTx.objectStore(STORE_NAME);
      const wCust = writeTx.objectStore(CUSTOMER_STORE_NAME);
      const wProd = writeTx.objectStore(PRODUCT_STORE_NAME);

      for (const inv of rawData.invoices) {
        wInv.put(inv);
      }
      for (const cust of rawData.customers) {
        wCust.put(cust);
      }
      for (const prod of rawData.products) {
        wProd.put(prod);
      }

      writeTx.oncomplete = () => resolve();
      writeTx.onerror = () => reject(writeTx.error);
    };

    transaction.onerror = () => reject(transaction.error);
  });
};

export const getInvoiceFingerprint = (inv: InvoiceData): string => {
  return JSON.stringify({
    invoiceNo: inv.invoiceNo,
    customerName: inv.customerName,
    customerPhone: inv.customerPhone,
    address: inv.address,
    date: inv.date,
    dueDate: inv.dueDate,
    items: inv.items?.map(i => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice, discount: i.discount })),
    discountOverall: inv.discountOverall,
    paymentMethods: inv.paymentMethods,
    advance: inv.advance,
    notes: inv.notes,
  });
};

export const saveDomicileToDB = async (record: DomicileRecord): Promise<void> => {
  const dbLocal = await openDB();
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = dbLocal.transaction(DOMICILE_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(DOMICILE_STORE_NAME);
      const recordId = record.id !== undefined && record.id !== null && !isNaN(Number(record.id)) ? Number(record.id) : undefined;
      const data: any = {
        ...record,
        id: recordId,
        userId: userId,
        createdAt: record.createdAt || Date.now(),
      };
      if (data.id === undefined || data.id === null || isNaN(data.id)) {
        delete data.id;
      }
      const request = data.id !== undefined ? store.put(data) : store.add(data);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, DOMICILE_STORE_NAME);
  }

  if (uid && db) {
    try {
      const docId = String(record.id || Date.now());
      const firestoreRecord = {
        ...record,
        id: record.id || Number(docId),
        userId: uid,
        createdAt: record.createdAt || Date.now()
      };
      await setDoc(doc(db, 'users', uid, 'domicile_applicants', docId), firestoreRecord, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/domicile_applicants`);
    }
  }
};

export const getAllDomicilesFromDB = async (): Promise<DomicileRecord[]> => {
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  if (uid && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'users', uid, 'domicile_applicants'));
      const cloudRecords: DomicileRecord[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as DomicileRecord;
        cloudRecords.push(data);
      });

      if (cloudRecords.length > 0) {
        cloudRecords.sort((a, b) => b.createdAt - a.createdAt);
        // Cache locally
        const dbLocal = await openDB();
        const tx = dbLocal.transaction(DOMICILE_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DOMICILE_STORE_NAME);
        for (const rec of cloudRecords) {
          store.put({ ...rec, userId: uid });
        }
        return cloudRecords;
      } else {
        // Migrate existing local records if Firestore is empty for this user
        const localRecords = await getAllDomicilesFromLocalDB(userId);
        if (localRecords.length > 0) {
          for (const rec of localRecords) {
            const docId = String(rec.id || Date.now());
            await setDoc(doc(db, 'users', uid, 'domicile_applicants', docId), {
              ...rec,
              userId: uid
            }, { merge: true });
          }
          return localRecords;
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/domicile_applicants`);
    }
  }

  return getAllDomicilesFromLocalDB(userId);
};

const getAllDomicilesFromLocalDB = async (userId: string): Promise<DomicileRecord[]> => {
  const dbLocal = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbLocal.transaction(DOMICILE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(DOMICILE_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      let results = request.result as (DomicileRecord & { userId?: string })[];
      if (userId) {
        results = results.filter(r => r.userId === userId || (!r.userId && userId === 'local-default-user'));
      }
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteDomicileFromDB = async (idOrKey: number | string): Promise<void> => {
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  const dbLocal = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = dbLocal.transaction(DOMICILE_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(DOMICILE_STORE_NAME);

      const numId = Number(idOrKey);
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const record = cursor.value as DomicileRecord & { userId?: string };
          const matchId = record.id !== undefined && record.id !== null && (record.id === idOrKey || Number(record.id) === numId || String(record.id) === String(idOrKey));
          const matchCnic = record.cnic && String(record.cnic).trim().toLowerCase() === String(idOrKey).trim().toLowerCase();

          if (matchId || matchCnic) {
            if (userId && record.userId && record.userId !== userId) {
              cursor.continue();
              return;
            }
            store.delete(cursor.primaryKey);
          }
          cursor.continue();
        }
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, DOMICILE_STORE_NAME);
  }

  if (uid && db) {
    try {
      const docId = String(idOrKey);
      await deleteDoc(doc(db, 'users', uid, 'domicile_applicants', docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/domicile_applicants`);
    }
  }
};

export const saveCVToDB = async (record: CVRecord): Promise<void> => {
  const dbLocal = await openDB();
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = dbLocal.transaction(CV_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CV_STORE_NAME);
      const data: any = {
        ...record,
        userId: userId,
        createdAt: record.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CV_STORE_NAME);
  }

  if (uid && db) {
    try {
      const docId = String(record.id);
      const firestoreRecord = {
        ...record,
        userId: uid,
        createdAt: record.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'users', uid, 'cv_records', docId), firestoreRecord, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/cv_records`);
    }
  }
};

export const getAllCVsFromDB = async (): Promise<CVRecord[]> => {
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  if (uid && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'users', uid, 'cv_records'));
      const cloudRecords: CVRecord[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as CVRecord;
        cloudRecords.push(data);
      });

      if (cloudRecords.length > 0) {
        cloudRecords.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        const dbLocal = await openDB();
        const tx = dbLocal.transaction(CV_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CV_STORE_NAME);
        for (const rec of cloudRecords) {
          store.put({ ...rec, userId: uid });
        }
        return cloudRecords;
      } else {
        const localRecords = await getAllCVsFromLocalDB(userId);
        if (localRecords.length > 0) {
          for (const rec of localRecords) {
            const docId = String(rec.id);
            await setDoc(doc(db, 'users', uid, 'cv_records', docId), {
              ...rec,
              userId: uid
            }, { merge: true });
          }
          return localRecords;
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/cv_records`);
    }
  }

  return getAllCVsFromLocalDB(userId);
};

const getAllCVsFromLocalDB = async (userId: string): Promise<CVRecord[]> => {
  const dbLocal = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbLocal.transaction(CV_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CV_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      let results = request.result as (CVRecord & { userId?: string })[];
      if (userId) {
        results = results.filter(r => r.userId === userId || (!r.userId && userId === 'local-default-user'));
      }
      results.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteCVFromDB = async (id: string): Promise<void> => {
  const userId = getCurrentUserId();
  const uid = auth?.currentUser?.uid;

  const dbLocal = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = dbLocal.transaction(CV_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CV_STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result as CVRecord & { userId?: string };
        if (record) {
          if (userId && record.userId && record.userId !== userId) {
            reject(new Error('Unauthorized to delete another user\'s CV'));
            return;
          }
          const delReq = store.delete(id);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => reject(delReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, CV_STORE_NAME);
  }

  if (uid && db) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'cv_records', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/cv_records`);
    }
  }
};




