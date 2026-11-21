import React, { useState, useEffect } from 'react';
import { InvoiceData } from '../types';
import { Plus, Trash2, RotateCcw, FileText, CheckCircle2, Users, Search, UserPlus } from 'lucide-react';
import { 
  getAllCustomersFromDB, 
  saveCustomerToDB, 
  CustomerRecord,
  getAllProductsFromDB,
  saveProductToDB,
  deleteProductFromDB,
  seedDefaultProducts,
  ProductRecord
} from '../db/indexedDB';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  onReset: () => void;
  onLoadSample: () => void;
  onGenerate: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  data,
  onChange,
  onReset,
  onLoadSample,
  onGenerate,
}) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeRowForProduct, setActiveRowForProduct] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [editingProdId, setEditingProdId] = useState<number | null>(null);
  const [prodSaveMsg, setProdSaveMsg] = useState('');

  useEffect(() => {
    getAllCustomersFromDB().then(setCustomers).catch(() => {});
    seedDefaultProducts()
      .then(() => getAllProductsFromDB())
      .then(setProducts)
      .catch(() => {});
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      alert('Please enter product/service name.');
      return;
    }
    try {
      await saveProductToDB({
        id: editingProdId || undefined,
        name: newProdName.trim(),
        defaultPrice: Number(newProdPrice) || 0,
      });
      setNewProdName('');
      setNewProdPrice('');
      setEditingProdId(null);
      const updated = await getAllProductsFromDB();
      setProducts(updated);
      setProdSaveMsg('Saved successfully!');
      setTimeout(() => setProdSaveMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Failed to save product/service.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Are you sure you want to delete this product/service?')) {
      try {
        await deleteProductFromDB(id);
        const updated = await getAllProductsFromDB();
        setProducts(updated);
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  const handleEditProductClick = (prod: ProductRecord) => {
    setEditingProdId(prod.id || null);
    setNewProdName(prod.name);
    setNewProdPrice(prod.defaultPrice ? String(prod.defaultPrice) : '');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSelectProduct = (prod: ProductRecord) => {
    if (activeRowForProduct !== null) {
      const newItems = [...data.items];
      const item = { ...newItems[activeRowForProduct] };
      item.description = prod.name;
      if (prod.defaultPrice && prod.defaultPrice > 0 && (!item.unitPrice || item.unitPrice === 0)) {
        item.unitPrice = prod.defaultPrice;
      }
      newItems[activeRowForProduct] = item;
      onChange({ ...data, items: newItems });
    }
    setShowProductModal(false);
    setActiveRowForProduct(null);
  };

  const handleSaveCustomer = async () => {
    if (!data.customerName.trim()) {
      alert('Please enter a customer name to save.');
      return;
    }
    try {
      await saveCustomerToDB({
        name: data.customerName,
        phone: data.customerPhone,
        address: data.address,
      });
      const updated = await getAllCustomersFromDB();
      setCustomers(updated);
      setSaveSuccessMsg('Customer saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save customer:', err);
      alert('Failed to save customer.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const handleHeaderChange = (field: keyof InvoiceData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handlePaymentChange = (key: keyof InvoiceData['paymentMethods']) => {
    onChange({
      ...data,
      paymentMethods: {
        ...data.paymentMethods,
        [key]: !data.paymentMethods[key],
      },
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...data.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'description' ? value : Number(value) || 0,
    };
    onChange({ ...data, items: updatedItems });
  };

  const addRow = () => {
    if (data.items.length >= 25) return;
    const newItem = {
      id: data.items.length + 1,
      description: '',
      qty: 0,
      unitPrice: 0,
      discount: 0,
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeRow = (index: number) => {
    const updatedItems = data.items.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      id: idx + 1,
    }));
    onChange({ ...data, items: updatedItems });
  };

  const subtotal = data.items.reduce((acc, item) => acc + (item.qty * item.unitPrice) - item.discount, 0);
  const grandTotal = Math.max(0, subtotal - (data.discountOverall || 0));
  const receivedAmount = data.advance || 0;
  const remainingBalance = Math.max(0, grandTotal - receivedAmount);

  let paymentStatus = 'UNPAID';
  if (grandTotal > 0 && receivedAmount >= grandTotal) {
    paymentStatus = 'PAID';
  } else if (receivedAmount > 0 && receivedAmount < grandTotal) {
    paymentStatus = 'PARTIALLY PAID';
  } else if (receivedAmount === 0) {
    paymentStatus = 'UNPAID';
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 space-y-8 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Invoice Data Editor
          </h2>
          <p className="text-sm text-slate-500">
            Fill in customer details and items below. Changes update the preview in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-gradient-to-t from-emerald-50 to-emerald-100/60 hover:from-emerald-100 hover:to-emerald-200/80 border border-emerald-200 rounded-xl shadow-[0_2px_8px_rgba(16,185,129,0.12)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Load Sample
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-gradient-to-t from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 rounded-xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" /> Reset
          </button>
          <button
            type="button"
            onClick={onGenerate}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-t from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-blue-500/30 flex items-center gap-1.5"
          >
            View / Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Details & Customer Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800">Invoice Information</h3>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice No:</label>
            <input
              type="text"
              value={data.invoiceNo}
              onChange={(e) => handleHeaderChange('invoiceNo', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="MADS-XXXX"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date:</label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => handleHeaderChange('date', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date (Optional):</label>
            <input
              type="date"
              value={data.dueDate || ''}
              onChange={(e) => handleHeaderChange('dueDate', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800">Customer Details</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  getAllCustomersFromDB().then(setCustomers).catch(() => {});
                  setShowCustomerModal(true);
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Users className="w-3.5 h-3.5" /> Select / Search
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1 shadow-2xs"
                title="Save customer to database"
              >
                <UserPlus className="w-3.5 h-3.5" /> Save Customer
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded text-xs font-medium">
              {saveSuccessMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name:</label>
            <input
              type="text"
              value={data.customerName}
              onChange={(e) => handleHeaderChange('customerName', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter customer full name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Phone:</label>
              <input
                type="text"
                value={data.customerPhone}
                onChange={(e) => handleHeaderChange('customerPhone', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="03XX-XXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address:</label>
              <input
                type="text"
                value={data.address}
                onChange={(e) => handleHeaderChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="City / Area"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800 mb-3">Payment Methods</h3>
        <div className="flex flex-wrap gap-6 items-center">
          {[
            { key: 'cash', label: 'Cash' },
            { key: 'easyPaisa', label: 'EasyPaisa' },
            { key: 'jazzCash', label: 'JazzCash' },
            { key: 'bank', label: 'Bank' },
            { key: 'whatsApp', label: 'WhatsApp' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.paymentMethods[key as keyof InvoiceData['paymentMethods']]}
                onChange={() => handlePaymentChange(key as keyof InvoiceData['paymentMethods'])}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Items Table Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800">
            Invoice Items ({data.items.length} Rows)
          </h3>
          <button
            type="button"
            onClick={addRow}
            className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-gradient-to-t from-blue-50 to-blue-100/60 hover:from-blue-100 hover:to-blue-200/80 border border-blue-200 rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.12)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-blue-600" /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-blue-600 text-white text-xs font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-2 w-10 text-center">No.</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-2 w-28 text-center">Qty</th>
                <th className="py-2.5 px-2 w-36">Unit Price</th>
                <th className="py-2.5 px-2 w-36">Discount</th>
                <th className="py-2.5 px-3 w-28 text-right">Total</th>
                <th className="py-2.5 px-2 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.items.map((item, index) => {
                const total = (item.qty * item.unitPrice) - item.discount;
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-2 text-center font-medium text-slate-500">{index + 1}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description or service..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRowForProduct(index);
                            getAllProductsFromDB().then(setProducts).catch(() => {});
                            setShowProductModal(true);
                          }}
                          className="px-2 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded border border-slate-300 transition-colors shrink-0 flex items-center gap-1"
                          title="Select or Search Product / Service"
                        >
                          <Search className="w-3.5 h-3.5" /> Select
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.qty === 0 ? '' : item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm text-center font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm text-center font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.discount === 0 ? '' : item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm text-center font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-800">
                      Rs. {total > 0 ? total.toLocaleString() : '0'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advance Payment, Payment Status & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Payment Status & Advance (Rs.):</label>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                paymentStatus === 'PAID' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : paymentStatus === 'PARTIALLY PAID' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {paymentStatus}
              </span>
            </div>

            {/* Status Control Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleHeaderChange('advance', grandTotal)}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                  paymentStatus === 'PAID'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                PAID
              </button>
              <button
                type="button"
                onClick={() => {
                  if (receivedAmount === 0 || receivedAmount >= grandTotal) {
                    handleHeaderChange('advance', Math.round(grandTotal / 2));
                  }
                }}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                  paymentStatus === 'PARTIALLY PAID'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                PARTIAL
              </button>
              <button
                type="button"
                onClick={() => handleHeaderChange('advance', 0)}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                  paymentStatus === 'UNPAID'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                UNPAID
              </button>
            </div>

            <input
              type="number"
              min="0"
              max={grandTotal}
              value={data.advance === 0 ? '' : data.advance}
              onChange={(e) => {
                const val = Math.min(grandTotal, Math.max(0, Number(e.target.value) || 0));
                handleHeaderChange('advance', val);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter received advance amount..."
            />
          </div>

          {/* Live Payment Summary Box */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
            <div className="flex justify-between font-semibold text-slate-600">
              <span>Grand Total:</span>
              <span className="font-bold text-slate-900">Rs. {grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-600">
              <span>Received:</span>
              <span className="font-bold text-emerald-600">Rs. {receivedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-600 border-t border-slate-100 pt-1.5">
              <span>Remaining Balance:</span>
              <span className={`font-black ${remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                Rs. {remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms:</label>
          <textarea
            rows={5}
            value={data.notes}
            onChange={(e) => handleHeaderChange('notes', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            placeholder="Thank you message or warranty notes..."
          />
        </div>
      </div>

      {/* Customer Selection & Search Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Customer Database</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by customer name or phone number..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No saved customers found. Fill in customer details and click "Save Customer" to store them.
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      onChange({
                        ...data,
                        customerName: cust.name,
                        customerPhone: cust.phone,
                        address: cust.address,
                      });
                      setShowCustomerModal(false);
                    }}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-700">{cust.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>📞 {cust.phone || 'No phone'}</span>
                        <span>📍 {cust.address || 'No address'}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 group-hover:bg-blue-600 group-hover:text-white rounded-lg shadow-2xs transition-colors">
                      Select
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product / Service Selection & Management Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Select Product / Service</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProductModal(false);
                  setActiveRowForProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* Add / Edit Form */}
            <form onSubmit={handleSaveProduct} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase text-slate-700">
                {editingProdId ? 'Edit Product / Service' : 'Add New Product / Service'}
              </div>
              {prodSaveMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded text-xs font-medium">
                  {prodSaveMsg}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Product or Service Name"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="Default Price (Opt)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors shrink-0"
                  >
                    {editingProdId ? 'Update' : 'Save'}
                  </button>
                  {editingProdId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProdId(null);
                        setNewProdName('');
                        setNewProdPrice('');
                      }}
                      className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs transition-colors shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products or services..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No products or services found. Add one above!
                </div>
              ) : (
                filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <div 
                      onClick={() => handleSelectProduct(prod)}
                      className="flex-1 cursor-pointer pr-3"
                    >
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-700">{prod.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Default Price: Rs. {prod.defaultPrice ? prod.defaultPrice.toLocaleString() : '0'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectProduct(prod)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditProductClick(prod)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        title="Edit product"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => prod.id && handleDeleteProduct(prod.id)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition-colors"
                        title="Delete product"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => {
                  setShowProductModal(false);
                  setActiveRowForProduct(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
