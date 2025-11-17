import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import type { Wine } from '../types';
import { SAMPLE_WINES } from '../utils/sampleData';
import { NewWineCard } from '../components/NewWineCard';

export function NewResultsScreen() {
  const navigation = useNavigation();
  const wines = SAMPLE_WINES; // Using sample data directly for this new screen

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back to Camera</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>New Sample Wine List</Text>
        </View>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>A fresh start with a clean layout.</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {wines.map((wine, index) => (
          <NewWineCard
            key={`new-sample-${index}`}
            wine={wine}
            rank={index + 1}
          />
        ))}
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
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginBottom: theme.spacing.md,
  },
  backButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[600],
    lineHeight: Platform.OS === 'web' ? 24 : theme.typography.styles.body.lineHeight * 18,
  },
  titleContainer: {
    marginBottom: Platform.OS === 'web' ? 8 : theme.spacing.sm,
    minHeight: Platform.OS === 'web' ? 60 : undefined,
  },
  title: {
    ...theme.typography.styles.pageTitle,
    color: theme.colors.text.primary,
    lineHeight: Platform.OS === 'web' ? 56 : theme.typography.styles.pageTitle.lineHeight * 48,
  },
  subtitleContainer: {
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: Platform.OS === 'web' ? 24 : theme.typography.styles.body.lineHeight * 18,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
});
