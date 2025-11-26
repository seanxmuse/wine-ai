import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme, rf, rs } from '../theme';
import { parseWineListImage } from '../services/vision';
import { matchWinesToLwin, getPriceStats, getCriticScores } from '../services/winelabs';
import { searchCriticScoresOnWeb } from '../services/webSearch';
import { calculateMarkup } from '../utils/wineRanking';
import { supabase } from '../services/supabase';
import { createGeneralChatConversation, addAssistantMessage } from '../services/chat';
import { formatWinesAsMarkdown } from '../utils/wineFormatting';
import type { Wine } from '../types';

type ProcessingStep = 'idle' | 'uploading' | 'parsing' | 'matching' | 'fetching' | 'complete';

/**
 * Simple Web Camera - Works on mobile browsers
 * Integrated with wine list scanning workflow
 */
export function SimpleCameraWeb() {
  const navigation = useNavigation();
  const videoRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');

  useEffect(() => {
    // Add CSS to hide video controls globally
    const style = document.createElement('style');
    style.textContent = `
      video::-webkit-media-controls {
        display: none !important;
      }
      video::-webkit-media-controls-enclosure {
        display: none !important;
      }
      video::-webkit-media-controls-panel {
        display: none !important;
      }
      video::-webkit-media-controls-play-button {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Check if camera permission was previously granted and auto-start
    const checkAndStartCamera = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('[WEB CAMERA] Permission status:', result.state);

          if (result.state === 'granted') {
            console.log('[WEB CAMERA] Camera permission already granted, auto-starting');
            setCheckingPermission(false);
            setPermissionGranted(true);

            // Immediately start camera without waiting for another useEffect
            try {
              const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: 'environment',
                  width: { ideal: 1920 },
                  height: { ideal: 1080 }
                },
                audio: false
              });

              console.log('[WEB CAMERA] Stream obtained on mount');
              setStream(mediaStream);
              setCameraStarted(true);
            } catch (err) {
              console.error('[WEB CAMERA] Error starting camera on mount:', err);
              setPermissionGranted(false);
            }
            return;
          }
        }
        console.log('[WEB CAMERA] Permission not granted or check not supported');
      } catch (err) {
        console.log('[WEB CAMERA] Could not check camera permission:', err);
      } finally {
        setCheckingPermission(false);
      }
    };

    checkAndStartCamera();

    return () => {
      stopCamera();
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Attach stream to video element when both are ready
  useEffect(() => {
    if (stream && videoRef.current && cameraStarted && !photo) {
      console.log('[WEB CAMERA] Attaching stream to video element');
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => {
        console.log('[WEB CAMERA] Video is playing');
      }).catch((err: any) => {
        console.error('[WEB CAMERA] Error playing video:', err);
      });
    }
  }, [stream, cameraStarted, photo]);

  // Reset state when navigating back to camera
  useFocusEffect(
    React.useCallback(() => {
      console.log('[WEB CAMERA] Screen focused - resetting state');
      // Reset processing state so "Complete!" overlay doesn't show
      setIsProcessing(false);
      setProcessingStep('idle');
      setPhoto(null);
      setError('');
      // Camera stream is maintained by the main useEffect
      return () => {
        // Cleanup when screen loses focus
        console.log('[WEB CAMERA] Screen unfocused');
      };
    }, [])
  );

  const startCamera = async () => {
    try {
      console.log('[WEB CAMERA] Starting...');

      if (Platform.OS !== 'web') {
        setError('This component only works on web');
        return;
      }

      // Request camera with back camera preference
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      console.log('[WEB CAMERA] Stream obtained');
      setStream(mediaStream);
      setPermissionGranted(true);
      setCameraStarted(true);

    } catch (err: any) {
      console.error('[WEB CAMERA] Error:', err);
      setError(err.message || 'Camera access denied');
      setPermissionGranted(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraStarted(false);
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('[WEB CAMERA] Refs not ready');
      return;
    }

    // Get video dimensions
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setPhoto(imageData);

    console.log('[WEB CAMERA] Photo captured');
  };

  const retake = () => {
    console.log('[WEB CAMERA] Retake - clearing photo and restarting camera');
    setPhoto(null);
    setError(null);
    setIsProcessing(false);
    setProcessingStep('idle');

    // Restart camera if stream is not active
    if (!stream || !stream.active) {
      console.log('[WEB CAMERA] Stream not active, restarting camera');
      startCamera();
    } else if (videoRef.current) {
      // Ensure video element is playing
      console.log('[WEB CAMERA] Stream active, ensuring video playback');
      videoRef.current.play().catch((err: any) => {
        console.error('[WEB CAMERA] Error restarting video playback:', err);
        startCamera();
      });
    }
  };

  const pickImage = async () => {
    try {
      // Request media library permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to select images.');
        return;
      }

      // Open the Photos library directly
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 1,
        // Force JPEG format to avoid HEIC issues
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[PICKER] Selected image:', asset.uri);
        console.log('[PICKER] Image type:', asset.mimeType);
        console.log('[PICKER] Image size:', asset.width, 'x', asset.height);

        // Convert to JPEG data URL to ensure compatibility
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        console.log('[PICKER] Blob type:', blob.type, 'size:', blob.size);

        // Convert to JPEG if needed
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;

            // If it's HEIC or any non-JPEG format, convert via canvas
            if (!blob.type.includes('jpeg') && !blob.type.includes('jpg')) {
              console.log('[PICKER] Converting non-JPEG image to JPEG');
              const img = document.createElement('img') as HTMLImageElement;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                console.log('[PICKER] Converted to JPEG, new size:', jpegDataUrl.length);
                setPhoto(jpegDataUrl);
                resolve();
              };
              img.src = dataUrl;
            } else {
              console.log('[PICKER] Image is already JPEG');
              setPhoto(dataUrl);
              resolve();
            }
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (err: any) {
      console.error('[PICKER] Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image: ' + err.message);
    }
  };

  const processWineList = async () => {
    if (!photo) return;

    setIsProcessing(true);
    setProcessingStep('uploading');

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      // Convert data URL to blob
      const response = await fetch(photo);
      const blob = await response.blob();

      // Upload to Supabase storage with user-specific path
      const fileName = `${currentUser.id}/scans/wine-list-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('wine-lists')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wine-lists')
        .getPublicUrl(fileName);

      // Parse wine list using the data URL directly (not the storage URL)
      // This avoids issues with private storage buckets
      setProcessingStep('parsing');
      const parsedWines = await parseWineListImage(photo);

      if (!parsedWines || parsedWines.length === 0) {
        throw new Error('No wines found in image');
      }

      // Match wines to LWIN
      setProcessingStep('matching');
      const matchedWines = await matchWinesToLwin(parsedWines.map(w => w.wineName));

      // Fetch price stats and critic scores
      setProcessingStep('fetching');
      const winesWithData: Wine[] = await Promise.all(
        matchedWines.map(async (match, index) => {
          const originalWine = parsedWines[index];
          
          if (!match.lwin) {
            return {
              displayName: match.display_name || originalWine.wineName,
              restaurantPrice: originalWine.price,
              vintage: match.vintage || originalWine.vintage,
              dataSource: match.dataSource as any,
              webSearchPrice: match.webSearchPrice,
              webSearchSource: match.webSearchSource,
              searchConfidence: match.confidence ? match.confidence * 100 : undefined,
            };
          }

          try {
            const [priceData, scoresData] = await Promise.all([
              getPriceStats(undefined, match.lwin),
              getCriticScores(undefined, match.lwin),
            ]);

            const medianPrice = priceData?.median || undefined;
            const markup = originalWine.price && medianPrice
              ? calculateMarkup(originalWine.price, medianPrice)
              : undefined;

            // If Wine Labs doesn't have critic scores, try web search
            let criticScore = scoresData?.[0]?.score;
            let critic = scoresData?.[0]?.critic;
            let criticSource = scoresData?.[0]?.score ? 'Wine Labs' : undefined;
            let criticSourceUrl: string | undefined;

            if (!criticScore) {
              console.log(`[SimpleCameraWeb] No Wine Labs scores for ${originalWine.wineName}, trying web search...`);
              try {
                const webScores = await searchCriticScoresOnWeb(
                  match.display_name || originalWine.wineName,
                  match.vintage || originalWine.vintage
                );

                if (webScores.length > 0) {
                  // Use the first (best) score from web search
                  criticScore = webScores[0].score;
                  critic = webScores[0].critic;
                  criticSource = webScores[0].source || 'Wine Searcher';
                  criticSourceUrl = webScores[0].sourceUrl;
                  console.log(`[SimpleCameraWeb] Found web score: ${criticScore} from ${criticSource}`);
                }
              } catch (webErr) {
                console.error(`[SimpleCameraWeb] Web search failed for ${originalWine.wineName}:`, webErr);
              }
            }

            return {
              displayName: match.display_name || originalWine.wineName,
              lwin: match.lwin,
              lwin7: match.lwin7,
              restaurantPrice: originalWine.price,
              vintage: match.vintage || originalWine.vintage,
              realPrice: medianPrice,
              markup: markup ?? undefined,
              criticScore,
              critic,
              criticSource,
              criticSourceUrl,
              dataSource: match.dataSource as any,
            };
          } catch (err) {
            console.error(`Error fetching data for ${originalWine.wineName}:`, err);
            return {
              displayName: match.display_name || originalWine.wineName,
              restaurantPrice: originalWine.price,
              vintage: match.vintage || originalWine.vintage,
              lwin: match.lwin,
              lwin7: match.lwin7,
            };
          }
        })
      );

      // Save scan to database
      const { data: { user } } = await supabase.auth.getUser();
      let scanId: string | undefined;
      let conversationId: string | undefined;
      let assistantMessageId: string | undefined;

      if (user) {
        const { data: scan } = await supabase
          .from('scans')
          .insert({
            user_id: user.id,
            image_url: publicUrl,
            wine_count: winesWithData.length,
          })
          .select()
          .single();

        if (scan) {
          scanId = scan.id;

          await supabase.from('wine_results').insert(
            winesWithData.map((wine) => ({
              scan_id: scan.id,
              name: wine.displayName,
              vintage: wine.vintage,
              price: wine.restaurantPrice,
              lwin: wine.lwin,
              median_price: wine.realPrice,
              markup_percentage: wine.markup,
              critic_score: wine.criticScore,
              critic_name: wine.critic,
            }))
          );

          // Create a chat conversation for this scan with messages
          try {
            console.log('[WEB CAMERA] Creating chat conversation for scan:', scan.id);
            const conversation = await createGeneralChatConversation(publicUrl);
            conversationId = conversation.id;

            // Update the conversation with scanId
            await supabase
              .from('chat_conversations')
              .update({ scan_id: scan.id })
              .eq('id', conversation.id);

            // Save user message "Analyze this wine list" with the image
            const { data: userMsg, error: userMsgError } = await supabase
              .from('chat_messages')
              .insert({
                conversation_id: conversation.id,
                role: 'user',
                content: 'Analyze this wine list',
                image_url: publicUrl,
              })
              .select()
              .single();

            if (userMsgError) {
              console.error('[WEB CAMERA] Error saving user message:', userMsgError);
            }

            // Format wines and save assistant message
            const markdownContent = formatWinesAsMarkdown(winesWithData);
            const assistantContent = `${markdownContent}\n\nWould you like me to help you find the best value or highest rated wines?`;
            
            const assistantMessage = await addAssistantMessage(
              conversation.id,
              assistantContent,
              { wines: winesWithData, imageUrl: publicUrl }
            );
            assistantMessageId = assistantMessage.id;

            console.log('[WEB CAMERA] Chat conversation created with messages:', conversationId);
          } catch (chatErr) {
            console.error('[WEB CAMERA] Error creating chat conversation:', chatErr);
            // Don't fail the entire scan if chat creation fails
          }
        }
      }

      setProcessingStep('complete');

      // Navigate to results with wines data and message ID for chat
      (navigation as any).navigate('Results', {
        wines: winesWithData,
        imageUrl: publicUrl,
        scanId,
        conversationId,
        assistantMessageId,
      });

    } catch (err: any) {
      console.error('[WEB CAMERA] Processing error:', err);
      setError(err.message || 'Failed to process wine list');
      setIsProcessing(false);
      setProcessingStep('idle');
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          This camera only works on web browsers
        </Text>
      </View>
    );
  }

  // Loading state while checking permission
  if (checkingPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.gold[500]} />
      </View>
    );
  }

  // Permission request screen
  if (!permissionGranted && !cameraStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera" size={64} color={theme.colors.gold[500]} />
          </View>

          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Wine Scanner needs access to your camera to scan wine lists and identify great deals.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.grantButton} onPress={startCamera}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.grantButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => (navigation as any).navigate('ChatHistory')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: photo! }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.gold[500]} />
          <Text style={styles.processingText}>
            {processingStep === 'uploading' && 'Uploading image...'}
            {processingStep === 'parsing' && 'Reading wine list...'}
            {processingStep === 'matching' && 'Matching wines...'}
            {processingStep === 'fetching' && 'Fetching wine data...'}
            {processingStep === 'complete' && 'Complete!'}
          </Text>
        </View>
      </View>
    );
  }

  // Photo preview mode
  if (photo) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: photo }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={retake} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Review Photo</Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.retakeButton} onPress={retake}>
            <Ionicons name="camera-reverse" size={24} color={theme.colors.text.primary} />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanButton} onPress={processWineList}>
            <Ionicons name="scan" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Wine List</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera mode
  return (
    <View style={styles.container}>
      {/* Video element */}
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
        playsInline
        autoPlay
        muted
        controls={false}
        webkit-playsinline="true"
      />

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Camera UI overlay */}
      {cameraStarted && !error && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={pickImage}
              style={styles.iconButton}
            >
              <Ionicons name="images" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={() => (navigation as any).navigate('ChatHistory')}
              style={styles.iconButton}
            >
              <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Settings')}
              style={styles.iconButton}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Capture button */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Position the wine list in frame
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: rs(60),
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(20),
    zIndex: 20,
  },
  iconButton: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: rf(18),
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: rs(40),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  captureButton: {
    width: rs(70),
    height: rs(70),
    borderRadius: rs(35),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: '#fff',
  },
  instructions: {
    position: 'absolute',
    bottom: rs(140),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: rf(15),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: rs(20),
    paddingVertical: rs(10),
    borderRadius: 20,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: rs(20),
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: rf(15),
    textAlign: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: rs(120),
    left: rs(20),
    right: rs(20),
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    padding: rs(12),
    borderRadius: 8,
  },
  errorBannerText: {
    color: '#fff',
    fontSize: rf(14),
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: rs(40),
    left: rs(20),
    right: rs(20),
    flexDirection: 'row',
    gap: rs(12),
    zIndex: 10,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: rs(14),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
  },
  retakeButtonText: {
    color: theme.colors.text.primary,
    fontSize: rf(15),
    fontWeight: '600',
  },
  scanButton: {
    flex: 2,
    backgroundColor: theme.colors.gold[500],
    paddingVertical: rs(14),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
  },
  scanButtonText: {
    color: '#fff',
    fontSize: rf(15),
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: rs(16),
  },
  processingText: {
    color: '#fff',
    fontSize: rf(17),
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(40),
    backgroundColor: theme.colors.background,
  },
  permissionIcon: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rs(24),
    borderWidth: 2,
    borderColor: theme.colors.gold[500],
  },
  permissionTitle: {
    fontSize: rf(24),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: rs(12),
    textAlign: 'center',
  },
  permissionText: {
    fontSize: rf(16),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: rf(22),
    marginBottom: rs(24),
    paddingHorizontal: rs(8),
  },
  errorBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 8,
    padding: rs(12),
    marginBottom: rs(20),
    width: '100%',
  },
  errorBoxText: {
    color: '#ff6b6b',
    fontSize: rf(14),
    textAlign: 'center',
  },
  grantButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gold[500],
    paddingVertical: rs(14),
    paddingHorizontal: rs(24),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(10),
    width: '100%',
    marginBottom: rs(12),
  },
  grantButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: rs(12),
    paddingHorizontal: rs(20),
  },
  skipButtonText: {
    color: theme.colors.text.secondary,
    fontSize: rf(15),
  },
});
