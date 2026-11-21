import React, { useRef, useState, useEffect } from 'react';
import { InvoiceData } from '../types';
import { Logo } from './Logo';
import { Printer, Download, ArrowLeft, Receipt, Sparkles, Check, Share2, TrendingUp } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { QRCode } from './QRCode';
import { saveInvoiceToDB, getInvoiceByNoFromDB, getInvoiceFingerprint } from '../db/indexedDB';


interface InvoicePreviewProps {
  data: InvoiceData;
  onBackToEdit: () => void;
  onNewInvoice: () => void;
  onOpenDashboard: () => void;
  onBeforePrint?: (data: InvoiceData) => Promise<InvoiceData>;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  data,
  onBackToEdit,
  onNewInvoice,
  onOpenDashboard,
  onBeforePrint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareFallbackMessage, setShareFallbackMessage] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [scale, setScale] = useState(1);

  // Proportional scale calculation for A4 preview fitting
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth - 32;
        const availableHeight = containerRef.current.clientHeight - 32;
        const a4Width = 794; // ~210mm at 96 DPI
        const a4Height = invoiceRef.current ? Math.max(1123, invoiceRef.current.scrollHeight) : 1123;

        const scaleX = availableWidth / a4Width;
        const scaleY = availableHeight / a4Height;
        const newScale = Math.min(scaleX, scaleY);
        setScale(newScale > 0 ? newScale : 1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver.disconnect();
    };
  }, []);

  // Safe defaults
  const items = data?.items || [];
  const paymentMethodObj = data?.paymentMethod || {};
  const advanceNumber = Number(data?.advance || 0);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (Number(item?.qty || 0) * Number(item?.unitPrice || 0)), 0);
  const totalItemDiscounts = items.reduce((acc, item) => acc + Number(item?.discount || 0), 0);
  const grandTotal = Math.max(0, subtotal - totalItemDiscounts);
  const remainingBalance = Math.max(0, grandTotal - advanceNumber);
  const paymentStatus = grandTotal === 0 ? 'UNPAID' : (remainingBalance === 0 ? 'PAID' : (advanceNumber > 0 && remainingBalance > 0 ? 'PARTIALLY PAID' : 'UNPAID'));

  const handlePrint = async () => {
    try {
      if (onBeforePrint) {
        await onBeforePrint(data);
      } else {
        const existing = await getInvoiceByNoFromDB(data.invoiceNo);
        const currentFingerprint = getInvoiceFingerprint(data);
        const existingFingerprint = existing ? getInvoiceFingerprint(existing) : null;

        if (!existing || currentFingerprint !== existingFingerprint) {
          await saveInvoiceToDB(data);
        }
      }
    } catch (err) {
      console.error('Auto-save on print error:', err);
    }

    try {
      await document.fonts.ready;

      if (invoiceRef.current) {
        const images = invoiceRef.current.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(
            (imgElement) =>
              new Promise((resolve) => {
                const img = imgElement as HTMLImageElement;
                if (img.complete) resolve(true);
                else {
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(true);
                }
              })
          )
        );
      }
    } catch (err) {
      console.error('Print asset load error:', err);
    }
    window.print();
  };

  const generatePdfBlob = async (): Promise<Blob> => {
    await document.fonts.ready;
    if (invoiceRef.current) {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (imgElement) =>
            new Promise((resolve) => {
              const img = imgElement as HTMLImageElement;
              if (img.complete) resolve(true);
              else {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(true);
              }
            })
        )
      );
    }

    const el = invoiceRef.current!;
    const originalTransform = el.style.transform;
    const originalWidth = el.style.width;
    
    el.style.transform = 'none';
    el.style.width = '794px';

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794,
        onclone: (clonedDoc) => {
          Array.from(document.styleSheets).forEach((sheet) => {
            try {
              if (sheet.href) {
                const link = clonedDoc.createElement('link');
                link.rel = 'stylesheet';
                link.href = sheet.href;
                clonedDoc.head.appendChild(link);
              } else if (sheet.cssRules) {
                const style = clonedDoc.createElement('style');
                Array.from(sheet.cssRules).forEach((rule) => {
                  style.appendChild(clonedDoc.createTextNode(rule.cssText));
                });
                clonedDoc.head.appendChild(style);
              }
            } catch (e) {
              // ignore cross-origin stylesheet errors
            }
          });

          const existingStyles = document.querySelectorAll('style');
          existingStyles.forEach((s) => {
            const clonedStyle = clonedDoc.createElement('style');
            clonedStyle.innerHTML = s.innerHTML;
            clonedDoc.head.appendChild(clonedStyle);
          });

          const printReadabilityStyle = clonedDoc.createElement('style');
          printReadabilityStyle.innerHTML = `
            .invoice-print-container table,
            .invoice-print-container th,
            .invoice-print-container td {
              border: 1px solid #64748B !important;
            }
            .invoice-print-container tbody tr td {
              font-weight: 500 !important;
              color: #0f172a !important;
            }
            .invoice-print-container th {
              font-weight: 700 !important;
            }
            .invoice-print-container span,
            .invoice-print-container p {
              font-weight: 500 !important;
            }
            .invoice-print-container h1,
            .invoice-print-container h2 {
              font-weight: 800 !important;
            }
          `;
          clonedDoc.head.appendChild(printReadabilityStyle);
        },
      });

      el.style.transform = originalTransform;
      el.style.width = originalWidth;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let renderHeight = imgHeight;
      let renderWidth = pdfWidth;
      if (renderHeight > pdfHeight) {
        renderHeight = pdfHeight;
        renderWidth = (canvas.width * pdfHeight) / canvas.height;
      }
      const xOffset = (pdfWidth - renderWidth) / 2;
      const yOffset = (pdfHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset >= 0 ? xOffset : 0, yOffset >= 0 ? yOffset : 0, renderWidth, renderHeight);
      return pdf.output('blob');
    } catch (err) {
      el.style.transform = originalTransform;
      el.style.width = originalWidth;
      throw err;
    }
  };

  const handleDownloadPDF = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!invoiceRef.current) return;
    setIsExporting(true);

    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const invoiceNoStr = data.invoiceNo ? data.invoiceNo.replace(/[^a-zA-Z0-9-_]/g, '_') : 'MADS';
      const a = document.createElement('a');
      a.href = url;
      a.download = `MA-DIGITAL-STORE-Invoice-${invoiceNoStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please use Print -> Save as PDF instead.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePDF = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!invoiceRef.current) return;
    setIsSharing(true);
    setShareFallbackMessage(null);

    try {
      const pdfBlob = await generatePdfBlob();
      const invoiceNoStr = data.invoiceNo ? data.invoiceNo.replace(/[^a-zA-Z0-9-_]/g, '_') : 'MADS';
      const fileName = `MA-DIGITAL-STORE-Invoice-${invoiceNoStr}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const shareData = {
        title: `MA DIGITAL STORE - Invoice ${data.invoiceNo || ''}`,
        text: `Invoice from MA DIGITAL STORE`,
        files: [file],
      };

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err: any) {
          if (err && err.name === 'AbortError') return;
          throw new Error('File sharing not supported');
        }
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShareFallbackMessage('File sharing is not supported on this browser. Please download the PDF and share it manually.');
      }
    } catch (error: any) {
      if (error && error.name !== 'AbortError') {
        console.error('Error sharing PDF:', error);
        setShareFallbackMessage('File sharing is not supported on this browser. Please download the PDF and share it manually.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Controls Toolbar */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={onBackToEdit}
          className="px-4 py-2 text-sm font-semibold text-slate-700 bg-gradient-to-t from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 rounded-xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Editor
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenDashboard}
            className="px-4 py-2 text-sm font-semibold text-blue-700 bg-gradient-to-t from-blue-50 to-blue-100/60 hover:from-blue-100 hover:to-blue-200/80 border border-blue-200/80 rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.12)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4 text-blue-600" /> Dashboard
          </button>
          <button
            type="button"
            onClick={onNewInvoice}
            className="px-4 py-2 text-sm font-semibold text-blue-700 bg-gradient-to-t from-blue-50 to-blue-100/60 hover:from-blue-100 hover:to-blue-200/80 border border-blue-200/80 rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.12)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-blue-600" /> New Invoice
          </button>
          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="px-4 py-2 text-sm font-semibold text-blue-700 bg-gradient-to-t from-blue-50 to-blue-100/60 hover:from-blue-100 hover:to-blue-200/80 border border-blue-200/80 rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.12)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4 text-blue-600" /> Receipt
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-t from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-xl shadow-[0_4px_14px_rgba(15,23,42,0.3)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.4)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-slate-600/30 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDownloadPDF(e);
            }}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-t from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-blue-500/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {isExporting ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSharePDF(e);
            }}
            disabled={isSharing}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-t from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 rounded-xl shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-indigo-500/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" /> {isSharing ? 'Sharing...' : 'Share Invoice'}
          </button>
        </div>
      </div>

      {shareFallbackMessage && (
        <div className="print:hidden bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-sm">
          <span>{shareFallbackMessage}</span>
          <button onClick={() => setShareFallbackMessage(null)} className="font-bold ml-4 text-amber-900 hover:text-amber-950">✕</button>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold text-base">MA DIGITAL STORE - Receipt</h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-white hover:text-slate-200 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-slate-800 bg-slate-50">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                <h4 className="text-base font-extrabold text-blue-900 font-sans">MA DIGITAL STORE</h4>
                <p className="text-[11px] text-slate-600 font-sans">Digital Services & Mobile Accessories</p>
                <p className="text-[11px] text-slate-600">Mohib Banda, Mardan | Ph: 0327-5051049</p>
                <div className="pt-2 font-bold text-slate-900">=== SALES RECEIPT ===</div>
              </div>

              <div className="space-y-1 text-xs pb-3 border-b border-dashed border-slate-300 font-sans">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Invoice No:</span>
                  <span className="font-bold text-blue-900">{data.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Date:</span>
                  <span>{data.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Customer:</span>
                  <span className="font-medium text-slate-900">{data.customerName || 'Walk-in Customer'}</span>
                </div>
                {data.customerPhone && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Phone:</span>
                    <span>{data.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Payment:</span>
                  <span className="font-medium">
                    {Object.entries(data.paymentMethods)
                      .filter(([_, val]) => val)
                      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                      .join(', ') || 'Cash'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
                <div className="grid grid-cols-12 font-bold text-[11px] text-slate-700 border-b pb-1">
                  <span className="col-span-6">Description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Total</span>
                </div>
                {data.items
                  .filter((item) => (item.qty > 0 && item.unitPrice > 0) || item.description.trim() !== '')
                  .map((item, idx) => {
                    const rowTotal = (item.qty * item.unitPrice) - item.discount;
                    return (
                      <div key={idx} className="grid grid-cols-12 text-[11px] items-center">
                        <span className="col-span-6 truncate pr-1">{item.description || `Item #${item.id}`}</span>
                        <span className="col-span-2 text-center">{item.qty || 1}</span>
                        <span className="col-span-4 text-right font-semibold">Rs. {rowTotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
              </div>

              {/* Totals Summary */}
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                {totalItemDiscounts > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-Rs. {totalItemDiscounts.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-blue-900 pt-1 border-t border-slate-300 font-sans">
                  <span>Grand Total:</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
                {data.advance > 0 && (
                  <>
                    <div className="flex justify-between text-emerald-800">
                      <span>Advance Paid:</span>
                      <span>Rs. {data.advance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-red-600 pt-1">
                      <span>Remaining Balance:</span>
                      <span>Rs. {remainingBalance.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-4 text-[11px] text-slate-500 font-sans border-t border-dashed border-slate-300">
                <p>{data.notes}</p>
                <p className="font-bold text-slate-800 mt-2">*** THANK YOU! PLEASE VISIT AGAIN ***</p>
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-3.5 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Invoice Container (A4 Printable) */}
      <div 
        ref={containerRef}
        className="w-full h-[75vh] min-h-[650px] overflow-visible bg-slate-200/60 p-4 rounded-2xl border border-slate-300 flex items-center justify-center relative"
      >
        <div
          ref={invoiceRef}
          style={{
            width: '210mm',
            minHeight: '297mm',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="bg-white text-slate-900 p-6 shadow-2xl flex flex-col justify-between border-[6px] border-blue-700 rounded-2xl invoice-print-container box-border flex-shrink-0"
        >
          <div>
            {/* Header section */}
            <div className="flex justify-between items-start border-b-2 border-blue-600 pb-3.5 mb-3.5">
              <div className="pt-1 flex flex-col space-y-2">
                <Logo variant="stacked" showText={true} />
                <div className="text-[11px] font-bold text-blue-800 tracking-wider uppercase bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200 inline-block w-fit shadow-xs">
                  ★ Premium Quality Services
                </div>
              </div>
              <div className="text-right space-y-0.5 text-sm font-medium text-slate-800">
                <h1 className="text-2xl font-black uppercase tracking-tight text-blue-900">
                  MA DIGITAL STORE
                </h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Digital Services & Mobile Accessories</p>
                <p className="text-xs text-slate-700 pt-0.5">
                  <span className="font-semibold text-slate-900">Phone:</span> 0327-5051049
                </p>
                <p className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">EasyPaisa:</span> 0316-5073529
                </p>
                <p className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Email:</span> muhammadalizaryani@gmail.com
                </p>
                <p className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Address:</span> Mohib Banda, Mardan
                </p>
              </div>
            </div>

            {/* Title & Customer Information */}
            <div className="grid grid-cols-12 gap-4 mb-3.5 items-end">
              <div className="col-span-5">
                <h2 className="text-4xl font-black tracking-wider text-slate-900 uppercase">
                  INVOICE
                </h2>
              </div>
              <div className="col-span-7 space-y-1 text-sm text-slate-800">
                <div className="flex justify-between border-b border-slate-400 pb-0.5">
                  <div>
                    <span className="font-semibold">Invoice No:</span>{' '}
                    <span className="font-mono font-bold text-blue-900">{data.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Invoice Date:</span> {data.date}
                  </div>
                </div>
                {data.dueDate && (
                  <div className="flex justify-end border-b border-slate-400 pb-0.5">
                    <div>
                      <span className="font-semibold">Due Date:</span>{' '}
                      <span className="font-medium text-slate-900">{data.dueDate}</span>
                    </div>
                  </div>
                )}
                <div className="border-b border-slate-400 pb-0.5">
                  <span className="font-semibold">Customer Name:</span>{' '}
                  <span className="font-medium text-slate-900">{data.customerName || '__________________________'}</span>
                </div>
                <div className="border-b border-slate-400 pb-0.5">
                  <span className="font-semibold">Customer Phone:</span>{' '}
                  <span className="font-medium text-slate-900">{data.customerPhone || '__________________________'}</span>
                </div>
                <div className="border-b border-slate-400 pb-0.5">
                  <span className="font-semibold">Address:</span>{' '}
                  <span className="font-medium text-slate-900">{data.address || '__________________________'}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="mb-3.5 border-2 border-blue-600 rounded-xl overflow-hidden">
              <div className="bg-blue-600 text-white font-bold text-xs uppercase px-4 py-1 tracking-wider inline-block rounded-br-lg">
                Payment Method
              </div>
              <div className="px-6 py-2 flex flex-wrap items-center justify-around gap-4 bg-blue-50/40">
                {[
                  { key: 'cash', label: 'Cash' },
                  { key: 'easyPaisa', label: 'EasyPaisa' },
                  { key: 'jazzCash', label: 'JazzCash' },
                  { key: 'bank', label: 'Bank' },
                  { key: 'whatsApp', label: 'WhatsApp' },
                ].map(({ key, label }) => {
                  const checked = data.paymentMethods[key as keyof InvoiceData['paymentMethods']];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{label}</span>
                      <div className={`w-4.5 h-4.5 border-2 border-blue-700 rounded flex items-center justify-center bg-white ${checked ? 'text-blue-700 font-bold' : ''}`}>
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Item Table (15 rows) */}
            <div className="mb-3.5 border-2 border-blue-600 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-600 text-white font-bold uppercase tracking-wider text-center">
                    <th className="py-1.5 px-2 border-r border-blue-500 w-10">No.</th>
                    <th className="py-1.5 px-3 border-r border-blue-500 text-left">Description</th>
                    <th className="py-1.5 px-2 border-r border-blue-500 w-14">Qty</th>
                    <th className="py-1.5 px-2 border-r border-blue-500 w-20">Unit Price</th>
                    <th className="py-1.5 px-2 border-r border-blue-500 w-20">Discount</th>
                    <th className="py-1.5 px-2 w-24 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {data.items.map((item, index) => {
                    const rowTotal = item.qty > 0 || item.unitPrice > 0 ? (item.qty * item.unitPrice) - item.discount : 0;
                    const isEven = index % 2 === 0;
                    return (
                      <tr key={index} className={isEven ? 'bg-white' : 'bg-blue-50/40'}>
                        <td className="py-1 px-2 text-center border-r border-blue-200 font-medium text-slate-600">
                          {item.id}
                        </td>
                        <td className="py-1 px-3 border-r border-blue-200 text-slate-800 font-medium">
                          {item.description}
                        </td>
                        <td className="py-1 px-2 text-center border-r border-blue-200 text-slate-800">
                          {item.qty > 0 ? item.qty : ''}
                        </td>
                        <td className="py-1 px-2 text-center border-r border-blue-200 text-slate-800">
                          {item.unitPrice > 0 ? item.unitPrice.toLocaleString() : ''}
                        </td>
                        <td className="py-1 px-2 text-center border-r border-blue-200 text-slate-800">
                          {item.discount > 0 ? item.discount.toLocaleString() : ''}
                        </td>
                        <td className="py-1 px-2 text-right font-semibold text-slate-900">
                          {rowTotal > 0 ? rowTotal.toLocaleString() : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary & Notes Section */}
            <div className="grid grid-cols-2 gap-4 mb-3.5">
              {/* Summary Box */}
              <div className="border-2 border-blue-600 rounded-xl overflow-hidden flex flex-col justify-between bg-white shadow-xs">
                <div>
                  <div className="bg-blue-600 text-white font-bold text-xs uppercase px-4 py-1 tracking-wider inline-block rounded-br-lg shadow-xs">
                    Summary
                  </div>
                  <div className="p-3 space-y-1 text-xs text-slate-800 font-medium">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <span className="font-semibold text-slate-700">Payment Status</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider ${
                        paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        paymentStatus === 'PARTIALLY PAID' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <span className="text-slate-600 font-medium">Subtotal</span>
                      <span className="font-semibold text-slate-900">Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <span className="text-slate-600 font-medium">Discount</span>
                      <span className="font-semibold text-slate-900">Rs. {totalItemDiscounts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-blue-300 pb-1 font-bold text-blue-900 text-sm bg-blue-50/50 px-1 rounded">
                      <span>Grand Total</span>
                      <span>Rs. {grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <span className="text-slate-600 font-medium">Advance</span>
                      <span className="font-semibold text-emerald-700">Rs. {data.advance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5 font-bold text-slate-900 text-sm">
                      <span>Remaining Balance</span>
                      <span className="text-red-600 font-extrabold">Rs. {remainingBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Box with QR Code */}
              <div className="border-2 border-blue-600 rounded-xl overflow-hidden flex flex-col justify-between bg-white shadow-xs">
                <div>
                  <div className="bg-blue-600 text-white font-bold text-xs uppercase px-4 py-1 tracking-wider inline-block rounded-br-lg shadow-xs">
                    Notes & Verification
                  </div>
                  <div className="p-3 flex items-start justify-between gap-3">
                    <div className="text-xs text-slate-700 leading-relaxed flex-1 min-h-[80px] font-medium">
                      {data.notes}
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-xs">
                      {(() => {
                        const activePaymentMethods = Object.entries(paymentMethodObj)
                          .filter(([_, active]) => active)
                          .map(([method]) => method.charAt(0).toUpperCase() + method.slice(1))
                          .join(', ') || 'Cash';

                        const itemsFormatted = items
                          .filter(item => item && item.description && item.description.trim() !== '')
                          .map((item, idx) => {
                            const total = (Number(item.qty || 0) * Number(item.unitPrice || 0)) - Number(item.discount || 0);
                            return `${idx + 1}. ${item.description} | Qty: ${item.qty} | Unit Price: ${item.unitPrice} | Discount: ${item.discount} | Total: ${total}`;
                          })
                          .join('\n');

                        const qrCodeContent = [
                          "MA DIGITAL STORE",
                          "",
                          `Invoice Number: ${data.invoiceNo}`,
                          `Invoice Date: ${data.date}`,
                          data.dueDate ? `Due Date: ${data.dueDate}` : "",
                          "",
                          `Customer Name: ${data.customerName || 'N/A'}`,
                          `Customer Phone: ${data.customerPhone || 'N/A'}`,
                          `Customer Address: ${data.customerAddress || 'N/A'}`,
                          "",
                          `Payment Method: ${activePaymentMethods}`,
                          "",
                          "ITEMS:",
                          itemsFormatted || "1. None | Qty: 0 | Unit Price: 0 | Discount: 0 | Total: 0",
                          "",
                          "SUMMARY:",
                          `Payment Status: ${paymentStatus}`,
                          `Subtotal: ${subtotal}`,
                          `Total Discount: ${totalItemDiscounts}`,
                          `Grand Total: ${grandTotal}`,
                          `Advance: ${advanceNumber}`,
                          `Remaining Balance: ${remainingBalance}`,
                          "",
                          `Notes: ${data.notes || 'N/A'}`,
                          "",
                          "Services:",
                          "Mobile Accessories",
                          "Online Services",
                          "Printing",
                          "Photocopy",
                          "Passport Photos",
                          "PVC Cards",
                          "Scanning",
                          "Internet Services"
                        ].join('\n');

                        return (
                          <QRCode
                            value={qrCodeContent}
                            size={60}
                          />
                        );
                      })()}
                      <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">Scan Data</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Services Section */}
          <div className="bg-blue-700 text-white rounded-xl py-2 px-4 text-[11px] font-semibold mt-3 shadow-xs">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 stroke-[3]" /> Mobile Accessories
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 stroke-[3]" /> Online Services
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 stroke-[3]" /> Printing
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 stroke-[3]" /> Photocopy
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 stroke-[3]" /> Passport Photos
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 stroke-[3]" /> PVC Cards
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 stroke-[3]" /> Scanning
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 stroke-[3]" /> Internet Services
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
