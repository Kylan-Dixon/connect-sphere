'use server';

import { initializeApp, getApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App;
let auth: Auth;
let db: Firestore;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // The replace is crucial for keys stored in single-line env vars.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (!getApps().length) {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      app = getApp();
      console.log('Using existing Firebase Admin SDK app instance.');
    }
  } catch (error: any) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK.');
    console.error('The FIREBASE_SERVICE_ACCOUNT_KEY is likely malformed or missing from your .env.local file.');
    console.error('Parsing Error:', error.message);
    // Gracefully fail without crashing the build
    app = getApps().length > 0 ? getApp() : (undefined as any); 
  }
} else {
    console.error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found.');
    app = undefined as any;
}

// Initialize auth and db only if app was initialized successfully
if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    // Provide non-functional mocks to satisfy Next.js compiler
    auth = {} as Auth;
    db = {} as Firestore;
}


export { app, auth, db };
