import React from 'react';
import { View, Text, StyleSheet, Image, Platform, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { theme, rf, rs } from '../theme';
import { ChatWineCard } from './ChatWineCard';
import type { Wine, ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
  onWinePress?: (wine: Wine) => void;
}

export function ChatBubble({ message, onWinePress }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const hasWines = message.wines && message.wines.length > 0;
  const hasContent = message.content && message.content.trim().length > 0;
  const hasImage = !!message.imageUrl;
  
  // Show image in bubble for:
  // - User messages (when they upload)
  // - Assistant messages that have wine results (analysis results)
  const shouldShowImage = hasImage && (isUser || hasWines);

  // Don't render empty assistant messages (no content, no wines, no image)
  if (!isUser && !hasContent && !hasWines && !hasImage) {
    console.warn('[ChatBubble] Skipping empty assistant message:', message.id);
    return null;
  }

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      {/* Avatar for Assistant */}
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="wine" size={20} color={theme.colors.gold[600]} />
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble
      ]}>
        {/* Image Attachment - show for user messages and assistant wine analysis */}
        {shouldShowImage && (
          <Image 
            source={{ uri: message.imageUrl }} 
            style={styles.messageImage} 
            resizeMode="cover" 
          />
        )}

        {/* Text Content */}
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <View>
            {/* Wine Cards embedded in Assistant Message */}
            {hasWines && message.wines!.map((wine, index) => (
              <ChatWineCard
                key={`wine-${index}`}
                wine={wine}
                onPress={() => onWinePress && onWinePress(wine)}
              />
            ))}
            
            <Markdown
              style={{
                body: {
                  color: '#1c1915', // theme.colors.text.primary
                  fontSize: rf(16),
                  lineHeight: rf(24), // relaxed line height
                  fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
                },
                heading2: {
                  color: '#1c1915',
                  fontSize: rf(20),
                  fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
                  marginTop: rs(12),
                  marginBottom: rs(8),
                },
                bullet_list: {
                  marginTop: rs(8),
                  marginBottom: rs(8),
                },
                paragraph: {
                  marginBottom: rs(12),
                },
              }}
            >
              {message.content}
            </Markdown>
          </View>
        )}
        
        {/* Timestamp (mocked for now as it's not in ChatMessage type explicitly formatted) */}
        <Text style={[
          styles.timestamp, 
          isUser ? styles.userTimestamp : styles.assistantTimestamp
        ]}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: rs(16),
    width: '100%',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: '#faf8f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(8),
    marginTop: rs(4),
  },
  bubble: {
    maxWidth: '80%',
    padding: rs(16),
    paddingVertical: rs(16),
    paddingHorizontal: rs(20),
    borderRadius: rs(20),
  },
  userBubble: {
    backgroundColor: '#d4af37', // Gold fallback since no linear-gradient
    borderBottomRightRadius: rs(4),
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)' as any,
    }),
  },
  assistantBubble: {
    backgroundColor: '#faf8f4',
    borderWidth: 1,
    borderColor: '#e8e3d8',
    borderBottomLeftRadius: rs(4),
  },
  userText: {
    color: '#1c1915',
    fontSize: rf(16),
    lineHeight: rf(24),
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
  },
  messageImage: {
    width: '100%',
    height: rs(150),
    borderRadius: rs(8),
    marginBottom: rs(12),
  },
  timestamp: {
    fontSize: rf(11),
    marginTop: rs(4),
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
    fontWeight: '200' as any,
  },
  userTimestamp: {
    color: 'rgba(28, 25, 21, 0.6)', // semi-transparent dark
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: '#a39883',
    textAlign: 'left',
  },
});

