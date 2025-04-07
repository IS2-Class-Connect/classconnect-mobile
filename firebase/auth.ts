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
  import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
  import { Platform } from 'react-native';
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
  
  export function useGoogleSignIn() {
    const redirectUri = makeRedirectUri({
        // @ts-ignore
        useProxy: true,
      });
      console.log('🔴 Redirect URI:', redirectUri); // debería ser https://auth.expo.io/...
          

  
    const [request, response, promptAsync] = useAuthRequest(
      {
        clientId: Platform.select({
          android: '737983419302-id5c09jpdukkqej357sc9si1ltahtjj7.apps.googleusercontent.com',
          ios: '737983419302-id5c09jpdukkqej357sc9si1ltahtjj7.apps.googleusercontent.com',
          default: '737983419302-id5c09jpdukkqej357sc9si1ltahtjj7.apps.googleusercontent.com',
        }),
        redirectUri,
        scopes: ['openid', 'profile', 'email'], // ✅ ESTA LÍNEA ES CLAVE
      },
      Google.discovery
    );
  
    async function handleGoogleResponse() {
        try {
          if (response?.type === 'success') {
            console.log('✅ Google login success response:', response);
            const { idToken } = response.authentication!;
            if (idToken) {
              const credential = GoogleAuthProvider.credential(idToken);
              const result = await signInWithCredential(auth, credential);
              console.log('🔥 Firebase login success:', result.user.email);
            }
          } else {
            console.log('⚠️ Google response not successful:', response?.type);
          }
        } catch (e) {
          console.error('❌ Error handling Google login:', e);
        }
      }
      
  
    return { request, response, promptAsync, handleGoogleResponse };
  }
  
  