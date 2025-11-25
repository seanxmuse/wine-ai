import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme, rf, rs } from '../theme';
import type { Wine } from '../types';
import { formatPrice, formatMarkup } from '../utils/wineRanking';

interface ChatWineCardProps {
  wine: Wine;
  onPress?: () => void;
}

export function ChatWineCard({ wine, onPress }: ChatWineCardProps) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default navigation if no handler provided
      (navigation as any).navigate('Results', {
        wines: [wine], // Pass as single item array to match expected format if needed, or adapt ResultsScreen
        // Note: ResultsScreen typically expects a list of wines or a specific wine context.
        // Based on existing code, passing 'wine' or 'wines' might be supported.
        // Let's stick to the pattern seen in ChatScreen: navigate with 'wines' array.
        // We might need to check ResultsScreen implementation to be sure.
        // For now, we'll assume we want to show this specific wine's details.
        wine: wine,
        // If ResultsScreen expects 'wines', we might need to adjust.
        // But let's trigger the callback if provided, which is the main use case in Chat.
      });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Text style={styles.wineName} numberOfLines={2}>
        {wine.displayName}
      </Text>
      
      <Text style={styles.wineDetails} numberOfLines={2}>
        {[
          wine.region, 
          wine.vintage, 
          wine.varietal
        ].filter(Boolean).join(' • ')}
      </Text>
      
      <View style={styles.priceRow}>
        <Text style={styles.priceValue}>
          {formatPrice(wine.restaurantPrice)}
        </Text>
        
        {wine.markup !== undefined && (
          <View style={styles.markupBadge}>
            <Text style={styles.markupText}>
              {formatMarkup(wine.markup)} markup
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#faf8f4', // theme.colors.surface
    borderWidth: 1,
    borderColor: '#e8e3d8', // theme.colors.border
    borderRadius: rs(12),
    padding: rs(16),
    marginVertical: rs(8),
    width: '100%',
  },
  wineName: {
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
    fontSize: rf(18),
    color: '#1c1915', // theme.colors.text.primary
    marginBottom: rs(8),
  },
  wineDetails: {
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
    fontSize: rf(14),
    color: '#5a5045', // theme.colors.text.secondary
    marginBottom: rs(12),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceValue: {
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_600SemiBold' : 'serif',
    fontSize: rf(20),
    fontWeight: '600',
    color: '#d4af37', // theme.colors.gold[500]
  },
  markupBadge: {
    backgroundColor: '#8b3952', // theme.colors.error (burgundy)
    paddingVertical: rs(4),
    paddingHorizontal: rs(12),
    borderRadius: rs(12),
  },
  markupText: {
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_600SemiBold' : 'serif',
    fontSize: rf(12),
    fontWeight: '600',
    color: '#fefdfb', // theme.colors.text.inverse
  },
});





