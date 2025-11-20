import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';
import type { Wine } from '../types';
import { parseWineListImage } from '../services/vision';
import { matchWinesToLwin, getPriceStats, getCriticScores } from '../services/winelabs';
import { calculateMarkup } from '../utils/wineRanking';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';
import { useActiveConversation } from '../contexts/ActiveConversationContext';
import { createGeneralChatConversation, addAssistantMessage, generateChatTitle } from '../services/chat';
import { formatWinesAsMarkdown } from '../utils/wineFormatting';

type ProcessingStep = 'idle' | 'uploading' | 'parsing' | 'matching' | 'fetching' | 'complete';

export function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { activeConversationId } = useActiveConversation();
  const { returnToChat, conversationId: routeConversationId } = (route.params as any) || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hasSkippedPermission, setHasSkippedPermission] = useState(false);
  const [shouldShowCamera, setShouldShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Debug: Log permission state changes
  useEffect(() => {
    if (permission) {
      console.log('Camera permission state:', {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
        status: permission.status,
      });
    }
  }, [permission]);
  
  // Animation values for branding intro
  const brandingOpacity = useRef(new Animated.Value(1)).current;
  const brandingPosition = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Track when camera should be shown
  useEffect(() => {
    if (permission?.granted || hasSkippedPermission) {
      setShouldShowCamera(true);
    } else {
      setShouldShowCamera(false);
    }
  }, [permission?.granted, hasSkippedPermission]);

  // Intro Animation Effect - Reset and trigger when camera should be shown
  useEffect(() => {
    if (shouldShowCamera) {
      console.log('Starting intro animation', { granted: permission?.granted, skipped: hasSkippedPermission });
      
      // Reset animation values first to ensure they start from the correct state
      brandingOpacity.setValue(1);
      brandingPosition.setValue(0);
      overlayOpacity.setValue(0); // Start with overlay invisible so camera shows immediately
      setOverlayVisible(false); // Don't show overlay initially - let camera be visible right away
      
      // Small delay to ensure camera is mounted, then animate branding only
      const timer = setTimeout(() => {
        Animated.parallel([
          // Float up branding
          Animated.timing(brandingPosition, {
            toValue: -250,
            duration: 800,
            useNativeDriver: true,
          }),
          // Fade out branding text only
          Animated.timing(brandingOpacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start((finished) => {
          if (finished) {
            console.log('Intro animation completed');
          }
        });
      }, 300); // Shorter delay - camera should initialize quickly
      
      return () => clearTimeout(timer);
    } else {
      // Reset to initial state when camera should not be shown
      brandingOpacity.setValue(1);
      brandingPosition.setValue(0);
      overlayOpacity.setValue(0);
      setOverlayVisible(false);
    }
  }, [shouldShowCamera]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={theme.colors.gold[500]} />
          <Text style={[styles.permissionDescription, { marginTop: theme.spacing.lg }]}>
            Checking permissions...
          </Text>
        </View>
      </View>
    );
  }

  if (!permission.granted && !hasSkippedPermission) {
    // Check if we can ask again or need to direct to settings
    // On iOS, canAskAgain can be:
    // - undefined: first time, permission never asked
    // - true: permission was asked but can ask again
    // - false: permission was denied and can't ask again (must go to Settings)
    const canAskAgain = permission.canAskAgain === undefined || permission.canAskAgain === true;
    const needsSettings = permission.canAskAgain === false;
    
    // Debug log for iOS
    if (Platform.OS === 'ios') {
      console.log('iOS Permission Screen State:', {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
        status: permission.status,
        needsSettings,
        canAskAgainComputed: canAskAgain,
      });
    }

    const handlePermissionRequest = async () => {
      try {
        // On iOS, if permission was permanently denied (canAskAgain === false),
        // we cannot show the prompt again - must direct to Settings
        if (needsSettings) {
          Alert.alert(
            'Camera Permission Required',
            'Camera access was previously denied. Please enable it in your device settings to scan wine lists.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (settingsError) {
                    console.error('Failed to open settings:', settingsError);
                    Alert.alert(
                      'Error',
                      'Could not open settings. Please manually enable camera access in Settings > Wine Scanner.'
                    );
                  }
                }
              }
            ]
          );
          return;
        }

        // Request permission - this should trigger iOS system prompt
        // IMPORTANT: On iOS, this must be called directly from user action handler
        // iOS will show the system dialog if:
        // 1. Permission was never asked before (canAskAgain === undefined)
        // 2. Permission can be asked again (canAskAgain === true)
        // iOS will NOT show dialog if canAskAgain === false (must go to Settings)
        console.log('[PERMISSION] Requesting camera permission...', {
          platform: Platform.OS,
          beforeRequest: {
            granted: permission.granted,
            canAskAgain: permission.canAskAgain,
            status: permission.status,
          },
        });
        
        // Call requestPermission - this should trigger iOS system dialog
        // The hook's requestPermission function should work on iOS
        const result = await requestPermission();
        
        console.log('[PERMISSION] Request result:', {
          platform: Platform.OS,
          granted: result.granted,
          canAskAgain: result.canAskAgain,
          status: result.status,
        });
        
        // Additional iOS-specific debug
        if (Platform.OS === 'ios') {
          console.log('[PERMISSION] iOS Debug:', {
            before: {
              granted: permission.granted,
              canAskAgain: permission.canAskAgain,
              status: permission.status,
            },
            after: {
              granted: result.granted,
              canAskAgain: result.canAskAgain,
              status: result.status,
            },
            promptShown: result.granted || (result.canAskAgain === false && !permission.granted),
          });
        }
        
        if (!result.granted) {
          // Check if we can still ask again
          if (result.canAskAgain === false) {
            // Permission permanently denied, direct to settings
            Alert.alert(
              'Camera Permission Required',
              'Camera access is needed to scan wine lists. Please enable it in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: async () => {
                    try {
                      await Linking.openSettings();
                    } catch (settingsError) {
                      console.error('Failed to open settings:', settingsError);
                    }
                  }
                }
              ]
            );
          } else {
            // User denied but can ask again - show info message
            Alert.alert(
              'Permission Denied',
              'Camera access is needed to scan wine lists. You can grant permission when prompted again.',
              [{ text: 'OK' }]
            );
          }
        } else {
          // Permission granted - the useEffect will handle showing camera and animation
          console.log('Camera permission granted!');
        }
      } catch (e) {
        console.error('Permission request failed:', e);
        Alert.alert(
          'Error',
          'Could not request camera permission. Please check your settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (settingsError) {
                  console.error('Failed to open settings:', settingsError);
                }
              }
            }
          ]
        );
      }
    };

    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          {/* Icon */}
          <Animated.View
            style={[
              styles.permissionIconContainer,
              {
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <Ionicons name="camera" size={64} color={theme.colors.gold[500]} />
          </Animated.View>

          {/* Title */}
          <Text style={styles.permissionTitle}>
            Camera Access Needed
          </Text>

          {/* Description */}
          <Text style={styles.permissionDescription}>
            To scan wine lists, we need access to your camera. You can also upload photos from your library.
          </Text>

          {/* Permission Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handlePermissionRequest}
              activeOpacity={0.8}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={theme.colors.neutral[50]}
                style={styles.permissionButtonIcon}
              />
              <Text style={styles.permissionButtonText}>
                {needsSettings ? 'Open Settings' : 'Grant Permission'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              setHasSkippedPermission(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            Your privacy is important. We only use your camera to scan wine lists.
          </Text>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    // Handle permission denied case - re-prompt
    if (!permission?.granted) {
      if (permission?.canAskAgain) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access in your device settings to scan wines.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
      } else {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to scan wines.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
      return;
    }

    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        // Instead of processing immediately, show preview
        setPreviewImage(photo.uri);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image');
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    if (isProcessing) return;

    // Apple-style button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5, // Lower quality to reduce size for vision API
        allowsEditing: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Show preview instead of immediately processing
        setPreviewImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const analyzeImage = async () => {
    if (!previewImage || isProcessing) return;
    setIsProcessing(true);
    setProcessingStep('idle');
    await processWineList(previewImage);
  };

  const cancelPreview = () => {
    setPreviewImage(null);
  };


  const processWineList = async (imageUri: string) => {
    try {
      logger.info('PROCESS', 'Starting wine list processing', { imageUri });

      // Step 1: Upload image to Supabase Storage (optional - continue if it fails)
      setProcessingStep('uploading');
      logger.info('UPLOAD', 'Starting image upload...');
      let imageUrl: string | undefined;
      try {
        imageUrl = await uploadImage(imageUri);
        logger.success('UPLOAD', 'Image uploaded successfully', { imageUrl });
      } catch (uploadError: any) {
        logger.warn('UPLOAD', 'Image upload failed, continuing without storage', { 
          error: uploadError?.message || 'Unknown error' 
        });
        // Continue processing without storing the image
        imageUrl = undefined;
      }

      // Step 2: Parse wine list with LLM
      setProcessingStep('parsing');
      logger.info('PARSE', 'Starting vision AI parsing...');
      const parsedWines = await parseWineListImage(imageUri);
      logger.success('PARSE', `Extracted ${parsedWines.length} wines`, { parsedWines });

      if (parsedWines.length === 0) {
        logger.warn('PARSE', 'No wines found in image');
        Alert.alert('No wines found', 'Could not extract wines from this image. Please try again.');
        setIsProcessing(false);
        setProcessingStep('idle');
        setPreviewImage(null);
        return;
      }

      // Step 3: Match wines to LWIN identifiers
      setProcessingStep('matching');
      logger.info('MATCH', 'Starting Wine Labs matching...');
      const queries = parsedWines.map(w => `${w.wineName} ${w.vintage || ''}`);
      logger.debug('MATCH', 'Match queries', { queries });

      const matches = await matchWinesToLwin(queries);
      logger.success('MATCH', 'Wine Labs matching complete');

      // Log matching statistics
      const matchedCount = matches.filter(m => m?.lwin || m?.lwin7).length;
      const unmatchedCount = parsedWines.length - matchedCount;
      logger.info('MATCH', `Matched: ${matchedCount}/${parsedWines.length} wines`, {
        matchedCount,
        unmatchedCount,
        matchRate: `${Math.round((matchedCount / parsedWines.length) * 100)}%`
      });

      // Step 4: Fetch pricing and scores for each wine
      setProcessingStep('fetching');
      const wines: Wine[] = await Promise.all(
        parsedWines.map(async (parsed, index) => {
          const match = matches[index];
          const lwin = match?.lwin;
          
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
                // Fallback to web search
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
                }
              }
            } catch (e) {
              console.error('Error fetching critic scores:', e);
              // Try web search fallback
              try {
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
                }
              } catch (webError) {
                console.error('Error fetching critic scores from web search:', webError);
              }
            }
          } else {
             // No lwin - try web search for critic scores if match source is web-search
            if (match?.dataSource === 'web-search' || !match?.matched) {
               try {
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
                }
              } catch (webError) {
                console.error('Error fetching critic scores from web search (no lwin):', webError);
              }
            }
          }

          const priceForMarkup = realPrice || match?.webSearchPrice;
          if (priceForMarkup && !markup) {
            markup = calculateMarkup(parsed.price, priceForMarkup);
          }

          const wine: Wine = {
            lwin7: match?.lwin7,
            lwin: match?.lwin,
            displayName,
            vintage: match?.vintage || parsed.vintage,
            restaurantPrice: parsed.price,
            realPrice,
            markup,
            criticScore,
            critic,
            criticCount,
            varietal: match?.varietal,
            region: match?.region,
            dataSource: match?.dataSource,
            searchConfidence: match?.confidence,
            webSearchPrice: match?.webSearchPrice,
            webSearchSource: match?.webSearchSource,
          };

          return wine;
        })
      );

      // Step 5: Save scan to database
      let savedScanId: string | undefined;
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user && imageUrl) {
        const { data: scan, error: scanError } = await supabase
          .from('scans')
          .insert({
            user_id: session.session.user.id,
            image_url: imageUrl,
          })
          .select()
          .single();

        if (scan && !scanError) {
          savedScanId = scan.id;
          await supabase.from('wine_results').insert(
            wines.map(wine => ({
              scan_id: scan.id,
              lwin7: wine.lwin7,
              lwin: wine.lwin,
              display_name: wine.displayName,
              vintage: wine.vintage,
              restaurant_price: wine.restaurantPrice,
              real_price: wine.realPrice,
              markup: wine.markup,
              critic_score: wine.criticScore,
              critic_name: wine.critic,
              critic_count: wine.criticCount,
            }))
          );
        }
      }

      // Create or add to chat conversation
      setProcessingStep('complete');
      setPreviewImage(null);
      
      // If we came from Chat screen, always return to Chat
      if (returnToChat) {
        try {
          let conversationId: string = routeConversationId || activeConversationId || '';
          
          if (!conversationId) {
            const newConversation = await createGeneralChatConversation(imageUrl);
            conversationId = newConversation.id;
          }
          
          const markdownContent = formatWinesAsMarkdown(wines);
          const assistantContent = `${markdownContent}\n\nWould you like me to help you find the best value or highest rated wines?`;
          
          const assistantMessage = await addAssistantMessage(conversationId, assistantContent, { wines, imageUrl });
          
          if (!routeConversationId && !activeConversationId) {
            try {
              await generateChatTitle(conversationId, undefined, wines);
            } catch (titleError) {
              console.error('Error generating chat title:', titleError);
            }
          }
          
          (navigation as any).navigate('Chat', { 
            conversationId,
            winesData: { [assistantMessage.id]: wines },
          });
        } catch (chatError) {
          console.error('Error creating/updating chat:', chatError);
          (navigation as any).navigate('Results', { 
            wines,
            imageUrl,
            scanId: savedScanId,
          });
        }
      } else {
        // Original logic for when coming from Camera screen directly
        try {
          let conversationId: string;
          
          if (activeConversationId) {
            conversationId = activeConversationId;
            const markdownContent = formatWinesAsMarkdown(wines);
            const assistantContent = `${markdownContent}\n\nWould you like me to help you find the best value or highest rated wines?`;
            
            const assistantMessage = await addAssistantMessage(conversationId, assistantContent, { wines, imageUrl });
            
            (navigation as any).navigate('Chat', { 
              conversationId,
              winesData: { [assistantMessage.id]: wines },
            });
          } else {
            const newConversation = await createGeneralChatConversation(imageUrl);
            conversationId = newConversation.id;
            
            const markdownContent = formatWinesAsMarkdown(wines);
            const assistantContent = `${markdownContent}\n\nWould you like me to help you find the best value or highest rated wines?`;
            
            const assistantMessage = await addAssistantMessage(conversationId, assistantContent, { wines, imageUrl });
            
            try {
              await generateChatTitle(conversationId, undefined, wines);
            } catch (titleError) {
              console.error('Error generating chat title:', titleError);
            }
            
            (navigation as any).navigate('Chat', { 
              conversationId,
              winesData: { [assistantMessage.id]: wines },
            });
          }
        } catch (chatError) {
          console.error('Error creating/updating chat:', chatError);
          (navigation as any).navigate('Results', { 
            wines,
            imageUrl,
            scanId: savedScanId,
          });
        }
      }
      
      setIsProcessing(false);
      setProcessingStep('idle');
    } catch (error) {
      logger.error('PROCESS', 'Failed to process wine list', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      Alert.alert('Error', 'Failed to process wine list. Please try again.');
      setIsProcessing(false);
      setProcessingStep('idle');
      setPreviewImage(null);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User not authenticated');
    }

    const userId = session.session.user.id;
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw new Error(`Storage bucket check failed: ${bucketError.message}`);

    const wineListsBucket = buckets?.find(b => b.id === 'wine-lists');
    if (!wineListsBucket) {
      throw new Error('Storage bucket "wine-lists" does not exist.');
    }

    let fileExtension = 'jpg';
    let contentType = 'image/jpeg';

    const response = await fetch(uri);
    const blob = await response.blob();

    if (blob.type) {
      contentType = blob.type;
      if (blob.type === 'image/png') fileExtension = 'png';
      else if (blob.type === 'image/heic') fileExtension = 'heic';
    } else if (uri.toLowerCase().includes('.png')) {
      contentType = 'image/png';
      fileExtension = 'png';
    }

    const fileName = `${userId}/${Date.now()}.${fileExtension}`;

    const { error } = await supabase.storage
      .from('wine-lists')
      .upload(fileName, blob, { contentType, upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('wine-lists')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // Show preview screen if image is selected
  if (previewImage) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={cancelPreview} style={styles.cancelButton}>
              <Ionicons name="close" size={24} color={theme.colors.neutral[50]} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Preview Wine List</Text>
            <View style={styles.placeholderButton} />
          </View>
          
          <View style={styles.previewImageContainer}>
            <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={cancelPreview}
              disabled={isProcessing}
            >
              <Ionicons name="camera-outline" size={20} color={theme.colors.text.primary} style={styles.retakeIcon} />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={analyzeImage}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.colors.neutral[50]} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color={theme.colors.neutral[50]} style={styles.analyzeIcon} />
                  <Text style={styles.analyzeButtonText}>Send</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingContent}>
              <ActivityIndicator size="large" color={theme.colors.gold[500]} />
              <Text style={styles.processingText}>{getProcessingStepText(processingStep)}</Text>
              <View style={styles.processingSteps}>
                {(['uploading', 'parsing', 'matching', 'fetching'] as ProcessingStep[]).map((step) => (
                  <View
                    key={step}
                    style={[
                      styles.stepIndicator,
                      processingStep === step && styles.stepIndicatorActive,
                      getStepCompleted(processingStep, step) && styles.stepIndicatorCompleted,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Only render camera if shouldShowCamera is true
  if (!shouldShowCamera) {
    return null; // This should never happen due to earlier checks, but safety guard
  }

  console.log('Rendering CameraView', { 
    shouldShowCamera, 
    permissionGranted: permission?.granted,
    hasSkippedPermission,
    cameraReady
  });

  return (
    <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={false}
          onCameraReady={() => {
            console.log('Camera is ready');
            setCameraReady(true);
          }}
          onMountError={(error) => {
            console.error('Camera mount error:', error);
            Alert.alert('Camera Error', 'Failed to initialize camera. Please try again.');
          }}
        >
          {/* Show loading indicator while camera initializes */}
          {!cameraReady && (
            <View style={styles.cameraLoading}>
              <ActivityIndicator size="large" color={theme.colors.gold[500]} />
            </View>
          )}
          {/* Header: Just Icons - positioned absolutely, not in full-screen overlay */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.chatHistoryButton}
                onPress={() => (navigation as any).navigate('ChatHistory')}
              >
                <Ionicons name="time-outline" size={24} color={theme.colors.neutral[50]} />
              </TouchableOpacity>
              
              {/* Spacer to push settings to right */}
              <View style={{ flex: 1 }} />

              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => (navigation as any).navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={24} color={theme.colors.neutral[50]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center Content: Branding - positioned absolutely */}
          <Animated.View 
            style={[
              styles.centerContent,
              { 
                opacity: brandingOpacity,
                transform: [{ translateY: brandingPosition }]
              }
            ]}
            pointerEvents="none"
          >
            <Ionicons name="wine" size={64} color={theme.colors.neutral[50]} style={{ marginBottom: theme.spacing.md }} />
            <Text style={styles.mainTitle}>Wine Scanner</Text>
            <Text style={styles.mainSubtitle}>
              Scan any wine list to discover value
            </Text>
          </Animated.View>

          {/* Controls - positioned absolutely at bottom */}
          <View style={styles.controls}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.libraryButton}
                onPress={pickImage}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={28} color={theme.colors.neutral[50]} />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color={theme.colors.gold[500]} />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => (navigation as any).navigate('Chat', {
                  conversationId: routeConversationId || activeConversationId
              })}
            >
              <Ionicons name="chatbubbles-outline" size={28} color={theme.colors.neutral[50]} />
            </TouchableOpacity>
          </View>
        </CameraView>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color={theme.colors.gold[500]} />
            <Text style={styles.processingText}>{getProcessingStepText(processingStep)}</Text>
            <View style={styles.processingSteps}>
              {(['uploading', 'parsing', 'matching', 'fetching'] as ProcessingStep[]).map((step) => (
                <View
                  key={step}
                  style={[
                    styles.stepIndicator,
                    processingStep === step && styles.stepIndicatorActive,
                    getStepCompleted(processingStep, step) && styles.stepIndicatorCompleted,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      )}

    </View>
  );
}

function getProcessingStepText(step: ProcessingStep): string {
  switch (step) {
    case 'uploading': return 'Uploading image...';
    case 'parsing': return 'Extracting wine information...';
    case 'matching': return 'Matching wines to database...';
    case 'fetching': return 'Fetching prices and scores...';
    case 'complete': return 'Complete!';
    default: return 'Preparing...';
  }
}

function getStepCompleted(currentStep: ProcessingStep, step: ProcessingStep): boolean {
  const stepOrder: ProcessingStep[] = ['uploading', 'parsing', 'matching', 'fetching'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(step);
  return currentIndex > stepIndex;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background for camera
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
      minWidth: '100vw',
    }),
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    zIndex: 100,
    ...(Platform.OS === 'web' && {
      pointerEvents: 'auto' as any,
    }),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(250, 248, 244, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 248, 244, 0.2)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)' as any,
      WebkitBackdropFilter: 'blur(20px)' as any,
    }),
  },
  chatHistoryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(250, 248, 244, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 248, 244, 0.2)',
    marginRight: 12,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)' as any,
      WebkitBackdropFilter: 'blur(20px)' as any,
    }),
  },
  chatButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(250, 248, 244, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 248, 244, 0.2)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)' as any,
      WebkitBackdropFilter: 'blur(20px)' as any,
      cursor: 'pointer' as any,
    }),
  },
  // New Center Content Styles
  centerContent: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    pointerEvents: 'none', // Critical: don't block touch events, only visual overlay
    zIndex: 1,
  },
  logoText: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  mainTitle: {
    fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay_800ExtraBold' : 'serif',
    fontSize: 48,
    fontWeight: '800' as any,
    color: theme.colors.neutral[50],
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    letterSpacing: -0.02,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    ...(Platform.OS === 'web' && {
      whiteSpace: 'nowrap' as any,
      lineHeight: 60,
    }),
  },
  mainSubtitle: {
    fontSize: 20,
    color: '#e8e3d8',
    textAlign: 'center',
    fontWeight: '300' as any,
    marginBottom: theme.spacing['2xl'],
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: Platform.OS === 'web' ? theme.spacing['2xl'] : theme.spacing['3xl'],
    paddingTop: theme.spacing.lg,
    zIndex: 100,
  },
  libraryButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(250, 248, 244, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 248, 244, 0.2)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)' as any,
      WebkitBackdropFilter: 'blur(20px)' as any,
      transition: 'all 0.3s ease' as any,
      cursor: 'pointer' as any,
    }),
  },
  libraryIcon: {
    marginRight: theme.spacing.sm,
  },
  libraryButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.neutral[50],
    fontSize: Platform.OS === 'web' ? 16 : theme.typography.sizes.base,
    fontWeight: '500' as any,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.gold[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(250, 248, 244, 0.3)',
    ...theme.shadows.gold,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        transform: 'scale(1.1)' as any,
        boxShadow: '0 12px 32px rgba(212, 175, 55, 0.6)' as any,
      } as any,
    }),
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffd966',
    opacity: 0.3,
  },
  placeholderButton: {
    width: 64,
    height: 64,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    ...(Platform.OS === 'web' && {
      minHeight: '100vh' as any,
    }),
  },
  permissionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    ...(Platform.OS === 'web' && {
      margin: '0 auto' as any,
    }),
  },
  permissionIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${theme.colors.gold[500]}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 24px rgba(212, 175, 55, 0.2)' as any,
    }),
  },
  permissionTitle: {
    ...theme.typography.styles.heroTitle,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontSize: Platform.OS === 'web' ? 32 : theme.typography.sizes['2xl'],
    width: '100%',
  },
  permissionDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing['3xl'],
    lineHeight: Platform.OS === 'web' ? 26 : 22,
    fontSize: Platform.OS === 'web' ? 18 : theme.typography.sizes.base,
    paddingHorizontal: theme.spacing.md,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold[500],
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    borderRadius: Platform.OS === 'web' ? 12 : theme.borderRadius.lg,
    minWidth: 240,
    ...theme.shadows.gold,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        backgroundColor: theme.colors.gold[600],
        transform: 'translateY(-2px)' as any,
        boxShadow: '0 8px 16px rgba(212, 175, 55, 0.4)' as any,
      } as any,
      ':active': {
        transform: 'translateY(0px)' as any,
      } as any,
    }),
  },
  permissionButtonIcon: {
    marginRight: theme.spacing.sm,
  },
  permissionButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.neutral[50],
    fontSize: Platform.OS === 'web' ? 18 : theme.typography.sizes.lg,
    fontWeight: '600' as any,
  },
  skipButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  skipButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: Platform.OS === 'web' ? 16 : theme.typography.sizes.base,
    textDecorationLine: 'underline',
  },
  privacyNote: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing['2xl'],
    fontSize: Platform.OS === 'web' ? 14 : theme.typography.sizes.sm,
    fontStyle: 'italic',
    paddingHorizontal: theme.spacing.lg,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.neutral[900],
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(135deg, #3a342c 0%, #1c1915 100%)' as any,
    }),
  },
  enableCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold[500],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.gold,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        backgroundColor: theme.colors.gold[600],
        transform: 'translateY(-2px)' as any,
      } as any,
    }),
  },
  enableCameraButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.neutral[50],
    fontSize: Platform.OS === 'web' ? 16 : theme.typography.sizes.base,
    fontWeight: '600' as any,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral[900],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.neutral[50],
    flex: 1,
    textAlign: 'center',
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
  },
  previewActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: Platform.OS === 'web' ? 12 : theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.25)' as any,
      } as any,
    }),
  },
  retakeIcon: {
    marginRight: theme.spacing.sm,
  },
  retakeButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.text.primary,
    fontSize: Platform.OS === 'web' ? 18 : theme.typography.sizes.lg,
    fontWeight: '600' as any,
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold[500],
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: Platform.OS === 'web' ? 12 : theme.borderRadius.lg,
    ...theme.shadows.gold,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        backgroundColor: theme.colors.gold[600],
        transform: 'translateY(-2px)' as any,
      } as any,
    }),
  },
  analyzeIcon: {
    marginRight: theme.spacing.sm,
  },
  analyzeButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.neutral[50],
    fontSize: Platform.OS === 'web' ? 18 : theme.typography.sizes.lg,
    fontWeight: '600' as any,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)' as any,
      WebkitBackdropFilter: 'blur(10px)' as any,
    }),
  },
  processingContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  processingText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[50],
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    fontSize: Platform.OS === 'web' ? 18 : theme.typography.sizes.base,
  },
  processingSteps: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s ease' as any,
    }),
  },
  stepIndicatorActive: {
    backgroundColor: theme.colors.gold[500],
    width: 24,
  },
  stepIndicatorCompleted: {
    backgroundColor: theme.colors.gold[400],
  },
  cameraLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 5,
  },
});
