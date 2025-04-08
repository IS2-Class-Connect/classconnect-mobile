// firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth/react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBtKMGOJFJKbEfijtRsfquNve_nqjGzM_w',
  authDomain: 'classconnect-2f725.firebaseapp.com',
  projectId: 'classconnect-2f725',
  storageBucket: 'classconnect-2f725.appspot.com',
  messagingSenderId: '737983419302',
  appId: '1:737983419302:web:99c5d4597e456ae5547567',
};

// Inicialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicialize Firebase Authentication and set up persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };
