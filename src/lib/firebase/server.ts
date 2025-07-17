
'use server';

import { initializeApp, getApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
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

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // IMPORTANT: Replace newlines for Vercel/other environments
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  log('Attempting to initialize Firebase Admin...');
  log(`Project ID provided: ${!!projectId}`);
  log(`Client Email provided: ${!!clientEmail}`);
  log(`Private Key provided: ${!!privateKey}`);

  if (!projectId || !clientEmail || !privateKey) {
    const errorMsg = 'Firebase Admin SDK initialization failed: Missing required environment variables.';
    log(`ERROR: ${errorMsg}`);
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
    log(`Initializing app with name: ${appName}`);
    const app = initializeApp({
        credential: cert(serviceAccount),
    }, appName);

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
