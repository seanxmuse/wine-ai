import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { Wine, RankingCategory } from '../types';
import { formatPrice, formatMarkup, getMarkupColor } from '../utils/wineRanking';

interface WineCardProps {
  wine: Wine;
  rank: number;
  category: RankingCategory;
  imageUrl?: string;
  scanId?: string;
}

export function WineCard({ wine, rank, category, imageUrl, scanId }: WineCardProps) {
  const navigation = useNavigation();
  const markupColor = wine.markup ? getMarkupColor(wine.markup) : theme.colors.text.tertiary;
  
  // Debug logging for critic scores
  if (wine.criticScore) {
    console.log(`[WineCard] ${wine.displayName} - Displaying critic score:`, {
      criticScore: wine.criticScore,
      critic: wine.critic,
      criticCount: wine.criticCount,
    });
  } else {
    console.log(`[WineCard] ${wine.displayName} - No critic score to display`);
  }

  const handleChatPress = () => {
    (navigation as any).navigate('Chat', {
      wine,
      imageUrl,
      scanId,
      initialMessage: `Tell me more about wine ${wine.displayName}`,
    });
  };

  return (
    <View style={styles.card}>
      {/* Rank Badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      {/* Wine Info */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.wineName}>
            {wine.displayName}
          </Text>
          {wine.dataSource === 'web-search' && (
            <View style={styles.webSearchBadge}>
              <Ionicons name="search" size={12} color={theme.colors.primary[600]} />
              <Text style={styles.webSearchBadgeText}>Web</Text>
            </View>
          )}
        </View>

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

          {wine.realPrice || wine.webSearchPrice ? (
            <>
              <View style={styles.priceRow}>
                <View style={styles.priceLabelContainer}>
                  <Text style={styles.priceLabel}>
                    {wine.webSearchPrice && !wine.realPrice ? 'Est. Market Price' : 'Market Price'}
                  </Text>
                </View>
                <View style={styles.priceValueContainer}>
                  <Text style={styles.realPrice}>
                    {formatPrice(wine.realPrice || wine.webSearchPrice!)}
                  </Text>
                  {wine.webSearchPrice && !wine.realPrice && wine.webSearchSource && (
                    <Text style={styles.priceSourceText}>({wine.webSearchSource})</Text>
                  )}
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

        {/* Chat Button */}
        <View style={styles.chatSection}>
          <TouchableOpacity style={styles.chatButton} onPress={handleChatPress}>
            <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary[600]} />
            <Text style={styles.chatButtonText}>Chat about this wine</Text>
          </TouchableOpacity>
        </View>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  wineName: {
    ...theme.typography.styles.cardTitle,
    color: theme.colors.text.primary,
    lineHeight: Platform.OS === 'web' ? 1.2 : theme.typography.styles.cardTitle.lineHeight,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  webSearchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  webSearchBadgeText: {
    ...theme.typography.styles.caption,
    color: theme.colors.primary[600],
    fontSize: 10,
    fontWeight: '600',
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
  priceSourceText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    fontSize: 10,
    marginTop: 2,
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
  chatSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  chatButtonText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary[600],
    marginLeft: theme.spacing.xs,
    fontFamily: theme.typography.fonts.bodyMedium,
  },
});
