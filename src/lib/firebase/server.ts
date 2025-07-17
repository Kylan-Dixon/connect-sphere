'use server';

import { initializeApp, getApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
}

let admin: FirebaseAdmin | null = null;

function initializeAdmin() {
  if (admin) {
    return admin;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    console.error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found.');
    throw new Error('Firebase Admin SDK could not be initialized. Service account key is missing.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);

    // The replace is crucial for keys stored in single-line env vars.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const app = !getApps().length
      ? initializeApp({ credential: cert(serviceAccount) })
      : getApp();

    const auth = getAuth(app);
    const db = getFirestore(app);
    
    admin = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully.');
    return admin;
  } catch (error: any) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK.');
    console.error('The FIREBASE_SERVICE_ACCOUNT_KEY is likely malformed or missing from your .env.local file.');
    console.error('Parsing Error:', error.message);
    throw new Error(`Firebase Admin SDK could not be initialized: ${error.message}`);
  }
}

export function getFirebaseAdmin() {
  if (!admin) {
    initializeAdmin();
  }
  return admin!;
}
