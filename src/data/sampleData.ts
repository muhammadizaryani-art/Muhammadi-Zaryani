import { InvoiceData } from '../types';

export const getInitialInvoiceData = (): InvoiceData => {
  const items = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    description: '',
    qty: 0,
    unitPrice: 0,
    discount: 0,
  }));

  return {
    invoiceNo: `MADS-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    address: '',
    paymentMethods: {
      cash: true,
      easyPaisa: false,
      jazzCash: false,
      bank: false,
      whatsApp: false,
    },
    items,
    advance: 0,
    notes: 'Thank you for choosing MA Digital Store. We appreciate your business.',
    discountOverall: 0,
  };
};

export const getSampleInvoiceData = (): InvoiceData => {
  const sampleDescriptions = [
    'iPhone 14 Pro Max Tempered Glass & Back Protector',
    'Fast Charger 20W Type-C Adapter',
    'Wireless Bluetooth Earbuds (AirPods Pro clone)',
    'Online CNIC Verification & Form Submission',
    'Passport Size Photos (8 pcs)',
    'PVC Smart Identity Card Printing',
    'Mobile Data Cable (Type-C to Lightning)',
    'Document Scanning & Email',
    'Ring Light 10 inch with Tripod Stand',
    'Mobile Silicon Back Cover Case',
  ];

  const sampleQtys = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const samplePrices = [1200, 1500, 2500, 500, 300, 400, 600, 200, 3500, 500];
  const sampleDiscounts = [100, 0, 200, 0, 0, 0, 50, 0, 300, 0];

  const items = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    description: sampleDescriptions[i] || '',
    qty: sampleQtys[i] || 0,
    unitPrice: samplePrices[i] || 0,
    discount: sampleDiscounts[i] || 0,
  }));

  return {
    invoiceNo: 'MADS-4829',
    date: new Date().toISOString().split('T')[0],
    customerName: 'Muhammad Usman Khan',
    customerPhone: '0300-1234567',
    address: 'Main Bazaar, Mardan',
    paymentMethods: {
      cash: true,
      easyPaisa: true,
      jazzCash: false,
      bank: false,
      whatsApp: false,
    },
    items,
    advance: 2000,
    notes: 'Thank you for choosing MA Digital Store. We appreciate your business. Warranty claims valid within 7 days.',
    discountOverall: 0,
  };
};
