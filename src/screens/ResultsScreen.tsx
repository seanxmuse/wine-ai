import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { Wine, RankingCategory } from '../types';
import { rankWines, formatPrice, formatMarkup, getMarkupColor } from '../utils/wineRanking';
import { WineCard } from '../components/WineCard';
import { createGeneralChatConversation, addAssistantMessage } from '../services/chat';
import { formatWinesAsMarkdown } from '../utils/wineFormatting';

export function ResultsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { wines, imageUrl, scanId, wine, conversationId, assistantMessageId } = route.params as {
    wines?: Wine[];
    wine?: Wine;
    imageUrl?: string;
    scanId?: string;
    conversationId?: string;
    assistantMessageId?: string;
  };

  // Determine if we are showing a single wine detail or a list
  const singleWine = wine || (wines && wines.length === 1 ? wines[0] : null);
  const isDetailView = !!singleWine;

  // List View State
  const [selectedCategory, setSelectedCategory] = useState<RankingCategory>('highestRated');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Get active wines (all wines or single wine)
  const activeWines = wines || (singleWine ? [singleWine] : []);

  // Shared chat handler for both views
  const handleChatPress = async () => {
    if (isCreatingChat) return; // Prevent double-clicks

    try {
      setIsCreatingChat(true);
      console.log('[ResultsScreen] Chat button pressed', { conversationId, hasWines: activeWines.length });

      if (conversationId) {
        // Resume existing conversation
        console.log('[ResultsScreen] Resuming conversation:', conversationId);
        (navigation as any).navigate('Chat', {
          conversationId,
          imageUrl,
          scanId,
        });
      } else {
        // Create new conversation with wine data
        console.log('[ResultsScreen] Creating new conversation with', activeWines.length, 'wines');
        const newConversation = await createGeneralChatConversation(imageUrl, scanId);
        console.log('[ResultsScreen] Conversation created:', newConversation.id);

        // Add assistant message with wine analysis
        const markdownContent = formatWinesAsMarkdown(activeWines);
        const assistantContent = `${markdownContent}\n\nWould you like me to help you find the best value or highest rated wines?`;

        console.log('[ResultsScreen] Adding assistant message with wines');
        await addAssistantMessage(newConversation.id, assistantContent, {
          wines: activeWines,
          imageUrl
        });

        // Navigate to chat
        console.log('[ResultsScreen] Navigating to chat');
        (navigation as any).navigate('Chat', {
          conversationId: newConversation.id,
          imageUrl,
          scanId,
        });
      }
    } catch (error) {
      console.error('[ResultsScreen] Error creating chat:', error);
      Alert.alert('Error', 'Failed to create chat conversation. Please try again.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Render Detail View
  if (isDetailView && singleWine) {

    // Determine rank if possible (if coming from list context, but here likely standalone)
    // For standalone, we might not have a rank.
    const rank = 1; 

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Wine Card (Header Info) */}
            <View style={styles.detailCard}>
                <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{rank}</Text>
                </View>
                <Text style={styles.detailName}>{singleWine.displayName}</Text>
                <View style={styles.detailMeta}>
                    {singleWine.vintage && (
                        <View style={styles.metaTag}>
                            <Text style={styles.metaTagText}>{singleWine.vintage}</Text>
                        </View>
                    )}
                    {singleWine.varietal && (
                        <View style={styles.metaTag}>
                            <Text style={styles.metaTagText}>🍇 {singleWine.varietal}</Text>
                        </View>
                    )}
                    {singleWine.region && (
                        <View style={styles.metaTag}>
                            <Text style={styles.metaTagText}>📍 {singleWine.region}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Price Section */}
            <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Restaurant Price</Text>
                    <Text style={styles.restaurantPrice}>{formatPrice(singleWine.restaurantPrice)}</Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Market Price</Text>
                    <Text style={styles.marketPrice}>
                        {singleWine.realPrice ? formatPrice(singleWine.realPrice) : 'N/A'}
                    </Text>
                </View>
                {singleWine.markup !== undefined && (
                    <View style={styles.priceRowLast}>
                        <Text style={styles.priceLabel}>Markup</Text>
                        <View style={styles.markupBadge}>
                            <Text style={styles.markupText}>{formatMarkup(singleWine.markup)} {singleWine.markup > 200 ? '⚠️' : ''}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Critic Scores */}
            <View style={styles.scoresSection}>
                <Text style={styles.sectionTitle}>Critic Scores</Text>
                {singleWine.criticScore ? (
                    <>
                        {singleWine.critic && (
                             <View style={styles.scoreItem}>
                                <Text style={styles.scoreCritic}>{singleWine.critic}</Text>
                                <Text style={styles.scoreValue}>{singleWine.criticScore}</Text>
                            </View>
                        )}
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreCritic}>Average</Text>
                            <Text style={styles.scoreValue}>{singleWine.criticScore}</Text>
                        </View>
                    </>
                ) : (
                    <Text style={styles.noDataText}>No critic scores available.</Text>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleChatPress} disabled={isCreatingChat}>
                    {isCreatingChat ? (
                      <ActivityIndicator size="small" color="#8b3952" />
                    ) : (
                      <>
                        <Text style={{ fontSize: 20 }}>💬</Text>
                        <Text style={styles.actionButtonTextSecondary}>Chat</Text>
                      </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => Alert.alert('Saved', 'Wine saved to favorites!')}>
                    <Text style={{ fontSize: 20 }}>❤️</Text>
                    <Text style={styles.actionButtonTextPrimary}>Save</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
      </View>
    );
  }

  // Fallback to List View logic if not single wine
  const rankings = rankWines(activeWines);
  const displayedWines = rankings[selectedCategory];

  const categories: { key: RankingCategory; label: string }[] = [
    { key: 'highestRated', label: 'Highest Rated' },
    { key: 'bestValue', label: 'Best Value' },
    { key: 'mostInexpensive', label: 'Most Inexpensive' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1c1915" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <TouchableOpacity onPress={handleChatPress} style={styles.chatButton} disabled={isCreatingChat}>
          {isCreatingChat ? (
            <ActivityIndicator size="small" color="#1c1915" />
          ) : (
            <Ionicons name="chatbubble-outline" size={24} color="#1c1915" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.summaryTitle}>{activeWines.length} Wines Found</Text>
        
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

           {displayedWines.length > 0 ? (
             displayedWines.map((w, index) => (
               <WineCard
                 key={index}
                 wine={w}
                 rank={index + 1}
                 category={selectedCategory}
                 imageUrl={imageUrl}
                 scanId={scanId}
               />
             ))
           ) : (
             <View style={styles.emptyState}>
               <Ionicons name="wine-outline" size={64} color="#a39883" />
               <Text style={styles.emptyStateTitle}>
                 {selectedCategory === 'highestRated' ? 'No Rated Wines Found' :
                  selectedCategory === 'bestValue' ? 'Insufficient Data for Best Value' :
                  'No Wines Found'}
               </Text>
               <Text style={styles.emptyStateText}>
                 {selectedCategory === 'highestRated'
                   ? 'None of the wines on this list have critic ratings available from Wine Labs or web search. Try the "Most Inexpensive" view to see all wines by price.'
                   : selectedCategory === 'bestValue'
                   ? 'Best Value requires both critic ratings and market prices. Some wines on this list are missing this data. Try "Highest Rated" or "Most Inexpensive" instead.'
                   : 'No wines could be identified from this image. Please try scanning again with better lighting.'}
               </Text>
             </View>
           )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefdfb',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#faf8f4',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e3d8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(180deg, #faf8f4 0%, #fefdfb 100%)' as any,
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1c1915',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_600SemiBold' : 'serif',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Detail View Styles
  detailCard: {
    backgroundColor: '#faf8f4',
    borderWidth: 1,
    borderColor: '#e8e3d8',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    ...theme.shadows.md,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)' as any,
      boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' as any,
    }),
    ...theme.shadows.gold,
  },
  rankText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1915',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_700Bold' : 'serif',
  },
  detailName: {
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
    fontSize: 28,
    color: '#1c1915',
    marginBottom: 8,
    lineHeight: 36,
  },
  detailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  metaTag: {
    backgroundColor: '#fffef5',
    borderWidth: 1,
    borderColor: '#fff4c2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  metaTagText: {
    fontSize: 14,
    color: '#5a5045',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
  },
  priceSection: {
    backgroundColor: '#fffef5',
    borderWidth: 1,
    borderColor: '#fff4c2',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  priceRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#fff4c2',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#5a5045',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
  },
  restaurantPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8b3952', // Burgundy
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_600SemiBold' : 'serif',
  },
  marketPrice: {
    fontSize: 18,
    color: '#a39883',
    textDecorationLine: 'line-through',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
  },
  markupBadge: {
    backgroundColor: '#8b3952',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  markupText: {
    color: '#fefdfb',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_600SemiBold' : 'serif',
  },
  scoresSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
    fontSize: 20,
    color: '#1c1915',
    marginBottom: 16,
    fontWeight: '400' as any,
  },
  scoreItem: {
    backgroundColor: '#faf8f4',
    borderWidth: 1,
    borderColor: '#e8e3d8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreCritic: {
    fontSize: 16,
    color: '#1c1915',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#d4af37',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_700Bold' : 'serif',
  },
  noDataText: {
    color: '#a39883',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 40,
  },
  actionButtonPrimary: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#d4af37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)' as any,
      boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' as any,
      transition: 'all 0.3s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        transform: 'translateY(-2px)' as any,
      } as any,
    }),
    ...theme.shadows.gold,
  },
  actionButtonSecondary: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#faf8f4',
    borderWidth: 1,
    borderColor: '#e8e3d8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        transform: 'translateY(-2px)' as any,
      } as any,
    }),
  },
  actionButtonTextPrimary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1915',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_600SemiBold' : 'serif',
  },
  actionButtonTextSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1915',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_600SemiBold' : 'serif',
  },
  // List View Styles
  summaryTitle: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
    color: '#1c1915',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#faf8f4',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#d4af37',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5a5045',
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_500Medium' : 'serif',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#fefdfb',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    marginHorizontal: 24,
    backgroundColor: '#faf8f4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8e3d8',
    marginTop: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1c1915',
    marginTop: 16,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#5a5045',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
  },
});
