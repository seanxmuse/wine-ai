import React from 'react';
import { View, Text, StyleSheet, Image, Platform, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { ChatWineCard } from './ChatWineCard';
import type { Wine, ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
  wines?: Wine[];
  onWinePress?: (wine: Wine) => void;
}

export function ChatBubble({ message, wines, onWinePress }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const hasWines = wines && wines.length > 0;

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
        {/* Image Attachment */}
        {message.imageUrl && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: message.imageUrl }} 
              style={styles.messageImage} 
              resizeMode="contain" 
            />
          </View>
        )}

        {/* Text Content */}
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <View>
            {/* Wine Cards embedded in Assistant Message */}
            {hasWines && wines.map((wine, index) => (
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
                  fontSize: 18,
                  lineHeight: 26, // relaxed line height
                  fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
                },
                heading2: {
                  color: '#1c1915',
                  fontSize: 22,
                  fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_400Regular' : 'serif',
                  marginTop: 12,
                  marginBottom: 8,
                },
                bullet_list: {
                  marginTop: 8,
                  marginBottom: 8,
                },
                paragraph: {
                  marginBottom: 12,
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
    marginBottom: 16,
    width: '100%',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#faf8f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '80%',
    padding: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#d4af37', // Gold fallback since no linear-gradient
    borderBottomRightRadius: 4,
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)' as any,
    }),
  },
  assistantBubble: {
    backgroundColor: '#faf8f4',
    borderWidth: 1,
    borderColor: '#e8e3d8',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#1c1915',
    fontSize: 18,
    lineHeight: 1.6,
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
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

