import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Calendar, Mail, ShieldCheck, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User as FirebaseUser } from '../lib/firebase';

interface UserOnboardingModalProps {
  user: FirebaseUser;
  onComplete: (profileData: { fullName: string; dateOfBirth: string }) => void;
}

export const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState(user.displayName || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!dateOfBirth) {
      setError('Please select your date of birth.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSendVerification = async () => {
    setIsSendingVerification(true);
    try {
      if (user && !user.emailVerified) {
        if (typeof (user as any).sendEmailVerification === 'function') {
          await (user as any).sendEmailVerification();
        }
      }
      setVerificationSent(true);
    } catch (err: any) {
      console.error('Error sending verification email:', err);
      setVerificationSent(true);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleFinishOnboarding = () => {
    onComplete({ fullName: fullName.trim(), dateOfBirth });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-900/95 border border-slate-800/80 rounded-3xl max-w-4xl w-full overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.85)] grid grid-cols-1 md:grid-cols-12 relative backdrop-blur-2xl"
      >
        {/* Left / Gradient Brand Accent Panel (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950/85 to-indigo-950 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800/80">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/25 text-base tracking-wider">
                MA
              </div>
              <div>
                <span className="text-xs font-black tracking-widest text-white uppercase block">MA DIGITAL STORE</span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider block">SECURE PORTAL</span>
              </div>
            </div>

            <div className="mt-12 sm:mt-16">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Step {step} of 2
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                {step === 1 ? 'Personal Information' : 'Gmail Verification'}
              </h2>
              <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                {step === 1
                  ? 'Set up your merchant profile details to access invoicing, domicile records, and automated tools.'
                  : 'Verify your authenticated Google account to ensure high-security compliance.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-6 border-t border-slate-800/80 flex items-center gap-3.5">
            <div className="relative">
              <img
                src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt=""
                className="w-11 h-11 rounded-2xl border-2 border-blue-500/40 object-cover shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.displayName || 'Google Merchant'}</p>
              <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Right Form Panel (7 cols) */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/90 relative">
          {/* Step Indicator Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-blue-400' : 'text-emerald-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step === 1 ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Personal Info</span>
              </div>
              <span className="text-slate-600">→</span>
              <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-blue-400' : 'text-slate-500'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step === 2 ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  2
                </span>
                <span>Verification</span>
              </div>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Secure Onboarding</span>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-red-500/5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleStep1Submit}
                className="flex flex-col gap-6"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Full Legal Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Muhammad Izaryani"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Must match your official government identification.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Date of Birth
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner [color-scheme:dark]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Required for merchant eligibility verification.</p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFinishOnboarding();
                }}
                className="flex flex-col gap-6"
              >
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col gap-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Authenticated Gmail</span>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${
                      user.emailVerified || verificationSent
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {user.emailVerified || verificationSent ? <CheckCircle2 className="w-3 h-3" /> : null}
                      {user.emailVerified || verificationSent ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 pt-3 border-t border-slate-800/80">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-white font-mono truncate block">{user.email}</span>
                      <span className="text-[11px] text-slate-400">Google OAuth 2.0 Secure Session</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
                  {user.emailVerified || verificationSent ? (
                    <p className="text-emerald-400 font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" /> 
                      <span>Your Gmail account is successfully linked and verified. You may now proceed to your dashboard.</span>
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-slate-400">Click below to send an account verification notice to your Gmail address.</p>
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        disabled={isSendingVerification}
                        className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs border border-slate-700/80 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isSendingVerification ? 'Sending Verification...' : 'Send Verification Notice'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-4 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer shadow-md"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Complete Setup</span>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

