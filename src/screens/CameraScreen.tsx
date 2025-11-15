import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import type { Wine } from '../types';
import { parseWineListImage } from '../services/vision';
import { matchWinesToLwin, getPriceStats, getCriticScores } from '../services/winelabs';
import { calculateMarkup } from '../utils/wineRanking';
import { supabase } from '../services/supabase';

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          We need camera permission to scan wine lists
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
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

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        await processWineList(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processWineList = async (imageUri: string) => {
    try {
      // Step 1: Upload image to Supabase Storage
      const imageUrl = await uploadImage(imageUri);

      // Step 2: Parse wine list with LLM
      const parsedWines = await parseWineListImage(imageUri);

      if (parsedWines.length === 0) {
        Alert.alert('No wines found', 'Could not extract wines from this image. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Step 3: Match wines to LWIN identifiers
      const queries = parsedWines.map(w => `${w.wineName} ${w.vintage || ''}`);
      const matches = await matchWinesToLwin(queries);

      // Step 4: Fetch pricing and scores for each wine
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

          return {
            lwin7: match?.lwin7,
            lwin: match?.lwin,
            displayName: match?.display_name || parsed.wineName,
            vintage: parsed.vintage,
            restaurantPrice: parsed.price,
            realPrice,
            markup,
            criticScore,
            critic,
          };
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
      navigation.navigate('Results', { wines });
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing wine list:', error);
      Alert.alert('Error', 'Failed to process wine list. Please try again.');
      setIsProcessing(false);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User not authenticated');
    }

    const userId = session.session.user.id;
    const fileName = `${userId}/${Date.now()}.jpg`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: fileName,
    } as any);

    const { data, error } = await supabase.storage
      .from('wine-lists')
      .upload(fileName, formData);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('wine-lists')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

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
          </View>

          <View style={styles.frameContainer}>
            <View style={styles.frame} />
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.libraryButton}
              onPress={pickImage}
              disabled={isProcessing}
            >
              <Text style={styles.controlText}>Library</Text>
            </TouchableOpacity>

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
          <ActivityIndicator size="large" color={theme.colors.gold[500]} />
          <Text style={styles.processingText}>Analyzing wine list...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[900],
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    ...theme.typography.styles.sectionTitle,
    color: theme.colors.neutral[50],
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[200],
    textAlign: 'center',
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
    padding: theme.spacing.md,
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
  permissionText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  permissionButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.text.inverse,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    ...theme.typography.styles.body,
    color: theme.colors.neutral[50],
    marginTop: theme.spacing.lg,
  },
});
