// Base URL for the Gateway (can be configured via environment variable)
const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

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
    throw new Error(`Error ${res.status}: ${error}`);
  }

  return await res.json();
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

  return await res.json();
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
    throw new Error(`Error ${res.status}: ${error}`);
  }

  return await res.json();
}

/**
 * Payload shape for registering a new user in the backend
 */
export type RegisterPayload = {
  email: string;
  name: string;
  urlProfilePhoto: string;
  provider: string;
};

/**
 * Notify the backend about a new user registration (custom object, not Firebase.User)
 */
export async function notifyRegisterToDB(user: RegisterPayload) {
  console.log('📡 Notify backend of new user:', user.email);
  return postToGateway('/users', user);
}

/**
 * Payload shape for login notification
 */
export type LoginPayload = {
  email: string;
};

/**
 * Notify the backend about a user login
 */
export async function notifyLoginToDB(user: LoginPayload) {
  console.log('📡 Notify backend of login:', user.email);
  return postToGateway('/users/login', user);
}

/**
 * Update the user's location in the backend (requires Firebase token)
 */
export async function updateUserLocation(userId: number, latitude: number, longitude: number, token: string) {
  console.log('📍 Updating user location...');
  return patchToGateway(`/users/${userId}/location`, { latitude, longitude }, token);
}

/**
 * Increments failed login attempts for the given user (no auth required)
 */
export async function increaseFailedAttempts(userId: number) {
  console.log('⚠️ Increasing failed login attempts...');
  return patchToGateway(`/users/${userId}/failed-attempts`, {});
}

/**
 * Checks if the user account is locked (no auth required)
 */
export async function checkLockStatus(userId: number) {
  console.log('🔒 Checking account lock status...');
  return getFromGateway(`/users/${userId}/check-lock-status`);
}
