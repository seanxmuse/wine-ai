import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { Wine, RankingCategory } from '../types';
import { rankWines, formatPrice, formatMarkup, getMarkupColor } from '../utils/wineRanking';
import { WineCard } from '../components/WineCard';

export function ResultsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { wines, imageUrl, scanId } = route.params as { wines: Wine[]; imageUrl?: string; scanId?: string };

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
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatIconButton}
            onPress={() => (navigation as any).navigate('ChatHistory')}
          >
            <Ionicons name="chatbubbles" size={24} color={theme.colors.primary[600]} />
          </TouchableOpacity>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Wine List Analysis</Text>
        </View>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>{wines.length} wines scanned</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Section - Best Picks */}
        <View style={styles.summarySection}>
          <View style={styles.summaryTitleContainer}>
            <Text style={styles.summaryTitle}>✨ Best Picks</Text>
          </View>
          <View style={styles.summaryDescriptionContainer}>
            <Text style={styles.summaryDescription}>
              Our top recommendations based on quality, value, and price
            </Text>
          </View>

          {/* Highest Rated Summary */}
          {summaryWines.highestRated.length > 0 && (
            <View style={styles.summaryCategory}>
              <View style={styles.summaryCategoryHeader}>
                <View style={styles.summaryCategoryTitleContainer}>
                  <Text style={styles.summaryCategoryTitle}>🏆 Highest Rated</Text>
                </View>
                <View style={styles.summaryCategoryReasonContainer}>
                  <Text style={styles.summaryCategoryReason}>
                    Exceptional critic scores for premium quality
                  </Text>
                </View>
              </View>
              {summaryWines.highestRated.map((wine, index) => (
                <WineCard
                  key={`highest-${index}`}
                  wine={wine}
                  rank={index + 1}
                  category="highestRated"
                  imageUrl={imageUrl}
                  scanId={scanId}
                />
              ))}
            </View>
          )}

          {/* Best Value Summary */}
          {summaryWines.bestValue.length > 0 && (
            <View style={styles.summaryCategory}>
              <View style={styles.summaryCategoryHeader}>
                <View style={styles.summaryCategoryTitleContainer}>
                  <Text style={styles.summaryCategoryTitle}>💎 Best Value</Text>
                </View>
                <View style={styles.summaryCategoryReasonContainer}>
                  <Text style={styles.summaryCategoryReason}>
                    Great quality at reasonable prices with fair markup
                  </Text>
                </View>
              </View>
              {summaryWines.bestValue.map((wine, index) => (
                <WineCard
                  key={`value-${index}`}
                  wine={wine}
                  rank={index + 1}
                  category="bestValue"
                  imageUrl={imageUrl}
                  scanId={scanId}
                />
              ))}
            </View>
          )}

          {/* Most Inexpensive Summary */}
          {summaryWines.mostInexpensive.length > 0 && (
            <View style={styles.summaryCategory}>
              <View style={styles.summaryCategoryHeader}>
                <View style={styles.summaryCategoryTitleContainer}>
                  <Text style={styles.summaryCategoryTitle}>💰 Most Inexpensive</Text>
                </View>
                <View style={styles.summaryCategoryReasonContainer}>
                  <Text style={styles.summaryCategoryReason}>
                    Budget-friendly options without compromising too much
                  </Text>
                </View>
              </View>
              {summaryWines.mostInexpensive.map((wine, index) => (
                <WineCard
                  key={`inexpensive-${index}`}
                  wine={wine}
                  rank={index + 1}
                  category="mostInexpensive"
                  imageUrl={imageUrl}
                  scanId={scanId}
                />
              ))}
            </View>
          )}
        </View>

        {/* All Wines Section */}
        <View style={styles.allWinesSection}>
          <View style={styles.allWinesTitleContainer}>
            <Text style={styles.allWinesTitle}>All Wines</Text>
          </View>
          <View style={styles.allWinesDescriptionContainer}>
            <Text style={styles.allWinesDescription}>
              Browse all {wines.length} wines by category
            </Text>
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

          {/* Category Description */}
          {currentCategory && (
            <View style={styles.categoryDescriptionContainer}>
              <Text style={styles.categoryDescription}>
                {currentCategory.description}
              </Text>
            </View>
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
                imageUrl={imageUrl}
                scanId={scanId}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  backButton: {
    flex: 1,
  },
  chatIconButton: {
    padding: theme.spacing.xs,
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
  summarySection: {
    marginBottom: theme.spacing['3xl'],
  },
  summaryTitleContainer: {
    marginBottom: Platform.OS === 'web' ? 8 : theme.spacing.sm,
    minHeight: Platform.OS === 'web' ? 40 : undefined,
  },
  summaryTitle: {
    ...theme.typography.styles.pageTitle,
    color: theme.colors.text.primary,
    fontSize: Platform.OS === 'web' ? 32 : theme.typography.sizes['2xl'],
    lineHeight: Platform.OS === 'web' ? 38 : theme.typography.styles.pageTitle.lineHeight * 32,
  },
  summaryDescriptionContainer: {
    marginBottom: theme.spacing.xl,
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  summaryDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: Platform.OS === 'web' ? 24 : theme.typography.styles.body.lineHeight * 18,
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
  summaryCategoryTitleContainer: {
    marginBottom: Platform.OS === 'web' ? 4 : theme.spacing.xs,
    minHeight: Platform.OS === 'web' ? 30 : undefined,
  },
  summaryCategoryTitle: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.text.primary,
    fontSize: Platform.OS === 'web' ? 24 : theme.typography.sizes.xl,
    lineHeight: Platform.OS === 'web' ? 28 : theme.typography.styles.sectionTitle.lineHeight * 24,
  },
  summaryCategoryReasonContainer: {
    minHeight: Platform.OS === 'web' ? 20 : undefined,
  },
  summaryCategoryReason: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: Platform.OS === 'web' ? 20 : theme.typography.styles.bodySmall.lineHeight * 14,
  },
  allWinesSection: {
    marginTop: theme.spacing['2xl'],
    paddingTop: theme.spacing['2xl'],
    borderTopWidth: 2,
    borderTopColor: theme.colors.divider,
  },
  allWinesTitleContainer: {
    marginBottom: Platform.OS === 'web' ? 8 : theme.spacing.sm,
    minHeight: Platform.OS === 'web' ? 34 : undefined,
  },
  allWinesTitle: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.text.primary,
    fontSize: Platform.OS === 'web' ? 28 : theme.typography.sizes.xl,
    lineHeight: Platform.OS === 'web' ? 32 : theme.typography.styles.sectionTitle.lineHeight * 28,
  },
  allWinesDescriptionContainer: {
    marginBottom: theme.spacing.lg,
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  allWinesDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    lineHeight: Platform.OS === 'web' ? 24 : theme.typography.styles.body.lineHeight * 18,
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
  categoryDescriptionContainer: {
    marginBottom: theme.spacing.lg,
    minHeight: Platform.OS === 'web' ? 20 : undefined,
    paddingLeft: theme.spacing.sm,
  },
  categoryDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: Platform.OS === 'web' ? 20 : theme.typography.styles.bodySmall.lineHeight * 14,
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
