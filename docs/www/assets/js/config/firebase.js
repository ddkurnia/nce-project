/**
 * NCE Firebase Configuration & Initialization
 * Nusantara Commodity Exchange (NCE)
 *
 * This module initializes the Firebase app and exports ready-to-use instances
 * of Auth, Firestore, and Storage. It also exports the API_BASE_URL constant
 * used by all backend service calls.
 *
 * Environment variables are expected to be provided via Vite's import.meta.env
 * (prefixed with VITE_). For development without a .env file, the values fall
 * back to empty strings and the API base defaults to localhost:3001.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// ---------------------------------------------------------------------------
// Firebase Configuration
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || ''
};

// ---------------------------------------------------------------------------
// Firebase Initialization
// ---------------------------------------------------------------------------

const app = initializeApp(firebaseConfig);

// Auth instance – used by authService for Firebase Authentication
const auth = getAuth(app);

// Firestore instance – available for direct usage if needed
const db = getFirestore(app);

// Storage instance – available for direct file uploads if needed
const storage = getStorage(app);

// ---------------------------------------------------------------------------
// API Base URL
// ---------------------------------------------------------------------------

/**
 * The base URL for the NCE Express backend API.
 * Configurable via the VITE_API_BASE_URL environment variable.
 *
 * @constant {string}
 */
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { app, auth, db, storage, API_BASE_URL };
export default app;
