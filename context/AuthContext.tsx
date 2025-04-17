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

// Types for authentication errors
export type AuthError = 
  | 'invalid-credentials' 
  | 'user-not-found' 
  | 'too-many-requests' 
  | 'account-locked'
  | 'user-disabled'
  | 'email-not-verified'  // New error type for unverified emails
  | 'network-error'
  | 'server-error'
  | 'unknown-error';

// Information about account lock status
export type LockInfo = {
  accountLocked: boolean;
  lockUntil: Date | null;
  failedAttempts: number;
};

// Type for the authentication context
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  loginWithEmailAndPassword: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError; lockInfo?: LockInfo }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: AuthError }>;
  startRegistration: () => void;
  finishRegistration: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
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
  // Flag to indicate if a registration process is in progress
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Get the function to start the Google sign-in flow
  const { promptAsync } = useGoogleSignIn();

  // Functions to control registration state
  const startRegistration = useCallback(() => {
    console.log('Starting registration process - ignoring 404 errors');
    setIsRegistering(true);
  }, []);

  const finishRegistration = useCallback(() => {
    console.log('Finishing registration process');
    setIsRegistering(false);
  }, []);

  // Function to fetch user data from the backend
  const fetchUserData = useCallback(async (token: string) => {
    try {
      const userData = await getCurrentUserFromBackend(token);
      setUser(userData);
      return userData;
    } catch (error: any) {
      // If we're in the registration process and get a 404, ignore it
      if (isRegistering && error.message?.includes('404')) {
        console.log('Ignoring 404 error during registration process');
        return null;
      }
      
      console.error('Error fetching user data from backend:', error);
      setUser(null);
      throw error;
    }
  }, [isRegistering]);

  // Function to refresh user data from the backend
  const refreshUserData = useCallback(async () => {
    if (!authToken) {
      console.warn('Cannot refresh user data: No authentication token available');
      return;
    }
    
    setLoading(true);
    try {
      await fetchUserData(authToken);
    } finally {
      setLoading(false);
    }
  }, [authToken, fetchUserData]);

  const loginWithEmailAndPassword = useCallback(async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Step 1: Attempt to authenticate with Firebase first
      try {
        const auth = getAuth();
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Firebase authentication successful:', result.user.email);
        
        // Get token
        const token = await result.user.getIdToken();
        setAuthToken(token);
        
        // Step 1.5: Check if email is verified
        const emailVerified = await isEmailVerified(result.user);
        if (!emailVerified) {
          console.log('❌ Email not verified, preventing login completion');
          // Log out from Firebase since email is not verified
          await firebaseLogout();
          setAuthToken(null);
          setUser(null);
          
          return { 
            success: false, 
            error: 'email-not-verified' as AuthError
          };
        }
        
        console.log('✅ Email is verified, proceeding with login');
        
        // Step 2: Now check if the account is locked in the backend
        try {
          const lockStatus = await checkLockStatus(email);
          
          if (lockStatus.accountLocked) {
            console.log('❌ Account is locked, preventing login completion');
            // Log out from Firebase since the account is locked
            await firebaseLogout();
            setAuthToken(null);
            setUser(null);
            
            return { 
              success: false, 
              error: 'account-locked' as AuthError,
              lockInfo: lockStatus
            };
          }
          
          console.log('✅ Account is not locked, proceeding with login');
        } catch (lockError) {
          // If checking lock status fails, we'll assume the account is not locked
          // This could happen if the user doesn't exist in the backend yet
          console.log('⚠️ Could not check lock status, assuming not locked:', lockError);
        }
        
        // Step 3: Fetch user data from backend
        try {
          const userData = await fetchUserData(token);
          if (!userData) {
            throw new Error('Backend returned no user data');
          }
          
          console.log('✅ Backend user data retrieved successfully');
          return { success: true };
        } catch (backendError) {
          console.error('❌ Backend error after successful Firebase login:', backendError);
          await firebaseLogout();
          setAuthToken(null);
          setUser(null);
          return { success: false, error: 'server-error' as AuthError };
        }
      } catch (firebaseError: any) {
        console.error('❌ Firebase authentication error:', firebaseError?.code);
        
        // Check for admin-disabled account first
        if (firebaseError?.code === 'auth/user-disabled') {
          console.log('❌ User account has been disabled by an administrator');
          return { success: false, error: 'user-disabled' as AuthError };
        }
        
        // Handle other Firebase authentication errors
        if (firebaseError?.code === 'auth/invalid-login-credentials' || 
            firebaseError?.code === 'auth/wrong-password' || 
            firebaseError?.code === 'auth/user-not-found') {
          
          // Record failed login attempt in backend
          try {
            // This will fail silently if the user doesn't exist in the backend
            const updatedLockStatus = await increaseFailedAttempts(email);
            
            // Check if account just got locked
            if (updatedLockStatus.accountLocked) {
              return { 
                success: false, 
                error: 'account-locked' as AuthError,
                lockInfo: updatedLockStatus
              };
            } else {
              return { 
                success: false, 
                error: 'invalid-credentials' as AuthError,
                lockInfo: updatedLockStatus
              };
            }
          } catch (failedAttemptError) {
            // If recording failed attempt fails, just show auth error
            // This could happen if the user doesn't exist in the backend yet
            console.log('⚠️ Could not record failed attempt, user may not exist:', failedAttemptError);
            return { success: false, error: 'invalid-credentials' as AuthError };
          }
        } else if (firebaseError?.code === 'auth/too-many-requests') {
          // Firebase's own rate limiting
          return { success: false, error: 'too-many-requests' as AuthError };
        } else if (firebaseError?.code === 'auth/network-request-failed') {
          return { success: false, error: 'network-error' as AuthError };
        } else {
          return { success: false, error: 'unknown-error' as AuthError };
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error during login:', error);
      return { success: false, error: 'unknown-error' as AuthError };
    } finally {
      setLoading(false);
    }
  }, [fetchUserData]);

  // Function to log in with Google
  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    
    try {
      // Start the Google authentication flow
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        // Wait for Firebase to complete authentication
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify if the user is authenticated
        const auth = getAuth();
        if (!auth.currentUser) {
          throw new Error('Google authentication failed: No user found after sign-in');
        }
        
        // Check if email is verified (Google accounts are usually pre-verified)
        const emailVerified = await isEmailVerified(auth.currentUser);
        if (!emailVerified) {
          console.log('❌ Email not verified after Google login, preventing login completion');
          await firebaseLogout();
          return { 
            success: false, 
            error: 'email-not-verified' as AuthError 
          };
        }
        
        // Get token
        const token = await auth.currentUser.getIdToken();
        setAuthToken(token);
        
        // Fetch user data
        try {
          const userData = await fetchUserData(token);
          if (!userData) {
            throw new Error('Backend returned no user data');
          }
          
          console.log('✅ Backend user data retrieved successfully after Google login');
          return { success: true };
        } catch (backendError) {
          console.error('❌ Backend error after successful Google login:', backendError);
          await firebaseLogout();
          setAuthToken(null);
          setUser(null);
          return { success: false, error: 'server-error' as AuthError };
        }
      } else {
        return { success: false, error: 'user-not-found' as AuthError };
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      return { success: false, error: 'unknown-error' as AuthError };
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, promptAsync]);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (fbUser) => {
      if (fbUser) {
        try {
          // Get and store the token
          const token = await fbUser.getIdToken();
          console.log('Firebase token obtained from listener');
          setAuthToken(token);
          
          // Fetch user data (will be ignored if isRegistering is true and we get a 404)
          try {
            await fetchUserData(token);
          } catch (error) {
            // Error is already logged in fetchUserData
            // We don't need to do anything else here
          }
        } catch (error) {
          console.error('Error getting auth token from listener:', error);
          setAuthToken(null);
          setUser(null);
        }
      } else {
        // If no Firebase user, clear token and user data
        setAuthToken(null);
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserData]);

  // Function to log out
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseLogout();
      setAuthToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
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

// Hook to access the context
export const useAuth = () => useContext(AuthContext);