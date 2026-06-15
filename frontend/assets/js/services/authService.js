/**
 * NCE Authentication Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Handles all authentication flows:
 *  - Firebase Auth sign-in / sign-up / sign-out
 *  - Backend JWT token exchange
 *  - User profile retrieval & updates
 *  - Auth state observation
 *  - Local storage persistence
 *
 * All API calls are routed through the Express backend (not directly to
 * Firebase from the service layer), using the httpService fetch wrapper.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import { auth } from '../config/firebase.js';
import { get, post, patch, NCEApiError } from './httpService.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'nce_user';

// ---------------------------------------------------------------------------
// AuthService Class
// ---------------------------------------------------------------------------

class AuthService {
  constructor() {
    /** @type {object|null} Cached user data from localStorage */
    this._cachedUser = null;

    /** @type {Array<(user: object|null) => void>} Auth state listeners */
    this._listeners = [];

    // Load cached user on instantiation
    this._loadCachedUser();

    // Subscribe to Firebase auth state changes and forward to listeners
    firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        this._clearCachedUser();
      }
      this._listeners.forEach((fn) => {
        try {
          fn(firebaseUser);
        } catch (err) {
          console.warn('[NCE AuthService] Listener error:', err);
        }
      });
    });
  }

  // -----------------------------------------------------------------------
  // Sign In
  // -----------------------------------------------------------------------

  /**
   * Sign in with email and password.
   *  1. Authenticate via Firebase Auth
   *  2. Retrieve a JWT from the NCE backend
   *  3. Store user data in localStorage
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} User data with token
   * @throws {NCEApiError}
   */
  async signIn(email, password) {
    try {
      // Step 1 – Firebase Authentication
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // Step 2 – Get JWT from backend
      const idToken = await firebaseUser.getIdToken();
      const backendResponse = await post('/auth/login', { idToken });

      // Step 3 – Store user data
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        token: backendResponse.token || idToken,
        role: backendResponse.user?.role || backendResponse.role || 'buyer',
        ...backendResponse.user
      };

      this._setCachedUser(userData);

      return userData;
    } catch (error) {
      // Wrap Firebase errors in NCEApiError for consistent handling
      if (error instanceof NCEApiError) {
        throw error;
      }

      const message = this._mapFirebaseError(error);
      throw new NCEApiError(message, 401, null, 'AUTH_SIGN_IN_FAILED');
    }
  }

  // -----------------------------------------------------------------------
  // Sign Up
  // -----------------------------------------------------------------------

  /**
   * Create a new account.
   *  1. Create Firebase user
   *  2. POST profile data to the NCE backend
   *  3. Store user data in localStorage
   *
   * @param {string} email
   * @param {string} password
   * @param {object} userData – Additional profile fields (displayName, phone, role, etc.)
   * @returns {Promise<object>} Created user data with token
   * @throws {NCEApiError}
   */
  async signUp(email, password, userData = {}) {
    try {
      // Step 1 – Create Firebase user
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // Step 2 – Get ID token
      const idToken = await firebaseUser.getIdToken();

      // Step 3 – POST to backend to create user profile
      const payload = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        idToken,
        ...userData
      };

      const backendResponse = await post('/auth/register', payload);

      // Step 4 – Store user data
      const storedUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: userData.displayName || firebaseUser.displayName || '',
        photoURL: userData.photoURL || firebaseUser.photoURL || '',
        token: backendResponse.token || idToken,
        role: backendResponse.user?.role || userData.role || 'buyer',
        ...backendResponse.user
      };

      this._setCachedUser(storedUser);

      return storedUser;
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }

      const message = this._mapFirebaseError(error);
      throw new NCEApiError(message, 400, null, 'AUTH_SIGN_UP_FAILED');
    }
  }

  // -----------------------------------------------------------------------
  // Sign Out
  // -----------------------------------------------------------------------

  /**
   * Sign out from Firebase and clear all local user data.
   *
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('[NCE AuthService] Firebase signOut error:', error);
    }

    // Always clear local data, even if Firebase sign-out failed
    this._clearCachedUser();
  }

  // -----------------------------------------------------------------------
  // Current User
  // -----------------------------------------------------------------------

  /**
   * Get the current Firebase user (synchronous).
   *
   * @returns {object|null} Firebase user or null
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  // -----------------------------------------------------------------------
  // Auth State Observer
  // -----------------------------------------------------------------------

  /**
   * Subscribe to Firebase auth state changes.
   *
   * @param {(user: object|null) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    if (typeof callback !== 'function') {
      console.warn('[NCE AuthService] onAuthStateChanged expects a function.');
      return () => {};
    }

    this._listeners.push(callback);

    // Return an unsubscribe function
    return () => {
      const index = this._listeners.indexOf(callback);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    };
  }

  // -----------------------------------------------------------------------
  // ID Token
  // -----------------------------------------------------------------------

  /**
   * Get the current user's JWT token.
   * First checks the cached token; if missing, fetches a fresh one from Firebase.
   *
   * @param {boolean} [forceRefresh=false] – Force Firebase to issue a new token
   * @returns {Promise<string|null>} JWT token or null if not authenticated
   */
  async getIdToken(forceRefresh = false) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // Fallback to cached user
      const cached = this._getCachedUser();
      return cached?.token || null;
    }

    try {
      const token = await currentUser.getIdToken(forceRefresh);
      // Update cached token
      const cached = this._getCachedUser();
      if (cached) {
        cached.token = token;
        this._setCachedUser(cached);
      }
      return token;
    } catch (error) {
      console.warn('[NCE AuthService] getIdToken error:', error);
      const cached = this._getCachedUser();
      return cached?.token || null;
    }
  }

  // -----------------------------------------------------------------------
  // Profile – Update
  // -----------------------------------------------------------------------

  /**
   * Update the current user's profile on the backend.
   *
   * @param {object} data – Fields to update (displayName, phone, company, etc.)
   * @returns {Promise<object>} Updated profile
   * @throws {NCEApiError}
   */
  async updateProfile(data) {
    try {
      const response = await patch('/users/profile', data);

      // Update cached user data
      const cached = this._getCachedUser();
      if (cached) {
        this._setCachedUser({ ...cached, ...data, ...response.user, ...response.data });
      }

      return response;
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to update profile',
        0,
        null,
        'PROFILE_UPDATE_FAILED'
      );
    }
  }

  // -----------------------------------------------------------------------
  // Profile – Get by UID
  // -----------------------------------------------------------------------

  /**
   * Retrieve a user's public profile from the backend.
   *
   * @param {string} uid – Firebase UID
   * @returns {Promise<object>} User profile
   * @throws {NCEApiError}
   */
  async getUserProfile(uid) {
    try {
      return await get(`/users/${uid}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch user profile',
        0,
        null,
        'PROFILE_FETCH_FAILED'
      );
    }
  }

  // -----------------------------------------------------------------------
  // Local Storage Helpers
  // -----------------------------------------------------------------------

  /**
   * Store user data in localStorage and update the in-memory cache.
   *
   * @param {object} userData
   */
  _setCachedUser(userData) {
    this._cachedUser = userData;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch {
      console.warn('[NCE AuthService] localStorage write failed.');
    }
  }

  /**
   * Read cached user data from localStorage (or in-memory cache).
   *
   * @returns {object|null}
   */
  _getCachedUser() {
    if (this._cachedUser) {
      return this._cachedUser;
    }
    this._loadCachedUser();
    return this._cachedUser;
  }

  /**
   * Load user data from localStorage into the in-memory cache.
   */
  _loadCachedUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this._cachedUser = JSON.parse(raw);
      }
    } catch {
      this._cachedUser = null;
    }
  }

  /**
   * Remove all cached user data (localStorage + in-memory).
   */
  _clearCachedUser() {
    this._cachedUser = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  // -----------------------------------------------------------------------
  // Firebase Error Mapper
  // -----------------------------------------------------------------------

  /**
   * Map common Firebase Auth error codes to user-friendly messages.
   *
   * @param {object} error – Firebase AuthError
   * @returns {string}
   */
  _mapFirebaseError(error) {
    const code = error?.code || '';
    const map = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Please provide a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
      'auth/requires-recent-login': 'Please sign in again before performing this action.'
    };

    return map[code] || error?.message || 'An authentication error occurred.';
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

const authService = new AuthService();
export default authService;
