
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
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `${timestamp}: ${message}\n`, 'utf8');
}

export async function getFirebaseAdmin(): Promise<FirebaseAdmin> {
  log('--- getFirebaseAdmin() called ---');

  if (getApps().length > 0) {
    log('Firebase Admin SDK already initialized. Returning existing instance.');
    const app = getApp();
    return {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
    };
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // IMPORTANT: Replace newlines for Vercel/other environments
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  log('Attempting to initialize Firebase Admin for the first time...');
  log(`Project ID provided: ${!!projectId}`);
  log(`Client Email provided: ${!!clientEmail}`);
  log(`Private Key provided: ${!!privateKey}`);

  if (!projectId || !clientEmail || !privateKey) {
    const errorMsg = 'Firebase Admin SDK initialization failed: Missing required environment variables.';
    log(`ERROR: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    log(`Initializing default app...`);
    const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
    });

    const auth = getAuth(app);
    const db = getFirestore(app);

    log('Firebase Admin SDK initialized successfully.');
    log('--- getFirebaseAdmin() finished ---');
    
    return { app, auth, db };

  } catch (error: any) {
    log(`CRITICAL: Failed to initialize Firebase Admin SDK in getFirebaseAdmin. Error: ${error.message}`);
    log('--- getFirebaseAdmin() finished with error ---');
    throw new Error(`Firebase Admin SDK could not be initialized: ${error.message}`);
  }
}
