'use server';

import { initializeApp, getApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | undefined;
let auth: Auth;
let db: Firestore;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (!getApps().length) {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      app = getApp();
      console.log('Using existing Firebase Admin SDK app instance.');
    }
  } catch (error: any) {
    console.error('CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. The JSON is likely malformed. Please check your .env.local file.');
    console.error('Parsing Error:', error.message);
  }
} else {
  console.warn(
    'CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found. Firebase Admin SDK will not be initialized.'
  );
}

if (app) {
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Provide mock objects to prevent server crashes on import,
  // but functionality will be broken. The logs above are the real error source.
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db };
