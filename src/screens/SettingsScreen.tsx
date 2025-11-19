import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { theme } from '../theme';

export function SettingsScreen() {
  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              const { error } = await supabase.auth.signOut();
              if (error) {
                throw error;
              }
              // Navigation will automatically redirect to Auth screen
              // when session changes (handled in App.js)
            } catch (error: any) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, styles.logoutButton]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.error[600]} />
              <Text style={[styles.settingItemText, styles.logoutText]}>Log Out</Text>
            </View>
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={theme.colors.error[600]} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="wine-outline" size={24} color={theme.colors.primary[600]} />
              <View>
                <Text style={styles.settingItemText}>Wine Scanner</Text>
                <Text style={styles.settingItemSubtext}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.styles.cardTitle,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
  },
  settingItemSubtext: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.md,
    marginTop: 2,
  },
  logoutButton: {
    borderColor: theme.colors.error[200],
  },
  logoutText: {
    color: theme.colors.error[600],
    fontWeight: '600',
  },
});

