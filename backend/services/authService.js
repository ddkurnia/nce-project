/**
 * Authentication Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Handles user document management in Firestore, Firebase ID token
 * verification, session management, and full auth flows (register,
 * login, refresh, logout).
 *
 * @module services/authService
 */

import { db, auth } from '../config/firebase.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Firestore collection references (lazy getters for dev-mode safety)
// ---------------------------------------------------------------------------

const getUsersCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('users');
};

const getSessionsCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('sessions');
};

// ---------------------------------------------------------------------------
// Core User Document Operations (per spec)
// ---------------------------------------------------------------------------

/**
 * Create a user document in the Firestore 'users' collection.
 *
 * @param {string} uid  - Firebase Auth UID (used as document ID)
 * @param {object} data - User profile data
 * @param {string} data.email
 * @param {string} data.role
 * @param {string} data.companyName
 * @param {string} data.phone
 * @returns {Promise<object>} Created user document data with id
 */
export async function createUser(uid, data) {
  try {
    const now = new Date();

    const userDoc = {
      uid,
      email: data.email || '',
      displayName: data.displayName || '',
      photoURL: data.photoURL || '',
      role: data.role || 'buyer',
      companyName: data.companyName || '',
      phone: data.phone || '',
      location: data.location || '',
      address: data.address || '',
      city: data.city || '',
      province: data.province || '',
      bio: data.bio || '',
      verification: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await getUsersCollection().doc(uid).set(userDoc);

    logger.info(`[AuthService] User document created: ${uid}`);

    return { id: uid, ...userDoc };
  } catch (error) {
    logger.error(`[AuthService] Failed to create user document: ${uid}`, error);
    throw error;
  }
}

/**
 * Get a user document by Firebase UID.
 *
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<object|null>} User document data or null if not found
 */
export async function getUserByUid(uid) {
  try {
    const docSnap = await getUsersCollection().doc(uid).get();

    if (!docSnap.exists) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    logger.error(`[AuthService] Failed to get user by UID: ${uid}`, error);
    throw error;
  }
}

/**
 * Update a user document in Firestore.
 *
 * @param {string} uid  - Firebase Auth UID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated user document data
 */
export async function updateUser(uid, data) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // Remove fields that should never be directly updated
    delete updateData.uid;
    delete updateData.id;
    delete updateData.createdAt;

    await getUsersCollection().doc(uid).update(updateData);

    logger.info(`[AuthService] User document updated: ${uid}`);

    const updatedDoc = await getUsersCollection().doc(uid).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[AuthService] Failed to update user document: ${uid}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Token Verification (per spec)
// ---------------------------------------------------------------------------

/**
 * Verify a Firebase ID token and return the decoded token.
 *
 * @param {string} idToken - Firebase ID token from the client
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token with uid, email, etc.
 * @throws {Error} If the token is invalid or expired
 */
export async function verifyFirebaseToken(idToken) {
  try {
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    const decodedToken = await auth.verifyIdToken(idToken);
    logger.debug(`[AuthService] Token verified for UID: ${decodedToken.uid}`);
    return decodedToken;
  } catch (error) {
    logger.warn(`[AuthService] Token verification failed: ${error.message}`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Session Management (per spec)
// ---------------------------------------------------------------------------

/**
 * Create a session record in the 'sessions' collection.
 *
 * @param {string} uid - Firebase Auth UID of the session owner
 * @returns {Promise<object>} Created session record with id
 */
export async function createSession(uid) {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const sessionDoc = {
      uid,
      createdAt: now,
      expiresAt,
      active: true,
    };

    const docRef = await getSessionsCollection().add(sessionDoc);

    logger.info(`[AuthService] Session created: ${docRef.id} for UID: ${uid}`);

    return { id: docRef.id, ...sessionDoc };
  } catch (error) {
    logger.error(`[AuthService] Failed to create session for UID: ${uid}`, error);
    throw error;
  }
}

/**
 * Delete a session record from the 'sessions' collection.
 *
 * @param {string} sessionId - Session document ID
 * @returns {Promise<void>}
 */
export async function deleteSession(sessionId) {
  try {
    await getSessionsCollection().doc(sessionId).delete();
    logger.info(`[AuthService] Session deleted: ${sessionId}`);
  } catch (error) {
    logger.error(`[AuthService] Failed to delete session: ${sessionId}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Controller-Compatible Auth Flows
// ---------------------------------------------------------------------------

/**
 * Register a new user – creates Firebase Auth user and Firestore document.
 * Supports two flows:
 *  1. Server-side creation: email + password provided
 *  2. Client-side creation: uid + idToken provided (Firebase user already exists)
 *
 * @param {object} params
 * @param {string} params.email       - User email
 * @param {string} [params.password]  - Password for server-side user creation
 * @param {string} [params.uid]       - Firebase UID if user was created client-side
 * @param {string} [params.idToken]   - Firebase ID token from client-side signup
 * @param {string} [params.displayName]
 * @param {string} [params.phone]
 * @param {string} [params.role]      - 'buyer' | 'seller' | 'exporter'
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerUser(params) {
  try {
    if (!auth) throw new Error('Firebase Auth is not initialized.');

    const { email, password, uid, idToken, displayName, phone, role } = params;
    let userUid = uid || null;
    let customToken = idToken || null;

    // Flow 1: Server-side user creation
    if (email && password && !uid) {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || '',
      });
      userUid = userRecord.uid;

      // Set custom claims for role
      await auth.setCustomUserClaims(userUid, { role: role || 'buyer' });
    }

    // Flow 2: Client-side user creation – verify the token
    if (!userUid && idToken) {
      const decodedToken = await auth.verifyIdToken(idToken);
      userUid = decodedToken.uid;
    }

    if (!userUid) {
      throw new Error('Unable to determine user UID for registration');
    }

    // Create Firestore user document
    const userDoc = await createUser(userUid, {
      email: email || '',
      displayName: displayName || '',
      phone: phone || '',
      role: role || 'buyer',
    });

    // Create a session
    const session = await createSession(userUid);

    // Generate a custom token for the client if we created the user server-side
    if (email && password && !idToken) {
      customToken = await auth.createCustomToken(userUid, { role: role || 'buyer' });
    }

    logger.info(`[AuthService] User registered: ${userUid}`);

    return {
      user: userDoc,
      token: customToken || session.id,
    };
  } catch (error) {
    logger.error('[AuthService] Registration failed:', error);
    throw error;
  }
}

/**
 * Login a user by verifying their Firebase ID token.
 * Creates a new session and returns the user profile.
 *
 * @param {string} idToken - Firebase ID token from the client
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser(idToken) {
  try {
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user profile from Firestore
    const userProfile = await getUserByUid(uid);

    if (!userProfile) {
      // Auto-create the profile if it doesn't exist (first-time login)
      const newUser = await createUser(uid, {
        email: decodedToken.email || '',
        displayName: decodedToken.name || '',
        role: decodedToken.role || 'buyer',
      });

      const session = await createSession(uid);

      logger.info(`[AuthService] Login with auto-profile creation: ${uid}`);

      return {
        user: newUser,
        token: idToken,
      };
    }

    // Check if user is active
    if (userProfile.active === false) {
      const err = new Error('Account has been deactivated');
      err.code = 'auth/user-disabled';
      throw err;
    }

    // Create a new session
    await createSession(uid);

    logger.info(`[AuthService] User logged in: ${uid}`);

    return {
      user: userProfile,
      token: idToken,
    };
  } catch (error) {
    logger.error('[AuthService] Login failed:', error);
    throw error;
  }
}

/**
 * Refresh an authentication token.
 * Verifies the current token and returns a fresh token + user profile.
 *
 * @param {string} currentToken - Current Firebase ID token
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function refreshToken(currentToken) {
  try {
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    const decodedToken = await auth.verifyIdToken(currentToken);
    const uid = decodedToken.uid;

    const userProfile = await getUserByUid(uid);

    if (!userProfile) {
      const err = new Error('User profile not found');
      err.statusCode = 404;
      throw err;
    }

    logger.info(`[AuthService] Token refreshed for UID: ${uid}`);

    return {
      user: userProfile,
      token: currentToken,
    };
  } catch (error) {
    logger.error('[AuthService] Token refresh failed:', error);
    throw error;
  }
}

/**
 * Logout a user by revoking Firebase refresh tokens.
 *
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<void>}
 */
export async function logoutUser(uid) {
  try {
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    // Revoke all refresh tokens for this user in Firebase Auth
    await auth.revokeRefreshTokens(uid);

    logger.info(`[AuthService] User logged out: ${uid}`);
  } catch (error) {
    logger.error(`[AuthService] Logout failed for UID: ${uid}`, error);
    throw error;
  }
}
