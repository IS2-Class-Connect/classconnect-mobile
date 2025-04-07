// Fake backend functions to call your future DB (e.g. REST API, Supabase, etc.)
import { User } from 'firebase/auth';

/**
 * Called after login to notify your own DB that the user exists/logged in.
 * You should send user.uid, email, etc.
 */
export async function notifyLoginToDB(user: User) {
  console.log('📡 Notify backend of login:', user.email);
  // TODO: Add API call to backend to log the login or update lastSeen
}

/**
 * Called after registration to create a user entry in your own DB.
 */
export async function notifyRegisterToDB(user: User) {
  console.log('📡 Notify backend of new user:', user.email);
  // TODO: Add API call to backend to save new user data
}
