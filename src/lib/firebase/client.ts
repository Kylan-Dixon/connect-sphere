
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This logic ensures Firebase is initialized only once.
if (getApps().length) {
  app = getApp();
} else {
  let firebaseConfig;

  // For Firebase App Hosting, the config is injected as FIREBASE_WEBAPP_CONFIG.
  // For local development, it falls back to the individual NEXT_PUBLIC_FIREBASE_ variables.
  const firebaseConfigStr = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG || process.env.FIREBASE_WEBAPP_CONFIG;

  if (firebaseConfigStr) {
    try {
      firebaseConfig = JSON.parse(firebaseConfigStr);
    } catch (error) {
      console.error("Failed to parse FIREBASE_WEBAPP_CONFIG JSON:", error);
      throw new Error("Could not initialize Firebase: Invalid FIREBASE_WEBAPP_CONFIG.");
    }
  } else {
    // This case is for local development where you'd use a .env.local file.
    console.warn("FIREBASE_WEBAPP_CONFIG not found, falling back to individual NEXT_PUBLIC_ variables for local development.");
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
  }

  if (!firebaseConfig?.apiKey) {
    throw new Error("Could not initialize Firebase: API key is missing. Ensure Firebase configuration is set correctly in environment variables.");
  }

  app = initializeApp(firebaseConfig);
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
