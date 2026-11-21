import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DomicileRecord } from '../types';
import { getAllDomicilesFromDB, saveDomicileToDB, deleteDomicileFromDB } from '../db/indexedDB';
import { 
  Users, Search, Plus, FileText, Shield, Calendar, Edit3, Trash2, 
  Eye, X, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Upload, Image as ImageIcon, Sparkles
} from 'lucide-react';

interface DomicileManagerProps {
  onBackToHome: () => void;
}

export const DomicileManager: React.FC<DomicileManagerProps> = ({ onBackToHome }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [applicants, setApplicants] = useState<DomicileRecord[]>([]);
  const [showApplicantTable, setShowApplicantTable] = useState(false);
  const [showPaymentDashboard, setShowPaymentDashboard] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [exportMode, setExportMode] = useState<'all' | 'range' | 'custom'>('all');
  const [exportRangeStart, setExportRangeStart] = useState<number>(1);
  const [exportRangeEnd, setExportRangeEnd] = useState<number>(10);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const [carouselDirection, setCarouselDirection] = useState<number>(1);

  const handlePaidAmountChange = (paid: number, total: number) => {
    let status: 'PAID' | 'UNPAID' | 'PARTIALLY PAID' = 'UNPAID';
    if (paid <= 0) {
      status = 'UNPAID';
    } else if (paid >= total) {
      status = 'PAID';
    } else {
      status = 'PARTIALLY PAID';
    }
    setFormData(prev => ({ ...prev, paidAmount: paid, totalFee: total, paymentStatus: status }));
  };
  const [selectedApplicant, setSelectedApplicant] = useState<DomicileRecord | null>(null);
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState<Partial<DomicileRecord>>({
    applicantName: '',
    cnic: '',
    domicilePassword: '',
    applicantPicture: '',
    dmcPicture: '',
    formBPicture: '',
    parentCnicPicture: '',
    otherDocumentPicture: '',
    recordDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    paymentStatus: 'UNPAID',
  });

  const loadApplicants = async () => {
    try {
      const data = await getAllDomicilesFromDB();
      setApplicants(data);
      // Do NOT automatically set selectedApplicant so dashboard opens on default preview screen first!
    } catch (err) {
      console.error('Failed to load domicile records:', err);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, []);

  const filteredApplicants = applicants.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      app.applicantName.toLowerCase().includes(q) ||
      app.cnic.toLowerCase().includes(q)
    );
  });

  const handleOpenAddModal = () => {
    setFormData({
      applicantName: '',
      cnic: '',
      domicilePassword: '',
      applicantPicture: '',
      dmcPicture: '',
      formBPicture: '',
      parentCnicPicture: '',
      otherDocumentPicture: '',
      recordDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      totalFee: 1500,
    });
    setActiveModal('add');
  };

  const handleOpenEditModal = (app: DomicileRecord) => {
    setFormData({ 
      ...app, 
      paidAmount: app.paidAmount ?? 0, 
      totalFee: app.totalFee ?? 1500 
    });
    setActiveModal('edit');
  };

  const handleImageUpload = (field: keyof DomicileRecord, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.cnic) {
      alert('Please enter Applicant Name and CNIC number.');
      return;
    }

    try {
      const record: DomicileRecord = {
        id: formData.id !== undefined && formData.id !== null ? Number(formData.id) : undefined,
        applicantName: formData.applicantName || '',
        cnic: formData.cnic || '',
        domicilePassword: formData.domicilePassword || '',
        applicantPicture: formData.applicantPicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        dmcPicture: formData.dmcPicture || '',
        formBPicture: formData.formBPicture || '',
        parentCnicPicture: formData.parentCnicPicture || '',
        otherDocumentPicture: formData.otherDocumentPicture || '',
        recordDate: formData.recordDate || new Date().toISOString().split('T')[0],
        status: formData.status || 'Pending',
        paymentStatus: formData.paymentStatus || 'UNPAID',
        paidAmount: Number(formData.paidAmount) || 0,
        totalFee: Number(formData.totalFee) || 1500,
        createdAt: formData.id ? (formData as any).createdAt : Date.now(),
      };

      await saveDomicileToDB(record);
      const updatedList = await getAllDomicilesFromDB();
      setApplicants(updatedList);
      setActiveModal(null);

      if (record.id) {
        const fresh = updatedList.find(a => a.id === record.id);
        if (fresh) {
          setSelectedApplicant(fresh);
        }
      }

      alert('Domicile applicant record saved successfully!');
    } catch (err) {
      console.error('Failed to save domicile record:', err);
      alert('Failed to save applicant record.');
    }
  };

  const handleDelete = async (appOrId?: DomicileRecord | number | string, optionalCnic?: string) => {
    if (confirm('Are you sure you want to delete this applicant?')) {
      try {
        if (appOrId && typeof appOrId === 'object') {
          if (appOrId.id !== undefined && appOrId.id !== null) {
            await deleteDomicileFromDB(appOrId.id);
          }
          if (appOrId.cnic) {
            await deleteDomicileFromDB(appOrId.cnic);
          }
        } else if (appOrId !== undefined && appOrId !== null) {
          await deleteDomicileFromDB(appOrId as number | string);
        }
        if (optionalCnic) {
          await deleteDomicileFromDB(optionalCnic);
        }

        await loadApplicants();
        setSelectedApplicant(null);
      } catch (err) {
        console.error('Failed to delete applicant record:', err);
        alert('Failed to delete applicant record.');
      }
    }
  };

  const getPaymentBadgeClass = (status?: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'PARTIALLY PAID':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  const parseUniversalImportText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const results: Array<{ name: string; cnic: string; code: string; isValid: boolean; isDuplicate: boolean }> = [];

    const cnicRegex = /(\d{5}[-\s]?\d{7}[-\s]?\d|\d{5}[-\s]?xxxxxxx[-]?x|\b\d{13}\b)/i;

    for (const line of lines) {
      if (/^(name|cnic|code|password|applicant|sr|no)/i.test(line) && lines.indexOf(line) === 0 && !cnicRegex.test(line)) {
        continue;
      }

      let cnic = '';
      let name = '';
      let code = '';

      const cnicMatch = line.match(cnicRegex);
      if (cnicMatch) {
        cnic = cnicMatch[0].trim();
        const remainder = line.replace(cnicRegex, '').trim();
        const parts = remainder.split(/\t+|,\s+|\s{2,}/).map(p => p.trim()).filter(Boolean);
        
        if (parts.length >= 2) {
          name = parts[0];
          code = parts[1];
        } else if (parts.length === 1) {
          name = parts[0];
        } else {
          const cols = line.split(/\t+|,\s+/).map(c => c.trim()).filter(Boolean);
          if (cols.length >= 3) {
            name = cols[0];
            cnic = cols[1];
            code = cols[2];
          } else if (cols.length === 2) {
            if (cols[0].toLowerCase() === cnic.toLowerCase()) {
              name = cols[1];
            } else {
              name = cols[0];
            }
          }
        }
      } else {
        const cols = line.split(/\t+|,\s+|\s{2,}/).map(c => c.trim()).filter(Boolean);
        if (cols.length >= 2) {
          name = cols[0];
          cnic = cols[1];
          code = cols[2] || '';
        } else if (cols.length === 1) {
          name = cols[0];
        }
      }

      name = name.replace(/^[-–—\s0-9#.]+|[-–—\s]+$/g, '').trim();
      cnic = cnic.replace(/\s+/g, '').trim();
      code = code ? code.replace(/\s+/g, '').trim() : Math.random().toString(36).substring(2, 10).toUpperCase();

      const isValid = Boolean(name && cnic);
      const isDuplicate = isValid && applicants.some(a => a.cnic.trim().toLowerCase() === cnic.toLowerCase());

      results.push({ name, cnic, code, isValid, isDuplicate });
    }

    return results;
  };

  const parsedUniversalRows = parseUniversalImportText(bulkImportText);
  const totalDetected = parsedUniversalRows.length;
  const validUniversalRows = parsedUniversalRows.filter(r => r.isValid);
  const newValidUniversalRows = validUniversalRows.filter(r => !r.isDuplicate);
  const duplicateUniversalRows = validUniversalRows.filter(r => r.isDuplicate);
  const invalidUniversalRows = parsedUniversalRows.filter(r => !r.isValid);

  const handleExecuteUniversalImport = async () => {
    if (newValidUniversalRows.length === 0) {
      alert('No new valid applicants to import (all detected records are duplicates or invalid).');
      return;
    }

    try {
      let count = 0;
      for (const row of newValidUniversalRows) {
        const record: DomicileRecord = {
          applicantName: row.name,
          cnic: row.cnic,
          domicilePassword: row.code || Math.random().toString(36).substring(2, 10).toUpperCase(),
          applicantPicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          dmcPicture: '',
          formBPicture: '',
          parentCnicPicture: '',
          otherDocumentPicture: '',
          recordDate: new Date().toISOString().split('T')[0],
          status: 'Pending',
          paymentStatus: 'UNPAID',
          paidAmount: 0,
          totalFee: 1500,
          createdAt: Date.now() + count,
        };
        await saveDomicileToDB(record);
        count++;
      }

      await loadApplicants();
      setShowBulkImportModal(false);
      setBulkImportText('');
      alert(`Successfully imported ${count} new applicants! (${duplicateUniversalRows.length} duplicates skipped)`);
    } catch (err) {
      console.error('Universal import error:', err);
      alert('Failed to complete universal import.');
    }
  };

  const handleExportPDF = () => {
    let listToExport = filteredApplicants;
    if (exportMode === 'range') {
      const start = Math.max(1, exportRangeStart) - 1;
      const end = Math.min(filteredApplicants.length, Math.max(start + 1, exportRangeEnd));
      listToExport = filteredApplicants.slice(start, end);
    } else if (exportMode === 'custom') {
      listToExport = filteredApplicants.filter(app => selectedExportIds.includes(app.id || app.cnic));
    }

    if (listToExport.length === 0) {
      alert('No applicants selected for export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for PDF export printing.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MA Digital Store - Domicile Applicant Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 25px; color: #111; background: #fff; }
            h1 { font-size: 22px; margin-bottom: 4px; color: #0f172a; }
            p { font-size: 13px; color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
            th { background-color: #f1f5f9; color: #334155; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
            .badge-paid { background: #dcfce7; color: #166534; }
            .badge-unpaid { background: #fee2e2; color: #991b1b; }
            .badge-partial { background: #e0f2fe; color: #0369a1; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>MA DIGITAL STORE — Domicile Applicant Report</h1>
          <p>Generated on: ${new Date().toLocaleString()} | Exported Records: ${listToExport.length} (Total Available: ${filteredApplicants.length})</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Applicant Name</th>
                <th>CNIC Number</th>
                <th>Portal Password</th>
                <th>Record Date</th>
                <th>Status</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              ${listToExport.map((app, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${app.applicantName}</strong></td>
                  <td>${app.cnic}</td>
                  <td>${app.domicilePassword || 'N/A'}</td>
                  <td>${app.recordDate}</td>
                  <td>${app.status || 'Pending'}</td>
                  <td>
                    <span class="badge ${
                      app.paymentStatus === 'PAID' ? 'badge-paid' :
                      app.paymentStatus === 'PARTIALLY PAID' ? 'badge-partial' : 'badge-unpaid'
                    }">
                      ${app.paymentStatus || 'UNPAID'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            © 2026 MA Digital Store, Mardan. Professional Domicile Management & Billing System.
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setShowExportModal(false);
  };

  // Summary counts
  const totalApplicants = applicants.length;
  const recentEntries = applicants.filter(a => Date.now() - a.createdAt < 7 * 24 * 60 * 60 * 1000).length;
  const documentsSavedCount = applicants.reduce((acc, a) => {
    let count = 0;
    if (a.applicantPicture) count++;
    if (a.dmcPicture) count++;
    if (a.formBPicture) count++;
    if (a.parentCnicPicture) count++;
    if (a.otherDocumentPicture) count++;
    return acc + count;
  }, 0);

  // Payment statistics calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const totalCollected = applicants.reduce((acc, a) => acc + (a.paidAmount || 0), 0);
  const paidApplicantsCount = applicants.filter(a => a.paymentStatus === 'PAID').length;
  const unpaidApplicantsCount = applicants.filter(a => !a.paymentStatus || a.paymentStatus === 'UNPAID').length;
  const partialApplicantsCount = applicants.filter(a => a.paymentStatus === 'PARTIALLY PAID').length;

  const todayTotal = applicants
    .filter(a => (a.createdAt || Date.parse(a.recordDate) || 0) >= todayStart)
    .reduce((acc, a) => acc + (a.paidAmount || 0), 0);

  const weekTotal = applicants
    .filter(a => (a.createdAt || Date.parse(a.recordDate) || 0) >= weekStart)
    .reduce((acc, a) => acc + (a.paidAmount || 0), 0);

  const monthTotal = applicants
    .filter(a => (a.createdAt || Date.parse(a.recordDate) || 0) >= monthStart)
    .reduce((acc, a) => acc + (a.paidAmount || 0), 0);

  const [chartTab, setChartTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const dailyChartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const amount = applicants
      .filter(a => {
        const t = a.createdAt || Date.parse(a.recordDate) || 0;
        return t >= dayStart && t < dayEnd;
      })
      .reduce((acc, a) => acc + (a.paidAmount || 0), 0);
    return { label: dayName, amount };
  });

  const weeklyChartData = Array.from({ length: 4 }, (_, i) => {
    const weekNum = 4 - i;
    const endT = Date.now() - i * 7 * 24 * 60 * 60 * 1000;
    const startT = endT - 7 * 24 * 60 * 60 * 1000;
    const amount = applicants
      .filter(a => {
        const t = a.createdAt || Date.parse(a.recordDate) || 0;
        return t >= startT && t < endT;
      })
      .reduce((acc, a) => acc + (a.paidAmount || 0), 0);
    return { label: `W${weekNum}`, amount };
  });

  const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const mYear = d.getFullYear();
    const mIndex = d.getMonth();
    const amount = applicants
      .filter(a => {
        const t = a.createdAt || Date.parse(a.recordDate) || 0;
        const dt = new Date(t);
        return dt.getFullYear() === mYear && dt.getMonth() === mIndex;
      })
      .reduce((acc, a) => acc + (a.paidAmount || 0), 0);
    return { label: monthName, amount };
  });

  const currentChartData = chartTab === 'daily' ? dailyChartData : chartTab === 'weekly' ? weeklyChartData : monthlyChartData;
  const maxChartAmount = Math.max(...currentChartData.map(d => d.amount), 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/60 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 lg:py-1.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-gradient-to-t from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-xl border border-slate-600 shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Main Menu
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" /> Domicile Management & Data Entry
              </h1>
              <p className="text-[11px] text-slate-400">MA Digital Store — Professional Applicant Records & Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setBulkImportText('');
                setShowBulkImportModal(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-t from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 rounded-xl border border-purple-500/30 shadow-[0_2px_10px_rgba(147,51,234,0.35)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Import Applicants
            </button>
            <button
              type="button"
              onClick={() => setShowPaymentDashboard(prev => !prev)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-t from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 rounded-xl border border-emerald-500/30 shadow-[0_2px_10px_rgba(16,185,129,0.35)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>💰</span> Payment Dashboard {showPaymentDashboard ? '(Hide)' : '(Show)'}
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Toggling upper applicant table visibility');
                setShowApplicantTable(prev => !prev);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-t from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-xl border border-slate-500/30 shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" /> Applicant List & Status
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedExportIds(filteredApplicants.map(a => a.id || a.cnic));
                setExportRangeEnd(Math.max(1, filteredApplicants.length));
                setShowExportModal(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-t from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl border border-blue-400/30 shadow-[0_2px_10px_rgba(37,99,235,0.35)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-t from-teal-600 to-cyan-500 hover:from-teal-500 hover:to-cyan-400 rounded-xl border border-teal-400/30 shadow-[0_2px_10px_rgba(20,184,166,0.35)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Entry
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-2.5 flex flex-col gap-4 lg:gap-2.5">
        
        {!showPaymentDashboard && (
          <>
            {/* Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-3">
              <div className="bg-slate-800/80 backdrop-blur-md p-5 lg:p-3.5 rounded-2xl border border-slate-700/80 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Applicants</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{totalApplicants}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-md p-5 lg:p-3.5 rounded-2xl border border-slate-700/80 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Entries (7 Days)</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{recentEntries}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-md p-5 lg:p-3.5 rounded-2xl border border-slate-700/80 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documents Saved</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{documentsSavedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-slate-800/60 backdrop-blur-md p-4 lg:p-2.5 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Applicant Name or CNIC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Showing {filteredApplicants.length} of {applicants.length} records
              </p>
            </div>
          </>
        )}

        {/* Domicile Payment Dashboard & Command Bar */}
        {showPaymentDashboard && (
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 rounded-3xl border border-slate-800 shadow-[0_30px_70px_rgba(0,0,0,0.8)] p-6 sm:p-8 flex flex-col gap-8 relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Header Section matching reference */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/30">
                    MA
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">Welcome back, Administrator 🖐️</h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Here's what's happening with your domicile platform today.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value="Search platform..."
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-400 w-48 focus:outline-none cursor-default"
                  />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentDashboard(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-2xl border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  ✕ Close Dashboard
                </button>
              </div>
            </div>

            {/* Top 4 Stat Cards Grid with Trend Indicators matching reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Applicants */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col justify-between relative group hover:border-cyan-500/50 transition-all">
                <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users / Applicants</span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                    👥
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-white font-mono">{totalApplicants}</p>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <span>↑ +12.5%</span> <span className="text-slate-400">from last month</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Total Orders / Entries */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col justify-between relative group hover:border-blue-500/50 transition-all">
                <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Records / Orders</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    📦
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-white font-mono">{recentEntries + totalApplicants}</p>
                  <p className="text-[11px] text-blue-400 mt-1 flex items-center gap-1 font-medium">
                    <span>↑ +8.1%</span> <span className="text-slate-400">from last month</span>
                  </p>
                </div>
              </div>

              {/* Card 3: Total Revenue */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col justify-between relative group hover:border-emerald-500/50 transition-all">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    💰
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-white font-mono">Rs. {totalCollected.toLocaleString()}</p>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <span>↑ +15.3%</span> <span className="text-slate-400">from last month</span>
                  </p>
                </div>
              </div>

              {/* Card 4: Conversion Rate */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col justify-between relative group hover:border-indigo-500/50 transition-all">
                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                    📊
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-white font-mono">
                    {totalApplicants > 0 ? ((paidApplicantsCount / totalApplicants) * 100).toFixed(2) : '0.00'}%
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <span>↑ +2.4%</span> <span className="text-slate-400">from last month</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Section: Revenue Overview (2 Cols) + Top Applicants / Products (1 Col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Revenue Overview Chart */}
              <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>📈</span> Revenue Overview
                    </h3>
                    <p className="text-xs text-slate-400">Daily, weekly, and monthly collection curves across active periods.</p>
                  </div>
                  {/* Chart Tabs */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setChartTab('daily')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        chartTab === 'daily' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartTab('weekly')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        chartTab === 'weekly' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartTab('monthly')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        chartTab === 'monthly' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Custom Bar Graph Container */}
                <div className="h-60 flex items-end justify-between gap-3 sm:gap-6 pt-8 pb-4 px-2 border-b border-slate-800/80 relative">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
                    <div className="border-b border-slate-700 w-full"></div>
                    <div className="border-b border-slate-700 w-full"></div>
                    <div className="border-b border-slate-700 w-full"></div>
                    <div className="border-b border-slate-700 w-full"></div>
                  </div>

                  {currentChartData.map((item, idx) => {
                    const heightPercent = Math.max(12, Math.round((item.amount / maxChartAmount) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative group h-full justify-end z-10">
                        <div className="absolute -top-12 bg-slate-950 border border-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Rs. {item.amount.toLocaleString()}
                        </div>
                        <div className="w-full max-w-[44px] bg-gradient-to-t from-cyan-600 via-teal-500 to-emerald-400 rounded-t-xl shadow-[0_0_25px_rgba(20,184,166,0.35)] transition-all duration-500 group-hover:brightness-125 relative" style={{ height: `${heightPercent}%` }}>
                          <div className="absolute inset-x-0 top-0 h-1.5 bg-white/50 rounded-t-xl"></div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 truncate max-w-full">{item.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                  <span className="font-medium">Peak: Rs. {Math.max(...currentChartData.map(d => d.amount)).toLocaleString()} | Total: Rs. {totalCollected.toLocaleString()}</span>
                  <span className="font-mono text-cyan-400">Live Database Synced</span>
                </div>
              </div>

              {/* Right 1 Col: Top Applicants / Products Summary */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🏆</span> Top Applicants
                  </h3>
                  <span className="text-xs text-cyan-400 font-medium">View All</span>
                </div>

                <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[260px] pr-1">
                  {applicants.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">No applicants registered yet.</div>
                  ) : (
                    applicants.slice(0, 5).map((app, idx) => (
                      <div key={app.id || idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl hover:border-slate-700 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-extrabold text-slate-500 font-mono w-4">{idx + 1}</span>
                          <img
                            src={app.applicantPicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{app.applicantName}</h4>
                            <p className="text-[10px] text-slate-400">Domicile File</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-extrabold text-emerald-400 font-mono">Rs. {app.paidAmount || 0}</span>
                          <p className="text-[10px] text-slate-400">{app.paymentStatus || 'UNPAID'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: User Growth (Left) + Users by Location (Middle) + Traffic Source Donut (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. User Growth Bar Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>👥</span> User Growth
                  </h3>
                  <span className="text-xs text-slate-400">Active Registrations</span>
                </div>
                <div className="h-44 flex items-end justify-between gap-2 pt-6 px-1 border-b border-slate-800/80">
                  {dailyChartData.map((item, idx) => {
                    const h = Math.max(15, Math.min(100, (item.amount / (maxChartAmount || 1)) * 90 + 20));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full max-w-[28px] bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-lg shadow-[0_0_15px_rgba(99,102,241,0.3)]" style={{ height: `${h}%` }}></div>
                        <span className="text-[10px] text-slate-400">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>New Users: <strong>{recentEntries}</strong></span>
                  <span className="text-cyan-400">Total Active: <strong>{totalApplicants}</strong></span>
                </div>
              </div>

              {/* 2. Users by Location (District Breakdown) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🗺️</span> Users by Location
                  </h3>
                  <span className="text-xs text-slate-400">Mardan & Regions</span>
                </div>
                <div className="flex flex-col gap-3 py-2">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                      <span>Mardan Center</span>
                      <span className="text-cyan-400">65.4%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 w-[65.4%] rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                      <span>Peshawar Region</span>
                      <span className="text-indigo-400">18.2%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 w-[18.2%] rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                      <span>Swabi & Charsadda</span>
                      <span className="text-emerald-400">16.4%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[16.4%] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 text-center pt-1">
                  Primary applicant origin distribution map
                </div>
              </div>

              {/* 3. Traffic Source / Status Distribution Donut Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🍩</span> Status Distribution
                  </h3>
                  <span className="text-xs text-slate-400">Payment Breakdown</span>
                </div>

                <div className="flex items-center justify-center py-3">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="14" className="text-slate-800" fill="transparent" />
                      <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="14" className="text-emerald-500" fill="transparent" strokeDasharray="314" strokeDashoffset={314 - (314 * (paidApplicantsCount / (totalApplicants || 1)))} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-extrabold text-white font-mono">{totalApplicants}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Paid Fully</span>
                    <span className="font-mono font-bold text-emerald-400">{paidApplicantsCount} ({totalApplicants > 0 ? Math.round((paidApplicantsCount / totalApplicants) * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Partially Paid</span>
                    <span className="font-mono font-bold text-blue-400">{partialApplicantsCount} ({totalApplicants > 0 ? Math.round((partialApplicantsCount / totalApplicants) * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unpaid</span>
                    <span className="font-mono font-bold text-rose-400">{unpaidApplicantsCount} ({totalApplicants > 0 ? Math.round((unpaidApplicantsCount / totalApplicants) * 100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Stream Footer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Recent Activity Stream
                </h3>
                <span className="text-xs text-slate-400">Real-time log</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {applicants.length === 0 ? (
                  <div className="text-xs text-slate-500">No activity recorded yet.</div>
                ) : (
                  applicants.slice(0, 6).map((app, idx) => (
                    <div key={app.id || idx} className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{app.applicantName}</p>
                        <p className="text-[10px] text-slate-400">CNIC: {app.cnic} • {app.paymentStatus || 'UNPAID'}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Rs. {app.paidAmount || 0}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {!showPaymentDashboard && (
          <>
            {/* Profile Card Carousel / Spotlight View (Inspired by reference design) */}
            {filteredApplicants.length > 0 ? (
              <div className="flex flex-col gap-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" /> Applicant Spotlight & Profiles
                </h2>

                {/* Central Profile Spotlight Card with Smooth Animated Transition */}
                {(() => {
                  const current = filteredApplicants[carouselIndex] || filteredApplicants[0];
                  return (
                    <div className="relative overflow-hidden w-full max-w-sm sm:max-w-md mx-auto min-h-[580px] flex items-center justify-center py-4">
                      {/* Background depth cards (Inspired by reference design) */}
                      {filteredApplicants.length > 1 && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                          <div className="absolute -left-28 sm:-left-36 top-1/2 -translate-y-1/2 w-72 sm:w-80 h-[480px] bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-700/30 scale-75 opacity-25 blur-[6px] -rotate-6 transition-all duration-500"></div>
                          <div className="absolute -right-28 sm:-right-36 top-1/2 -translate-y-1/2 w-72 sm:w-80 h-[480px] bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-700/30 scale-75 opacity-25 blur-[6px] rotate-6 transition-all duration-500"></div>
                        </div>
                      )}

                      <AnimatePresence mode="popLayout" custom={carouselDirection}>
                        <motion.div
                          key={carouselIndex}
                          custom={carouselDirection}
                          initial={(custom) => ({ x: custom > 0 ? 120 : -120, opacity: 0, scale: 0.92, filter: 'blur(8px)' })}
                          animate={{ x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                          exit={(custom) => ({ x: custom > 0 ? -120 : 120, opacity: 0.4, scale: 0.88, filter: 'blur(8px)' })}
                          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                          className="w-full bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 flex flex-col items-center text-center gap-8 relative overflow-hidden z-10"
                        >
                          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

                          {/* Applicant Picture */}
                          <div className="relative group flex-shrink-0">
                            <div className="w-48 h-56 sm:w-56 sm:h-64 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] bg-slate-900">
                              <img 
                                src={current.applicantPicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                                alt={current.applicantName} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <span className="absolute bottom-3 left-3 px-3 py-1 bg-slate-900/90 backdrop-blur-md text-cyan-400 text-xs font-bold rounded-lg border border-cyan-500/30">
                              {current.status || 'Pending'}
                            </span>
                          </div>

                          {/* Details & Info */}
                          <div className="flex-1 flex flex-col justify-between w-full gap-6">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
                                  Record #{String(carouselIndex + 1).padStart(2, '0')} / {filteredApplicants.length}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" /> {current.recordDate}
                                </span>
                              </div>
                              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{current.applicantName}</h3>
                              <div className="flex items-center justify-center gap-3 mt-1.5 flex-wrap">
                                <p className="text-sm font-mono text-cyan-300">CNIC: {current.cnic}</p>
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${getPaymentBadgeClass(current.paymentStatus)}`}>
                                  Payment: {current.paymentStatus || 'UNPAID'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 text-left">
                              <div>
                                <span className="text-xs text-slate-400 block font-medium">Domicile Portal Password</span>
                                <span className="text-sm font-bold text-white font-mono bg-slate-800 px-2.5 py-1 rounded-lg inline-block mt-1 border border-slate-700">
                                  {current.domicilePassword || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400 block font-medium">Attached Documents</span>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {current.dmcPicture && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-md border border-blue-500/30">DMC</span>}
                                  {current.formBPicture && <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-xs rounded-md border border-teal-500/30">Form B</span>}
                                  {current.parentCnicPicture && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-md border border-purple-500/30">Parent CNIC</span>}
                                  {current.otherDocumentPicture && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-md border border-amber-500/30">Other</span>}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedApplicant(current)}
                                className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-t from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-blue-500/30 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" /> View Full Profile & Docs
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(current)}
                                className="px-4 py-2.5 text-xs font-bold text-slate-200 bg-gradient-to-t from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-slate-600 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(current)}
                                className="p-2.5 text-red-400 bg-gradient-to-t from-red-950/60 to-red-900/60 hover:from-red-900 hover:to-red-800 rounded-xl shadow-[0_2px_8px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 border border-red-800/50 cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* Carousel Navigation Bar */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCarouselDirection(-1);
                        setCarouselIndex(prev => (prev > 0 ? prev - 1 : filteredApplicants.length - 1));
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCarouselDirection(1);
                        setCarouselIndex(prev => (prev < filteredApplicants.length - 1 ? prev + 1 : 0));
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-slate-400 font-medium ml-2">
                      Applicant {carouselIndex + 1} of {filteredApplicants.length}
                    </span>
                  </div>
                </div>

                {/* Applicant Cards Grid (Very Bottom Applicant List) */}
                <div className="mt-8">
                  <h3 className="text-md font-bold text-white mb-4">All Applicant Records</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredApplicants.map((app, idx) => (
                      <div
                        key={app.id || idx}
                        onClick={() => {
                          setSelectedApplicant(app);
                          setCarouselIndex(idx);
                        }}
                        className={`bg-slate-800/70 hover:bg-slate-800 backdrop-blur-md p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                          selectedApplicant?.id === app.id ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-slate-700/80 shadow-md'
                        }`}
                      >
                        <img 
                          src={app.applicantPicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                          alt={app.applicantName} 
                          className="w-14 h-14 rounded-xl object-cover border border-slate-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{app.applicantName}</h4>
                          <p className="text-xs font-mono text-cyan-400 mt-0.5 truncate">CNIC: {app.cnic}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-700">
                              {app.status || 'Pending'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${getPaymentBadgeClass(app.paymentStatus)}`}>
                              {app.paymentStatus || 'UNPAID'}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-300">Rs. {app.paidAmount ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/80 p-12 text-center flex flex-col items-center justify-center gap-4">
                <Users className="w-16 h-16 text-slate-600" />
                <h3 className="text-lg font-bold text-white">No Domicile Applicants Found</h3>
                <p className="text-sm text-slate-400 max-w-md">
                  {searchQuery ? 'No applicants match your search query.' : 'Get started by adding your first applicant record for domicile processing.'}
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-t from-teal-600 to-cyan-500 hover:from-teal-500 hover:to-cyan-400 rounded-xl border border-teal-400/30 shadow-[0_4px_16px_rgba(20,184,166,0.35)] transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add First Applicant
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* View Full Profile Modal / Drawer */}
      {selectedApplicant && !activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative">
            <button
              onClick={() => setSelectedApplicant(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-800 pb-6">
              <img 
                src={selectedApplicant.applicantPicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                alt={selectedApplicant.applicantName} 
                className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-lg cursor-pointer"
                onClick={() => setLightboxImage(selectedApplicant.applicantPicture)}
              />
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap mb-1">
                  <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/30">
                    {selectedApplicant.status || 'Pending'}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getPaymentBadgeClass(selectedApplicant.paymentStatus)}`}>
                    {selectedApplicant.paymentStatus || 'UNPAID'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{selectedApplicant.applicantName}</h2>
                <p className="text-sm font-mono text-cyan-400 mt-1">CNIC: {selectedApplicant.cnic}</p>
                <p className="text-xs text-slate-400 mt-1">Record Date: {selectedApplicant.recordDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <span className="text-xs text-slate-400 font-medium">Domicile Portal Password</span>
                <p className="text-base font-bold text-white font-mono mt-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 inline-block">
                  {selectedApplicant.domicilePassword || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <span className="text-xs text-slate-400 font-medium">Record Date & Timestamp</span>
                <p className="text-sm font-bold text-slate-200 mt-1">
                  {selectedApplicant.recordDate} ({new Date(selectedApplicant.createdAt).toLocaleDateString()})
                </p>
              </div>
            </div>

            {/* Payment Summary Breakdown Card */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <span className="text-xs font-bold uppercase text-cyan-400 tracking-wider">Payment & Fee Information</span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getPaymentBadgeClass(selectedApplicant.paymentStatus)}`}>
                  {selectedApplicant.paymentStatus || 'UNPAID'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-1 text-center sm:text-left">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Total Fee</span>
                  <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                    Rs. {selectedApplicant.totalFee ?? 1500}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Paid Amount</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block">
                    Rs. {selectedApplicant.paidAmount ?? 0}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Remaining Amount</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono mt-0.5 block">
                    Rs. {Math.max(0, (selectedApplicant.totalFee ?? 1500) - (selectedApplicant.paidAmount ?? 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Gallery */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Attached Document Gallery (Click to Inspect)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'DMC', url: selectedApplicant.dmcPicture },
                  { label: 'Form B', url: selectedApplicant.formBPicture },
                  { label: 'Parent CNIC', url: selectedApplicant.parentCnicPicture },
                  { label: 'Other Doc', url: selectedApplicant.otherDocumentPicture },
                ].map((doc, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-slate-400">{doc.label}</span>
                    <div 
                      onClick={() => doc.url && setLightboxImage(doc.url)}
                      className={`h-28 rounded-xl border border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center relative group ${doc.url ? 'cursor-pointer hover:border-cyan-500 transition-colors' : 'opacity-40'}`}
                    >
                      {doc.url ? (
                        <>
                          <img src={doc.url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleOpenEditModal(selectedApplicant)}
                className="px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Edit Record
              </button>
              <button
                onClick={() => handleDelete(selectedApplicant)}
                className="px-4 py-2 text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/50 rounded-xl border border-red-800/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Applicant Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-white">
              {activeModal === 'add' ? 'New Domicile Applicant Entry' : 'Edit Applicant Record'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Applicant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={formData.applicantName || ''}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">CNIC Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12301-1234567-1"
                    value={formData.cnic || ''}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Domicile Portal Password</label>
                  <input
                    type="text"
                    placeholder="Portal password"
                    value={formData.domicilePassword || ''}
                    onChange={(e) => setFormData({ ...formData, domicilePassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Record Date</label>
                  <input
                    type="date"
                    value={formData.recordDate || ''}
                    onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Status</label>
                  <select
                    value={formData.status || 'Pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Ready">Ready</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus || 'UNPAID'}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PAID">PAID</option>
                    <option value="PARTIALLY PAID">PARTIALLY PAID</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Total Fee (Rs.)</label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={formData.totalFee ?? 1500}
                    onChange={(e) => handlePaidAmountChange(formData.paidAmount ?? 0, Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Paid Amount (Rs.)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.paidAmount ?? 0}
                    onChange={(e) => handlePaidAmountChange(Number(e.target.value), formData.totalFee ?? 1500)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              {/* Image Upload Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" /> Applicant Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('applicantPicture', e)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
                  />
                  {formData.applicantPicture && (
                    <img src={formData.applicantPicture} alt="Applicant Preview" className="w-20 h-20 rounded-xl object-cover mt-2 border border-slate-700" />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" /> DMC Document Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('dmcPicture', e)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30 cursor-pointer"
                  />
                  {formData.dmcPicture && (
                    <img src={formData.dmcPicture} alt="DMC Preview" className="w-20 h-20 rounded-xl object-cover mt-2 border border-slate-700" />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-400" /> Form B Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('formBPicture', e)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30 cursor-pointer"
                  />
                  {formData.formBPicture && (
                    <img src={formData.formBPicture} alt="Form B Preview" className="w-20 h-20 rounded-xl object-cover mt-2 border border-slate-700" />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-400" /> Parent's CNIC Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('parentCnicPicture', e)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 cursor-pointer"
                  />
                  {formData.parentCnicPicture && (
                    <img src={formData.parentCnicPicture} alt="Parent CNIC Preview" className="w-20 h-20 rounded-xl object-cover mt-2 border border-slate-700" />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" /> Other Document Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('otherDocumentPicture', e)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                  />
                  {formData.otherDocumentPicture && (
                    <img src={formData.otherDocumentPicture} alt="Other Document Preview" className="w-20 h-20 rounded-xl object-cover mt-2 border border-slate-700" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-t from-teal-600 to-cyan-500 hover:from-teal-500 hover:to-cyan-400 rounded-xl shadow-[0_4px_14px_rgba(20,184,166,0.35)]"
                >
                  Save Applicant Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={lightboxImage} alt="Document Lightbox" className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-slate-700 shadow-2xl" />
          </div>
        </div>
      )}

      {/* Upper Applicant & Payment Status List Modal Controlled Exclusively by Top Button */}
      {showApplicantTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative">
            <button
              type="button"
              onClick={() => setShowApplicantTable(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/25 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Applicant & Payment Status</h2>
                <p className="text-xs text-slate-400">Upper Applicant List & Payment Ledger for all registered applicants</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-xs border-b border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5">S.No.</th>
                    <th className="px-5 py-3.5">Applicant Name</th>
                    <th className="px-5 py-3.5">CNIC Number</th>
                    <th className="px-5 py-3.5">Payment Amount</th>
                    <th className="px-5 py-3.5">Payment Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredApplicants.map((app, index) => {
                    const paid = app.paidAmount ?? 0;
                    const total = app.totalFee ?? 1500;
                    return (
                      <tr key={app.id || app.cnic} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-5 py-4 font-bold text-white flex items-center gap-3">
                          <img src={app.applicantPicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-600" />
                          <div>
                            <div>{app.applicantName}</div>
                            <span className="text-[10px] text-slate-400 font-normal">Record Date: {app.recordDate}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-cyan-400">{app.cnic}</td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-300">
                          Rs. {paid} <span className="text-xs text-slate-400 font-normal">/ Rs. {total}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${getPaymentBadgeClass(app.paymentStatus)}`}>
                            {app.paymentStatus || 'UNPAID'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setShowApplicantTable(false);
                              setSelectedApplicant(app);
                            }}
                            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow transition-colors cursor-pointer"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative">
            <button
              type="button"
              onClick={() => setShowExportModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/25 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Export Applicant List PDF</h2>
                <p className="text-xs text-slate-400">Choose export scope, range, or specific applicants to generate PDF report</p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {/* Export Mode Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setExportMode('all')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportMode === 'all' 
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm">Export All</div>
                  <div className="text-xs text-slate-400 mt-1">All {filteredApplicants.length} records</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportMode('range')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportMode === 'range' 
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm">Select Range</div>
                  <div className="text-xs text-slate-400 mt-1">e.g. 1 to 10</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportMode('custom')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportMode === 'custom' 
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm">Select Specific</div>
                  <div className="text-xs text-slate-400 mt-1">Choose custom applicants</div>
                </button>
              </div>

              {/* Range Inputs */}
              {exportMode === 'range' && (
                <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <label className="text-xs text-slate-400 block mb-1.5 font-medium">From Record #</label>
                    <input
                      type="number"
                      min={1}
                      max={filteredApplicants.length}
                      value={exportRangeStart}
                      onChange={(e) => setExportRangeStart(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-xs text-slate-400 block mb-1.5 font-medium">To Record #</label>
                    <input
                      type="number"
                      min={1}
                      max={filteredApplicants.length}
                      value={exportRangeEnd}
                      onChange={(e) => setExportRangeEnd(parseInt(e.target.value) || filteredApplicants.length)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Custom Specific Applicants Checkboxes */}
              {exportMode === 'custom' && (
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-xs font-bold text-slate-300">
                      Selected: {selectedExportIds.length} of {filteredApplicants.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExportIds(filteredApplicants.map(a => a.id || a.cnic))}
                        className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExportIds([])}
                        className="text-xs text-rose-400 hover:underline font-semibold cursor-pointer"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1">
                    {filteredApplicants.map((app, idx) => {
                      const idKey = app.id || app.cnic;
                      const isChecked = selectedExportIds.includes(idKey);
                      return (
                        <label
                          key={idKey}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked ? 'bg-blue-600/15 border-blue-500/50 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono text-slate-500 w-6">#{idx + 1}</span>
                            <img src={app.applicantPicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">{app.applicantName}</div>
                              <div className="text-xs font-mono text-cyan-400 truncate">{app.cnic}</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExportIds(prev => [...prev, idKey]);
                              } else {
                                setSelectedExportIds(prev => prev.filter(id => id !== idKey));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExportPDF()}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-t from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-all cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Generate & Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Applicant Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative">
            <button
              type="button"
              onClick={() => setShowBulkImportModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/25 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Bulk Applicant Import</h2>
                <p className="text-xs text-slate-400">Paste rows directly from Excel to create multiple applicant records instantly</p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Copy Name, CNIC & Code columns from Excel and paste here.
                </label>
                <textarea
                  rows={6}
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder={`Sumbal Begum\t16101-1234567-1\t8948HVT7\nMuhammad Khuzaifa\t16101-7654321-2\tDR3C8XK1\nImran Shah\t16101-9876543-3\tDHL2EAIH`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Preview & Stats */}
              {bulkImportText.trim() && (
                <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                        Total Detected: <span className="text-cyan-400 font-mono">{totalDetected}</span>
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                        New: <span className="font-mono">{newValidUniversalRows.length}</span>
                      </span>
                      <span className="text-xs font-bold text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                        Duplicates: <span className="font-mono">{duplicateUniversalRows.length}</span>
                      </span>
                      {invalidUniversalRows.length > 0 && (
                        <span className="text-xs font-bold text-rose-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                          Invalid: <span className="font-mono">{invalidUniversalRows.length}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-400 mb-1">
                    Applicant Name | CNIC | Code/Password
                  </div>

                  <div className="max-h-52 overflow-y-auto flex flex-col gap-2 pr-1">
                    {parsedUniversalRows.map((row, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                          row.isDuplicate 
                            ? 'bg-amber-950/35 border-amber-800/50 text-amber-200' 
                            : !row.isValid
                            ? 'bg-rose-950/35 border-rose-800/50 text-rose-200'
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span className="text-slate-500">#{idx + 1}</span>
                          <span className="font-bold text-white font-sans truncate">{row.name || '(Missing Name)'}</span>
                          <span className="text-cyan-400">{row.cnic || '(Missing CNIC)'}</span>
                          <span className="text-amber-300">{row.code || '(Code)'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.isDuplicate ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' : !row.isValid ? 'bg-rose-500/25 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {row.isDuplicate ? 'Duplicate (Skipped)' : !row.isValid ? 'Invalid Row' : 'Ready'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteUniversalImport}
                disabled={newValidUniversalRows.length === 0}
                className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                  newValidUniversalRows.length > 0 
                    ? 'bg-gradient-to-t from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 cursor-pointer shadow-[0_4px_16px_rgba(147,51,234,0.35)]' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Upload className="w-4 h-4" /> [ Import Applicants ] ({newValidUniversalRows.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
