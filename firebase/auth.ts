import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithCredential,
    onAuthStateChanged,
    User,
  } from 'firebase/auth';
  
  import * as Google from 'expo-auth-session/providers/google';
  import * as WebBrowser from 'expo-web-browser';
  import { Platform } from 'react-native';
  import { makeRedirectUri } from 'expo-auth-session';
  
  import { auth } from './config';
  
  // Finalize any pending browser session
  WebBrowser.maybeCompleteAuthSession();
  
  // 🔁 Listen for session changes
  export function onAuthStateChangedListener(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
  
  // ✅ Register with email
  export async function registerWithEmail(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential;
  }
  
  // 🔓 Login with email
  export function loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  // 🔒 Logout
  export function logout() {
    return signOut(auth);
  }
  
  // 🔁 Reset password
  export function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }
  
  // 🔐 Google Sign-In with Expo Auth Session
  export function useGoogleSignIn() {
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: Platform.select({
        android: '737983419302-id5c09jpdukkqej357sc9si1ltahtjj7.apps.googleusercontent.com',
        ios: '737983419302-id5c09jpdukkqej357sc9si1ltahtjj7.apps.googleusercontent.com',
        default: '737983419302-id5c09jpdukkqej357sc9si1ltahtjj7.apps.googleusercontent.com',
      }),
      redirectUri: makeRedirectUri(),
    });
  
    async function handleGoogleResponse() {
      if (response?.type === 'success') {
        const { idToken } = response.authentication!;
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          return await signInWithCredential(auth, credential);
        }
      }
    }
  
    return { request, promptAsync, response, handleGoogleResponse };
  }
