import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';
import { useGoogleSignIn } from '../../../firebase';
import { loginWithEmail, logout as firebaseLogout } from '../../../firebase/auth';
import Dialog from '../alerts/Dialog';
import ResetPasswordModal from '../modals/ResetPasswordModal'; 
import { getCurrentUserFromBackend } from '../../../services/userApi';
import { useAuth } from '../../../context/AuthContext';

export default function LoginForm({
  isLoading,
  setIsLoading,
  onShowRegister,
}: {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onShowRegister: () => void;
}) {
  const router = useRouter();
  const theme = useTheme();
  const { refreshUserData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'server' | 'backend' | null>(null);
  const [resetVisible, setResetVisible] = useState(false);

  const { promptAsync, handleGoogleResponse } = useGoogleSignIn();

  const handleEmailLogin = async () => {
    try {
      setIsLoading(true);
      
      // Step 1: Authenticate with Firebase
      const firebaseResult = await loginWithEmail(email, password);
      console.log('✅ Firebase authentication successful:', firebaseResult.user.email);
      
      // Step 2: Fetch user data from backend
      try {
        // Get token from Firebase user
        const token = await firebaseResult.user.getIdToken();
        
        // Try to fetch user data from backend
        const userData = await getCurrentUserFromBackend(token);
        
        // If we get here, backend fetch was successful
        if (userData) {
          console.log('✅ Backend user data retrieved successfully');
          
          // Now refresh the user data in AuthContext
          await refreshUserData();
          
          // Navigate to main app
          router.replace('/(tabs)');
        } else {
          // If userData is null or undefined, throw an error
          throw new Error('Backend returned no user data');
        }
      } catch (backendError) {
        // Handle backend error by logging out from Firebase
        console.error('❌ Backend error after successful Firebase login:', backendError);
        await firebaseLogout(); // Log out from Firebase
        setErrorType('backend');
      }
    } catch (error: any) {
      // Handle Firebase authentication errors
      const code = error?.code;
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-login-credentials'
      ) {
        setErrorType('auth');
      } else {
        setErrorType('server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Trigger Google sign-in flow
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        try {
          // Wait for Firebase authentication to complete
          // This is a bit tricky since handleGoogleResponse is called by the hook
          // We need to add a small delay to ensure Firebase auth completes
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to refresh user data from backend
          try {
            // This will throw an error if backend fetch fails
            await refreshUserData();
            
            // If we get here, backend fetch was successful
            console.log('✅ Backend user data retrieved successfully after Google login');
            
            // Navigate to main app
            router.replace('/(tabs)');
          } catch (backendError) {
            // Handle backend error by logging out from Firebase
            console.error('❌ Backend error after successful Google login:', backendError);
            await firebaseLogout(); // Log out from Firebase
            setErrorType('backend');
          }
        } catch (error) {
          console.error('❌ Error during Google authentication flow:', error);
          setErrorType('server');
        }
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      setErrorType('server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <TextField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />
      <Button
        title="Log In"
        onPress={handleEmailLogin}
        variant="primary"
        disabled={isLoading}
      />
      <Button
        title="Register"
        onPress={onShowRegister}
        variant="primary"
        disabled={isLoading}
      />
      <IconButton
        title="Continue with Google"
        icon={require('../../../assets/icons/google-blue.png')}
        onPress={handleGoogleLogin}
        disabled={isLoading}
        loading={isLoading}
      />

      <Text
        style={styles.resetLink}
        onPress={() => setResetVisible(true)}
      >
        Forgot your password? Reset here
      </Text>

      {/* ✅ Nuevo uso del modal */}
      <ResetPasswordModal
        visible={resetVisible}
        onClose={() => setResetVisible(false)}
      />

      <Dialog
        visible={errorType === 'auth'}
        message="Invalid email or password. Please try again."
        onClose={() => setErrorType(null)}
        type="error"
      />

      <Dialog
        visible={errorType === 'server'}
        message="Something went wrong. Please try again later."
        onClose={() => setErrorType(null)}
        type="error"
      />

      <Dialog
        visible={errorType === 'backend'}
        message="Could not retrieve your account information. Please try again or contact support."
        onClose={() => setErrorType(null)}
        type="error"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  resetLink: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});