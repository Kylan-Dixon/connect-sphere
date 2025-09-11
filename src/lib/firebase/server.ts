
'use server';

import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
}

const logFilePath = path.join(process.cwd(), 'firebase-admin.log');

function log(message: string) {
  // This function is for local debugging and won't be visible in App Hosting logs.
  // Use console.log for messages you want to appear in Cloud Logging.
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `${timestamp}: ${message}\n`, 'utf8');
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
    
    return { app, auth, db };

  } catch (error: any) {
    console.error(`CRITICAL: Failed to initialize Firebase Admin SDK in getFirebaseAdmin. This is expected to work automatically in App Hosting. Error: ${error.message}`);
    // For local development, you might need to set up credentials differently.
    // See: https://firebase.google.com/docs/admin/setup#initialize-sdk
    throw new Error(`Firebase Admin SDK could not be initialized: ${error.message}`);
  }
}
