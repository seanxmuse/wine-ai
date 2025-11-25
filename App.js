import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_800ExtraBold,
} from '@expo-google-fonts/playfair-display';
import {
  CrimsonPro_200ExtraLight,
  CrimsonPro_400Regular,
  CrimsonPro_500Medium,
  CrimsonPro_600SemiBold,
  CrimsonPro_700Bold,
} from '@expo-google-fonts/crimson-pro';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
// Use real Supabase backend
import { supabase } from './src/services/supabase';
import { theme } from './src/theme';

// Screens
import { AuthScreen } from './src/screens/AuthScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ChatHistoryScreen } from './src/screens/ChatHistoryScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ActiveConversationProvider } from './src/contexts/ActiveConversationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Load fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          PlayfairDisplay_400Regular,
          PlayfairDisplay_800ExtraBold,
          CrimsonPro_200ExtraLight,
          CrimsonPro_400Regular,
          CrimsonPro_500Medium,
          CrimsonPro_600SemiBold,
          CrimsonPro_700Bold,
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail
      }
    }
    loadFonts();
  }, []);

  // Check onboarding status
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        setOnboardingCompleted(completed === 'true');
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    }
    checkOnboarding();
  }, []);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      // Only reset onboarding on SIGNED_UP event (new account creation)
      if (_event === 'SIGNED_UP') {
        await AsyncStorage.removeItem('onboarding_completed');
        setOnboardingCompleted(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    setOnboardingCompleted(true);
  };

  if (!fontsLoaded || loading || checkingOnboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.gold[500]} />
      </View>
    );
  }

  // Show onboarding if not completed and user is authenticated
  if (session && !onboardingCompleted) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  const AppContent = () => {
    // Set document title for PWA (web only)
    useEffect(() => {
      if (Platform.OS === 'web') {
        document.title = 'Wine Scanner';
      }
    }, []);

    return (
      <ActiveConversationProvider>
        <NavigationContainer
          documentTitle={{
            enabled: false, // Disable automatic title updates from screen names
          }}
        >
          <StatusBar hidden={Platform.OS === 'ios'} style={Platform.OS === 'ios' ? 'light' : 'dark'} />
          <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'web' ? 'none' : 'default',
            title: 'Wine Scanner', // Set default title for all screens
            contentStyle: {
              backgroundColor: theme.colors.background,
              ...(Platform.OS === 'web' ? {
                position: 'relative',
                zIndex: 1,
                width: '100%',
                height: '100%',
                // Smooth transitions handled by CSS
              } : {}),
            },
          }}
        >
          {!session ? (
            <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Wine Scanner' }} />
          ) : (
            <>
              <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'Wine Scanner' }} />
              <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Wine Scanner' }} />
              <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Wine Scanner' }} />
              <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} options={{ title: 'Wine Scanner' }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Wine Scanner' }} />
            </>
          )}
        </Stack.Navigator>
        </NavigationContainer>
      </ActiveConversationProvider>
    );
  };

  return (
    <SafeAreaProvider>
      {Platform.OS === 'web' ? (
        <View style={styles.webWrapper}>
          <AppContent />
        </View>
      ) : (
        <AppContent />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      width: '100%',
      height: '100%',
    } : {}),
  },
  webWrapper: {
    flex: 1,
    ...(Platform.OS === 'web' ? {
      width: '100%',
      height: '100vh',
      position: 'relative',
      zIndex: 1,
      overflow: 'hidden',
    } : {}),
  },
});
