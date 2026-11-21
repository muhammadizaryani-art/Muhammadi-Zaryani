import React from 'react';
import { FileText, Shield, Sparkles, ArrowRight, Printer, Users, Database } from 'lucide-react';
import { Logo } from './Logo';
import { AuthBar } from './AuthBar';

interface MainHomeScreenProps {
  onSelectModule: (module: 'invoice' | 'domicile' | 'cv') => void;
}

export const MainHomeScreen: React.FC<MainHomeScreenProps> = ({ onSelectModule }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Banner / Header */}
      <header className="w-full bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/60 py-4 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Logo showText={false} className="text-cyan-400" />
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-snug">
              MA DIGITAL STORE
            </h1>
            <p className="text-xs text-slate-400 font-medium">Professional Digital Services & Billing Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AuthBar />
        </div>
      </header>

      {/* Hero Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/90 border border-slate-700 text-cyan-400 text-xs font-bold uppercase tracking-widest shadow-lg mb-4">
          <Sparkles className="w-4 h-4" /> Comprehensive Shop Management, Billing & CV Suite
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight sm:leading-none max-w-3xl">
          Welcome to <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400 bg-clip-text text-transparent">MA Digital Store</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-3 leading-relaxed">
          Select a professional module below to manage digital invoices, domicile applicant records, or build professional reference CVs instantly.
        </p>

        {/* Three Large 3D Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-10">
          {/* Invoice Generator Button */}
          <button
            onClick={() => onSelectModule('invoice')}
            className="group relative bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 hover:from-blue-500 hover:to-blue-800 text-left p-6 sm:p-8 rounded-3xl border border-blue-400/40 shadow-[0_15px_35px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_45px_rgba(37,99,235,0.6)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white mb-5 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white tracking-wide">INVOICE GENERATOR</h3>
              <p className="text-xs text-blue-100/80 mt-2 font-medium leading-relaxed">
                Create professional A4 invoices, manage customer & product databases, print, download PDFs, and view history.
              </p>
            </div>
            <div className="flex items-center gap-2 text-white font-bold text-xs mt-6 group-hover:translate-x-1.5 transition-transform">
              <span>Launch Invoice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Domicile Entry Button */}
          <button
            onClick={() => onSelectModule('domicile')}
            className="group relative bg-gradient-to-b from-teal-600 via-teal-700 to-cyan-900 hover:from-teal-500 hover:to-cyan-800 text-left p-6 sm:p-8 rounded-3xl border border-teal-400/40 shadow-[0_15px_35px_rgba(20,184,166,0.4)] hover:shadow-[0_20px_45px_rgba(20,184,166,0.6)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white mb-5 shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white tracking-wide">DOMICILE ENTRY</h3>
              <p className="text-xs text-teal-100/80 mt-2 font-medium leading-relaxed">
                Manage applicant domicile records, upload pictures & supporting documents (DMC, Form B, Parent CNIC), and profile viewer.
              </p>
            </div>
            <div className="flex items-center gap-2 text-white font-bold text-xs mt-6 group-hover:translate-x-1.5 transition-transform">
              <span>Launch Domicile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* CV Builder Button */}
          <button
            onClick={() => onSelectModule('cv')}
            className="group relative bg-gradient-to-b from-amber-600 via-amber-700 to-yellow-900 hover:from-amber-500 hover:to-yellow-800 text-left p-6 sm:p-8 rounded-3xl border border-amber-400/40 shadow-[0_15px_35px_rgba(245,158,11,0.4)] hover:shadow-[0_20px_45px_rgba(245,158,11,0.6)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white mb-5 shadow-inner">
                <FileText className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-black text-white tracking-wide">CV BUILDER</h3>
              <p className="text-xs text-amber-100/80 mt-2 font-medium leading-relaxed">
                Build professional A4 portrait reference CVs with two-column layout, gold accents, photo upload, QR code, and PDF export.
              </p>
            </div>
            <div className="flex items-center gap-2 text-white font-bold text-xs mt-6 group-hover:translate-x-1.5 transition-transform">
              <span>Launch CV Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-800 bg-slate-950/60">
        &copy; {new Date().getFullYear()} MA Digital Store. All rights reserved. Professional Billing & Domicile Management System.
      </footer>
    </div>
  );
};
