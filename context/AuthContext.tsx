import React, {
  createContext,
  useEffect,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import {
  onAuthStateChangedListener,
  logout as firebaseLogout,
} from '../firebase';

// Import User type from userApi instead of Firebase
import { User } from '../services/userApi'; // Adjust path according to your structure
import { User as FirebaseUser } from 'firebase/auth'; // Renamed to avoid conflicts
import { getCurrentUserFromBackend } from '../services/userApi'; // Import function to get data from backend

type AuthContextType = {
  user: User | null; // Now using User type from userApi
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>; // Function to update user data
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refreshUserData: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // Backend user data
  const [isLoading, setLoading] = useState(true);
  
  // Internal state to track Firebase user for token purposes
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Function to fetch user data from backend
  const fetchUserData = useCallback(async (fbUser: FirebaseUser) => {
    try {
      // Get Firebase token
      const token = await fbUser.getIdToken();
      
      // Get complete user data from backend
      const userData = await getCurrentUserFromBackend(token);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data from backend:', error);
      // If there's an error getting data, keep user as null
      setUser(null);
    }
  }, []);

  // Function to update user data from backend
  const refreshUserData = useCallback(async () => {
    if (!firebaseUser) {
      console.warn('Cannot refresh user data: No Firebase user logged in');
      return;
    }
    
    setLoading(true);
    try {
      await fetchUserData(firebaseUser);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, fetchUserData]);

  useEffect(() => {
    // logout(); //ONLY FOR DEVELOPMENT - Uncomment if you want to log out on init
    
    const unsubscribe = onAuthStateChangedListener(async (fbUser) => {
      setFirebaseUser(fbUser); // Store Firebase user internally only for token purposes
      
      if (fbUser) {
        // If there's a Firebase user, get their data from backend
        await fetchUserData(fbUser);
      } else {
        // If no Firebase user, clear backend user data
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
      setFirebaseUser(null);
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
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Access hook
export const useAuth = () => useContext(AuthContext);