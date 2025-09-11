
'use server';

import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
}

export async function getFirebaseAdmin(): Promise<FirebaseAdmin> {
  if (getApps().length > 0) {
    const app = getApp();
    return {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
    };
  }
  
  // When running on Google Cloud infrastructure (like Firebase App Hosting),
  // the Admin SDK can automatically discover the service account credentials
  // by calling initializeApp() with no arguments.
  try {
    const app = initializeApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('Firebase Admin SDK initialized successfully in App Hosting environment.');
    return { app, auth, db };

  } catch (error: any) {
    console.error(`CRITICAL: Failed to initialize Firebase Admin SDK in getFirebaseAdmin. This is expected to work automatically in App Hosting. Error: ${error.message}`);
    // For local development, you might need to set up credentials differently.
    // See: https://firebase.google.com/docs/admin/setup#initialize-sdk
    throw new Error(`Firebase Admin SDK could not be initialized: ${error.message}`);
  }
}
