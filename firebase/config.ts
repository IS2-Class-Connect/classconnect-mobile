import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBtKMGOJFJKbEfijtRsfquNve_nqjGzM_w',
  authDomain: 'classconnect-2f725.firebaseapp.com',
  projectId: 'classconnect-2f725',
  storageBucket: 'classconnect-2f725.appspot.com',
  messagingSenderId: '737983419302',
  appId: '1:737983419302:web:99c5d4597e456ae5547567',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };