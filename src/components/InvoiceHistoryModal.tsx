import React, { useState, useEffect, useRef } from 'react';
import { InvoiceData } from '../types';
import { StoredInvoice, getAllInvoicesFromDB, deleteInvoiceFromDB, getNextInvoiceNo, exportAppData, importAppData } from '../db/indexedDB';
import { X, Search, Trash2, Eye, Edit3, Calendar, User, Phone, FileText, Plus, Copy, Download, Upload, Filter, RotateCcw } from 'lucide-react';

interface InvoiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInvoice: (invoice: InvoiceData, mode: 'preview' | 'edit') => void;
  onNewInvoice: (newNo: string) => void;
}

export const InvoiceHistoryModal: React.FC<InvoiceHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectInvoice,
  onNewInvoice,
}) => {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIALLY PAID' | 'UNPAID'>('ALL');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await getAllInvoicesFromDB();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoice history from IndexedDB:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (invoiceNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoiceFromDB(invoiceNo);
        await loadInvoices();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
        alert('Failed to delete invoice.');
      }
    }
  };

  const handleCreateNew = async () => {
    const nextNo = await getNextInvoiceNo();
    onNewInvoice(nextNo);
    onClose();
  };

  const handleDuplicate = async (inv: StoredInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextNo = await getNextInvoiceNo();
      const today = new Date().toISOString().split('T')[0];
      const duplicated: InvoiceData = {
        invoiceNo: nextNo,
        date: today,
        dueDate: '',
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        address: inv.address,
        paymentMethods: inv.paymentMethods ? { ...inv.paymentMethods } : { cash: true, easyPaisa: false, jazzCash: false, bank: false, whatsApp: false },
        items: inv.items ? JSON.parse(JSON.stringify(inv.items)) : [],
        discountOverall: inv.discountOverall || 0,
        advance: 0,
        notes: inv.notes || '',
      };
      onSelectInvoice(duplicated, 'edit');
      onClose();
    } catch (error) {
      console.error('Failed to duplicate invoice:', error);
      alert('Failed to duplicate invoice.');
    }
  };

  const handleBackup = async () => {
    try {
      const data = await exportAppData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `MA-DIGITAL-STORE-BACKUP-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to backup data:', err);
      alert('Failed to export backup data.');
    }
  };

  const handleRestoreClick = () => {
    if (window.confirm('Restoring this backup will replace the current saved data. Continue?')) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('The selected file is not a valid JSON document.');
      }

      await importAppData(parsed);
      alert('Data restored successfully! The application will now reload.');
      window.location.reload();
    } catch (err: any) {
      console.error('Restore failed:', err);
      alert(`Restore failed: ${err.message || 'Invalid or corrupted backup file. Existing data was not modified.'}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const isThisWeek = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const firstDayOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    firstDayOfWeek.setDate(diff);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    return d >= firstDayOfWeek && d <= lastDayOfWeek;
  };

  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const currentYM = getTodayStr().substring(0, 7);
    return dateStr.startsWith(currentYM);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || dateFilter !== 'all' || startDate !== '' || endDate !== '';

  // Filter and sort invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.toLowerCase().includes(q)
    );

    const subtotal = inv.items.reduce((acc, item) => acc + (item.qty * item.unitPrice) - item.discount, 0);
    const grandTotal = Math.max(0, subtotal - (inv.discountOverall || 0));
    const remaining = Math.max(0, grandTotal - (inv.advance || 0));
    const invStatus = grandTotal === 0 ? 'UNPAID' : (remaining === 0 ? 'PAID' : ((inv.advance || 0) > 0 && remaining > 0 ? 'PARTIALLY PAID' : 'UNPAID'));

    const matchesStatus = statusFilter === 'ALL' || invStatus === statusFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = inv.date === getTodayStr();
    } else if (dateFilter === 'this_week') {
      matchesDate = isThisWeek(inv.date);
    } else if (dateFilter === 'this_month') {
      matchesDate = isThisMonth(inv.date);
    } else if (dateFilter === 'custom') {
      if (startDate && inv.date < startDate) matchesDate = false;
      if (endDate && inv.date > endDate) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  filteredInvoices.sort((a, b) => {
    const timeA = a.createdAt || 0;
    const timeB = b.createdAt || 0;
    if (sortOrder === 'newest') {
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.invoiceNo.localeCompare(a.invoiceNo, undefined, { numeric: true });
    } else {
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.invoiceNo.localeCompare(b.invoiceNo, undefined, { numeric: true });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Invoice History</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">IndexedDB local storage ({filteredInvoices.length} of {invoices.length})</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCreateNew}
              className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-t from-teal-700 to-cyan-600 hover:from-teal-600 hover:to-cyan-500 text-white border border-teal-500/30 shadow-[0_4px_14px_rgba(13,148,136,0.35)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Invoice
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters Toolbar */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 space-y-2 sm:space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice no, name, phone..."
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <label className="text-xs font-semibold text-slate-600">Sort:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="px-2.5 py-1.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-0.5">
                  <Filter className="w-3.5 h-3.5 text-blue-600" /> Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="PAID">PAID</option>
                  <option value="PARTIALLY PAID">PARTIAL</option>
                  <option value="UNPAID">UNPAID</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-0.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Date:
                </span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Custom Date Range Inputs */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 bg-gradient-to-t from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 text-slate-700 rounded-xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 text-xs font-semibold flex items-center gap-1.5"
                title="Reset search and filters"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Invoices List / Table */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading saved invoices from IndexedDB...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-700">No Invoices Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {hasActiveFilters ? 'No invoices match your search or filter criteria. Try clearing filters.' : 'Click "Save Invoice" when editing or viewing an invoice to save it permanently to your history.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gradient-to-t from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white border border-blue-500/30 shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
                >
                  <RotateCcw className="w-4 h-4" /> Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredInvoices.map((inv) => {
                const subtotal = inv.items.reduce((acc, item) => acc + (item.qty * item.unitPrice) - item.discount, 0);
                const grandTotal = Math.max(0, subtotal - (inv.discountOverall || 0));
                const remaining = Math.max(0, grandTotal - (inv.advance || 0));
                const invStatus = grandTotal === 0 ? 'UNPAID' : (remaining === 0 ? 'PAID' : ((inv.advance || 0) > 0 && remaining > 0 ? 'PARTIALLY PAID' : 'UNPAID'));

                return (
                  <div
                    key={inv.invoiceNo}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                          {inv.invoiceNo}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                          invStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          invStatus === 'PARTIALLY PAID' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invStatus}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {inv.date || 'N/A'}
                        </span>
                        {inv.dueDate && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="font-semibold text-slate-700">Due:</span> {inv.dueDate}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        {inv.customerName || 'Walk-in Customer'}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {inv.customerPhone || 'No Phone'}
                        </span>
                        <span>•</span>
                        <span>{inv.items.filter(i => i.qty > 0).length} Items</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-between md:justify-end">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Grand Total</div>
                        <div className="text-sm font-bold text-slate-900">Rs. {grandTotal.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Advance</div>
                        <div className="text-sm font-semibold text-emerald-600">Rs. {(inv.advance || 0).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Remaining</div>
                        <div className="text-sm font-bold text-blue-600">Rs. {remaining.toLocaleString()}</div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-0 md:ml-4">
                        <button
                          onClick={(e) => handleDuplicate(inv, e)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-gradient-to-t from-emerald-50 to-emerald-100/60 hover:from-emerald-100 hover:to-emerald-200/80 border border-emerald-200 rounded-xl shadow-[0_2px_8px_rgba(16,185,129,0.12)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
                          title="Duplicate Invoice"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-600" /> Duplicate
                        </button>
                        <button
                          onClick={() => {
                            onSelectInvoice(inv, 'preview');
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-gradient-to-t from-blue-50 to-blue-100/60 hover:from-blue-100 hover:to-blue-200/80 border border-blue-200/80 rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.12)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
                          title="View Invoice"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" /> View
                        </button>
                        <button
                          onClick={() => {
                            onSelectInvoice(inv, 'edit');
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-gradient-to-t from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 border border-slate-200/90 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
                          title="Edit Invoice"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit
                        </button>
                        <button
                          onClick={(e) => handleDelete(inv.invoiceNo, e)}
                          className="p-2 text-red-600 bg-gradient-to-t from-red-50 to-red-100/60 hover:from-red-100 hover:to-red-200/80 border border-red-200 rounded-xl shadow-[0_2px_8px_rgba(239,68,68,0.12)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={handleBackup}
              className="px-3.5 py-2 bg-gradient-to-t from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-emerald-500/30 flex items-center gap-1.5"
              title="Download backup file of invoices, customers, and products"
            >
              <Download className="w-4 h-4" /> Backup Data
            </button>
            <button
              type="button"
              onClick={handleRestoreClick}
              className="px-3.5 py-2 bg-gradient-to-t from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white rounded-xl font-semibold shadow-[0_4px_14px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-amber-500/30 flex items-center gap-1.5"
              title="Restore data from a backup JSON file"
            >
              <Upload className="w-4 h-4" /> Restore Data
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-t from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 text-slate-700 rounded-xl font-semibold border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
