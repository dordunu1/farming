import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Get the current chain ID from environment variables
const CURRENT_CHAIN = import.meta.env.VITE_CURRENT_CHAIN || 'RISE';

// Helper functions for chain-specific collections (now under 'chains')
export const getChainCollection = (collectionName: string) => collection(db, 'chains', CURRENT_CHAIN, collectionName);
export const getChainDoc = (collectionName: string, docId: string) => doc(db, 'chains', CURRENT_CHAIN, collectionName, docId);
export const getUserDoc = (userId: string) => getChainDoc('users', userId);
export const getUserTransactions = (userId: string) => collection(db, 'chains', CURRENT_CHAIN, 'users', userId, 'transactions');

// Shared auth collection
export const userAuthCollection = collection(db, 'userAuth');
export const getUserAuthDoc = (userId: string) => doc(db, 'userAuth', userId);

export { app, analytics, db, auth, CURRENT_CHAIN }; 