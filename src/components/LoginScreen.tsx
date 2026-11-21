import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sparkles, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!auth || !googleProvider) {
        setErrorMsg('Firebase Authentication is not configured or requires valid API keys.');
        setLoading(false);
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid') || error.code === 'auth/invalid-api-key') {
        setErrorMsg('The Firebase API key is not valid. Please provide valid Firebase credentials.');
      } else if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
        setErrorMsg('Google sign-in is not enabled in your Firebase Console.');
      } else {
        setErrorMsg(error.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative z-10 flex flex-col items-center text-center"
      >
        {/* Brand Logo & Badge */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-500/30 mb-6 border border-blue-400/30">
          MA
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>Secure Merchant Access</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          MA Digital Store
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Sign in with your authorized Google account to access your professional invoicing, domicile records, and management portal.
        </p>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-6 bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2.5 text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-medium">{errorMsg}</span>
          </motion.div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_35px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="mt-8 pt-6 border-t border-slate-800/80 w-full flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secured with Firebase Auth & Google Identity</span>
        </div>
      </motion.div>
    </div>
  );
};
