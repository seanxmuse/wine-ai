import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { ChatConversation } from '../types';
import { getChatConversations, deleteChatConversation } from '../services/chat';

export function ChatHistoryScreen() {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const convs = await getChatConversations();
      setConversations(convs);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      const errorMessage = error.message?.includes('network') || error.message?.includes('fetch')
        ? 'Network error. Please check your internet connection and try again.'
        : 'Failed to load conversations. Please try again.';
      Alert.alert('Error', errorMessage);
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
      setDeletingIds(prev => new Set(prev).add(conversationId));
      await deleteChatConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      const errorMessage = error.message?.includes('network') || error.message?.includes('fetch')
        ? 'Network error. Please check your internet connection and try again.'
        : 'Failed to delete conversation. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(conversationId);
        return next;
      });
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
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => (navigation as any).navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createChatButton}
            onPress={() => (navigation as any).navigate('Chat', {})}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary[600]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="camera-outline"
            size={24}
            color={theme.colors.text.secondary}
          />
          <Text style={styles.tabLabel}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabActive]}
        >
          <Ionicons
            name="chatbubbles"
            size={24}
            color={theme.colors.primary[600]}
          />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Chat</Text>
        </TouchableOpacity>
      </View>

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
                  <Text style={styles.conversationTitle} numberOfLines={1}>
                    {conversation.title}
                  </Text>
                </View>
                <Text style={styles.conversationDate}>
                  {new Date(conversation.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteConversation(conversation.id)}
                disabled={deletingIds.has(conversation.id)}
              >
                {deletingIds.has(conversation.id) ? (
                  <ActivityIndicator size="small" color={theme.colors.primary[600]} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color={theme.colors.text.tertiary} />
                )}
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
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.styles.pageTitle,
    color: theme.colors.text.primary,
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.styles.bodyLarge,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 28 : theme.typography.styles.bodyLarge.lineHeight * 24,
  },
  emptySubtext: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 22 : theme.typography.styles.bodySmall.lineHeight * 18,
    paddingHorizontal: theme.spacing.md,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.xs,
  },
  conversationIcon: {
    marginRight: theme.spacing.sm,
  },
  conversationTitle: {
    ...theme.typography.styles.bodyLarge,
    color: theme.colors.text.primary,
    flex: 1,
  },
  conversationDate: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.tertiary,
    marginLeft: 28, // Align with title (icon width + margin)
  },
  deleteButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  settingsButton: {
    padding: theme.spacing.xs,
  },
  createChatButton: {
    padding: theme.spacing.xs,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.lg,
    paddingTop: theme.spacing.md,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)' as any,
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer' as any,
      transition: 'all 0.2s ease' as any,
    }),
  },
  tabActive: {
    backgroundColor: theme.colors.primary[50],
  },
  tabLabel: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontSize: 12,
  },
  tabLabelActive: {
    color: theme.colors.primary[600],
    fontFamily: theme.typography.fonts.bodyMedium,
  },
});

