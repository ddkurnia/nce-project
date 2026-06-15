import { firebaseConfig, FIREBASE_CDN } from './config.js';
import { setState, getState } from './state.js';

let auth = null;
let firebaseApp = null;

export async function initAuth() {
  try {
    const { initializeApp } = await import(`${FIREBASE_CDN}/firebase-app.js`);
    const { getAuth, onAuthStateChanged } = await import(`${FIREBASE_CDN}/firebase-auth.js`);

    const app = initializeApp(firebaseConfig);
    firebaseApp = app;
    auth = getAuth(app);

    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL,
          token: firebaseUser.accessToken || firebaseUser.stsTokenManager?.accessToken,
        };
        localStorage.setItem('nce_user', JSON.stringify(userData));
        setState('user', userData);
      } else {
        localStorage.removeItem('nce_user');
        setState('user', null);
      }
    });
  } catch (err) {
    console.error('Auth init error:', err);
  }
}

export async function loginWithEmail(email, password) {
  const { signInWithEmailAndPassword } = await import(`${FIREBASE_CDN}/firebase-auth.js`);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerWithEmail(email, password, displayName) {
  const { createUserWithEmailAndPassword, updateProfile } = await import(`${FIREBASE_CDN}/firebase-auth.js`);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  return cred.user;
}

export async function logout() {
  const { signOut } = await import(`${FIREBASE_CDN}/firebase-auth.js`);
  await signOut(auth);
  localStorage.removeItem('nce_user');
  setState('user', null);
}

export function isAuthenticated() {
  const user = getState('user');
  return !!(user && user.token);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('nce_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthInstance() {
  return auth;
}

export function getFirebaseApp() {
  return firebaseApp;
}
