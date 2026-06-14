import { createRequire } from 'module';
import config from './environment.js';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

let app = null;
let db = null;
let auth = null;
let isInitialized = false;

/**
 * Initializes the Firebase Admin SDK using service account credentials
 * from environment variables. Safe to call multiple times — returns
 * the existing app if already initialized.
 *
 * In non-production environments, if the credentials are invalid (e.g. placeholder
 * values), initialization is skipped gracefully so the server can still start for
 * development of non-Firebase features.
 */
const initializeFirebase = () => {
  if (app) {
    return app;
  }

  const { projectId, privateKey, clientEmail } = config.firebase;

  // Detect placeholder / missing credentials
  const hasValidCredentials =
    projectId &&
    !projectId.startsWith('your-') &&
    privateKey &&
    !privateKey.startsWith('your-') &&
    clientEmail &&
    !clientEmail.startsWith('your-');

  if (!hasValidCredentials) {
    if (config.isProduction) {
      throw new Error(
        '[Firebase] Valid credentials are required in production. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.'
      );
    }
    console.warn(
      '[Firebase] Skipping initialization — placeholder or missing credentials detected. ' +
      'Firebase features will be unavailable until valid credentials are provided.'
    );
    return null;
  }

  const serviceAccount = {
    project_id: projectId,
    private_key: privateKey,
    client_email: clientEmail,
  };

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    auth = admin.auth();

    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    isInitialized = true;
    console.log('[Firebase] Admin SDK initialized successfully');
  } catch (error) {
    if (config.isProduction) {
      throw error;
    }
    console.error('[Firebase] Failed to initialize Admin SDK:', error.message);
    console.warn(
      '[Firebase] Continuing without Firebase. Related features will be unavailable.'
    );
  }

  return app;
};

/**
 * Firestore timestamp helpers — mirrors the admin.firestore.Timestamp
 * static methods for convenience throughout the application.
 */
const Timestamp = admin.firestore.Timestamp;

const timestampHelpers = {
  /** Returns a Firestore Timestamp representing the current moment */
  now: () => Timestamp.now(),

  /** Creates a Firestore Timestamp from a JavaScript Date object */
  fromDate: (date) => Timestamp.fromDate(date),

  /** Creates a Firestore Timestamp from epoch milliseconds */
  fromMillis: (milliseconds) => Timestamp.fromMillis(milliseconds),

  /** The Timestamp class itself, for constructing from seconds/nanoseconds */
  Timestamp,
};

// Initialize on module load
initializeFirebase();

export { admin, app, db, auth, timestampHelpers, isInitialized };
export default { admin, app, db, auth, timestampHelpers, isInitialized };
