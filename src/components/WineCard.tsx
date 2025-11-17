import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../theme';
import type { Wine, RankingCategory } from '../types';
import { formatPrice, formatMarkup, getMarkupColor } from '../utils/wineRanking';

interface WineCardProps {
  wine: Wine;
  rank: number;
  category: RankingCategory;
}

export function WineCard({ wine, rank, category }: WineCardProps) {
  const markupColor = wine.markup ? getMarkupColor(wine.markup) : theme.colors.text.tertiary;

  return (
    <View style={styles.card}>
      {/* Rank Badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      {/* Wine Info */}
      <View style={styles.content}>
        <Text style={styles.wineName}>
          {wine.displayName}
        </Text>

        {wine.vintage && (
          <Text style={styles.vintage}>{wine.vintage}</Text>
        )}

        {wine.varietal && (
          <Text style={styles.detail}>{wine.varietal}</Text>
        )}

        {wine.region && (
          <Text style={styles.detail}>{wine.region}</Text>
        )}

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Restaurant Price</Text>
            <Text style={styles.restaurantPrice}>
              {formatPrice(wine.restaurantPrice)}
            </Text>
          </View>

          {wine.realPrice ? (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Market Price</Text>
                <Text style={styles.realPrice}>
                  {formatPrice(wine.realPrice)}
                </Text>
              </View>

              {wine.markup !== undefined && (
                <View style={styles.markupRow}>
                  <Text style={styles.priceLabel}>Markup</Text>
                  <View style={[styles.markupBadge, { backgroundColor: markupColor }]}>
                    <Text style={styles.markupText}>
                      {formatMarkup(wine.markup)}
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noDataRow}>
              <Text style={styles.noDataText}>Market price data not available</Text>
            </View>
          )}
        </View>

        {/* Critic Score */}
        {wine.criticScore ? (
          <View style={styles.scoreSection}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreValue}>{wine.criticScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            {wine.critic && (
              <Text style={styles.criticName}>{wine.critic}</Text>
            )}
          </View>
        ) : (
          <View style={styles.noScoreSection}>
            <Text style={styles.noDataText}>Critic score not available</Text>
          </View>
        )}

        {/* Category-specific highlights */}
        {category === 'bestValue' && wine.criticScore && wine.markup !== undefined && (
          <View style={styles.valueHighlight}>
            <Text style={styles.valueText}>
              Score: {wine.criticScore} • Markup: {formatMarkup(wine.markup)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  rankBadge: {
    width: 60,
    backgroundColor: theme.colors.gold[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.neutral[50],
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  wineName: {
    fontSize: 20,
    lineHeight: 1.4,
    letterSpacing: 0,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: Platform.OS === 'web'
      ? 'Georgia, "Times New Roman", serif' as any
      : theme.typography.fonts.displayLight,
    ...(Platform.OS === 'web' && {
      wordWrap: 'break-word' as any,
      overflowWrap: 'break-word' as any,
    }),
  },
  vintage: {
    ...theme.typography.styles.bodyMedium,
    color: theme.colors.text.accent,
    marginBottom: theme.spacing.sm,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif' as any,
    }),
  },
  detail: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif' as any,
    }),
  },
  pricingSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  priceLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    fontSize: 11,
    marginBottom: 4,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif' as any,
    }),
  },
  restaurantPrice: {
    ...theme.typography.styles.bodyLarge,
    fontFamily: theme.typography.fonts.bodySemibold,
    color: theme.colors.text.primary,
  },
  realPrice: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  markupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  markupBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  markupText: {
    ...theme.typography.styles.label,
    color: theme.colors.neutral[50],
    fontSize: 12,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: theme.spacing.md,
  },
  scoreValue: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.gold[600],
    fontSize: 28,
  },
  scoreMax: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
  },
  criticName: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  valueHighlight: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gold[50],
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.gold[500],
  },
  valueText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.gold[800],
    fontFamily: theme.typography.fonts.bodyMedium,
  },
  noDataRow: {
    marginTop: theme.spacing.sm,
  },
  noDataText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  noScoreSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
});
