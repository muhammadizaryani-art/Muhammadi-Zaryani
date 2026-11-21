import React, { useState, useEffect } from 'react';
import { InvoiceData } from './types';
import { getInitialInvoiceData, getSampleInvoiceData } from './data/sampleData';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceHistoryModal } from './components/InvoiceHistoryModal';
import { InvoiceDashboard } from './components/InvoiceDashboard';
import { MainHomeScreen } from './components/MainHomeScreen';
import { DomicileManager } from './components/DomicileManager';
import { CVBuilderManager } from './components/CVBuilderManager';
import { UserOnboardingModal } from './components/UserOnboardingModal';
import { LoginScreen } from './components/LoginScreen';
import { AuthSignupScreen } from './components/AuthSignupScreen';
import { Logo } from './components/Logo';
import { Edit3, Eye, Sparkles, Printer, Download, History, FolderClock, TrendingUp, X, Home } from 'lucide-react';
import { saveInvoiceToDB, getNextInvoiceNo, getInvoiceByNoFromDB, getInvoiceFingerprint } from './db/indexedDB';
import { auth, onAuthStateChanged, User } from './lib/firebase';

export default function App() {
  const [appView, setAppView] = useState<'home' | 'invoice' | 'domicile' | 'cv'>('home');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);

  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    return getInitialInvoiceData();
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [loadedInvoiceContext, setLoadedInvoiceContext] = useState<{ invoiceNo: string; fingerprint: string } | null>(null);

  useEffect(() => {
    // Load next sequential invoice number on mount
    getNextInvoiceNo().then((nextNo) => {
      setInvoiceData((prev) => ({ ...prev, invoiceNo: nextNo }));
    });

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setAuthUser(user);
        if (user) {
          const completed = localStorage.getItem('onboarding_completed_' + user.uid) === 'true';
          setOnboardingCompleted(completed);
        } else {
          setOnboardingCompleted(true);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleSampleLoad = () => {
    setInvoiceData(getSampleInvoiceData());
    setLoadedInvoiceContext(null);
  };

  const handleReset = async () => {
    const nextNo = await getNextInvoiceNo();
    const fresh = getInitialInvoiceData();
    fresh.invoiceNo = nextNo;
    setInvoiceData(fresh);
    setLoadedInvoiceContext(null);
  };

  const processInvoiceBeforePrintOrSave = async (currentData: InvoiceData): Promise<InvoiceData> => {
    const currentFingerprint = getInvoiceFingerprint(currentData);

    if (loadedInvoiceContext) {
      if (currentFingerprint === loadedInvoiceContext.fingerprint) {
        const existing = await getInvoiceByNoFromDB(loadedInvoiceContext.invoiceNo);
        if (existing) {
          return currentData;
        }
      } else {
        // Edited previously saved invoice -> CRITICAL: Create NEW history record with NEW invoice number!
        const nextNo = await getNextInvoiceNo();
        const newData = { ...currentData, invoiceNo: nextNo };
        await saveInvoiceToDB(newData);
        setDashboardRefreshKey((prev) => prev + 1);
        setLoadedInvoiceContext({
          invoiceNo: nextNo,
          fingerprint: getInvoiceFingerprint(newData),
        });
        setInvoiceData(newData);
        return newData;
      }
    }

    const existingByNo = await getInvoiceByNoFromDB(currentData.invoiceNo);
    if (existingByNo) {
      const existingFingerprint = getInvoiceFingerprint(existingByNo);
      if (currentFingerprint === existingFingerprint) {
        setLoadedInvoiceContext({
          invoiceNo: currentData.invoiceNo,
          fingerprint: currentFingerprint,
        });
        return currentData;
      } else {
        // InvoiceNo exists with different content -> generate new number and save new record
        const nextNo = await getNextInvoiceNo();
        const newData = { ...currentData, invoiceNo: nextNo };
        await saveInvoiceToDB(newData);
        setDashboardRefreshKey((prev) => prev + 1);
        setLoadedInvoiceContext({
          invoiceNo: nextNo,
          fingerprint: getInvoiceFingerprint(newData),
        });
        setInvoiceData(newData);
        return newData;
      }
    } else {
      await saveInvoiceToDB(currentData);
      setDashboardRefreshKey((prev) => prev + 1);
      setLoadedInvoiceContext({
        invoiceNo: currentData.invoiceNo,
        fingerprint: currentFingerprint,
      });
      return currentData;
    }
  };

  const handleSaveInvoice = async () => {
    try {
      await processInvoiceBeforePrintOrSave(invoiceData);
      alert('Invoice saved successfully to IndexedDB history!');
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert('Failed to save invoice to storage.');
    }
  };

  const handleNewInvoice = async () => {
    const nextNo = await getNextInvoiceNo();
    const fresh = getInitialInvoiceData();
    fresh.invoiceNo = nextNo;
    setInvoiceData(fresh);
    setActiveTab('edit');
    setLoadedInvoiceContext(null);
  };

  const handleNewInvoiceWithNumber = (newNo: string) => {
    const fresh = getInitialInvoiceData();
    fresh.invoiceNo = newNo;
    setInvoiceData(fresh);
    setActiveTab('edit');
    setLoadedInvoiceContext(null);
  };

  if (!authUser) {
    return <AuthSignupScreen onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  if (authUser && !onboardingCompleted) {
    return (
      <UserOnboardingModal
        user={authUser}
        onComplete={(profileData) => {
          localStorage.setItem('onboarding_completed_' + authUser.uid, 'true');
          localStorage.setItem('user_profile_' + authUser.uid, JSON.stringify(profileData));
          setOnboardingCompleted(true);
        }}
      />
    );
  }

  if (appView === 'home') {
    return <MainHomeScreen onSelectModule={(mod) => setAppView(mod)} />;
  }

  if (appView === 'cv') {
    return <CVBuilderManager onBackToHome={() => setAppView('home')} />;
  }

  if (appView === 'domicile') {
    return <DomicileManager onBackToHome={() => setAppView('home')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAppView('home')}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors"
              title="Return to Main Menu"
            >
              <Home className="w-4 h-4 text-blue-600" /> Main Menu
            </button>
            <div className="flex items-center gap-2">
              <Logo showText={false} className="text-blue-600 flex-shrink-0" />
              <div className="flex flex-col justify-center">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-snug">
                  MA DIGITAL STORE
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-normal mt-0.5">Professional Invoice & Billing Generator</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop Liquid Glass 3D Navigation Bar */}
            <nav className="hidden sm:flex items-center gap-1 bg-slate-950/85 backdrop-blur-2xl p-1.5 rounded-2xl border border-slate-700/55 shadow-[0_12px_35px_rgba(0,0,0,0.4)]">
              <button
                type="button"
                onClick={() => setShowDashboardModal(true)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-1.5 ${
                  showDashboardModal
                    ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_6px_20px_rgba(37,99,235,0.4)] -translate-y-1 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-blue-400" /> Dashboard
              </button>

              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-1.5 ${
                  showHistoryModal
                    ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_6px_20px_rgba(37,99,235,0.4)] -translate-y-1 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FolderClock className="w-4 h-4 text-blue-400" /> History
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-1.5 ${
                  !showDashboardModal && !showHistoryModal && activeTab === 'preview'
                    ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_6px_20px_rgba(37,99,235,0.4)] -translate-y-1 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Eye className="w-4 h-4 text-blue-400" /> Preview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-1.5 ${
                  !showDashboardModal && !showHistoryModal && activeTab === 'edit'
                    ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_6px_20px_rgba(37,99,235,0.4)] -translate-y-1 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Edit3 className="w-4 h-4 text-blue-400" /> Edit
              </button>

              <button
                type="button"
                onClick={handleSaveInvoice}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-t from-emerald-600 to-emerald-500 text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-95 transition-all duration-300 flex items-center gap-1.5 -translate-y-1"
              >
                <History className="w-4 h-4" /> Save Invoice
              </button>
            </nav>

            {/* Mobile quick action in header if needed */}
            <button
              type="button"
              onClick={handleSaveInvoice}
              className="sm:hidden px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-8">
        {activeTab === 'edit' ? (
          <InvoiceForm
            data={invoiceData}
            onChange={setInvoiceData}
            onReset={handleReset}
            onLoadSample={handleSampleLoad}
            onGenerate={() => setActiveTab('preview')}
          />
        ) : (
          <InvoicePreview
            data={invoiceData}
            onBackToEdit={() => setActiveTab('edit')}
            onNewInvoice={handleNewInvoice}
            onOpenDashboard={() => setShowDashboardModal(true)}
            onBeforePrint={processInvoiceBeforePrintOrSave}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden">
        <p>© 2026 MA Digital Store, Mardan. All rights reserved. Professional A4 Invoice Generator.</p>
      </footer>

      {/* Sales Dashboard Modal */}
      {showDashboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Sales Dashboard</h2>
                  <p className="text-xs text-slate-500">Real-time summary of sales, invoices, and payments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDashboardModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <InvoiceDashboard refreshTrigger={dashboardRefreshKey} />
            </div>
            <div className="px-6 py-3 bg-white border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setShowDashboardModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History Modal */}
      <InvoiceHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectInvoice={(inv, mode) => {
          setInvoiceData(inv);
          setActiveTab(mode);
          setLoadedInvoiceContext({
            invoiceNo: inv.invoiceNo,
            fingerprint: getInvoiceFingerprint(inv),
          });
        }}
        onNewInvoice={handleNewInvoiceWithNumber}
      />

      {/* Mobile Floating Liquid Glass 3D Bottom Navigation Bar */}
      <div className="fixed bottom-5 left-4 right-4 z-40 sm:hidden print:hidden">
        <div className="bg-slate-950/85 backdrop-blur-2xl border border-slate-700/50 p-2 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex items-center justify-around text-white">
          <button
            type="button"
            onClick={() => setAppView('home')}
            className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all duration-300"
          >
            <Home className="w-4 h-4 mb-0.5 text-cyan-400" />
            <span>Menu</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDashboardModal(true)}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all duration-300 ${
              showDashboardModal
                ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_10px_25px_rgba(37,99,235,0.45)] -translate-y-3.5 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all duration-300 ${
              showHistoryModal
                ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_10px_25px_rgba(37,99,235,0.45)] -translate-y-3.5 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderClock className="w-4 h-4 mb-0.5" />
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all duration-300 ${
              !showDashboardModal && !showHistoryModal && activeTab === 'preview'
                ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_10px_25px_rgba(37,99,235,0.45)] -translate-y-3.5 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4 mb-0.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all duration-300 ${
              !showDashboardModal && !showHistoryModal && activeTab === 'edit'
                ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-[0_10px_25px_rgba(37,99,235,0.45)] -translate-y-3.5 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4 mb-0.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={handleSaveInvoice}
            className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold bg-gradient-to-t from-emerald-600 to-emerald-500 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-95 transition-all duration-300"
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
