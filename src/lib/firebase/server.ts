
'use server';

import { initializeApp, getApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
}

export async function getFirebaseAdmin(): Promise<FirebaseAdmin> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK could not be initialized. Missing required environment variables.');
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  // Use a unique app name to allow for re-initialization if needed
  const appName = `firebase-admin-app-${Date.now()}`;
  
  try {
    const app = initializeApp({
        credential: cert(serviceAccount),
    }, appName);

    const auth = getAuth(app);
    const db = getFirestore(app);
    
    return { app, auth, db };

  } catch (error: any) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK in getFirebaseAdmin.');
    console.error('Error:', error.message);
    throw new Error(`Firebase Admin SDK could not be initialized: ${error.message}`);
  }
}
