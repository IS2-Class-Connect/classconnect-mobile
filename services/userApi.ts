// services/userApi.ts

import {
  getFromGateway,
  postToGateway,
  patchToGateway,
} from './gatewayClient';

/**
 * Represents a user entity with location, profile information, and failed login attempt tracking.
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
  accountLockedByAdmins: boolean;
  description: string;
  lockUntil: Date | null;
  lastFailedAt: Date | null;
  createdAt: string;
  pushToken: string | null;
  pushTaskAssignment: boolean;
  pushMessageReceived: boolean;
  pushDeadlineReminder: boolean;
  emailEnrollment: boolean;
  emailAssistantAssignment: boolean;
}

/**
 * Payload shape for registering a new user in the backend.
 */
export type RegisterPayload = {
  uuid: string;
  email: string;
  name: string;
  urlProfilePhoto: string;
  provider: string;
};

export interface FederatedUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Token {
  idToken: string;

}

/**
 * Notify the backend about a new user registration.
 */
export async function notifyRegisterToDB(user: RegisterPayload): Promise<User> {
  console.log('📡 Notify backend of new user:', user.email);
  const response = await postToGateway('/users', user);
  console.log('✅ Backend response for user registration:', response);
  return response as User;
}


/**
 * Notify the backend about a new user registration.
 */
export async function verificateToken(token: Token): Promise<FederatedUser> {
  console.log('📡 Verificate google token:', token);
  const response = await postToGateway('/users/auth/google', token,token.idToken);
  console.log('✅ Backend response for user verification of token:', response);
  return response as FederatedUser;
}


/**
 * Payload shape for login notification.
 */
export type LoginPayload = {
  email: string;
};

/**
 * Update the user's location in the backend.
 */
export async function updateUserLocation(
  userId: string,
  latitude: number,
  longitude: number,
  token: string
): Promise<User> {
  const response = await patchToGateway(
    `/users/${userId}/location`,
    { latitude, longitude },
    token
  );
  console.log('✅ Location updated successfully:', response);
  return response as User;
}

/**
 * Increments failed login attempts for the given user by email.
 */
export async function increaseFailedAttempts(email: string): Promise<{
  accountLocked: boolean;
  lockUntil: Date | null;
  failedAttempts: number;
}> {
  const encodedEmail = encodeURIComponent(email);
  const response = await patchToGateway(`/users/${encodedEmail}/failed-attempts`, {});
  console.log('✅ Failed attempts increased for email:', email);
  return response;
}

/**
 * Checks if the user account is locked by email.
 */
export async function checkLockStatus(email: string): Promise<{
  accountLocked: boolean;
  lockUntil: Date | null;
  failedAttempts: number;
}> {
  const encodedEmail = encodeURIComponent(email);
  const response = await getFromGateway(`/users/${encodedEmail}/check-lock-status`);

  if (response.isLocked === -1) {
    throw new Error(response.message);
  }

  const result = {
    accountLocked: response.isLocked === 1,
    lockUntil: response.lockedDate,
    failedAttempts: response.failedAttempts || 0,
  };

  console.log('✅ Account lock status for email:', email, result);
  return result;
}

/**
 * Retrieves the currently authenticated user's data.
 */
export async function getCurrentUserFromBackend(token: string): Promise<User> {
  const response = await getFromGateway('/users/me', token);
  console.log('✅ Current user data:', response);
  return response as User;
}

/**
 * Retrieves user data by UUID.
 */
export async function findUserByUuid(uuid: string, token:string): Promise<User> {
  const response = await getFromGateway(`/users/${uuid}`, token);
  console.log('✅ User data fetched by UUID:', response);
  return response as User;
}

/**
 * Retrieves all users' public information.
 */
export async function getAllUsers(token: string): Promise<User[]> {
  const response = await getFromGateway('/users', token);
  console.log('✅ All users fetched:', response);
  return response as User[];
}

/**
 * Updates the user's profile information.
 */
export async function updateUserProfile(
  uuid: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'urlProfilePhoto' | 'description'>>,
  token: string
): Promise<User> {
  const response = await patchToGateway(`/users/me`, updates, token);
  console.log('✅ User profile updated:', response);
  return response as User;
}

/**
  * Updates the user's notification configuration.
  */
export async function updateUserNotificationConfiguration(
  uiud: string,
  updates: Partial<Pick<User,
    'pushTaskAssignment' |
    'pushMessageReceived' |
    'pushDeadlineReminder' |
    'emailEnrollment' |
    'emailAssistantAssignment'
  >>,
  token: string,
): Promise<User> {
  const response = await patchToGateway(`/users/me`, updates, token);
  console.log('✅ User notification configuration updated:', response);
  return response as User;
} 
