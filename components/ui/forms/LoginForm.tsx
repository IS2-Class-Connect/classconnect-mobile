import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';
import Dialog from '../alerts/Dialog';
import ResetPasswordModal from '../modals/ResetPasswordModal'; 
import { useAuth, AuthError, LockInfo } from '../../../context/AuthContext';
import GoogleAuth from '../../../firebase/GoogleAuth';
import { Modal } from 'react-native';
import { verificateToken } from '../../../services/userApi';
import { notifyRegisterToDB, updateUserProfile } from '../../../services/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Login form component that handles user authentication
 */
export default function LoginForm({
  isLoading: externalIsLoading,
  setIsLoading: setExternalIsLoading,
  onShowRegister,
}: {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onShowRegister: () => void;
}) {
  const router = useRouter();
  const theme = useTheme();
  const { loginWithEmailAndPassword, loginWithGoogle,emailExists,linkAccountsWithPassword,fetchUserData, isLoading: authIsLoading } = useAuth();
  // const { user, loading, error, signIn, signOut } = GoogleAuth();
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorType, setErrorType] = useState<AuthError | null>(null);
  const [resetVisible, setResetVisible] = useState(false);
  
  // Account lock tracking
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [lockedEmail, setLockedEmail] = useState<string | null>(null);

  // Combine external and internal loading states
  const isLoading = externalIsLoading || authIsLoading;

  // Clear lock info when email changes
  useEffect(() => {
    if (email !== lockedEmail) {
      setLockInfo(null);
      setLockedEmail(null);
    }
  }, [email, lockedEmail]);

  /**
   * Format lock time for display in a user-friendly way
   */
  const formatLockTime = () => {
    if (!lockInfo?.lockUntil) return '';
    
    const lockUntil = new Date(lockInfo.lockUntil);
    const now = new Date();
    
    // Calculate remaining minutes
    const minutesRemaining = Math.ceil((lockUntil.getTime() - now.getTime()) / (1000 * 60));
    
    if (minutesRemaining <= 0) return 'a moment';
    if (minutesRemaining === 1) return '1 minute';
    if (minutesRemaining < 60) return `${minutesRemaining} minutes`;
    
    const hoursRemaining = Math.ceil(minutesRemaining / 60);
    if (hoursRemaining === 1) return '1 hour';
    return `${hoursRemaining} hours`;
  };

  /**
   * Handle email/password login
   */
  const handleEmailLogin = async () => {
    if (!email) {
      setErrorType('invalid-credentials');
      return;
    }

    setExternalIsLoading(true);
    
    try {
      // Use the login function from the context
      const result = await loginWithEmailAndPassword(email, password);
      
      if (result.success) {
        // Navigate to the main application
        router.replace('/(tabs)');
      } else {
        // Handle error
        setErrorType(result.error || 'unknown-error');
        
        // Update lock information if available
        if (result.lockInfo) {
          setLockInfo(result.lockInfo);
          setLockedEmail(email); // Remember which email is locked
        }
      }
    } catch (error) {
      console.log('❌ Unexpected error during login:', error);
      setErrorType('unknown-error');
    } finally {
      setExternalIsLoading(false);
    }
  };

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkToken, setToken] = useState('');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');

  function askToLinkAccount(email: string, token: string) {
    setLinkEmail(email);
    setLinkPassword('');
    setToken(token);
    setShowLinkModal(true);
  }

//   /**
//    * Handle Google sign-in
//    */
// const handleGoogleLogin = async () => {
//   try {
//     setExternalIsLoading(true);

//     const result = await signIn();
//     if (!result?.id_token) {
//       throw new Error("No ID token returned from Google");
//     }

//     const emailString: string = result.email ?? "";
//     const token = result.id_token;

//     try {
//       await verificateToken({ idToken: token });
//     } catch (e) {
//       Alert.alert("Error", "Invalid or expired Google token. Please try logging in again.");
//       setExternalIsLoading(false);
//       return;
//     }

//     await AsyncStorage.setItem("token", token);
//     const methods = await emailExists(emailString);
//     if (methods.length > 0) {
//       if (methods.includes("google.com")) {
//         try {
//           const userCredential = await loginWithGoogle(token);
//           console.log("✅ Started with Google (already linked)", userCredential);
//           await fetchUserData(userCredential.id_token);
//           router.replace('/(tabs)');
//         } catch (err: any) {
//           console.log("❌ Error logging in with Google:", err);
//           Alert.alert("Error", "Authentication failed. Please try again.");
//         }
//       } else if (methods.includes("password")) {
//         setName(result.name!);
//         setPhoto(result.photo!);
//         askToLinkAccount(emailString, token); 
//       }
//     } else {
//       try {
//         const userCredential = await loginWithGoogle(token);
//         const userCreated = await notifyRegisterToDB({
//           uuid: userCredential.uid,
//           email: result.email!,
//           name: result.name ?? "",
//           urlProfilePhoto: result.photo ?? `https://api.dicebear.com/7.x/personas/png?seed=${result.name}`,
//           provider: "google.com",
//         });
//         console.log("✅ User registered in backend:", userCreated);
//         await fetchUserData(userCredential.id_token);
//         router.replace('/(tabs)');
//       } catch (err) {
//         console.log("❌ Error registering new user:", err);
//         Alert.alert("Error", "Failed to complete registration. Please try again.");
//       }
//     }

//   } catch (error: any) {
//     console.log("❌ Google login error:", error);
//     Alert.alert(
//       "Authentication Failed",
//       "There was an issue logging in with Google. You can try again or choose another method.",
//       [
//         { text: "Retry", onPress: handleGoogleLogin },
//         { text: "Cancel", style: "cancel" },
//       ]
//     );
//   } finally {
//     setExternalIsLoading(false);
//   }
// };


/**
 * Map error types to user-friendly messages
 */
const getErrorMessage = (errorType: AuthError): string => {
  switch (errorType) {
    case 'invalid-credentials':
      return 'Invalid email or password. Please try again.';
    case 'user-not-found':
      return 'User not found. Please check your email or register.';
    case 'too-many-requests':
      return 'Too many login attempts. Please try again later.';
    case 'account-locked':
      return `Your account has been temporarily locked due to too many failed login attempts. Please try again in ${formatLockTime()}.`;
    case 'user-disabled':
      return 'Your account has been disabled by an administrator. Please contact support for assistance.';
    case 'email-not-verified':
      return 'Please verify your email address before logging in. Check your inbox for a verification link.';
    case 'network-error':
      return 'Network error. Please check your internet connection and try again.';
    case 'server-error':
      return 'Could not retrieve your account information. Please try again or contact support.';
    case 'account-locked-by-admins':
      return 'Your account has been disabled by an administrator. Please contact support for assistance.';
    default:
      return 'Something went wrong. Please try again later.';
  }
};

  return (
    <View>
      {/* Email input */}
      <TextField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      
      {/* Password input */}
      <TextField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />
      
      {/* Login button - only disabled during loading */}
      <Button
        title="Log In"
        onPress={handleEmailLogin}
        variant="primary"
        disabled={isLoading}
      />
      
      {/* Register button */}
      <Button
        title="Register"
        onPress={onShowRegister}
        variant="primary"
        disabled={isLoading}
      />
      
      {/* Google sign-in button */}
      <IconButton
        title="Continue with Google"
        icon={require('../../../assets/icons/google-blue.png')}
        onPress={async () => {}}
        //onPress={handleGoogleLogin}
        disabled={isLoading}
        loading={isLoading}
      />

      {/* Password reset link */}
      <Text
        style={styles.resetLink}
        onPress={() => setResetVisible(true)}
      >
        Forgot your password? Reset here
      </Text>

      {/* Show account locked warning if applicable */}
      {email === lockedEmail && lockInfo?.accountLocked && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          This account is locked. Please try again in {formatLockTime()}.
        </Text>
      )}

      {/* Show failed attempts warning if applicable */}
      {email === lockedEmail && lockInfo && lockInfo.failedAttempts > 0 && !lockInfo.accountLocked && (
        <Text style={[styles.warningText, { color: theme.warning }]}>
          Warning: {lockInfo.failedAttempts} failed login {lockInfo.failedAttempts === 1 ? 'attempt' : 'attempts'}. 
          Your account will be temporarily locked after 5 failed attempts.
        </Text>
      )}

      {/* Password reset modal */}
      <ResetPasswordModal
        visible={resetVisible}
        onClose={() => setResetVisible(false)}
      />

      {/* Error dialog */}
      <Dialog
        visible={!!errorType}
        message={errorType ? getErrorMessage(errorType) : ''}
        onClose={() => setErrorType(null)}
        type="error"
      />
<Modal visible={showLinkModal} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Existing Account</Text>
      <Text style={styles.modalMessage}>
      An account already exists with the email {linkEmail} using email/password. Enter your password to link the accounts.
      </Text>
      <TextField
        placeholder="Password"
        value={linkPassword}
        onChangeText={setLinkPassword}
        secureTextEntry
      />
      <View style={styles.modalButtons}>
        <Button title="Cancel" onPress={() => setShowLinkModal(false)} />
        <Button title="Link" onPress={async () => {
          setShowLinkModal(false);
          if (linkPassword) {
            const result = await linkAccountsWithPassword(linkEmail, linkPassword, linkToken);
            try {
            console.log('🧾 Updating backend user profile...');
            await updateUserProfile(
              result.uid,
              {   name:  name,
                  urlProfilePhoto: photo,
              },
              result.id_token
            );
            console.log('✅ Backend user profile updated.');
            await fetchUserData(result.id_token);
            router.replace('/(tabs)'); 
          } catch (backendError) {
            console.log('❌ Backend update error:', backendError);
            return;
          }
          }
        }} />
      </View>
    </View>
  </View>
</Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      margin: 20,
      padding: 20,
      borderRadius: 10,
      backgroundColor: 'white',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    modalMessage: {
      marginBottom: 10,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  resetLink: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  warningText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
});
