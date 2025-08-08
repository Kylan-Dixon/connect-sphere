
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This logic ensures Firebase is initialized only once.
if (getApps().length) {
  app = getApp();
} else {
  let firebaseConfig;

  // Firebase App Hosting automatically injects FIREBASE_WEBAPP_CONFIG as a JSON string.
  // We need to parse this string to get the configuration object.
  const firebaseConfigStr = process.env.FIREBASE_WEBAPP_CONFIG;

  if (firebaseConfigStr) {
    try {
      firebaseConfig = JSON.parse(firebaseConfigStr);
    } catch (error) {
      console.error("Failed to parse FIREBASE_WEBAPP_CONFIG JSON:", error);
      // Throw an error to fail the build if config is malformed
      throw new Error("Could not initialize Firebase: Invalid FIREBASE_WEBAPP_CONFIG.");
    }
  } else {
    // This case is for local development where you'd use a .env.local file.
    // It's important that these are prefixed with NEXT_PUBLIC_ for Next.js to expose them to the browser.
    console.warn("FIREBASE_WEBAPP_CONFIG not found, falling back to NEXT_PUBLIC_ variables for local development.");
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
  }

  if (!firebaseConfig?.apiKey) {
    throw new Error("Could not initialize Firebase: API key is missing.");
  }

  app = initializeApp(firebaseConfig);
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
