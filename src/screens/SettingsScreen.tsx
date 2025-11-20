import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { theme } from '../theme';

export function SettingsScreen() {
  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('Wine Lover');
  const [scansCount, setScansCount] = useState<number>(0);
  const [moneySaved, setMoneySaved] = useState<number>(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || 'demo@winescanner.com');
        
        // Load scan count
        const { count } = await supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);
        
        if (count !== null) {
          setScansCount(count);
        }

        // Calculate money saved (placeholder - would need actual calculation)
        setMoneySaved(1250);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

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

  const handleHelpSupport = () => {
    Linking.openURL('mailto:seanxmuse@gmail.com');
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
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={theme.colors.gold[500]} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="pencil" size={24} color={theme.colors.gold[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="wine-outline" size={24} color={theme.colors.text.primary} style={{ marginRight: 16 }} />
              <View>
                <Text style={styles.settingItemText}>Wine Scanner</Text>
                <Text style={styles.settingItemSubtext}>Version 1.0.0</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
            <View style={styles.settingItemContent}>
              <Ionicons name="help-circle-outline" size={24} color={theme.colors.text.primary} style={{ marginRight: 16 }} />
              <Text style={styles.settingItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a39883" />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, styles.logoutButton]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.error[600]} style={{ marginRight: 16 }} />
              <Text style={[styles.settingItemText, styles.logoutText]}>Log Out</Text>
            </View>
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={theme.colors.error[600]} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#a39883" />
            )}
          </TouchableOpacity>
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
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
    fontSize: 24,
    fontWeight: '400' as any,
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
    fontSize: 14,
    fontWeight: '600' as any,
    color: '#5a5045',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#faf8f4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e3d8',
    ...theme.shadows.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fffef5',
    borderWidth: 2,
    borderColor: '#fff4c2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
    fontSize: 24,
    fontWeight: '400' as any,
    color: '#1c1915',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 18,
    color: '#5a5045',
  },
  editIcon: {
    fontSize: 24,
    color: '#d4af37',
  },
  statsCard: {
    flexDirection: 'row',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#faf8f4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e3d8',
    ...theme.shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_800ExtraBold' : 'serif',
    fontSize: 36,
    fontWeight: '800' as any,
    color: '#b8942f',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '200' as any,
    color: '#5a5045',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e8e3d8',
    marginHorizontal: 24,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  toggle: {
    width: 51,
    height: 31,
    backgroundColor: '#e8e3d8',
    borderRadius: 16,
    position: 'relative',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer' as any,
    }),
  },
  toggleActive: {
    backgroundColor: '#fff4c2',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    backgroundColor: '#faf8f4',
    borderRadius: 14,
    position: 'absolute',
    top: 2,
    left: 2,
    ...theme.shadows.sm,
  },
  chevron: {
    fontSize: 20,
    color: '#a39883',
  },
  logoutIcon: {
    fontSize: 24,
    color: '#8b3952',
    marginRight: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#faf8f4',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e3d8',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    fontSize: 18,
    color: '#1c1915',
  },
  settingItemSubtext: {
    fontSize: 14,
    color: '#5a5045',
    fontWeight: '200' as any,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#faf5f7',
    borderColor: '#ead1d9',
  },
  logoutText: {
    color: '#8b3952',
    fontWeight: '600' as any,
  },
});

