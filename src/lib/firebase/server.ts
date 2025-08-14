
'use server';

import { initializeApp, getApp, getApps, cert, type App } from 'firebase-admin/app';
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
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // IMPORTANT: Replace newlines for Vercel/other environments if needed. App Hosting handles this automatically.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const errorMsg = 'Firebase Admin SDK initialization failed: Missing one or more required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).';
    console.error(errorMsg);
    // Also log which ones are missing for easier debugging in App Hosting logs
    if (!projectId) console.error("FIREBASE_PROJECT_ID is not set.");
    if (!clientEmail) console.error("FIREBASE_CLIENT_EMAIL is not set.");
    if (!privateKey) console.error("FIREBASE_PRIVATE_KEY is not set.");
    throw new Error(errorMsg);
  }

  try {
    const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
    });

    const auth = getAuth(app);
    const db = getFirestore(app);
    
    return { app, auth, db };

  } catch (error: any) {
    console.error(`CRITICAL: Failed to initialize Firebase Admin SDK in getFirebaseAdmin. Error: ${error.message}`);
    throw new Error(`Firebase Admin SDK could not be initialized: ${error.message}`);
  }
}
