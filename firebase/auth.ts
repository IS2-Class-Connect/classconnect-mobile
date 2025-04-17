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
	reload
} from 'firebase/auth';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅

import { auth } from './config';

WebBrowser.maybeCompleteAuthSession();

// 🔁 Listen for session changes
export function onAuthStateChangedListener(callback: (user: User | null) => void) {
	return onAuthStateChanged(auth, callback);
}

// ✅ Register with email
export async function registerWithEmail(email: string, password: string) {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	await sendEmailVerification(userCredential.user);
	await AsyncStorage.setItem('lastLogin', Date.now().toString()); // ✅
	return userCredential;
}

// 📧 Check if email is verified
export async function isEmailVerified(user?: User | null): Promise<boolean> {
	try {
	  // If no user is provided, use the current authenticated user
	  const currentUser = user || auth.currentUser;
	  
	  if (!currentUser) {
		console.log('❌ No user is currently logged in to check email verification');
		return false;
	  }
	  
	  // Reload the user to get the most up-to-date information from Firebase
	  await reload(currentUser);
	  
	  // Check if email is verified
	  const isVerified = currentUser.emailVerified;
	  console.log(`📧 Email verification status for ${currentUser.email}: ${isVerified ? '✅ Verified' : '❌ Not verified'}`);
	  
	  return isVerified;
	} catch (error) {
	  console.log('❌ Error checking email verification status:', error);
	  return false;
	}
  }
  
// 🔓 Login with email
export async function loginWithEmail(email: string, password: string) {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	await AsyncStorage.setItem('lastLogin', Date.now().toString()); // ✅
	return userCredential;
}

// 🔒 Logout
export function logout() {
	return signOut(auth);
}

// 🛠 Reset password by sending a reset email
export async function sendPasswordReset(email: string) {
	if (!email) {
		throw new Error('Email is required to reset password.');
	}
	try {
		await sendPasswordResetEmail(auth, email);
		console.log('📩 Password reset email sent to:', email);
	} catch (error) {
		console.log('❌ Error sending reset email:', error);
		throw error;
	}
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

					await AsyncStorage.setItem('lastLogin', Date.now().toString()); // ✅
				}
			} else {
				console.log('⚠️ Google response not successful:', response?.type);
			}
		} catch (e) {
			console.log('❌ Error handling Google login:', e);
		}
	}

	return { request, response, promptAsync, handleGoogleResponse };
}
