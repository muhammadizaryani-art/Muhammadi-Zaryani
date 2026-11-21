import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '../lib/firebase';
import { LogOut, User as UserIcon, ShieldAlert, X, AlertTriangle } from 'lucide-react';

export const AuthBar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        setErrorMsg(null);
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }
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

  const executeSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error: any) {
      console.error("Sign Out Error:", error);
      setErrorMsg(error.message || 'Failed to sign out.');
    }
  };

  return (
    <div className="flex items-center justify-end relative">
      {errorMsg && !user && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2 shadow-xl max-w-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span className="truncate">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-2 text-red-400 hover:text-red-200 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {user ? (
        <>
          {/* Top Corner Profile Picture / Avatar Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="relative group p-0.5 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-md hover:shadow-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 shrink-0"
            title="Open Account Profile"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-slate-900 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-cyan-400">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
          </button>

          {/* Rendered via React Portal directly at document.body level to escape all parent clipping contexts */}
          {isSidebarOpen && createPortal(
            <div className="fixed inset-0 z-[999999] pointer-events-auto">
              {/* Solid Backdrop Overlay */}
              <div
                className="fixed inset-0 bg-slate-950/95 backdrop-blur-md"
                onClick={() => setIsSidebarOpen(false)}
              />

              {/* Profile Information Panel / Drawer (Fixed position, solid opaque background, overflow visible/scroll) */}
              <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-slate-950 border-l border-slate-800 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col overflow-y-auto">
                {/* Scrollable Content Container */}
                <div className="p-6 sm:p-8 flex-1 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-xs">
                        MA
                      </div>
                      <span className="text-xs font-black tracking-wider text-white uppercase">Account Profile</span>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
                      title="Close Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Profile Picture → Name → Gmail Info Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative mb-4">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt=""
                          className="w-20 h-20 rounded-full object-cover border-4 border-blue-500/30 shadow-xl"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-blue-500/30 flex items-center justify-center text-cyan-400 shadow-xl">
                          <UserIcon className="w-10 h-10" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
                    </div>

                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      {user.displayName || 'Authorized Merchant'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1 break-all">
                      {user.email}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                      <span>✓ Google Verified Session</span>
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="space-y-2">
                    <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                      <span className="font-medium text-slate-400">Firebase UID</span>
                      <span className="font-mono text-slate-200">{user.uid.substring(0, 10)}...</span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                      <span className="font-medium text-slate-400">Authentication</span>
                      <span className="text-blue-400 font-semibold">Google OAuth 2.0</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Sign Out Button Container */}
                <div className="p-6 sm:p-8 pt-4 border-t border-slate-800 bg-slate-950 mt-auto">
                  <button
                    onClick={() => setShowSignOutConfirm(true)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold text-xs border border-rose-800/60 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Sign Out Confirmation Modal via Portal */}
          {showSignOutConfirm && createPortal(
            <div className="fixed inset-0 z-[1000000] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,1)] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-5 shadow-lg">
                  <AlertTriangle className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-black text-white tracking-tight mb-2">
                  Are you sure you want to sign out?
                </h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  You will need to sign back in with your Google account to access your merchant portal.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSignOutConfirm(false);
                      setIsSidebarOpen(false);
                      executeSignOut();
                    }}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      ) : (
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md border border-blue-400/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          title="Continue with Google Authentication"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  );
};
