import React, {
  createContext,
  useEffect,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { onAuthStateChangedListener, logout as firebaseLogout, isEmailVerified } from '../firebase';
import { User, getCurrentUserFromBackend, increaseFailedAttempts, checkLockStatus } from '../services/userApi';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useGoogleSignIn } from '../firebase';
import { addPushTokenListener } from 'expo-notifications';
import { registerForPushNotificationsAsync, updateUserPushToken } from '@/services/notifications';

export type AuthError = 
  | 'invalid-credentials' 
  | 'user-not-found' 
  | 'too-many-requests' 
  | 'account-locked'
  | 'account-locked-by-admins'
  | 'user-disabled'
  | 'email-not-verified'
  | 'network-error'
  | 'server-error'
  | 'unknown-error';

export type LockInfo = {
  accountLocked: boolean;
  lockUntil: Date | null;
  failedAttempts: number;
};

// Type for the authentication context

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  authToken: string | null;
  logout: () => Promise<void>;
  refreshUserData: (tokenOverride?: string) => Promise<void>;
  loginWithEmailAndPassword: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError; lockInfo?: LockInfo }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: AuthError }>;
  startRegistration: () => void;
  finishRegistration: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  authToken: null,
  logout: async () => {},
  refreshUserData: async () => {},
  loginWithEmailAndPassword: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  startRegistration: () => {},
  finishRegistration: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const { promptAsync } = useGoogleSignIn();

  const startRegistration = useCallback(() => setIsRegistering(true), []);
  const finishRegistration = useCallback(() => setIsRegistering(false), []);

  const fetchUserData = useCallback(async (token: string) => {
    try {
      const userData = await getCurrentUserFromBackend(token);

      if (userData.accountLockedByAdmins) {
        console.warn('⛔ User is locked by admins');
        setUser(null);
        throw new Error('account-locked-by-admins');
      }

      setUser(userData);
      return userData;
    } catch (error: any) {
      if (isRegistering && error.message?.includes('404')) {
        return null;
      }
      setUser(null);
      throw error;
    }
  }, [isRegistering]);

  const refreshUserData = useCallback(async (tokenOverride?: string) => {
    const tokenToUse = tokenOverride || authToken;
    if (!tokenToUse) return;

    setLoading(true);
    try {
      await fetchUserData(tokenToUse);
    } finally {
      setLoading(false);
    }
  }, [authToken, fetchUserData]);

  const loginWithEmailAndPassword = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const auth = getAuth();
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setAuthToken(token);

      try {
        const lockStatus = await checkLockStatus(email);
        if (lockStatus.accountLocked) {
          await firebaseLogout();
          setAuthToken(null);
          setUser(null);
          return { success: false, error: 'account-locked' as AuthError, lockInfo: lockStatus };
        }
      } catch {}

      try {
        await fetchUserData(token);
        return { success: true };
      } catch (error: any) {
        await firebaseLogout();
        setAuthToken(null);
        setUser(null);
        if (error.message === 'account-locked-by-admins') {
          return { success: false, error: 'account-locked-by-admins' as AuthError };
        }
        return { success: false, error: 'server-error' as AuthError };
      }
    } catch (firebaseError: any) {
      return handleFirebaseAuthError(firebaseError, email);
    } finally {
      setLoading(false);
    }
  }, [fetchUserData]);

  const handleFirebaseAuthError = async (firebaseError: any, email: string) => {
    if (firebaseError?.code === 'auth/user-disabled') {
      return { success: false, error: 'user-disabled' as AuthError };
    }
    if (firebaseError?.code === 'auth/invalid-login-credentials' || firebaseError?.code === 'auth/wrong-password' || firebaseError?.code === 'auth/user-not-found') {
      try {
        const updatedLockStatus = await increaseFailedAttempts(email);
        if (updatedLockStatus.accountLocked) {
          return { success: false, error: 'account-locked' as AuthError, lockInfo: updatedLockStatus };
        } else {
          return { success: false, error: 'invalid-credentials' as AuthError, lockInfo: updatedLockStatus };
        }
      } catch {
        return { success: false, error: 'invalid-credentials' as AuthError };
      }
    }
    if (firebaseError?.code === 'auth/too-many-requests') {
      return { success: false, error: 'too-many-requests' as AuthError };
    }
    if (firebaseError?.code === 'auth/network-request-failed') {
      return { success: false, error: 'network-error' as AuthError };
    }
    return { success: false, error: 'unknown-error' as AuthError };
  };

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const auth = getAuth();
        if (!auth.currentUser) throw new Error('No user after Google login');

        const emailVerified = await isEmailVerified(auth.currentUser);
        if (!emailVerified) {
          await firebaseLogout();
          return { success: false, error: 'email-not-verified' as AuthError };
        }

        const token = await auth.currentUser.getIdToken();
        setAuthToken(token);

        try {
          await fetchUserData(token);
          return { success: true };
        } catch (error: any) {
          await firebaseLogout();
          setAuthToken(null);
          setUser(null);
          if (error.message === 'account-locked-by-admins') {
            return { success: false, error: 'account-locked-by-admins' as AuthError };
          }
          return { success: false, error: 'server-error' as AuthError };
        }
      } else {
        return { success: false, error: 'user-not-found' as AuthError };
      }
    } catch {
      return { success: false, error: 'unknown-error' as AuthError };
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, promptAsync]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setAuthToken(token);
          await fetchUserData(token);
        } catch {
          setAuthToken(null);
          setUser(null);
        }
      } else {
        setAuthToken(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchUserData]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseLogout();
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle spurious changes in the push token
  */
  useEffect(() => {
    const subscription = addPushTokenListener(async (newPushToken) => {
      const tokenString = typeof newPushToken === 'string'
        ? newPushToken
        : newPushToken?.data;

      if (user && user.uuid && authToken && tokenString) {
        try {
          await updateUserPushToken(user.uuid, tokenString, authToken);
        } catch (e) {
          console.log(`Failed to update push token: ${e}`);
        }
      }
    });

    return () => subscription.remove();
  }, [user, authToken]);

  /**
   * Register user's push token for push notifications.
   */
  useEffect(() => {
    async function registerAndSendToken() {
      if (user && user.uuid && authToken) {
        const tokenString = await registerForPushNotificationsAsync();
        if (tokenString) {
          try {
            await updateUserPushToken(user.uuid, tokenString, authToken);
          } catch (e) {
            console.log(`Failed to update push token: ${e}`);
          }
        }
      }
    }

    registerAndSendToken();
  }, [user, authToken]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      authToken,
      logout,
      refreshUserData,
      loginWithEmailAndPassword,
      loginWithGoogle,
      startRegistration,
      finishRegistration
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
