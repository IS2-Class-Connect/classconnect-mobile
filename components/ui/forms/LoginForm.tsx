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
  const { loginWithEmailAndPassword, loginWithGoogle, isLoading: authIsLoading } = useAuth();
  
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
      console.error('❌ Unexpected error during login:', error);
      setErrorType('unknown-error');
    } finally {
      setExternalIsLoading(false);
    }
  };

  /**
   * Handle Google sign-in
   */
  const handleGoogleLogin = async () => {
    setExternalIsLoading(true);
    
    try {
      // Use the Google login function from the context
      const result = await loginWithGoogle();
      
      if (result.success) {
        // Navigate to the main application
        router.replace('/(tabs)');
      } else {
        // Handle error
        setErrorType(result.error || 'unknown-error');
      }
    } catch (error) {
      console.error('❌ Unexpected error during Google login:', error);
      setErrorType('unknown-error');
    } finally {
      setExternalIsLoading(false);
    }
  };

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
      case 'network-error':
        return 'Network error. Please check your internet connection and try again.';
      case 'server-error':
        return 'Could not retrieve your account information. Please try again or contact support.';
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
        onPress={handleGoogleLogin}
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