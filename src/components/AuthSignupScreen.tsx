import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, Key, User, Calendar, ArrowRight, ShieldCheck, 
  Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff 
} from 'lucide-react';
import { 
  auth, googleProvider, signInWithPopup, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  updateProfile, User as FirebaseUser 
} from '../lib/firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

interface AuthSignupScreenProps {
  onLoginSuccess: (user: FirebaseUser) => void;
}

export const AuthSignupScreen: React.FC<AuthSignupScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Temporary store for created user during step 1 before step 2 completion
  const [pendingUser, setPendingUser] = useState<FirebaseUser | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!auth || !googleProvider) {
        setErrorMsg('Firebase Authentication is not configured or requires valid API keys.');
        setLoading(false);
        return;
      }
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user has profile in Firestore or localStorage
      const db = getFirestore();
      if (db) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName || 'Google Merchant',
            photoURL: user.photoURL || '',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("Firestore sync error:", e);
        }
      }
      localStorage.setItem('onboarding_completed_' + user.uid, 'true');
      onLoginSuccess(user);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      setErrorMsg(error.message || 'Failed to authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1AccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (!auth) {
        setErrorMsg('Firebase Auth is not initialized.');
        setLoading(false);
        return;
      }

      if (mode === 'signin') {
        // Sign in existing user
        const result = await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('onboarding_completed_' + result.user.uid, 'true');
        onLoginSuccess(result.user);
      } else {
        // Step 1 of signup: Create user with email & password in Firebase Auth
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          setPendingUser(result.user);
          setStep(2); // Move to Step 2: Personal Profile (Full Name & Date of Birth)
        } catch (signupErr: any) {
          if (signupErr.code === 'auth/email-already-in-use') {
            // If email already exists, automatically try signing in with the provided password
            try {
              const signInResult = await signInWithEmailAndPassword(auth, email, password);
              localStorage.setItem('onboarding_completed_' + signInResult.user.uid, 'true');
              onLoginSuccess(signInResult.user);
              return;
            } catch (signInErr: any) {
              throw new Error('This email is already registered, but the password provided was incorrect. Please check your password or switch to Sign In.');
            }
          }
          throw signupErr;
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please switch to Sign In instead.');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password. Please check your credentials.');
      } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
        setErrorMsg('Email/Password sign-in is disabled in your Firebase Console. Please use "Continue with Google" or enable Email/Password provider in Firebase Console.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address format.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters long.');
      } else {
        setErrorMsg(error.message || 'Authentication failed. Please try again or use Google Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2ProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your Full Name.');
      return;
    }
    if (!dateOfBirth) {
      setErrorMsg('Please select your Date of Birth.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = pendingUser || auth?.currentUser;
      if (currentUser) {
        // Update Firebase Auth profile
        await updateProfile(currentUser, { displayName: fullName.trim() });

        // Save Full Name and Date of Birth to Firestore database using Firebase UID
        const db = getFirestore();
        if (db) {
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            email: currentUser.email,
            fullName: fullName.trim(),
            dateOfBirth,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }

        localStorage.setItem('onboarding_completed_' + currentUser.uid, 'true');
        onLoginSuccess(currentUser);
      } else {
        setErrorMsg('Session expired. Please restart signup.');
        setStep(1);
      }
    } catch (error: any) {
      console.error("Profile save error:", error);
      setErrorMsg(error.message || 'Failed to save profile information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Large Beautiful Rounded Split-Panel Card inspired by reference image */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl bg-slate-900/90 border border-slate-800/90 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.85)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-2xl relative z-10"
      >
        {/* Left / Accent Branding Panel (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white text-xl shadow-xl shadow-blue-500/30 border border-blue-400/30">
                MA
              </div>
              <div>
                <h1 className="text-sm font-black tracking-widest text-white uppercase">MA DIGITAL STORE</h1>
                <p className="text-[11px] text-blue-400 font-semibold tracking-wider">Professional Merchant Portal</p>
              </div>
            </div>

            <div className="mt-14 lg:mt-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{step === 2 ? 'Personal Profile Setup' : mode === 'signup' ? 'New Account Creation' : 'Secure Sign In'}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {step === 2 ? 'Tell us about yourself' : mode === 'signup' ? 'Create your operator account' : 'Welcome back to console'}
              </h2>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                {step === 2
                  ? 'Enter your Full Name and Date of Birth to finalize your secure merchant account and access professional invoicing and domicile management.'
                  : mode === 'signup'
                  ? 'Set up your secure credentials to manage invoices, customer databases, and automated digital billing.'
                  : 'Access your invoices, customer records, and live data dashboards instantly.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Firebase & Google OAuth Secured</span>
            </div>
            <span className="font-mono text-[10px] bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-300">
              {step === 2 ? 'Step 2 of 2' : 'Step 1 of 2'}
            </span>
          </div>
        </div>

        {/* Right Form Panel (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-slate-900/50 relative">
          {/* Step Indicator Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-blue-400' : 'text-emerald-400'}`}>
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${step === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Account Credentials</span>
              </div>
              <span className="text-slate-600">→</span>
              <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-blue-400' : 'text-slate-500'}`}>
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${step === 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  2
                </span>
                <span>Personal Profile</span>
              </div>
            </div>

            {step === 1 && (
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                {mode === 'signup' ? 'Existing user? Sign In' : 'Need an account? Sign Up'}
              </button>
            )}
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-lg"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="font-medium">{errorMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleStep1AccountSubmit}
                className="flex flex-col gap-5"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@madigitalstore.in"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Key className="w-4 h-4" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_35px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Processing...' : mode === 'signup' ? 'Continue to Personal Profile' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {mode === 'signup' && (
                  <>
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-800"></div>
                      <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase">Or continue with</span>
                      <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                      <span>Continue with Google</span>
                    </button>
                  </>
                )}
              </motion.form>
            ) : (
              <motion.form
                key="step2-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleStep2ProfileSubmit}
                className="flex flex-col gap-6"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Muhammad Izar"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_35px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Saving Profile...' : 'Continue & Launch Store'}</span>
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
