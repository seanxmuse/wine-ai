import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import type { Wine, RankingCategory } from '../types';
import { rankWines, formatPrice, formatMarkup, getMarkupColor } from '../utils/wineRanking';
import { WineCard } from '../components/WineCard';
import { SAMPLE_WINES } from '../utils/sampleData';

export function ResultsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { wines: routeWines } = route.params as { wines: Wine[] };

  // Debug mode toggle - use sample data instead of API data
  const [debugMode, setDebugMode] = useState(false);
  const wines = debugMode ? SAMPLE_WINES : routeWines;

  const [selectedCategory, setSelectedCategory] = useState<RankingCategory>('highestRated');

  const rankings = rankWines(wines);

  // Get top 3 wines from each category for summary
  const summaryWines = {
    highestRated: rankings.highestRated.slice(0, 3),
    bestValue: rankings.bestValue.slice(0, 3),
    mostInexpensive: rankings.mostInexpensive.slice(0, 3),
  };

  const categories: { key: RankingCategory; label: string; description: string }[] = [
    { 
      key: 'highestRated', 
      label: 'Highest Rated',
      description: 'Wines with the highest critic scores for exceptional quality'
    },
    { 
      key: 'bestValue', 
      label: 'Best Value',
      description: 'Best balance of quality, price, and reasonable markup'
    },
    { 
      key: 'mostInexpensive', 
      label: 'Most Inexpensive',
      description: 'Most affordable options on the list'
    },
  ];

  const displayedWines = rankings[selectedCategory];
  const currentCategory = categories.find(c => c.key === selectedCategory);

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

        {/* Debug Mode Toggle */}
        <View style={styles.debugToggle}>
          <Text style={styles.debugLabel}>Debug Mode (Sample Data)</Text>
          <Switch
            value={debugMode}
            onValueChange={setDebugMode}
            trackColor={{ false: theme.colors.neutral[300], true: theme.colors.gold[500] }}
            thumbColor={debugMode ? theme.colors.gold[700] : theme.colors.neutral[50]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Section - Best Picks */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>✨ Best Picks</Text>
          <Text style={styles.summaryDescription}>
            Our top recommendations based on quality, value, and price
          </Text>

          {/* Highest Rated Summary */}
          {summaryWines.highestRated.length > 0 && (
            <View style={styles.summaryCategory}>
              <View style={styles.summaryCategoryHeader}>
                <Text style={styles.summaryCategoryTitle}>🏆 Highest Rated</Text>
                <Text style={styles.summaryCategoryReason}>
                  Exceptional critic scores for premium quality
                </Text>
              </View>
              {summaryWines.highestRated.map((wine, index) => (
                <WineCard
                  key={`highest-${index}`}
                  wine={wine}
                  rank={index + 1}
                  category="highestRated"
                />
              ))}
            </View>
          )}

          {/* Best Value Summary */}
          {summaryWines.bestValue.length > 0 && (
            <View style={styles.summaryCategory}>
              <View style={styles.summaryCategoryHeader}>
                <Text style={styles.summaryCategoryTitle}>💎 Best Value</Text>
                <Text style={styles.summaryCategoryReason}>
                  Great quality at reasonable prices with fair markup
                </Text>
              </View>
              {summaryWines.bestValue.map((wine, index) => (
                <WineCard
                  key={`value-${index}`}
                  wine={wine}
                  rank={index + 1}
                  category="bestValue"
                />
              ))}
            </View>
          )}

          {/* Most Inexpensive Summary */}
          {summaryWines.mostInexpensive.length > 0 && (
            <View style={styles.summaryCategory}>
              <View style={styles.summaryCategoryHeader}>
                <Text style={styles.summaryCategoryTitle}>💰 Most Inexpensive</Text>
                <Text style={styles.summaryCategoryReason}>
                  Budget-friendly options without compromising too much
                </Text>
              </View>
              {summaryWines.mostInexpensive.map((wine, index) => (
                <WineCard
                  key={`inexpensive-${index}`}
                  wine={wine}
                  rank={index + 1}
                  category="mostInexpensive"
                />
              ))}
            </View>
          )}
        </View>

        {/* All Wines Section */}
        <View style={styles.allWinesSection}>
          <Text style={styles.allWinesTitle}>All Wines</Text>
          <Text style={styles.allWinesDescription}>
            Browse all {wines.length} wines by category
          </Text>

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

          {/* Category Description */}
          {currentCategory && (
            <Text style={styles.categoryDescription}>
              {currentCategory.description}
            </Text>
          )}

          {/* Wine List */}
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
                key={`${selectedCategory}-${index}`}
                wine={wine}
                rank={index + 1}
                category={selectedCategory}
              />
            ))
          )}
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
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  debugLabel: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
  },
  summarySection: {
    marginBottom: theme.spacing['3xl'],
  },
  summaryTitle: {
    ...theme.typography.styles.pageTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontSize: Platform.OS === 'web' ? 32 : theme.typography.sizes['2xl'],
  },
  summaryDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    lineHeight: Platform.OS === 'web' ? 24 : 20,
  },
  summaryCategory: {
    marginBottom: theme.spacing.xl,
  },
  summaryCategoryHeader: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.gold[200],
  },
  summaryCategoryTitle: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    fontSize: Platform.OS === 'web' ? 24 : theme.typography.sizes.xl,
  },
  summaryCategoryReason: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  allWinesSection: {
    marginTop: theme.spacing['2xl'],
    paddingTop: theme.spacing['2xl'],
    borderTopWidth: 2,
    borderTopColor: theme.colors.divider,
  },
  allWinesTitle: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontSize: Platform.OS === 'web' ? 28 : theme.typography.sizes.xl,
  },
  allWinesDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' as any,
    }),
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
    }),
  },
  tabActive: {
    backgroundColor: theme.colors.gold[500],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(212, 175, 55, 0.3)' as any,
    }),
  },
  tabText: {
    ...theme.typography.styles.label,
    color: theme.colors.text.secondary,
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: '500' as any,
  },
  tabTextActive: {
    color: theme.colors.neutral[50],
    fontWeight: '600' as any,
  },
  categoryDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
    paddingLeft: theme.spacing.sm,
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
