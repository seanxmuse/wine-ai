import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../theme';
import type { Wine } from '../types';
import { formatPrice, formatMarkup, getMarkupColor } from '../utils/wineRanking';

interface NewWineCardProps {
  wine: Wine;
  rank: number;
}

export function NewWineCard({ wine, rank }: NewWineCardProps) {
  const markupColor = wine.markup ? getMarkupColor(wine.markup) : theme.colors.text.tertiary;

  return (
    <View style={styles.card}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.wineName}>{wine.displayName}</Text>

        <View style={styles.detailsContainer}>
          {wine.vintage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Vintage: {wine.vintage}</Text>
            </View>
          )}
          {wine.varietal && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Varietal: {wine.varietal}</Text>
            </View>
          )}
          {wine.region && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Region: {wine.region}</Text>
            </View>
          )}
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Restaurant Price</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{formatPrice(wine.restaurantPrice)}</Text>
            </View>
          </View>
          {wine.realPrice && (
            <View style={styles.row}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Market Price</Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={[styles.value, styles.strikethrough]}>{formatPrice(wine.realPrice)}</Text>
              </View>
            </View>
          )}
          {wine.markup !== undefined && (
            <View style={styles.row}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Markup</Text>
              </View>
              <View style={styles.markupBadgeContainer}>
                <View style={[styles.markupBadge, { backgroundColor: markupColor }]}>
                  <Text style={styles.markupText}>{formatMarkup(wine.markup)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Critic Score */}
        {wine.criticScore && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>Critic Score</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{wine.criticScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
            </View>
            {wine.criticCount ? (
              <View style={styles.row}>
                <Text style={styles.label}>Source</Text>
                <Text style={styles.value}>
                  Avg score of {wine.criticScore} across {wine.criticCount} {wine.criticCount === 1 ? 'Critic' : 'Critics and Enthusiasts'}
                </Text>
              </View>
            ) : wine.critic && (
              <View style={styles.row}>
                <Text style={styles.label}>Critic</Text>
                <Text style={styles.value}>{wine.critic}</Text>
              </View>
            )}
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
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  rankBadge: {
    width: 60,
    backgroundColor: theme.colors.gold[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    ...theme.typography.styles.sectionTitle,
    color: 'white',
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  wineName: {
    ...theme.typography.styles.cardTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
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
  section: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  labelContainer: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? 20 : undefined,
  },
  label: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    lineHeight: Platform.OS === 'web' ? 16 : theme.typography.styles.caption.lineHeight * 14,
  },
  valueContainer: {
    alignItems: 'flex-end',
    minHeight: Platform.OS === 'web' ? 24 : undefined,
  },
  value: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    textAlign: 'right',
    lineHeight: Platform.OS === 'web' ? 22 : theme.typography.styles.body.lineHeight * 18,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
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
    color: 'white',
    ...theme.typography.styles.label,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.gold[600],
    fontSize: 24,
  },
  scoreMax: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.tertiary,
    marginLeft: 2,
  },
});
