import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import type { Wine, RankingCategory } from '../types';
import { rankWines, formatPrice, formatMarkup, getMarkupColor } from '../utils/wineRanking';
import { WineCard } from '../components/WineCard';

export function ResultsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { wines } = route.params as { wines: Wine[] };

  const [selectedCategory, setSelectedCategory] = useState<RankingCategory>('highestRated');

  const rankings = rankWines(wines);

  const categories: { key: RankingCategory; label: string }[] = [
    { key: 'highestRated', label: 'Highest Rated' },
    { key: 'bestValue', label: 'Best Value' },
    { key: 'mostInexpensive', label: 'Most Inexpensive' },
  ];

  const displayedWines = rankings[selectedCategory];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wine List Analysis</Text>
        <Text style={styles.subtitle}>{wines.length} wines scanned</Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabs}>
        {categories.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              selectedCategory === key && styles.tabActive,
            ]}
            onPress={() => setSelectedCategory(key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === key && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Wine List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {displayedWines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {selectedCategory === 'highestRated'
                ? 'No wines with critic scores found'
                : selectedCategory === 'bestValue'
                ? 'Not enough data to calculate value scores'
                : 'No wines found'}
            </Text>
          </View>
        ) : (
          displayedWines.map((wine, index) => (
            <WineCard
              key={index}
              wine={wine}
              rank={index + 1}
              category={selectedCategory}
            />
          ))
        )}
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
  },
  title: {
    ...theme.typography.styles.pageTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.gold[500],
  },
  tabText: {
    ...theme.typography.styles.label,
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  tabTextActive: {
    color: theme.colors.gold[600],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  emptyState: {
    paddingVertical: theme.spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
