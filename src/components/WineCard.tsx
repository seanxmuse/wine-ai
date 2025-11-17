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

        <View style={styles.detailsContainer}>
          {wine.vintage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>{wine.vintage}</Text>
            </View>
          )}
          {wine.varietal && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>{wine.varietal}</Text>
            </View>
          )}
          {wine.region && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>{wine.region}</Text>
            </View>
          )}
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.priceRow}>
            <View style={styles.priceLabelContainer}>
              <Text style={styles.priceLabel}>Restaurant Price</Text>
            </View>
            <View style={styles.priceValueContainer}>
              <Text style={styles.restaurantPrice}>
                {formatPrice(wine.restaurantPrice)}
              </Text>
            </View>
          </View>

          {wine.realPrice ? (
            <>
              <View style={styles.priceRow}>
                <View style={styles.priceLabelContainer}>
                  <Text style={styles.priceLabel}>Market Price</Text>
                </View>
                <View style={styles.priceValueContainer}>
                  <Text style={styles.realPrice}>
                    {formatPrice(wine.realPrice)}
                  </Text>
                </View>
              </View>

              {wine.markup !== undefined && (
                <View style={styles.markupRow}>
                  <View style={styles.priceLabelContainer}>
                    <Text style={styles.priceLabel}>Markup</Text>
                  </View>
                  <View style={styles.markupBadgeContainer}>
                    <View style={[styles.markupBadge, { backgroundColor: markupColor }]}>
                      <Text style={styles.markupText}>
                        {formatMarkup(wine.markup)}
                      </Text>
                    </View>
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
            {wine.criticCount ? (
              <Text style={styles.criticName}>
                Avg score of {wine.criticScore} across {wine.criticCount} {wine.criticCount === 1 ? 'Critic' : 'Critics and Enthusiasts'}
              </Text>
            ) : wine.critic ? (
              <Text style={styles.criticName}>{wine.critic}</Text>
            ) : null}
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
    minWidth: 60,
    backgroundColor: theme.colors.gold[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.neutral[50],
    fontWeight: '800',
    fontSize: 32,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  wineName: {
    ...theme.typography.styles.cardTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: Platform.OS === 'web' ? 1.2 : theme.typography.styles.cardTitle.lineHeight,
  },
  detailsContainer: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    marginBottom: theme.spacing.sm,
    minHeight: Platform.OS === 'web' ? 20 : undefined,
  },
  detailText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    lineHeight: Platform.OS === 'web' ? 20 : theme.typography.styles.bodySmall.lineHeight * 14,
  },
  pricingSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  priceLabelContainer: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? 20 : undefined,
  },
  priceLabel: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    fontSize: 11,
    lineHeight: Platform.OS === 'web' ? 16 : theme.typography.styles.caption.lineHeight * 14,
  },
  priceValueContainer: {
    alignItems: 'flex-end',
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  restaurantPrice: {
    ...theme.typography.styles.bodyLarge,
    fontFamily: theme.typography.fonts.bodySemibold,
    color: theme.colors.text.primary,
    lineHeight: Platform.OS === 'web' ? 24 : theme.typography.styles.bodyLarge.lineHeight * 20,
  },
  realPrice: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
    lineHeight: Platform.OS === 'web' ? 22 : theme.typography.styles.body.lineHeight * 18,
  },
  markupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  markupBadgeContainer: {
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  markupBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  markupText: {
    ...theme.typography.styles.label,
    color: 'white',
    fontSize: 12,
  },
  scoreSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: theme.spacing.sm,
  },
  scoreValue: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.gold[600],
    fontSize: 28,
  },
  scoreMax: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.tertiary,
    marginLeft: 2,
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
