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
	reload,
	updateEmail,
	sendEmailVerification as sendVerificationEmail,
	getAuth,
  } from 'firebase/auth';
  
  import * as Google from 'expo-auth-session/providers/google';
  import * as WebBrowser from 'expo-web-browser';
  import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
  import { Platform } from 'react-native';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  
  import { auth } from './config';
  
  WebBrowser.maybeCompleteAuthSession();
  
  // 🔁 Listen for session changes
  export function onAuthStateChangedListener(callback: (user: User | null) => void) {
	return onAuthStateChanged(auth, async (fbUser) => {
	  if (fbUser) {
		console.log('🔁 AuthStateChanged: User is logged in:', fbUser.email);
		await AsyncStorage.setItem('lastLogin', Date.now().toString());
		const saved = await AsyncStorage.getItem('lastLogin');
		console.log('🕒 [onAuth] lastLogin set to:', saved);
	  } else {
		console.log('🔁 AuthStateChanged: No user');
	  }
	  callback(fbUser);
	});
  }
  
  // ✅ Register with email
  export async function registerWithEmail(email: string, password: string) {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	await sendEmailVerification(userCredential.user);
	await AsyncStorage.setItem('lastLogin', Date.now().toString());
	const saved = await AsyncStorage.getItem('lastLogin');
	console.log('🕒 [register] lastLogin set to:', saved);
	return userCredential;
  }
  
  // 📧 Check if email is verified
  export async function isEmailVerified(user?: User | null): Promise<boolean> {
	try {
	  const currentUser = user || auth.currentUser;
	  if (!currentUser) {
		console.log('❌ No user is currently logged in to check email verification');
		return false;
	  }
	  await reload(currentUser);
	  const isVerified = currentUser.emailVerified;
	  console.log(`📧 Email verification for ${currentUser.email}: ${isVerified ? '✅ Verified' : '❌ Not verified'}`);
	  return isVerified;
	} catch (error) {
	  console.log('❌ Error checking email verification:', error);
	  return false;
	}
  }
  
  // 🔓 Login with email
  export async function loginWithEmail(email: string, password: string) {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	await AsyncStorage.setItem('lastLogin', Date.now().toString());
	const saved = await AsyncStorage.getItem('lastLogin');
	console.log('🕒 [login] lastLogin set to:', saved);
	return userCredential;
  }
  
  // 🔒 Logout
  export function logout() {
	return signOut(auth);
  }
  
  // 🛠 Reset password
  export async function sendPasswordReset(email: string) {
	if (!email) throw new Error('Email is required to reset password.');
	try {
	  await sendPasswordResetEmail(auth, email);
	  console.log('📩 Password reset email sent to:', email);
	} catch (error) {
	  console.log('❌ Error sending reset email:', error);
	  throw error;
	}
  }

  import * as React from 'react';
import { Button, Alert } from 'react-native';
WebBrowser.maybeCompleteAuthSession();

// 🔐 Google Sign-In
  export function useGoogleSignIn() {
	const [request, response, promptAsync] = Google.useAuthRequest({
		clientId: '278336937854-pots3anfn9ops568409sn276v4moqnre.apps.googleusercontent.com',
		androidClientId: '278336937854-pkodj3tagodrj84a2uca6e1i5458075j.apps.googleusercontent.com',
	});

	React.useEffect(() => {
		if (response?.type === 'success') {
			handleGoogleResponse(); 
		} else if (response?.type === 'error') {
			Alert.alert("Error", "Autenticación fallida.");
		}
	}, [response]);


	async function handleGoogleResponse() {
	  try {
		console.log('🔁 Google response:', JSON.stringify(response, null, 2));
		if (response?.type === 'success') {
		  const { idToken } = response.authentication!;
		  if (idToken) {
			const credential = GoogleAuthProvider.credential(idToken);
			const result = await signInWithCredential(auth, credential);
			console.log('🔥 Google login success:', result.user.email);
  
			await AsyncStorage.setItem('lastLogin', Date.now().toString());
			const saved = await AsyncStorage.getItem('lastLogin');
			console.log('🕒 [google] lastLogin set to:', saved);
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
  

  // ✏️ Update email
  export async function updateFirebaseEmail(newEmail: string) {
	const currentUser = getAuth().currentUser;
	if (!currentUser) throw new Error('No authenticated user found.');
	try {
	  console.log(`✏️ Updating email to: ${newEmail}`);
	  await updateEmail(currentUser, newEmail);
	  console.log('✅ Email updated successfully');
	} catch (error) {
	  console.log('❌ Error updating email:', error);
	  throw error;
	}
  }
  
  // ✉️ Send verification again
  export async function sendVerificationToCurrentUser() {
	const currentUser = getAuth().currentUser;
	if (!currentUser) throw new Error('No authenticated user found.');
	try {
	  console.log(`📩 Sending email verification to: ${currentUser.email}`);
	  await sendVerificationEmail(currentUser);
	  console.log('✅ Verification email sent');
	} catch (error) {
	  console.log('❌ Error sending verification email:', error);
	  throw error;
	}
  }
  