import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Markdown from 'react-native-markdown-display';
import { theme } from '../theme';
import type { Wine, ChatConversation, ChatMessage } from '../types';
import {
  createChatConversation,
  createGeneralChatConversation,
  getChatConversation,
  getChatMessages,
  sendChatMessage,
  updateChatConversation,
  uploadImageToStorage,
  generateChatTitle,
  addAssistantMessage,
} from '../services/chat';
import { useActiveConversation } from '../contexts/ActiveConversationContext';
import { formatWinesAsMarkdown } from '../utils/wineFormatting';
import { parseWineListImage } from '../services/vision';
import { matchWinesToLwin, getPriceStats, getCriticScores } from '../services/winelabs';
import { calculateMarkup } from '../utils/wineRanking';
import { supabase } from '../services/supabase';
import { Alert } from 'react-native';

export function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { wine, imageUrl, scanId, conversationId, initialMessage, winesData: initialWinesData } = route.params as {
    wine?: Wine;
    imageUrl?: string;
    scanId?: string;
    conversationId?: string;
    initialMessage?: string;
    winesData?: Record<string, Wine[]>;
  };
  const { setActiveConversationId } = useActiveConversation();

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [winesData, setWinesData] = useState<Map<string, Wine[]>>(new Map()); // Store wines by message ID
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim1 = useRef(new Animated.Value(0)).current;
  const bounceAnim2 = useRef(new Animated.Value(0)).current;
  const bounceAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeConversation();
  }, []);

  useEffect(() => {
    if (initialMessage) {
      setInputText(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    // Store initial wines data if provided via navigation params
    if (initialWinesData) {
      setWinesData(prev => {
        const newMap = new Map(prev);
        Object.entries(initialWinesData).forEach(([messageId, wines]) => {
          newMap.set(messageId, wines);
        });
        return newMap;
      });
    }
  }, [initialWinesData]);

  useEffect(() => {
    // Set active conversation when conversation loads
    if (conversation) {
      setActiveConversationId(conversation.id);
    }
    
    // Cleanup when component unmounts
    return () => {
      setActiveConversationId(null);
    };
  }, [conversation, setActiveConversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const initializeConversation = async () => {
    try {
      setIsInitializing(true);
      let conv: ChatConversation;

      if (conversationId) {
        // Load existing conversation
        conv = await getChatConversation(conversationId);
        if (!conv) {
          throw new Error('Conversation not found');
        }
        setConversation(conv);
        const existingMessages = await getChatMessages(conversationId);
        setMessages(existingMessages);
        // Note: winesData for existing messages won't be available since it's stored in memory
        // This is acceptable for MVP - "View Results" will only work for new messages
        if (conv.imageUrl) {
          setUploadedImage(conv.imageUrl);
        }
      } else {
        // Create new conversation
        if (wine) {
          conv = await createChatConversation(wine, imageUrl, scanId);
        } else {
          conv = await createGeneralChatConversation();
        }
        setConversation(conv);
        setMessages([]);
        if (imageUrl) {
          setUploadedImage(imageUrl);
        }
      }
    } catch (error: any) {
      console.error('Error initializing conversation:', error);
      const errorMessage = error.message?.includes('network') || error.message?.includes('fetch')
        ? 'Network error. Please check your internet connection and try again.'
        : error.message?.includes('not found')
        ? 'Conversation not found. It may have been deleted.'
        : 'Failed to load conversation. Please try again.';
      Alert.alert('Error', errorMessage, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleImagePick = () => {
    setShowImagePicker(true);
  };

  const handleImageOption = async (option: 'camera' | 'library') => {
    setShowImagePicker(false);
    
    try {
      let result;
      
      if (option === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setUploadedImage(imageUri);
        
        // Analyze the image
        await analyzeWineListImage(imageUri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      const errorMessage = error.message?.includes('permission')
        ? 'Camera permission denied. Please enable camera access in settings.'
        : 'Failed to pick image. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  // Animation effects
  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isAnalyzing]);

  useEffect(() => {
    if (isLoading && !isAnalyzing) {
      const createBounceAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: -8,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      createBounceAnimation(bounceAnim1, 0).start();
      createBounceAnimation(bounceAnim2, 200).start();
      createBounceAnimation(bounceAnim3, 400).start();
    }
  }, [isLoading, isAnalyzing]);

  const analyzeWineListImage = async (imageUri: string) => {
    if (!conversation) return;

    setIsAnalyzing(true);
    
    try {
      // Upload image to storage if it's a local URI
      let imageUrlToSave = imageUri;
      if (imageUri.startsWith('file://') || imageUri.startsWith('ph://')) {
        const uploadedUrl = await uploadImageToStorage(imageUri);
        if (uploadedUrl) {
          imageUrlToSave = uploadedUrl;
        }
      }

      // Save user message to database
      const { data: savedUserMessage, error: userMessageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: 'Analyze this wine list',
          image_url: imageUrlToSave,
        })
        .select()
        .single();

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
        Alert.alert('Error', 'Failed to save your message. Please try again.');
      }

      // Add user message to UI
      const userMessage: ChatMessage = {
        id: savedUserMessage?.id || `user-${Date.now()}`,
        conversationId: conversation.id,
        role: 'user',
        content: 'Analyze this wine list',
        imageUrl: imageUrlToSave,
        createdAt: savedUserMessage?.created_at || new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Parse wine list
      const parsedWines = await parseWineListImage(imageUri);
      
      if (parsedWines.length === 0) {
        const errorContent = 'I couldn\'t find any wines in this image. Please try uploading a clearer image of a wine list.';
        
        // Save error message to database
        const { data: savedErrorMessage } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: errorContent,
          })
          .select()
          .single();

        const errorMessage: ChatMessage = {
          id: savedErrorMessage?.id || `assistant-${Date.now()}`,
          conversationId: conversation.id,
          role: 'assistant',
          content: errorContent,
          createdAt: savedErrorMessage?.created_at || new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsAnalyzing(false);
        return;
      }

      // Match wines
      const queries = parsedWines.map(w => `${w.wineName} ${w.vintage || ''}`);
      const matches = await matchWinesToLwin(queries);

      // Fetch pricing and scores
      const wines: Wine[] = await Promise.all(
        parsedWines.map(async (parsed, index) => {
          const match = matches[index];
          const lwin = match?.lwin;
          
          // Build display name early so we can use it in fallback logic
          const displayName = match?.display_name || parsed.wineName || 'Unknown Wine';

          let realPrice: number | undefined;
          let markup: number | undefined;
          let criticScore: number | undefined;
          let critic: string | undefined;
          let criticCount: number | undefined;

          if (lwin) {
            try {
              const priceStats = await getPriceStats(undefined, lwin);
              realPrice = priceStats.median;
              if (realPrice) {
                markup = calculateMarkup(parsed.price, realPrice);
              }
            } catch (e) {
              console.error('Error fetching price stats:', e);
            }

            try {
              const scores = await getCriticScores(undefined, lwin, parsed.vintage);
              if (scores.length > 0) {
                const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
                criticScore = Math.round((totalScore / scores.length) * 100) / 100;
                criticCount = scores.length;
                const topScore = scores.reduce((max, s) =>
                  s.score > max.score ? s : max
                );
                critic = topScore.critic;
              } else {
                // Fallback to web search if WineLabs has no scores
                console.log(`[WineLabs] No critic scores from WineLabs, trying web search for: ${displayName}`);
                const { searchCriticScoresOnWeb } = await import('../services/webSearch');
                const webScores = await searchCriticScoresOnWeb(displayName, parsed.vintage);
                if (webScores.length > 0) {
                  const totalScore = webScores.reduce((sum, s) => sum + s.score, 0);
                  criticScore = Math.round((totalScore / webScores.length) * 100) / 100;
                  criticCount = webScores.length;
                  const topScore = webScores.reduce((max, s) =>
                    s.score > max.score ? s : max
                  );
                  critic = topScore.critic;
                  console.log(`[WebSearch] Found ${webScores.length} critic scores via web search`);
                }
              }
            } catch (e) {
              console.error('Error fetching critic scores:', e);
              // Try web search fallback even on error
              try {
                console.log(`[WineLabs] Error getting scores, trying web search fallback for: ${displayName}`);
                const { searchCriticScoresOnWeb } = await import('../services/webSearch');
                const webScores = await searchCriticScoresOnWeb(displayName, parsed.vintage);
                if (webScores.length > 0) {
                  const totalScore = webScores.reduce((sum, s) => sum + s.score, 0);
                  criticScore = Math.round((totalScore / webScores.length) * 100) / 100;
                  criticCount = webScores.length;
                  const topScore = webScores.reduce((max, s) =>
                    s.score > max.score ? s : max
                  );
                  critic = topScore.critic;
                  console.log(`[WebSearch] Found ${webScores.length} critic scores via web search fallback`);
                }
              } catch (webError) {
                console.error('Error fetching critic scores from web search:', webError);
              }
            }
          }

          return {
            lwin7: match?.lwin7,
            lwin: match?.lwin,
            displayName,
            vintage: parsed.vintage,
            restaurantPrice: parsed.price,
            realPrice,
            markup,
            criticScore,
            critic,
            criticCount,
          };
        })
      );

      // Format results as markdown
      const markdownContent = formatWinesAsMarkdown(wines);
      const assistantContent = `${markdownContent}\n\nWould you like me to help you find the best value or highest rated wines?`;

      // Save assistant message with image URL
      const assistantMessage = await addAssistantMessage(
        conversation.id,
        assistantContent,
        { wines, imageUrl: imageUrlToSave }
      );

      // Store wines data for this message
      setWinesData(prev => {
        const newMap = new Map(prev);
        newMap.set(assistantMessage.id, wines);
        return newMap;
      });

      setMessages(prev => [...prev, assistantMessage]);

      // Generate chat title based on wines
      try {
        await generateChatTitle(conversation.id, undefined, wines);
        // Reload conversation to get updated title
        const updatedConv = await getChatConversation(conversation.id);
        if (updatedConv) {
          setConversation(updatedConv);
        }
      } catch (titleError) {
        console.error('Error generating chat title:', titleError);
        // Don't show error to user - title generation is not critical
      }

      // Update conversation with image URL if it doesn't have one
      if (conversation && !conversation.imageUrl) {
        try {
          const updatedConversation = await updateChatConversation(conversation.id, {
            imageUrl: imageUrlToSave,
          });
          setConversation(updatedConversation);
        } catch (updateError) {
          console.error('Error updating conversation image URL:', updateError);
          // Don't show alert for this - it's not critical
        }
      }
    } catch (error: any) {
      console.error('Error analyzing wine list:', error);
      const errorContent = error.message?.includes('network') || error.message?.includes('fetch')
        ? 'Network error. Please check your internet connection and try again.'
        : 'Sorry, I encountered an error analyzing the wine list. Please try again.';
      
      Alert.alert('Error', errorContent);

      // Save error message to database
      try {
        const { data: savedErrorMessage } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: errorContent,
          })
          .select()
          .single();

        const errorMessage: ChatMessage = {
          id: savedErrorMessage?.id || `assistant-${Date.now()}`,
          conversationId: conversation.id,
          role: 'assistant',
          content: errorContent,
          createdAt: savedErrorMessage?.created_at || new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } catch (saveError) {
        console.error('Error saving error message:', saveError);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || isAnalyzing || !conversation) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: conversation.id,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };

    try {
      // Add user message to UI immediately
      setMessages(prev => [...prev, tempUserMessage]);

      // Send message and get response
      const assistantMessage = await sendChatMessage(
        conversation.id,
        userMessage,
        wine || undefined,
        uploadedImage || imageUrl || conversation.imageUrl
      );

      // Replace temp message and add assistant response
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMessage.id),
        {
          ...tempUserMessage,
          id: `user-${Date.now()}`,
        },
        assistantMessage,
      ]);

      // Generate chat title after first message exchange
      if (messages.length === 0) {
        try {
          await generateChatTitle(conversation.id, userMessage);
          // Reload conversation to get updated title
          const updatedConv = await getChatConversation(conversation.id);
          if (updatedConv) {
            setConversation(updatedConv);
          }
        } catch (titleError) {
          console.error('Error generating chat title:', titleError);
          // Don't show error to user - title generation is not critical
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      
      // Show user-friendly error message
      const errorMessage = error.message?.includes('network') || error.message?.includes('fetch')
        ? 'Network error. Please check your internet connection and try again.'
        : error.message?.includes('API key')
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to send message. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{conversation?.title || wine?.displayName || 'Chat'}</Text>
          {wine?.vintage && <Text style={styles.headerSubtitle}>{wine.vintage}</Text>}
        </View>
      </View>

      {(imageUrl || conversation?.imageUrl) && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl || conversation?.imageUrl }} style={styles.wineListImage} resizeMode="contain" />
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyText}>
              {wine ? 'Start a conversation about this wine' : 'Start a conversation'}
            </Text>
            <Text style={styles.emptySubtext}>
              {wine 
                ? 'Ask about tasting notes, food pairings, or recommendations'
                : 'Upload a wine list image to analyze, or ask me anything about wine'}
            </Text>
          </View>
        )}

        {messages.map((message) => {
          const messageWines = winesData.get(message.id);
          const hasWinesData = messageWines && messageWines.length > 0;
          
          return (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              {message.role === 'assistant' && (
                <View style={styles.avatar}>
                  <Ionicons name="wine" size={20} color={theme.colors.gold[600]} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {message.imageUrl && message.role === 'assistant' && (
                  <View style={styles.messageImageContainer}>
                    <Image source={{ uri: message.imageUrl }} style={styles.messageImage} resizeMode="contain" />
                  </View>
                )}
                {message.role === 'assistant' ? (
                  <Markdown
                    style={{
                      body: {
                        color: theme.colors.text.primary,
                        fontSize: 16,
                        lineHeight: 22,
                      },
                      heading2: {
                        color: theme.colors.text.primary,
                        fontSize: 20,
                        fontWeight: 'bold',
                        marginTop: 12,
                        marginBottom: 8,
                      },
                      bullet_list: {
                        marginTop: 4,
                        marginBottom: 4,
                      },
                      list_item: {
                        marginBottom: 4,
                      },
                      strong: {
                        fontWeight: 'bold',
                        color: theme.colors.text.primary,
                      },
                      paragraph: {
                        marginBottom: 8,
                      },
                    }}
                  >
                    {message.content}
                  </Markdown>
                ) : (
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user' ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {message.content}
                  </Text>
                )}
                {hasWinesData && message.imageUrl && (
                  <TouchableOpacity
                    style={styles.viewResultsButton}
                    onPress={() => {
                      (navigation as any).navigate('Results', {
                        wines: messageWines,
                        imageUrl: message.imageUrl,
                      });
                    }}
                  >
                    <Ionicons name="stats-chart" size={16} color={theme.colors.primary[600]} />
                    <Text style={styles.viewResultsText}>View Results</Text>
                  </TouchableOpacity>
                )}
              </View>
              {message.role === 'user' && (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={theme.colors.primary[600]} />
                </View>
              )}
            </View>
          );
        })}

        {(isLoading || isAnalyzing) && (
          <View style={styles.loadingMessage}>
            <View style={styles.avatar}>
              <Ionicons name="wine" size={20} color={theme.colors.gold[600]} />
            </View>
            <View style={styles.assistantBubble}>
              {isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="wine" size={32} color={theme.colors.gold[500]} />
                  </Animated.View>
                  <Text style={styles.analyzingText}>Analyzing wine list...</Text>
                  <View style={styles.processingSteps}>
                    <Animated.View style={[styles.stepDot, styles.stepDotActive, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.stepDot, styles.stepDotActive, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.stepDot, styles.stepDotActive, { opacity: pulseAnim }]} />
                  </View>
                </View>
              ) : (
                <View style={styles.thinkingContainer}>
                  <View style={styles.thinkingDots}>
                    <Animated.View style={[styles.thinkingDot, { transform: [{ translateY: bounceAnim1 }] }]} />
                    <Animated.View style={[styles.thinkingDot, { transform: [{ translateY: bounceAnim2 }] }]} />
                    <Animated.View style={[styles.thinkingDot, { transform: [{ translateY: bounceAnim3 }] }]} />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {uploadedImage && !conversation?.imageUrl && (
          <View style={styles.messageContainer}>
            <View style={styles.userMessage}>
              <View style={styles.userBubble}>
                <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} resizeMode="contain" />
              </View>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={theme.colors.primary[600]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleImagePick}
          disabled={isLoading || isAnalyzing}
        >
          <Ionicons
            name="camera-outline"
            size={24}
            color={isLoading || isAnalyzing ? theme.colors.text.tertiary : theme.colors.primary[600]}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={wine ? "Ask about this wine..." : "Ask me anything about wine..."}
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          editable={!isLoading && !isAnalyzing}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading || isAnalyzing) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading || isAnalyzing}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() && !isLoading && !isAnalyzing ? theme.colors.primary[600] : theme.colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>

      {showImagePicker && (
        <View style={styles.imagePickerModal}>
          <TouchableOpacity
            style={styles.imagePickerBackdrop}
            onPress={() => setShowImagePicker(false)}
            activeOpacity={1}
          />
          <View style={styles.imagePickerOptions}>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => handleImageOption('camera')}
            >
              <Ionicons name="camera" size={32} color={theme.colors.primary[600]} />
              <Text style={styles.imagePickerOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => handleImageOption('library')}
            >
              <Ionicons name="images" size={32} color={theme.colors.primary[600]} />
              <Text style={styles.imagePickerOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imagePickerCancel}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.imagePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.styles.cardTitle,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  imageContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  wineListImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  emptyText: {
    ...theme.typography.styles.bodyLarge,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: theme.colors.primary[600],
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    ...theme.typography.styles.body,
    lineHeight: Platform.OS === 'web' ? 24 : theme.typography.styles.body.lineHeight * 18,
  },
  userText: {
    color: theme.colors.neutral[50],
  },
  assistantText: {
    color: theme.colors.text.primary,
  },
  messageImageContainer: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  messageImage: {
    width: '100%',
    maxHeight: 200,
    borderRadius: theme.borderRadius.md,
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  viewResultsText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary[600],
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  loadingMessage: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  imageButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  uploadedImage: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  analyzingContainer: {
    alignItems: 'center',
  },
  analyzingText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  processingSteps: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  stepDotActive: {
    backgroundColor: theme.colors.gold[500],
  },
  thinkingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.text.tertiary,
  },
  imagePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  imagePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imagePickerOptions: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === 'web' ? theme.spacing.lg : theme.spacing['2xl'],
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.md,
  },
  imagePickerOptionText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
  },
  imagePickerCancel: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  imagePickerCancelText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  sendButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

