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

// 🔐 Google Sign-In with Expo Auth Session
export function useGoogleSignIn() {
	const redirectUri = "https://auth.expo.io/@classconnect/classconnect-mobile"; 
	
	const [request, response, promptAsync] = useAuthRequest(
		{
			clientId: '737983419302-8eaahr34d13ah39n87f353p7pedk1psj.apps.googleusercontent.com', 
			redirectUri,
			scopes: ['openid', 'profile', 'email'],
		},
		Google.discovery
	);


	console.log('🔁 Google response detected:', JSON.stringify(response, null, 2));
	
	async function handleGoogleResponse() {
		try {
			console.log('🔁 Google response detected:', JSON.stringify(response, null, 2));
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


