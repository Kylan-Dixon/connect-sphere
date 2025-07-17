'use server';

import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app;

// The entire service account key JSON is expected in this env var
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = !getApps().length
      ? initializeApp({
          credential: cert(serviceAccount),
        })
      : getApp();
  } catch (error) {
    console.error('Failed to parse or initialize Firebase Admin SDK:', error);
  }
} else {
  console.warn(
    'Firebase Admin SDK not initialized. Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.'
  );
}

const auth = app ? getAuth(app) : ({} as any);
const db = app ? getFirestore(app) : ({} as any);

export { app, auth, db };
