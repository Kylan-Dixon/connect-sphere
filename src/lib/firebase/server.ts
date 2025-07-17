import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountKey = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let app;

// Check if all service account keys are present
if (
  serviceAccountKey.projectId &&
  serviceAccountKey.clientEmail &&
  serviceAccountKey.privateKey
) {
  app = !getApps().length
    ? initializeApp({
        credential: cert(serviceAccountKey),
      })
    : getApp();
} else {
  console.warn(
    'Firebase Admin SDK not initialized. Missing environment variables.'
  );
}

// Initialize auth and db, they will be undefined if app is not initialized
// The functions using them should handle this case.
const auth = app ? getAuth(app) : ({} as any);
const db = app ? getFirestore(app) : ({} as any);

export { app, auth, db };
