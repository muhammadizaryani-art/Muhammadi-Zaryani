import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged, 
  User,
  Auth 
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2Ln-QphD0F3zwRArmJyUaaS9sI4JnjiU",
  authDomain: "corded-bucksaw-h6shk.firebaseapp.com",
  projectId: "corded-bucksaw-h6shk",
  storageBucket: "corded-bucksaw-h6shk.firebasestorage.app",
  messagingSenderId: "59639834808",
  appId: "1:59639834808:web:21ae19e9aaa391d33a2c4d"
};

let app: FirebaseApp | undefined;
let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;
let dbInstance: Firestore | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
  googleProviderInstance = new GoogleAuthProvider();
  dbInstance = getFirestore(app);
} catch (err) {
  console.error("Firebase initialization failed:", err);
}

export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const db = dbInstance;

export { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged };
export type { User };
