import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import type { Wine } from '../types';
import { parseWineListImage } from '../services/vision';
import { matchWinesToLwin, getPriceStats, getCriticScores } from '../services/winelabs';
import { calculateMarkup } from '../utils/wineRanking';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';
import { SAMPLE_WINES } from '../utils/sampleData';

type ProcessingStep = 'idle' | 'uploading' | 'parsing' | 'matching' | 'fetching' | 'complete';

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();
  const buttonScale = useRef(new Animated.Value(1)).current;

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
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
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={theme.colors.neutral[50]}
                style={styles.permissionButtonIcon}
              />
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            Your privacy is important. We only use your camera to scan wine lists.
          </Text>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        await processWineList(photo.uri);
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

  const viewSampleData = () => {
    logger.info('DEBUG', 'Viewing sample data (no API calls)');
    (navigation as any).navigate('Results', { wines: SAMPLE_WINES });
  };

  const processWineList = async (imageUri: string) => {
    try {
      logger.info('PROCESS', 'Starting wine list processing', { imageUri });

      // Step 1: Upload image to Supabase Storage
      setProcessingStep('uploading');
      logger.info('UPLOAD', 'Starting image upload...');
      const imageUrl = await uploadImage(imageUri);
      logger.success('UPLOAD', 'Image uploaded successfully', { imageUrl });

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

      // Log unmatched wines for debugging
      if (unmatchedCount > 0) {
        const unmatchedWines = parsedWines
          .map((wine, i) => ({ wine, match: matches[i] }))
          .filter(({ match }) => !match?.lwin && !match?.lwin7)
          .map(({ wine }) => `${wine.wineName} ${wine.vintage || ''}`);
        logger.warn('MATCH', `Unmatched wines (${unmatchedCount}):`, unmatchedWines);
      }

      // Step 4: Fetch pricing and scores for each wine
      setProcessingStep('fetching');
      const wines: Wine[] = await Promise.all(
        parsedWines.map(async (parsed, index) => {
          const match = matches[index];
          const lwin = match?.lwin;

          let realPrice: number | undefined;
          let markup: number | undefined;
          let criticScore: number | undefined;
          let critic: string | undefined;

          if (lwin) {
            // Get price stats
            try {
              const priceStats = await getPriceStats(undefined, lwin);
              realPrice = priceStats.median;
              if (realPrice) {
                markup = calculateMarkup(parsed.price, realPrice);
              }
            } catch (e) {
              console.error('Error fetching price stats:', e);
            }

            // Get critic scores
            try {
              const scores = await getCriticScores(undefined, lwin, parsed.vintage);
              if (scores.length > 0) {
                // Use highest score
                const topScore = scores.reduce((max, s) =>
                  s.score > max.score ? s : max
                );
                criticScore = topScore.score;
                critic = topScore.critic;
              }
            } catch (e) {
              console.error('Error fetching critic scores:', e);
            }
          }

          // Build wine object with fallback for missing display name
          const displayName = match?.display_name || match?.wl_display_name || parsed.wineName || 'Unknown Wine';

          const wine: Wine = {
            lwin7: match?.lwin7,
            lwin: match?.lwin,
            displayName,
            vintage: parsed.vintage,
            restaurantPrice: parsed.price,
            realPrice,
            markup,
            criticScore,
            critic,
          };

          // Log wine data for debugging
          logger.debug('WINE', `Processed wine: ${displayName}`, {
            hasLwin: !!lwin,
            hasPrice: !!realPrice,
            hasScore: !!criticScore,
            markup: markup ? `${markup.toFixed(0)}%` : 'N/A'
          });

          return wine;
        })
      );

      // Step 5: Save scan to database
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data: scan, error: scanError } = await supabase
          .from('scans')
          .insert({
            user_id: session.session.user.id,
            image_url: imageUrl,
          })
          .select()
          .single();

        if (scan && !scanError) {
          // Save wine results
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
            }))
          );
        }
      }

      // Navigate to results
      setProcessingStep('complete');
      setPreviewImage(null);
      (navigation as any).navigate('Results', { wines });
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

    // Detect image type from URI or blob
    let fileExtension = 'jpg';
    let contentType = 'image/jpeg';

    // Fetch the image and convert to Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Determine content type from blob or URI
    if (blob.type) {
      contentType = blob.type;
      if (blob.type === 'image/png') {
        fileExtension = 'png';
      } else if (blob.type === 'image/heic') {
        fileExtension = 'heic';
      } else if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') {
        fileExtension = 'jpg';
      }
    } else if (uri.toLowerCase().includes('.png')) {
      contentType = 'image/png';
      fileExtension = 'png';
    } else if (uri.toLowerCase().includes('.heic')) {
      contentType = 'image/heic';
      fileExtension = 'heic';
    }

    const fileName = `${userId}/${Date.now()}.${fileExtension}`;

    const { error } = await supabase.storage
      .from('wine-lists')
      .upload(fileName, blob, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

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
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.previewImageContainer}>
            <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
          </View>

          <View style={styles.previewActions}>
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
                  <Text style={styles.analyzeButtonText}>Analyze</Text>
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

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan Wine List</Text>
            <Text style={styles.subtitle}>
              Position wine list within frame
            </Text>

            {/* Debug Mode Button */}
            <TouchableOpacity
              style={styles.debugButton}
              onPress={viewSampleData}
              activeOpacity={0.7}
            >
              <Ionicons name="flask-outline" size={16} color={theme.colors.gold[700]} />
              <Text style={styles.debugButtonText}>View Sample Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.frameContainer}>
            <View style={styles.frame} />
          </View>

          <View style={styles.controls}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.libraryButton}
                onPress={pickImage}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="images-outline" 
                  size={24} 
                  color={theme.colors.neutral[50]} 
                  style={styles.libraryIcon}
                />
                <Text style={styles.libraryButtonText}>Library</Text>
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

            <View style={styles.placeholder} />
          </View>
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
    case 'uploading':
      return 'Uploading image...';
    case 'parsing':
      return 'Extracting wine information...';
    case 'matching':
      return 'Matching wines to database...';
    case 'fetching':
      return 'Fetching prices and scores...';
    case 'complete':
      return 'Complete!';
    default:
      return 'Preparing...';
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
    backgroundColor: theme.colors.neutral[900],
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.neutral[900],
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  cameraPlaceholderText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[50],
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontSize: Platform.OS === 'web' ? 18 : theme.typography.sizes.base,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.neutral[50],
    marginBottom: Platform.OS === 'web' ? theme.spacing.xl : theme.spacing.lg,
    textAlign: 'center',
    ...(Platform.OS === 'web' && {
      marginBottom: '40px' as any,
      lineHeight: '1.2' as any,
    }),
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[200],
    textAlign: 'center',
    ...(Platform.OS === 'web' && {
      marginTop: '0px' as any,
      paddingTop: '0px' as any,
      lineHeight: '1.5' as any,
    }),
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gold[100],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.md,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer' as any,
      transition: 'all 0.2s ease' as any,
    }),
  },
  debugButtonText: {
    ...theme.typography.styles.label,
    color: theme.colors.gold[700],
    fontSize: 13,
    fontWeight: '600' as any,
    marginLeft: theme.spacing.xs,
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  frame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderWidth: 3,
    borderColor: theme.colors.gold[500],
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.gold,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing['3xl'],
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: Platform.OS === 'web' ? 12 : theme.borderRadius.lg,
    minWidth: 120,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)' as any,
      WebkitBackdropFilter: 'blur(20px)' as any,
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
    }),
    ...theme.shadows.md,
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
  controlText: {
    ...theme.typography.styles.button,
    color: theme.colors.neutral[50],
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.gold[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.neutral[50],
    ...theme.shadows.gold,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
      ':hover': {
        transform: 'scale(1.05)' as any,
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
    backgroundColor: theme.colors.neutral[50],
  },
  placeholder: {
    width: 60,
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
  privacyNote: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing['2xl'],
    fontSize: Platform.OS === 'web' ? 14 : theme.typography.sizes.sm,
    fontStyle: 'italic',
    paddingHorizontal: theme.spacing.lg,
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
    padding: theme.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  analyzeButton: {
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
});
