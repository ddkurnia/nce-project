const firebaseConfig = {
  apiKey: 'AIzaSyBPjRvMExOZqW4LH4gdGlYqMj1hMQ0kllQ',
  authDomain: 'nce-project-1d1d1.firebaseapp.com',
  projectId: 'nce-project-1d1d1',
  storageBucket: 'nce-project-1d1d1.firebasestorage.app',
  messagingSenderId: '833507323759',
  appId: '1:833507323759:web:03cb0864b5a3078b8e1b7e'
};

const API_BASE_URL = 'https://us-central1-nce-project-1d1d1.cloudfunctions.net/api';

const FIREBASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.0';

// FCM VAPID key for web push notifications
const FCM_VAPID_KEY = 'BJzF8QY3n0m5V3lGfR2qK5hN8mP4sT6wU9xAzC7yD1eF3gH5iJ7kL9oM0nQ2rS4u';

export { firebaseConfig, API_BASE_URL, FIREBASE_CDN, FCM_VAPID_KEY };
