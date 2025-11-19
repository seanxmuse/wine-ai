import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { theme } from '../theme';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-20)).current;
  const formScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const inputShake = useRef(new Animated.Value(0)).current;

  // Animate error message
  const showError = (message: string) => {
    setError(message);
    Animated.parallel([
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(errorTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideError = () => {
    Animated.parallel([
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(errorTranslateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setError(null);
    });
  };

  // Shake animation for input errors
  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(inputShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Parse Supabase error messages
  const parseError = (error: any): string => {
    if (!error) return 'An unexpected error occurred';
    
    const message = error.message || '';
    const status = error.status || error.statusCode;

    // Handle specific error cases
    if (status === 422 || message.includes('already registered') || message.includes('User already registered')) {
      return 'This email is already registered. Please sign in instead.';
    }
    
    if (message.includes('Invalid login credentials') || message.includes('Invalid credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    
    if (message.includes('Password')) {
      return 'Password must be at least 6 characters long.';
    }
    
    if (message.includes('Email')) {
      return 'Please enter a valid email address.';
    }

    // Return user-friendly message or fallback
    return message || 'Something went wrong. Please try again.';
  };

  const handleAuth = async () => {
    // Clear any existing errors
    hideError();

    if (!email || !password) {
      const message = 'Please fill in all fields';
      showError(message);
      shakeInput();
      return;
    }

    if (!isLogin && !firstName.trim()) {
      const message = 'Please enter your first name';
      showError(message);
      shakeInput();
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: firstName.trim(),
            },
          },
        });

        if (error) throw error;

        // If session exists, user is automatically signed in (email confirmation disabled)
        // The App.js will handle navigation based on session state
        if (!data.session) {
          // Email confirmation required (shouldn't happen if disabled in Supabase)
          Alert.alert(
            'Success',
            'Account created! Please check your email to verify your account.',
            [{ text: 'OK' }]
          );
          // Reset form
          setEmail('');
          setPassword('');
          setFirstName('');
          setIsLogin(true);
        }
        // If session exists, user is auto-signed in - no alert needed, navigation happens automatically
      }
    } catch (error: any) {
      const errorMessage = parseError(error);
      showError(errorMessage);
      shakeInput();
    } finally {
      setLoading(false);
    }
  };

  // Clear error when switching between login/signup
  useEffect(() => {
    hideError();
  }, [isLogin]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      hideError();
    }
  }, [email, password, firstName]);

  const Container = Platform.OS === 'web' ? View : KeyboardAvoidingView;
  const containerProps = Platform.OS === 'web' 
    ? { style: styles.container }
    : { style: styles.container, behavior: (Platform.OS === 'ios' ? 'padding' : 'height') as 'padding' | 'height' | 'position' };

  return (
    <Container {...containerProps}>
      <View style={styles.content}>
        {/* Logo/Title */}
        <View style={styles.header}>
          <Image
            source={require('../../public/favicon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Wine Scanner</Text>
          <Text style={styles.subtitle}>
            Discover the best wines on any list
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <Animated.View
            style={[
              styles.errorBanner,
              {
                opacity: errorOpacity,
                transform: [
                  { translateY: errorTranslateY },
                  { translateX: inputShake },
                ],
              },
            ]}
          >
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={hideError} style={styles.errorClose}>
              <Ionicons name="close" size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Form */}
        <Animated.View
          style={[
            styles.form,
            {
              transform: [{ scale: formScale }, { translateX: inputShake }],
            },
          ]}
        >
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={theme.colors.text.tertiary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!loading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.text.tertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.text.tertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.neutral[50]} />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Text>
                  <Ionicons
                    name={isLogin ? 'log-in-outline' : 'person-add-outline'}
                    size={20}
                    color={theme.colors.neutral[50]}
                    style={styles.buttonIcon}
                  />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsLogin(!isLogin);
              // Clear firstName when switching to login
              if (!isLogin) {
                setFirstName('');
              }
            }}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(Platform.OS === 'web' ? {
      minHeight: '100vh' as any,
      width: '100%' as any,
      position: 'relative' as any,
      zIndex: 1,
      overflow: 'auto' as any,
    } : {}),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    ...(Platform.OS === 'web' && {
      position: 'relative' as any,
      zIndex: 2,
      width: '100%' as any,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: theme.spacing.lg,
    ...(Platform.OS === 'web' && {
      width: '100px' as any,
      height: '100px' as any,
    }),
  },
  title: {
    ...theme.typography.styles.heroTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    letterSpacing: -0.5,
    ...(Platform.OS === 'web' && {
      lineHeight: '1.1' as any,
      marginBottom: '16px' as any,
      letterSpacing: '-1px' as any,
    }),
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    ...(Platform.OS === 'web' && {
      marginTop: '0px' as any,
      paddingTop: '0px' as any,
    }),
  },
  form: {
    width: '100%',
    ...(Platform.OS === 'web' && {
      position: 'relative' as any,
      zIndex: 3,
    }),
  },
  input: {
    ...theme.typography.styles.body,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: Platform.OS === 'web' ? 12 : theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      outline: 'none' as any,
      ':focus': {
        borderColor: theme.colors.primary[600],
        borderWidth: '2px' as any,
        boxShadow: `0 0 0 3px ${theme.colors.primary[100]}` as any,
      } as any,
    }),
  },
  button: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.lg,
    borderRadius: Platform.OS === 'web' ? 12 : theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        backgroundColor: theme.colors.primary[700],
        transform: 'translateY(-1px)' as any,
        boxShadow: '0 4px 12px rgba(139, 57, 82, 0.3)' as any,
      } as any,
      ':active': {
        transform: 'translateY(0px)' as any,
      } as any,
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...theme.typography.styles.button,
    color: theme.colors.neutral[50],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5f7', // Light burgundy background
    borderWidth: 1,
    borderColor: '#ead1d9', // Light burgundy border
    borderRadius: Platform.OS === 'web' ? 12 : theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(139, 57, 82, 0.15)' as any,
    }),
  },
  errorIcon: {
    marginRight: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.error,
    flex: 1,
    fontWeight: '500' as any,
  },
  errorClose: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginLeft: theme.spacing.sm,
  },
  toggleButton: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      transition: 'opacity 0.2s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        opacity: 0.7,
      } as any,
    }),
  },
  toggleText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[600],
    ...(Platform.OS === 'web' && {
      transition: 'color 0.2s ease' as any,
    }),
  },
});
