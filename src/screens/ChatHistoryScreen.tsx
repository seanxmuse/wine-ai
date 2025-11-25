import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme, rf, rs } from '../theme';
import type { ChatConversation } from '../types';
import { getChatConversations, deleteChatConversation } from '../services/chat';

export function ChatHistoryScreen() {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const convs = await getChatConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationPress = (conversation: ChatConversation) => {
    // Navigate to chat screen with conversation ID
    (navigation as any).navigate('Chat', {
      conversationId: conversation.id,
      imageUrl: conversation.imageUrl,
      scanId: conversation.scanId,
    });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteChatConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => (navigation as any).navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => (navigation as any).navigate('Chat', {})}
      >
        <Ionicons name="add-circle" size={24} color={theme.colors.primary[600]} style={styles.newChatIcon} />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Upload a wine list image in chat to analyze, or start chatting about wines from the wine cards
            </Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              onPress={() => handleConversationPress(conversation)}
            >
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Ionicons
                    name="chatbubble"
                    size={20}
                    color={theme.colors.primary[600]}
                    style={styles.conversationIcon}
                  />
                  <Text style={styles.conversationTitle}>
                    {conversation.title}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteConversation(conversation.id)}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: rs(60),
    paddingHorizontal: rs(theme.spacing.lg),
    paddingBottom: rs(theme.spacing.md),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: rs(theme.spacing.md),
  },
  headerTitle: {
    ...theme.typography.styles.pageTitle,
    color: theme.colors.text.primary,
    fontSize: rf(24),
    flex: 1,
  },
  settingsButton: {
    padding: rs(theme.spacing.xs),
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: rs(theme.spacing.lg),
    marginTop: rs(theme.spacing.md),
    marginBottom: rs(theme.spacing.sm),
    padding: rs(theme.spacing.md),
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  newChatIcon: {
    marginRight: rs(theme.spacing.sm),
  },
  newChatText: {
    ...theme.typography.styles.bodyLarge,
    color: theme.colors.text.primary,
    fontSize: rf(16),
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: rs(theme.spacing.lg),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(theme.spacing['3xl']),
    paddingHorizontal: rs(theme.spacing.lg),
  },
  emptyText: {
    ...theme.typography.styles.bodyLarge,
    color: theme.colors.text.primary,
    marginTop: rs(theme.spacing.lg),
    textAlign: 'center',
    fontSize: rf(16),
    lineHeight: rf(24),
  },
  emptySubtext: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: rs(theme.spacing.md),
    textAlign: 'center',
    fontSize: rf(14),
    lineHeight: rf(20),
    paddingHorizontal: rs(theme.spacing.md),
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: rs(theme.spacing.md),
    marginBottom: rs(theme.spacing.md),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(theme.spacing.xs),
  },
  conversationIcon: {
    marginRight: rs(theme.spacing.sm),
  },
  conversationTitle: {
    ...theme.typography.styles.bodyLarge,
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: rf(16),
  },
  conversationDate: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.tertiary,
    marginLeft: rs(28), // Align with title (icon width + margin)
    fontSize: rf(12),
  },
  deleteButton: {
    padding: rs(theme.spacing.sm),
    marginLeft: rs(theme.spacing.sm),
  },
});

