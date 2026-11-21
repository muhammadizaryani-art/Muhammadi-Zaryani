import React, { useState, useRef, useEffect } from 'react';
import { CVData, CVExperience, CVEducation, CVRecord } from '../types';
import { getInitialCVData, getSampleCVData } from '../data/sampleCVData';
import { QRCode } from './QRCode';
import { saveCVToDB, getAllCVsFromDB, deleteCVFromDB } from '../db/indexedDB';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { 
  FileText, ArrowLeft, Printer, Download, Sparkles, User, Briefcase, 
  GraduationCap, Languages as LanguagesIcon, Wrench, Plus, Trash2, 
  Mail, Phone, MapPin, Calendar, Shield, CheckCircle2, RefreshCw, Eye,
  Save, FolderOpen, X
} from 'lucide-react';


interface CVBuilderManagerProps {
  onBackToHome: () => void;
}

export const CVBuilderManager: React.FC<CVBuilderManagerProps> = ({ onBackToHome }) => {
  const [cvData, setCvData] = useState<CVData>(() => {
    const saved = localStorage.getItem('ma_digital_store_cv_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return getInitialCVData();
  });

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.7);
  const [currentCvId, setCurrentCvId] = useState<string | null>(() => {
    return localStorage.getItem('ma_digital_store_current_cv_id') || null;
  });
  const [savedCVs, setSavedCVs] = useState<CVRecord[]>([]);
  const [isSavedCVsModalOpen, setIsSavedCVsModalOpen] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const cvRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSavedCVsList();
  }, []);

  const loadSavedCVsList = async () => {
    try {
      const records = await getAllCVsFromDB();
      setSavedCVs(records);
    } catch (e) {
      console.error('Error loading saved CVs:', e);
    }
  };

  const handleSaveCVRecord = async () => {
    try {
      const idToUse = currentCvId || Date.now().toString();
      const record: CVRecord = {
        ...cvData,
        id: idToUse,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveCVToDB(record);
      setCurrentCvId(idToUse);
      localStorage.setItem('ma_digital_store_current_cv_id', idToUse);
      await loadSavedCVsList();
      setSaveNotification('CV saved successfully!');
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (e) {
      console.error('Error saving CV:', e);
      alert('Failed to save CV. Please try again.');
    }
  };

  const handleOpenCVRecord = (record: CVRecord) => {
    setCvData(record);
    setCurrentCvId(record.id);
    localStorage.setItem('ma_digital_store_current_cv_id', record.id);
    setIsSavedCVsModalOpen(false);
  };

  const handleDeleteCVRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved CV?')) return;
    try {
      await deleteCVFromDB(id);
      if (currentCvId === id) {
        setCurrentCvId(null);
        localStorage.removeItem('ma_digital_store_current_cv_id');
      }
      await loadSavedCVsList();
    } catch (e) {
      console.error('Error deleting CV:', e);
      alert('Failed to delete CV.');
    }
  };

  const handleCreateNewCVRecord = () => {
    setCurrentCvId(null);
    localStorage.removeItem('ma_digital_store_current_cv_id');
    setCvData(getInitialCVData());
    setIsSavedCVsModalOpen(false);
  };


  useEffect(() => {
    localStorage.setItem('ma_digital_store_cv_data', JSON.stringify(cvData));
  }, [cvData]);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        const a4WidthPx = 794; // approx 210mm in pixels
        const padding = 16;
        const availableWidth = containerWidth - padding;
        const scale = Math.min(1, availableWidth / a4WidthPx);
        setPreviewScale(Math.max(0.25, scale));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    const observer = new ResizeObserver(() => updateScale());
    if (previewContainerRef.current) {
      observer.observe(previewContainerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateScale);
      observer.disconnect();
    };
  }, []);

  const handleLoadSample = () => {
    setCvData(getSampleCVData());
  };

  const handleReset = () => {
    setCurrentCvId(null);
    localStorage.removeItem('ma_digital_store_current_cv_id');
    setCvData({
      fullName: '',
      dob: '',
      gender: '',
      fatherName: '',
      maritalStatus: '',
      cnic: '',
      nationality: '',
      phone: '',
      email: '',
      location: '',
      photoUrl: '',
      summary: '',
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      personalInfoFontSize: 'Auto',
      summaryFontSize: 'Auto',
      experienceFontSize: 'Auto',
      educationFontSize: 'Auto',
      skillsFontSize: 'Auto',
      languagesFontSize: 'Auto',
      profileNameFontSize: 'Auto',
      personalInfoColor: 'Auto',
      summaryColor: 'Auto',
      experienceColor: 'Auto',
      educationColor: 'Auto',
      skillsColor: 'Auto',
      languagesColor: 'Auto',
      profileNameColor: 'Auto',
      profileNameBold: true,
      profileNameItalic: false,
      personalInfoHeadingFontSize: 'Auto',
      personalInfoHeadingColor: 'Auto',
      personalInfoHeadingBold: true,
      personalInfoHeadingItalic: false,
      summaryHeadingFontSize: 'Auto',
      summaryHeadingColor: 'Auto',
      summaryHeadingBold: true,
      summaryHeadingItalic: false,
      experienceHeadingFontSize: 'Auto',
      experienceHeadingColor: 'Auto',
      experienceHeadingBold: true,
      experienceHeadingItalic: false,
      educationHeadingFontSize: 'Auto',
      educationHeadingColor: 'Auto',
      educationHeadingBold: true,
      educationHeadingItalic: false,
      skillsHeadingFontSize: 'Auto',
      skillsHeadingColor: 'Auto',
      skillsHeadingBold: true,
      skillsHeadingItalic: false,
      languagesHeadingFontSize: 'Auto',
      languagesHeadingColor: 'Auto',
      languagesHeadingBold: true,
      languagesHeadingItalic: false,
      photoSize: 'Medium'
    });
  };

  const fontSizeOptions = ['Auto', '10', '11', '12', '13', '14', '15', '16', '18', '20'];
  const fontColorOptions = [
    { label: 'Auto/Default', value: 'Auto' },
    { label: 'Black', value: '#000000' },
    { label: 'White', value: '#ffffff' },
    { label: 'Dark Navy', value: '#0f172a' },
    { label: 'CV Gold', value: '#fbbf24' }
  ];

  const renderFontSizeSelect = (value: string | undefined, onChange: (val: string) => void) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-400">Font:</span>
      <select
        value={value || 'Auto'}
        onChange={e => onChange(e.target.value)}
        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[11px] text-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
      >
        {fontSizeOptions.map(opt => (
          <option key={opt} value={opt}>{opt === 'Auto' ? 'Auto' : `${opt}px`}</option>
        ))}
      </select>
    </div>
  );

  const renderFontColorSelect = (value: string | undefined, onChange: (val: string) => void) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-400">Color:</span>
      <select
        value={value || 'Auto'}
        onChange={e => onChange(e.target.value)}
        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[11px] text-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
      >
        {fontColorOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const renderHeadingStyleControls = (
    sectionName: string,
    fontSize?: string,
    setFontSize?: (v: string) => void,
    color?: string,
    setColor?: (v: string) => void,
    bold?: boolean,
    setBold?: (v: boolean) => void,
    italic?: boolean,
    setItalic?: (v: boolean) => void
  ) => (
    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-1.5 mt-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10.5px] font-extrabold text-amber-400 uppercase tracking-wider">
          {sectionName} Heading Style
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {setFontSize && renderFontSizeSelect(fontSize, setFontSize)}
          {setColor && renderFontColorSelect(color, setColor)}
          {setBold !== undefined && (
            <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg">
              <input
                type="checkbox"
                checked={bold ?? true}
                onChange={e => setBold(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-amber-400 focus:ring-0 w-3 h-3"
              />
              Bold
            </label>
          )}
          {setItalic !== undefined && (
            <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg">
              <input
                type="checkbox"
                checked={italic ?? false}
                onChange={e => setItalic(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-amber-400 focus:ring-0 w-3 h-3"
              />
              Italic
            </label>
          )}
        </div>
      </div>
    </div>
  );

  // Helper for Experience
  const addExperience = () => {
    const newExp: CVExperience = {
      id: Date.now().toString(),
      jobTitle: 'Job Title',
      company: 'Organization Name',
      location: 'Location',
      duration: '1 Year',
      bullets: ['Achievement or duty description']
    };
    setCvData(prev => ({ ...prev, experiences: [...prev.experiences, newExp] }));
  };

  const updateExperience = (id: string, field: keyof CVExperience, value: any) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeExperience = (id: string) => {
    setCvData(prev => ({ ...prev, experiences: prev.experiences.filter(item => item.id !== id) }));
  };

  // Helper for Education
  const addEducation = () => {
    const newEdu: CVEducation = {
      id: Date.now().toString(),
      degree: 'Degree / Qualification',
      institute: 'Institute Name',
      location: 'Location',
      year: 'Year'
    };
    setCvData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const updateEducation = (id: string, field: keyof CVEducation, value: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeEducation = (id: string) => {
    setCvData(prev => ({ ...prev, education: prev.education.filter(item => item.id !== id) }));
  };

  // PDF Export
  const handleDownloadPDF = async () => {
    if (!cvRef.current) return;
    setIsExporting(true);
    try {
      await document.fonts.ready;
    } catch (e) {
      // ignore font loading errors
    }

    try {
      // Wait for all images to be fully loaded
      const images = cvRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(imgEl => {
          const img = imgEl as HTMLImageElement;
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          });
        })
      );

      // Brief pause to allow fonts and layout to settle
      await new Promise(resolve => setTimeout(resolve, 400));

      // Create a clean, isolated off-screen container for unscaled A4 capture
      const cloneContainer = document.createElement('div');
      cloneContainer.style.position = 'fixed';
      cloneContainer.style.left = '-9999px';
      cloneContainer.style.top = '0';
      cloneContainer.style.width = '794px';
      cloneContainer.style.height = '1123px';
      cloneContainer.style.zIndex = '99999';
      cloneContainer.style.background = '#ffffff';

      const clonedEl = cvRef.current.cloneNode(true) as HTMLElement;
      clonedEl.style.transform = 'none';
      clonedEl.style.width = '794px';
      clonedEl.style.height = '1123px';
      clonedEl.style.maxWidth = '794px';
      clonedEl.style.maxHeight = '1123px';
      clonedEl.style.boxShadow = 'none';
      clonedEl.style.margin = '0';
      clonedEl.style.position = 'relative';

      // Convert any canvas elements (e.g. QR code) to data URL images so html2canvas captures them successfully
      const originalCanvases = cvRef.current.querySelectorAll('canvas');
      const clonedCanvases = clonedEl.querySelectorAll('canvas');
      originalCanvases.forEach((origCanvas, idx) => {
        const clonedCanvas = clonedCanvases[idx];
        if (clonedCanvas && origCanvas) {
          try {
            const dataUrl = origCanvas.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = dataUrl;
            img.width = origCanvas.width;
            img.height = origCanvas.height;
            img.style.cssText = origCanvas.style.cssText;
            img.className = origCanvas.className;
            clonedCanvas.parentNode?.replaceChild(img, clonedCanvas);
          } catch (e) {
            console.error('Error converting canvas to image for PDF:', e);
          }
        }
      });

      cloneContainer.appendChild(clonedEl);
      document.body.appendChild(cloneContainer);

      const canvas = await html2canvas(clonedEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123,
      });

      document.body.removeChild(cloneContainer);

      const imgData = canvas.toDataURL('image/png');
      if (!imgData || imgData === 'data:,' || imgData.length < 100) {
        throw new Error('Canvas export produced invalid image data.');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const nameStr = cvData.fullName ? cvData.fullName.replace(/[^a-zA-Z0-9-_]/g, '_') : 'CV';
      pdf.save(`CV-${nameStr}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF. Please use Direct Print instead.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (!cvRef.current) return;
    try {
      await document.fonts.ready;
      const images = cvRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(imgEl => {
          const img = imgEl as HTMLImageElement;
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          });
        })
      );

      // Convert images to base64 data URLs to ensure profile pictures display correctly in print windows
      await Promise.all(
        Array.from(images).map(async (imgEl) => {
          const img = imgEl as HTMLImageElement;
          if (img.src && !img.src.startsWith('data:')) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || img.width || 300;
              canvas.height = img.naturalHeight || img.height || 300;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                if (dataUrl && dataUrl !== 'data:,') {
                  img.src = dataUrl;
                }
              }
            } catch (e) {
              // ignore cross-origin issues
            }
          }
        })
      );

      await new Promise(resolve => setTimeout(resolve, 400));
    } catch (e) {
      // ignore
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for printing.');
      return;
    }

    // Clone cvRef and serialize any canvases (like QR code) to <img> data URLs so they print reliably
    const clonedEl = cvRef.current.cloneNode(true) as HTMLElement;
    clonedEl.style.transform = 'none';
    clonedEl.style.width = '210mm';
    clonedEl.style.height = '297mm';
    clonedEl.style.maxWidth = '210mm';
    clonedEl.style.maxHeight = '297mm';
    clonedEl.style.boxShadow = 'none';
    clonedEl.style.margin = '0';
    clonedEl.style.position = 'relative';
    clonedEl.style.display = 'flex';
    clonedEl.style.flexDirection = 'row';
    clonedEl.style.overflow = 'hidden';

    const originalCanvases = cvRef.current.querySelectorAll('canvas');
    const clonedCanvases = clonedEl.querySelectorAll('canvas');
    originalCanvases.forEach((origCanvas, idx) => {
      const clonedCanvas = clonedCanvases[idx];
      if (clonedCanvas && origCanvas) {
        try {
          const dataUrl = origCanvas.toDataURL('image/png');
          const img = document.createElement('img');
          img.src = dataUrl;
          img.width = origCanvas.width;
          img.height = origCanvas.height;
          img.style.cssText = origCanvas.style.cssText;
          img.className = origCanvas.className;
          clonedCanvas.parentNode?.replaceChild(img, clonedCanvas);
        } catch (e) {
          console.error('Error converting canvas to image for print:', e);
        }
      }
    });

    const styleTags = Array.from(document.querySelectorAll('style'))
      .map(tag => tag.outerHTML)
      .join('\n');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CV - ${cvData.fullName || 'Candidate'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              display: flex;
              justify-content: center;
              align-items: center;
              width: 210mm;
              height: 297mm;
              overflow: hidden;
            }
            * {
              box-sizing: border-box;
            }
          </style>
          ${styleTags}
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@4.1.14/dist/tailwind.min.css" />
        </head>
        <body>
          ${clonedEl.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const qrDataString = JSON.stringify({
    name: cvData.fullName,
    phone: cvData.phone,
    email: cvData.email,
    cnic: cvData.cnic,
    location: cvData.location
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/60 sticky top-0 z-30 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-gradient-to-t from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-xl border border-slate-600 shadow flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Main Menu
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Professional CV Builder
              </h1>
              <p className="text-[11px] text-slate-400">MA Digital Store — A4 Portrait Reference Curriculum Vitae Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSaveCVRecord}
              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-t from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> {currentCvId ? 'Update CV' : 'Save CV'}
            </button>
            <button
              type="button"
              onClick={() => setIsSavedCVsModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-t from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer relative"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Saved CVs
              {savedCVs.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {savedCVs.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleCreateNewCVRecord}
              className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600 shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New CV
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-gradient-to-t from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Load Sample CV
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600 shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Form
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-t from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl border border-blue-400/30 shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> {isExporting ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-t from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-xl border border-teal-400/30 shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Direct Print
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="flex sm:hidden bg-slate-900 border-b border-slate-800 p-2 justify-center gap-2 print:hidden">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'edit' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300'}`}
        >
          <FileText className="w-3.5 h-3.5" /> Edit Form
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'preview' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300'}`}
        >
          <Eye className="w-3.5 h-3.5" /> Live A4 Preview
        </button>
      </div>

      {/* Main Workspace: Split Form & Preview */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Editor (Visible on desktop or when tab is edit on mobile) */}
        <div className={`lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6 print:hidden ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" /> Candidate CV Information
            </h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">All Fields Optional</span>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">1. Personal Information</h3>
              <div className="flex items-center gap-2">
                {renderFontSizeSelect(cvData.personalInfoFontSize, val => setCvData({ ...cvData, personalInfoFontSize: val }))}
                {renderFontColorSelect(cvData.personalInfoColor, val => setCvData({ ...cvData, personalInfoColor: val }))}
              </div>
            </div>

            {/* Profile Name Styling Controls */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Profile Name Style (Below Photo)
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {renderFontSizeSelect(cvData.profileNameFontSize, val => setCvData({ ...cvData, profileNameFontSize: val }))}
                  {renderFontColorSelect(cvData.profileNameColor, val => setCvData({ ...cvData, profileNameColor: val }))}
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={cvData.profileNameBold ?? true}
                      onChange={e => setCvData({ ...cvData, profileNameBold: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-amber-400 focus:ring-0 w-3.5 h-3.5"
                    />
                    Bold
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={cvData.profileNameItalic ?? false}
                      onChange={e => setCvData({ ...cvData, profileNameItalic: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-amber-400 focus:ring-0 w-3.5 h-3.5"
                    />
                    Italic
                  </label>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Independent font size, color, bold, and italic settings for the name displayed under the profile photo.</p>
            </div>

            {renderHeadingStyleControls(
              'Personal Information',
              cvData.personalInfoHeadingFontSize,
              val => setCvData({ ...cvData, personalInfoHeadingFontSize: val }),
              cvData.personalInfoHeadingColor,
              val => setCvData({ ...cvData, personalInfoHeadingColor: val }),
              cvData.personalInfoHeadingBold,
              val => setCvData({ ...cvData, personalInfoHeadingBold: val }),
              cvData.personalInfoHeadingItalic,
              val => setCvData({ ...cvData, personalInfoHeadingItalic: val })
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={cvData.fullName}
                  onChange={e => setCvData({ ...cvData, fullName: e.target.value })}
                  placeholder="e.g. MUHAMMADI ZARYANI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Date of Birth</label>
                <input
                  type="text"
                  value={cvData.dob}
                  onChange={e => setCvData({ ...cvData, dob: e.target.value })}
                  placeholder="e.g. 10-06-2006"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Gender</label>
                <input
                  type="text"
                  value={cvData.gender}
                  onChange={e => setCvData({ ...cvData, gender: e.target.value })}
                  placeholder="e.g. MALE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={cvData.fatherName}
                  onChange={e => setCvData({ ...cvData, fatherName: e.target.value })}
                  placeholder="e.g. ZAFAR ALI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Marital Status</label>
                <input
                  type="text"
                  value={cvData.maritalStatus}
                  onChange={e => setCvData({ ...cvData, maritalStatus: e.target.value })}
                  placeholder="e.g. Un-married"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">CNIC Number</label>
                <input
                  type="text"
                  value={cvData.cnic}
                  onChange={e => setCvData({ ...cvData, cnic: e.target.value })}
                  placeholder="e.g. 16101-0489195-5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nationality</label>
                <input
                  type="text"
                  value={cvData.nationality}
                  onChange={e => setCvData({ ...cvData, nationality: e.target.value })}
                  placeholder="e.g. PAKISTANI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={cvData.phone}
                  onChange={e => setCvData({ ...cvData, phone: e.target.value })}
                  placeholder="e.g. +923165069672"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={cvData.email}
                  onChange={e => setCvData({ ...cvData, email: e.target.value })}
                  placeholder="e.g. muhammadizaryani@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Location / Address</label>
                <input
                  type="text"
                  value={cvData.location}
                  onChange={e => setCvData({ ...cvData, location: e.target.value })}
                  placeholder="e.g. MARDAN, KPK, PAKISTAN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-[11px] font-bold text-slate-300">Profile Photo</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Size:</span>
                    <select
                      value={cvData.photoSize || 'Medium'}
                      onChange={e => setCvData({ ...cvData, photoSize: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[11px] text-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
                    >
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (uploadEvent) => {
                          if (uploadEvent.target?.result) {
                            setCvData(prev => ({ ...prev, photoUrl: uploadEvent.target.result as string }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 file:cursor-pointer cursor-pointer bg-slate-950 border border-slate-800 rounded-xl"
                  />
                  {cvData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setCvData(prev => ({ ...prev, photoUrl: '' }))}
                      className="px-3 py-2 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 shrink-0"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Upload an image from your computer/phone. It will be neatly cropped into the circular frame.</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">2. Professional Summary (Optional)</h3>
              <div className="flex items-center gap-2">
                {renderFontSizeSelect(cvData.summaryFontSize, val => setCvData({ ...cvData, summaryFontSize: val }))}
                {renderFontColorSelect(cvData.summaryColor, val => setCvData({ ...cvData, summaryColor: val }))}
              </div>
            </div>
            {renderHeadingStyleControls(
              'Summary',
              cvData.summaryHeadingFontSize,
              val => setCvData({ ...cvData, summaryHeadingFontSize: val }),
              cvData.summaryHeadingColor,
              val => setCvData({ ...cvData, summaryHeadingColor: val }),
              cvData.summaryHeadingBold,
              val => setCvData({ ...cvData, summaryHeadingBold: val }),
              cvData.summaryHeadingItalic,
              val => setCvData({ ...cvData, summaryHeadingItalic: val })
            )}
            <textarea
              rows={3}
              value={cvData.summary}
              onChange={e => setCvData({ ...cvData, summary: e.target.value })}
              placeholder="Write a brief professional summary..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          {/* Experience Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">3. Work Experience (Optional)</h3>
              <div className="flex items-center gap-2">
                {renderFontSizeSelect(cvData.experienceFontSize, val => setCvData({ ...cvData, experienceFontSize: val }))}
                {renderFontColorSelect(cvData.experienceColor, val => setCvData({ ...cvData, experienceColor: val }))}
                <button
                  type="button"
                  onClick={addExperience}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-all flex items-center gap-1 cursor-pointer ml-1"
                >
                  <Plus className="w-3 h-3" /> Add Job
                </button>
              </div>
            </div>
            {renderHeadingStyleControls(
              'Experience',
              cvData.experienceHeadingFontSize,
              val => setCvData({ ...cvData, experienceHeadingFontSize: val }),
              cvData.experienceHeadingColor,
              val => setCvData({ ...cvData, experienceHeadingColor: val }),
              cvData.experienceHeadingBold,
              val => setCvData({ ...cvData, experienceHeadingBold: val }),
              cvData.experienceHeadingItalic,
              val => setCvData({ ...cvData, experienceHeadingItalic: val })
            )}

            {cvData.experiences.map((exp) => (
              <div key={exp.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => removeExperience(exp.id)}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={exp.jobTitle}
                      onChange={e => updateExperience(exp.id, 'jobTitle', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={e => updateExperience(exp.id, 'location', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Duration</label>
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={e => updateExperience(exp.id, 'duration', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Bullet Points (One per line)</label>
                  <textarea
                    rows={2}
                    value={exp.bullets.join('\n')}
                    onChange={e => updateExperience(exp.id, 'bullets', e.target.value.split('\n'))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="Bullet point 1&#10;Bullet point 2"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Education Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">4. Education (Optional)</h3>
              <div className="flex items-center gap-2">
                {renderFontSizeSelect(cvData.educationFontSize, val => setCvData({ ...cvData, educationFontSize: val }))}
                {renderFontColorSelect(cvData.educationColor, val => setCvData({ ...cvData, educationColor: val }))}
                <button
                  type="button"
                  onClick={addEducation}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-all flex items-center gap-1 cursor-pointer ml-1"
                >
                  <Plus className="w-3 h-3" /> Add Degree
                </button>
              </div>
            </div>
            {renderHeadingStyleControls(
              'Education',
              cvData.educationHeadingFontSize,
              val => setCvData({ ...cvData, educationHeadingFontSize: val }),
              cvData.educationHeadingColor,
              val => setCvData({ ...cvData, educationHeadingColor: val }),
              cvData.educationHeadingBold,
              val => setCvData({ ...cvData, educationHeadingBold: val }),
              cvData.educationHeadingItalic,
              val => setCvData({ ...cvData, educationHeadingItalic: val })
            )}

            {cvData.education.map((edu) => (
              <div key={edu.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => removeEducation(edu.id)}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Degree / Qualification</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Institute Name</label>
                    <input
                      type="text"
                      value={edu.institute}
                      onChange={e => updateEducation(edu.id, 'institute', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={e => updateEducation(edu.id, 'location', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Year / Status</label>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={e => updateEducation(edu.id, 'year', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skills & Languages */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">5. Skills & Languages (Optional)</h3>
            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <label className="block text-[11px] font-bold text-slate-300">Skills (Comma separated)</label>
                <div className="flex items-center gap-2">
                  {renderFontSizeSelect(cvData.skillsFontSize, val => setCvData({ ...cvData, skillsFontSize: val }))}
                  {renderFontColorSelect(cvData.skillsColor, val => setCvData({ ...cvData, skillsColor: val }))}
                </div>
              </div>
              {renderHeadingStyleControls(
                'Skills',
                cvData.skillsHeadingFontSize,
                val => setCvData({ ...cvData, skillsHeadingFontSize: val }),
                cvData.skillsHeadingColor,
                val => setCvData({ ...cvData, skillsHeadingColor: val }),
                cvData.skillsHeadingBold,
                val => setCvData({ ...cvData, skillsHeadingBold: val }),
                cvData.skillsHeadingItalic,
                val => setCvData({ ...cvData, skillsHeadingItalic: val })
              )}
              <input
                type="text"
                value={cvData.skills.join(', ')}
                onChange={e => setCvData({ ...cvData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="MS Office, Word, Excel, Photoshop"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none mt-1.5"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <label className="block text-[11px] font-bold text-slate-300">Languages (Comma separated)</label>
                <div className="flex items-center gap-2">
                  {renderFontSizeSelect(cvData.languagesFontSize, val => setCvData({ ...cvData, languagesFontSize: val }))}
                  {renderFontColorSelect(cvData.languagesColor, val => setCvData({ ...cvData, languagesColor: val }))}
                </div>
              </div>
              {renderHeadingStyleControls(
                'Languages',
                cvData.languagesHeadingFontSize,
                val => setCvData({ ...cvData, languagesHeadingFontSize: val }),
                cvData.languagesHeadingColor,
                val => setCvData({ ...cvData, languagesHeadingColor: val }),
                cvData.languagesHeadingBold,
                val => setCvData({ ...cvData, languagesHeadingBold: val }),
                cvData.languagesHeadingItalic,
                val => setCvData({ ...cvData, languagesHeadingItalic: val })
              )}
              <input
                type="text"
                value={cvData.languages.join(', ')}
                onChange={e => setCvData({ ...cvData, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="PASHTO, URDU, ENGLISH"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 Portrait Preview (Visible on desktop or when tab is preview on mobile) */}
        <div className={`lg:col-span-6 flex flex-col items-center ${activeTab === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="w-full text-center mb-3 flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live A4 Portrait Reference Preview</span>
            <span className="text-[10px] text-amber-400 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">Single A4 Page</span>
          </div>

          {/* Responsive A4 Scaling Wrapper */}
          <div ref={previewContainerRef} className="w-full overflow-hidden flex justify-center bg-slate-950/40 p-2 sm:p-4 rounded-3xl border border-slate-800 shadow-inner">
            <div style={{ width: `${794 * previewScale}px`, height: `${1123 * previewScale}px`, overflow: 'hidden' }} className="transition-all duration-100">
              <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: '210mm', height: '297mm' }}>
                {/* A4 Container matching reference layout exactly */}
                <div 
                  id="printable-cv-area"
                  ref={cvRef}
                  className="w-[210mm] h-[297mm] max-w-[210mm] max-h-[297mm] bg-white text-slate-900 shadow-[0_25px_60px_rgba(0,0,0,0.7)] relative overflow-hidden flex flex-row print:shadow-none print:w-full print:h-auto print:min-h-[297mm] print:m-0 print:p-0"
                  style={{ boxSizing: 'border-box' }}
                >
            {/* Left Dark Sidebar (approx 38%) */}
            <div className="w-[38%] bg-[#1e293b] text-white p-6 flex flex-col relative h-full box-border overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex-1">
                {/* Profile Photo */}
                <div className="flex flex-col items-center">
                  <div className={`${
                    cvData.photoSize === 'Small' ? 'w-24 h-24' :
                    cvData.photoSize === 'Large' ? 'w-48 h-48' :
                    'w-36 h-36'
                  } rounded-full border-4 border-amber-400 shadow-xl overflow-hidden bg-slate-800 flex items-center justify-center relative transition-all duration-200`}>
                    {cvData.photoUrl ? (
                      <img src={cvData.photoUrl} alt={cvData.fullName} crossOrigin="anonymous" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-amber-400 font-black text-3xl">
                        {cvData.fullName ? cvData.fullName.charAt(0) : 'CV'}
                      </div>
                    )}
                  </div>
                  
                  {/* Name in Left Sidebar */}
                  <h3 
                    className="text-amber-400 font-black text-lg tracking-wider text-center mt-3 uppercase leading-tight"
                    style={{
                      ...(cvData.profileNameFontSize && cvData.profileNameFontSize !== 'Auto' ? { fontSize: `${cvData.profileNameFontSize}px` } : {}),
                      ...(cvData.profileNameColor && cvData.profileNameColor !== 'Auto' ? { color: cvData.profileNameColor } : {}),
                      fontWeight: cvData.profileNameBold === false ? 'normal' : '900',
                      fontStyle: cvData.profileNameItalic ? 'italic' : 'normal'
                    }}
                  >
                    {cvData.fullName || 'CANDIDATE NAME'}
                  </h3>
                </div>

                {/* Personal Information Box */}
                <div className="mt-5">
                  <div 
                    className="bg-amber-400 text-slate-950 font-extrabold text-[12px] uppercase px-3.5 py-1 rounded-full shadow-md text-center tracking-widest mb-2.5"
                    style={{
                      ...(cvData.personalInfoHeadingFontSize && cvData.personalInfoHeadingFontSize !== 'Auto' ? { fontSize: `${cvData.personalInfoHeadingFontSize}px` } : {}),
                      ...(cvData.personalInfoHeadingColor && cvData.personalInfoHeadingColor !== 'Auto' ? { color: cvData.personalInfoHeadingColor } : {}),
                      fontWeight: cvData.personalInfoHeadingBold === false ? 'normal' : '800',
                      fontStyle: cvData.personalInfoHeadingItalic ? 'italic' : 'normal'
                    }}
                  >
                    PERSONAL INFORMATION
                  </div>

                  <div 
                    className="space-y-1.5 text-[10.5px] text-slate-100"
                    style={{
                      ...(cvData.personalInfoFontSize && cvData.personalInfoFontSize !== 'Auto' ? { fontSize: `${cvData.personalInfoFontSize}px` } : {}),
                      ...(cvData.personalInfoColor && cvData.personalInfoColor !== 'Auto' ? { color: cvData.personalInfoColor } : {})
                    }}
                  >
                    {cvData.fullName && (
                      <div className="border-b border-slate-700/60 pb-1 flex justify-between gap-1">
                        <span className="font-bold text-amber-300">NAME:</span>
                        <span className="font-bold text-right uppercase text-white">{cvData.fullName}</span>
                      </div>
                    )}
                    {cvData.dob && (
                      <div className="border-b border-slate-700/60 pb-1 flex justify-between gap-1">
                        <span className="font-bold text-amber-300">D.O.B:</span>
                        <span className="font-bold text-right uppercase text-white">{cvData.dob}</span>
                      </div>
                    )}
                    {cvData.gender && (
                      <div className="border-b border-slate-700/60 pb-1 flex justify-between gap-1">
                        <span className="font-bold text-amber-300">GENDER:</span>
                        <span className="font-bold text-right uppercase text-white">{cvData.gender}</span>
                      </div>
                    )}
                    {cvData.fatherName && (
                      <div className="border-b border-slate-700/60 pb-1 flex justify-between gap-1">
                        <span className="font-bold text-amber-300">F.NAME:</span>
                        <span className="font-bold text-right uppercase text-white">{cvData.fatherName}</span>
                      </div>
                    )}
                    {cvData.maritalStatus && (
                      <div className="border-b border-slate-700/60 pb-1 flex justify-between gap-1">
                        <span className="font-bold text-amber-300">Marital Status:</span>
                        <span className="font-bold text-right uppercase text-white">{cvData.maritalStatus}</span>
                      </div>
                    )}
                    {cvData.cnic && (
                      <div className="border-b border-slate-700/60 pb-1 flex justify-between gap-1">
                        <span className="font-bold text-amber-300">CNIC:</span>
                        <span className="font-bold text-right font-mono text-white">{cvData.cnic}</span>
                      </div>
                    )}
                    {cvData.nationality && (
                      <div className="border-b border-slate-700/60 pb-1 flex justify-between gap-1">
                        <span className="font-bold text-amber-300">NATIONALITY:</span>
                        <span className="font-bold text-right uppercase text-white">{cvData.nationality}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Section */}
                {(cvData.fullName || cvData.phone || cvData.email) && (
                  <div className="mt-4 flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-amber-400">
                      <QRCode value={qrDataString} size={85} />
                    </div>
                    <div className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-3 py-0.5 rounded-full mt-1.5 tracking-widest shadow">
                      SCAN ME
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Contact Sidebar */}
              <div 
                className="mt-auto pt-3 border-t border-slate-700/80 space-y-1.5 text-[10px] text-slate-100"
                style={{
                  ...(cvData.personalInfoFontSize && cvData.personalInfoFontSize !== 'Auto' ? { fontSize: `${cvData.personalInfoFontSize}px` } : {}),
                  ...(cvData.personalInfoColor && cvData.personalInfoColor !== 'Auto' ? { color: cvData.personalInfoColor } : {})
                }}
              >
                {cvData.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-bold uppercase leading-tight text-white">{cvData.location}</span>
                  </div>
                )}
                {cvData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold font-mono text-white">{cvData.phone}</span>
                  </div>
                )}
                {cvData.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold truncate text-white">{cvData.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Main Content Area (approx 62%) */}
            <div className="w-[62%] bg-white text-slate-900 p-7 flex flex-col relative h-full box-border overflow-hidden">
              <div className="flex-1 space-y-3.5">
                {/* Header Title */}
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-3">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">CURRICULUM VITAE</h2>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  </div>
                </div>

                {/* 1. Summary Section (Optional) */}
                {cvData.summary.trim() && (
                  <div>
                    <div 
                      className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-[12.5px] uppercase px-3.5 py-1 rounded-full shadow-sm mb-1.5"
                      style={{
                        ...(cvData.summaryHeadingFontSize && cvData.summaryHeadingFontSize !== 'Auto' ? { fontSize: `${cvData.summaryHeadingFontSize}px` } : {}),
                        ...(cvData.summaryHeadingColor && cvData.summaryHeadingColor !== 'Auto' ? { color: cvData.summaryHeadingColor } : {}),
                        fontWeight: cvData.summaryHeadingBold === false ? 'normal' : '900',
                        fontStyle: cvData.summaryHeadingItalic ? 'italic' : 'normal'
                      }}
                    >
                      <User className="w-3.5 h-3.5" /> SUMMARY
                    </div>
                    <p 
                      className="text-[11.5px] text-black leading-relaxed font-normal"
                      style={{
                        ...(cvData.summaryFontSize && cvData.summaryFontSize !== 'Auto' ? { fontSize: `${cvData.summaryFontSize}px` } : {}),
                        ...(cvData.summaryColor && cvData.summaryColor !== 'Auto' ? { color: cvData.summaryColor } : {})
                      }}
                    >
                      {cvData.summary}
                    </p>
                  </div>
                )}

                {/* 2. Experience Section (Optional) */}
                {cvData.experiences.length > 0 && (
                  <div>
                    <div 
                      className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-[12.5px] uppercase px-3.5 py-1 rounded-full shadow-sm mb-1.5"
                      style={{
                        ...(cvData.experienceHeadingFontSize && cvData.experienceHeadingFontSize !== 'Auto' ? { fontSize: `${cvData.experienceHeadingFontSize}px` } : {}),
                        ...(cvData.experienceHeadingColor && cvData.experienceHeadingColor !== 'Auto' ? { color: cvData.experienceHeadingColor } : {}),
                        fontWeight: cvData.experienceHeadingBold === false ? 'normal' : '900',
                        fontStyle: cvData.experienceHeadingItalic ? 'italic' : 'normal'
                      }}
                    >
                      <Briefcase className="w-3.5 h-3.5" /> EXPERIENCE
                    </div>
                    <div 
                      className="space-y-2.5"
                      style={{
                        ...(cvData.experienceFontSize && cvData.experienceFontSize !== 'Auto' ? { fontSize: `${cvData.experienceFontSize}px` } : {}),
                        ...(cvData.experienceColor && cvData.experienceColor !== 'Auto' ? { color: cvData.experienceColor } : {})
                      }}
                    >
                      {cvData.experiences.map((exp) => (
                        <div key={exp.id} className="text-xs">
                          <div className="font-bold text-black uppercase leading-tight">{exp.jobTitle}</div>
                          <div className="font-bold text-black flex justify-between items-center text-[11px]">
                            <span>{exp.company}{exp.location ? `, ${exp.location}` : ''}</span>
                            {exp.duration && <span className="font-bold text-black">({exp.duration})</span>}
                          </div>
                          {exp.bullets.length > 0 && (
                            <ul className="mt-1 space-y-0.5 list-disc list-inside text-[11px] text-black">
                              {exp.bullets.map((b, idx) => b.trim() && (
                                <li key={idx} className="leading-tight">{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Education Section (Optional) */}
                {cvData.education.length > 0 && (
                  <div>
                    <div 
                      className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-[12.5px] uppercase px-3.5 py-1 rounded-full shadow-sm mb-1.5"
                      style={{
                        ...(cvData.educationHeadingFontSize && cvData.educationHeadingFontSize !== 'Auto' ? { fontSize: `${cvData.educationHeadingFontSize}px` } : {}),
                        ...(cvData.educationHeadingColor && cvData.educationHeadingColor !== 'Auto' ? { color: cvData.educationHeadingColor } : {}),
                        fontWeight: cvData.educationHeadingBold === false ? 'normal' : '900',
                        fontStyle: cvData.educationHeadingItalic ? 'italic' : 'normal'
                      }}
                    >
                      <GraduationCap className="w-3.5 h-3.5" /> EDUCATION
                    </div>
                    <ul 
                      className="space-y-1.5 text-xs"
                      style={{
                        ...(cvData.educationFontSize && cvData.educationFontSize !== 'Auto' ? { fontSize: `${cvData.educationFontSize}px` } : {}),
                        ...(cvData.educationColor && cvData.educationColor !== 'Auto' ? { color: cvData.educationColor } : {})
                      }}
                    >
                      {cvData.education.map((edu) => (
                        <li key={edu.id} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-1.5 shrink-0"></span>
                          <div className="flex-1">
                            <span className="font-bold text-black">{edu.degree}</span>
                            <span className="text-black font-semibold"> | {edu.institute}{edu.location ? `, ${edu.location}` : ''}</span>
                            {edu.year && <span className="text-black font-bold text-[11px] ml-1">({edu.year})</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 4. Skills Section (Optional) */}
                {cvData.skills.length > 0 && (
                  <div>
                    <div 
                      className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-[12.5px] uppercase px-3.5 py-1 rounded-full shadow-sm mb-1.5"
                      style={{
                        ...(cvData.skillsHeadingFontSize && cvData.skillsHeadingFontSize !== 'Auto' ? { fontSize: `${cvData.skillsHeadingFontSize}px` } : {}),
                        ...(cvData.skillsHeadingColor && cvData.skillsHeadingColor !== 'Auto' ? { color: cvData.skillsHeadingColor } : {}),
                        fontWeight: cvData.skillsHeadingBold === false ? 'normal' : '900',
                        fontStyle: cvData.skillsHeadingItalic ? 'italic' : 'normal'
                      }}
                    >
                      <Wrench className="w-3.5 h-3.5" /> SKILLS
                    </div>
                    <div 
                      className="flex flex-wrap gap-1"
                      style={{
                        ...(cvData.skillsFontSize && cvData.skillsFontSize !== 'Auto' ? { fontSize: `${cvData.skillsFontSize}px` } : {}),
                        ...(cvData.skillsColor && cvData.skillsColor !== 'Auto' ? { color: cvData.skillsColor } : {})
                      }}
                    >
                      {cvData.skills.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-black rounded-md text-[10.5px] font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Languages Section (Optional) */}
                {cvData.languages.length > 0 && (
                  <div>
                    <div 
                      className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-[12.5px] uppercase px-3.5 py-1 rounded-full shadow-sm mb-1.5"
                      style={{
                        ...(cvData.languagesHeadingFontSize && cvData.languagesHeadingFontSize !== 'Auto' ? { fontSize: `${cvData.languagesHeadingFontSize}px` } : {}),
                        ...(cvData.languagesHeadingColor && cvData.languagesHeadingColor !== 'Auto' ? { color: cvData.languagesHeadingColor } : {}),
                        fontWeight: cvData.languagesHeadingBold === false ? 'normal' : '900',
                        fontStyle: cvData.languagesHeadingItalic ? 'italic' : 'normal'
                      }}
                    >
                      <LanguagesIcon className="w-3.5 h-3.5" /> LANGUAGES
                    </div>
                    <div 
                      className="flex flex-wrap gap-2 text-xs font-bold text-black"
                      style={{
                        ...(cvData.languagesFontSize && cvData.languagesFontSize !== 'Auto' ? { fontSize: `${cvData.languagesFontSize}px` } : {}),
                        ...(cvData.languagesColor && cvData.languagesColor !== 'Auto' ? { color: cvData.languagesColor } : {})
                      }}
                    >
                      {cvData.languages.map((lang, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          <span>{lang}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer minimal brand */}
              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <span>MA DIGITAL STORE — PROFESSIONAL CURRICULUM VITAE</span>
                <span className="font-mono">Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Saved CVs Modal */}
      {isSavedCVsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">Saved CVs ({savedCVs.length})</h3>
              </div>
              <button
                onClick={() => setIsSavedCVsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {savedCVs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No saved CVs found.</p>
                  <p className="text-xs text-slate-600 mt-1">Create a CV and click "Save CV" to store it securely.</p>
                </div>
              ) : (
                savedCVs.map(cv => (
                  <div
                    key={cv.id}
                    onClick={() => handleOpenCVRecord(cv)}
                    className={`bg-slate-950/60 border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all cursor-pointer hover:border-amber-400/50 ${currentCvId === cv.id ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 uppercase">
                        {cv.fullName ? cv.fullName.charAt(0) : 'CV'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate">{cv.fullName || 'Untitled CV'}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>{cv.phone || 'No phone'}</span>
                          <span>•</span>
                          <span>{new Date(cv.updatedAt || cv.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCVRecord(cv);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer"
                      >
                        Open / Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCVRecord(cv.id, e)}
                        className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all cursor-pointer bg-slate-900 border border-slate-800"
                        title="Delete CV"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCreateNewCVRecord}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create New CV
              </button>
              <button
                type="button"
                onClick={() => setIsSavedCVsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Notification Toast */}
      {saveNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-extrabold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" /> {saveNotification}
        </div>
      )}
</div>
  );
};
