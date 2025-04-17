// Base URL for the Gateway (can be configured via environment variable)
const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

/**
 * User interface representing the user model from the backend
 */
export interface User {
  uuid: string;
  email: string;
  name: string;
  urlProfilePhoto: string;
  provider: string;
  latitude: number | null;
  longitude: number | null;
  failedAttempts: number;
  accountLocked: boolean;
  lockUntil: Date | null;
  lastFailedAt: Date | null;
}

/**
 * Common POST helper for sending data to the Gateway
 */
async function postToGateway(endpoint: string, data: any) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    console.log('🚨 Error in POST request:', error);
    throw new Error(`Error ${res.status}: ${error}`);
  }

  const responseData = await res.json();
  return responseData;
}

/**
 * Common PATCH helper with optional Firebase token support
 */
async function patchToGateway(endpoint: string, data: any, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error ${res.status}: ${error}`);
  }

  const responseData = await res.json();
  return responseData;
}

/**
 * Common GET helper with optional Firebase token support
 */
async function getFromGateway(endpoint: string, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    console.log('🚨 Error in GET request:', error);
    throw new Error(`Error ${res.status}: ${error}`);
  }

  const responseData = await res.json();
  return responseData;
}

/**
 * Payload shape for registering a new user in the backend
 */
export type RegisterPayload = {
  uuid: string; // New field to store Firebase user UID
  email: string;
  name: string;
  urlProfilePhoto: string;
  provider: string;
};

/**
 * Notify the backend about a new user registration (custom object, not Firebase.User)
 */
export async function notifyRegisterToDB(user: RegisterPayload): Promise<User> {
  console.log('📡 Notify backend of new user:', user.email);
  try {
    const response = await postToGateway('/users', user);
    console.log('✅ Backend response for user registration:', response);
    return response as User;
  } catch (error) {
    console.log('🚨 Error notifying backend of new user:', error);
    throw error;
  }
}

/**
 * Payload shape for login notification
 */
export type LoginPayload = {
  email: string;
};

/**
 * Update the user's location in the backend (requires Firebase token)
 */
export async function updateUserLocation(userId: string, latitude: number, longitude: number, token: string): Promise<User> {
  try {
    const response = await patchToGateway(`/users/${userId}/location`, { latitude, longitude }, token);
    console.log('✅ Location updated successfully:', response);
    return response as User;
  } catch (error) {
    console.log('🚨 Error updating user location:', error);
    throw error;
  }
}

/**
 * Increments failed login attempts for the given user (no auth required)
 */
export async function increaseFailedAttempts(userId: number): Promise<User> {
  try {
    const response = await patchToGateway(`/users/${userId}/failed-attempts`, {});
    console.log('✅ Failed attempts increased:', response);
    return response as User;
  } catch (error) {
    console.log('🚨 Error increasing failed attempts:', error);
    throw error;
  }
}

/**
 * Checks if the user account is locked (no auth required)
 */
export async function checkLockStatus(userId: number): Promise<{
  accountLocked: boolean;
  lockUntil: Date | null;
  failedAttempts: number;
}> {
  try {
    const response = await getFromGateway(`/users/${userId}/check-lock-status`);
    console.log('✅ Account lock status:', response);
    return response;
  } catch (error) {
    console.log('🚨 Error checking account lock status:', error);
    throw error;
  }
}

/**
 * Retrieves the currently authenticated user's data using a Firebase token
 */
export async function getCurrentUserFromBackend(token: string): Promise<User> {
  try {
    const response = await getFromGateway('/users/me', token);
    console.log('✅ Current user data:', response);
    return response as User;
  } catch (error) {
    console.log('🚨 Error fetching current user from backend:', error);
    throw error;
  }
}