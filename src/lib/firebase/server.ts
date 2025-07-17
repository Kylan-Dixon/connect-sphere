
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
  console.log('--- getFirebaseAdmin() called ---');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // IMPORTANT: Replace newlines for Vercel/other environments
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log('Attempting to initialize Firebase Admin...');
  console.log('Project ID provided:', !!projectId);
  console.log('Client Email provided:', !!clientEmail);
  console.log('Private Key provided:', !!privateKey);

  if (!projectId || !clientEmail || !privateKey) {
    const errorMsg = 'Firebase Admin SDK initialization failed: Missing required environment variables.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };
  
  // Use a unique app name to allow for re-initialization if needed
  // This helps in Next.js dev mode with hot-reloading
  const appName = `firebase-admin-app-${Date.now()}`;
  
  try {
    console.log('Initializing app with name:', appName);
    const app = initializeApp({
        credential: cert(serviceAccount),
    }, appName);

    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('Firebase Admin SDK initialized successfully.');
    console.log('--- getFirebaseAdmin() finished ---');
    
    return { app, auth, db };

  } catch (error: any) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK in getFirebaseAdmin.');
    console.error('Error:', error.message);
    console.log('--- getFirebaseAdmin() finished with error ---');
    throw new Error(`Firebase Admin SDK could not be initialized: ${error.message}`);
  }
}
