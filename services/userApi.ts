import { User } from 'firebase/auth';

// Base URL for the user service from environment variable
const USER_SERVICE_URL = process.env.EXPO_PUBLIC_USER_SERVICE_URL || 'http://localhost:3001/users';

/**
 * Helper to POST data to the user service backend.
 */
async function postToUserService(endpoint: string, data: any) {
  try {
    const res = await fetch(`${USER_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Error ${res.status}: ${error}`);
    }

    return await res.json();
  } catch (err) {
    console.error('❌ Error calling user service:', err);
    throw err;
  }
}

/**
 * Called after login to notify your backend that the user logged in.
 */
export async function notifyLoginToDB(user: User) {
  console.log('📡 Notify backend of login:', user.email);
  return postToUserService('/login', {
    uid: user.uid,
    email: user.email,
    lastLogin: new Date().toISOString(),
  });
}

/**
 * Called after registration to create a new user in your backend.
 */
export async function notifyRegisterToDB(user: User) {
  console.log('📡 Notify backend of new user:', user.email);
  return postToUserService('/register', {
    uid: user.uid,
    email: user.email,
    createdAt: new Date().toISOString(),
  });
}
