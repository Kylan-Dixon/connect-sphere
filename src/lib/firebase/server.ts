
'use server';

import { initializeApp, getApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
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
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('CRITICAL: Missing one or more Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
    throw new Error('Firebase Admin SDK could not be initialized. Missing required environment variables.');
  }

  try {
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'), // Important for keys from .env
    };

    const app = !getApps().length
      ? initializeApp({ credential: cert(serviceAccount) })
      : getApp();

    const auth = getAuth(app);
    const db = getFirestore(app);
    
    admin = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK.');
    console.error('Error:', error.message);
    throw new Error(`Firebase Admin SDK could not be initialized: ${error.message}`);
  }
}

export async function getFirebaseAdmin() {
  if (!admin) {
    initializeAdmin();
  }
  return admin!;
}
