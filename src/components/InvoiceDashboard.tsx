import React, { useState, useEffect } from 'react';
import { StoredInvoice, getAllInvoicesFromDB } from '../db/indexedDB';
import { 
  TrendingUp, 
  Layers, 
  Calendar, 
  DollarSign, 
  Wallet, 
  ArrowDownRight, 
  CreditCard, 
  Smartphone, 
  Building2, 
  MessageSquare, 
  Activity, 
  FileText,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';

interface InvoiceDashboardProps {
  refreshTrigger?: number;
}

export const InvoiceDashboard: React.FC<InvoiceDashboardProps> = ({ refreshTrigger }) => {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getAllInvoicesFromDB()
      .then((data) => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [refreshTrigger]);

  // Calculations
  const totalInvoices = invoices.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7); // YYYY-MM

  let totalSales = 0;
  let todaysSales = 0;
  let thisMonthsSales = 0;
  let totalReceived = 0;
  let totalRemaining = 0;

  // Payment method counters
  let paymentStats = {
    cash: 0,
    easyPaisa: 0,
    jazzCash: 0,
    bank: 0,
    whatsApp: 0,
  };

  invoices.forEach((inv) => {
    const subtotal = inv.items.reduce((acc, item) => acc + (item.qty * item.unitPrice) - item.discount, 0);
    const grandTotal = Math.max(0, subtotal - (inv.discountOverall || 0));
    const advance = inv.advance || 0;
    const remaining = Math.max(0, grandTotal - advance);

    totalSales += grandTotal;
    totalReceived += advance;
    totalRemaining += remaining;

    if (inv.date) {
      if (inv.date === todayStr) {
        todaysSales += grandTotal;
      }
      if (inv.date.startsWith(currentYearMonth)) {
        thisMonthsSales += grandTotal;
      }
    }

    if (inv.paymentMethods) {
      if (inv.paymentMethods.cash) paymentStats.cash += grandTotal;
      if (inv.paymentMethods.easyPaisa) paymentStats.easyPaisa += grandTotal;
      if (inv.paymentMethods.jazzCash) paymentStats.jazzCash += grandTotal;
      if (inv.paymentMethods.bank) paymentStats.bank += grandTotal;
      if (inv.paymentMethods.whatsApp) paymentStats.whatsApp += grandTotal;
    }
  });

  const avgInvoiceValue = totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0;
  const collectionRate = totalSales > 0 ? Math.min(100, Math.round((totalReceived / totalSales) * 100)) : 0;

  // Last 7 days chart aggregation
  const last7DaysData: { date: string; label: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    
    // Sum sales for this date
    let daySales = 0;
    invoices.forEach((inv) => {
      if (inv.date === dateStr) {
        const sub = inv.items.reduce((acc, item) => acc + (item.qty * item.unitPrice) - item.discount, 0);
        daySales += Math.max(0, sub - (inv.discountOverall || 0));
      }
    });

    last7DaysData.push({ date: dateStr, label, amount: daySales });
  }

  const maxChartAmount = Math.max(...last7DaysData.map(d => d.amount), 1000);

  return (
    <div className="space-y-6 print:hidden pb-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-200">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sales Dashboard</h2>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Real-time Summary
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">MA Digital Store business analytics & live performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          Loading live business data from local database...
        </div>
      ) : totalInvoices === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Sales Data Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first invoice in the editor to see real-time revenue stats, charts, and payment summaries here.
          </p>
        </div>
      ) : (
        <>
          {/* Main Summary Metric Cards (6 Cards Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Total Invoices */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoices</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{totalInvoices}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  <span className="text-blue-600 font-bold">100%</span> Recorded in database
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            {/* Total Sales */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Gross Sales</p>
                <p className="text-3xl font-black text-slate-900 mt-1">Rs. {totalSales.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  <span className="text-emerald-600 font-bold">Avg:</span> Rs. {avgInvoiceValue.toLocaleString()} / inv
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Today's Sales */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sales</p>
                <p className="text-3xl font-black text-slate-900 mt-1">Rs. {todaysSales.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  <span className="text-emerald-600 font-bold flex items-center"><ArrowUpRight className="w-3 h-3" /> Live</span> Updated today
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {/* This Month's Sales */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">This Month's Sales</p>
                <p className="text-3xl font-black text-slate-900 mt-1">Rs. {thisMonthsSales.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  <span className="text-indigo-600 font-bold">Current month</span> overview
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Received Amount */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Received Amount</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">Rs. {totalReceived.toLocaleString()}</p>
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                  <span>{collectionRate}%</span> collection rate
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            {/* Remaining Balance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining Balance</p>
                <p className="text-3xl font-black text-amber-600 mt-1">Rs. {totalRemaining.toLocaleString()}</p>
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-semibold">
                  <span>Pending collection</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Statistics & Sales Overview Chart Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" /> Sales Overview (Last 7 Days)
                </h3>
                <p className="text-xs text-slate-500">Daily revenue trend based on actual stored invoices</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                <span>Total 7d:</span>
                <span className="text-blue-700 font-bold">
                  Rs. {last7DaysData.reduce((acc, d) => acc + d.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Custom Responsive SVG Bar Chart */}
            <div className="pt-2 pb-2">
              <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-slate-200 relative">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-slate-200 w-full"></div>
                  <div className="border-b border-dashed border-slate-200 w-full"></div>
                  <div className="border-b border-dashed border-slate-200 w-full"></div>
                  <div className="border-b border-dashed border-slate-200 w-full"></div>
                </div>

                {last7DaysData.map((day, idx) => {
                  const heightPercent = maxChartAmount > 0 ? Math.max(8, Math.round((day.amount / maxChartAmount) * 100)) : 8;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Rs. {day.amount.toLocaleString()} ({day.label})
                      </div>
                      <div 
                        className="w-full max-w-[48px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all duration-500 group-hover:from-blue-700 group-hover:to-blue-500 shadow-sm flex items-center justify-center"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {day.amount > 0 && (
                          <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity rotate-90 sm:rotate-0">
                            {day.amount > 999 ? `${Math.round(day.amount / 1000)}k` : day.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between gap-2 px-2 pt-2 text-[11px] font-semibold text-slate-500">
                {last7DaysData.map((day, idx) => (
                  <div key={idx} className="flex-1 text-center truncate">
                    {day.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two Column Section: Payment Summary & Recent Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Payment Method Statistics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Payment Methods
                </h3>
                <p className="text-xs text-slate-500">Sales volume by payment channel</p>
              </div>

              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Cash</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">Rs. {paymentStats.cash.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">EasyPaisa</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">Rs. {paymentStats.easyPaisa.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">JazzCash</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">Rs. {paymentStats.jazzCash.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Bank Transfer</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">Rs. {paymentStats.bank.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">WhatsApp / Online</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">Rs. {paymentStats.whatsApp.toLocaleString()}</span>
                </div>
              </div>

              {/* Financial Progress Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Collection Progress</span>
                  <span className="text-blue-600 font-bold">{collectionRate}% Paid</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${collectionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Invoices Section */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Recent Invoices
                  </h3>
                  <p className="text-xs text-slate-500">Latest transactions generated in database</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Showing latest {Math.min(5, invoices.length)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 5).map((inv) => {
                      const sub = inv.items.reduce((acc, item) => acc + (item.qty * item.unitPrice) - item.discount, 0);
                      const total = Math.max(0, sub - (inv.discountOverall || 0));
                      const advance = inv.advance || 0;
                      let statusBadge = 'PAID';
                      let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (advance === 0) {
                        statusBadge = 'UNPAID';
                        badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                      } else if (advance < total) {
                        statusBadge = 'PARTIAL';
                        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      }

                      return (
                        <tr key={inv.invoiceNo} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-blue-600">#{inv.invoiceNo}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{inv.customerName || 'Walk-in Customer'}</td>
                          <td className="py-3 px-3 text-slate-500">{inv.date}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">Rs. {total.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeColor}`}>
                              {statusBadge}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};
