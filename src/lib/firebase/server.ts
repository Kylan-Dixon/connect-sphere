'use server';

import { initializeApp, getApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App;
let auth: Auth;
let db: Firestore;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountJson) {
  throw new Error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found. Firebase Admin SDK cannot be initialized.');
}

try {
  const serviceAccount = JSON.parse(serviceAccountJson);
  // The replace is crucial for keys stored in single-line env vars.
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

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
  console.error('CRITICAL: Failed to initialize Firebase Admin SDK. The FIREBASE_SERVICE_ACCOUNT_KEY is likely malformed or missing.');
  console.error('Parsing Error:', error.message);
  // Throw an error to stop execution and provide a clear log.
  throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
