import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Chain-specific collection references
export const getChainCollections = (chainId: string) => {
  return {
    users: collection(db, chainId, 'users'),
    getUserDoc: (userId: string) => doc(db, chainId, 'users', userId),
    getUserTransactions: (userId: string) => collection(db, chainId, 'users', userId, 'transactions'),
  };
};

// Shared auth collection
export const userAuthCollection = collection(db, 'userAuth');
export const getUserAuthDoc = (userId: string) => doc(db, 'userAuth', userId); 