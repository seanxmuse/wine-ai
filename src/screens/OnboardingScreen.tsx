import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: 'wine-outline',
    title: 'Discover Great Wines',
    description: 'Scan any wine list and instantly discover the best wines based on critic scores, value, and price.',
    color: theme.colors.primary[600],
  },
  {
    icon: 'camera-outline',
    title: 'Scan & Analyze',
    description: 'Take a photo or upload a wine list. Our AI extracts all wines and matches them to our database.',
    color: theme.colors.gold[500],
  },
  {
    icon: 'trending-up-outline',
    title: 'Smart Recommendations',
    description: 'Get personalized recommendations showing the highest rated wines, best values, and most affordable options.',
    color: theme.colors.accent[500],
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Fair Pricing Insights',
    description: 'See real market prices and markup percentages to make informed decisions at any restaurant.',
    color: theme.colors.primary[700],
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate icon on slide change
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      // Fade out and slide
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width * 0.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide(currentSlide + 1);
        slideAnim.setValue(width * 0.1);
        // Fade in new slide
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Complete onboarding
      handleComplete();
    }
  };

  const handleComplete = async () => {
    // Button press animation
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

    // Save onboarding completion
    await AsyncStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide content */}
      <View style={styles.content}>
        <View style={styles.slideWrapper}>
          <Animated.View
            style={[
              styles.slideContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                { backgroundColor: `${slide.color}15` },
                { transform: [{ scale: iconScale }] },
              ]}
            >
              <Ionicons name={slide.icon as any} size={80} color={slide.color} />
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>{slide.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{slide.description}</Text>
          </Animated.View>
        </View>
      </View>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive,
              {
                backgroundColor:
                  currentSlide === index
                    ? slide.color
                    : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Next/Get Started button */}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: slide.color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={isLastSlide ? 'checkmark-circle' : 'arrow-forward'}
            size={20}
            color={theme.colors.neutral[50]}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: Platform.OS === 'web' ? 40 : 60,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.md,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer' as any,
      transition: 'opacity 0.2s ease' as any,
      ':hover': {
        opacity: 0.7,
      } as any,
    }),
  },
  skipText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    fontSize: Platform.OS === 'web' ? 16 : theme.typography.sizes.base,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...(Platform.OS === 'web' && {
      display: 'flex' as any,
      flexDirection: 'column' as any,
      alignItems: 'center' as any,
      justifyContent: 'center' as any,
      width: '100vw' as any,
      margin: '0' as any,
      padding: '0' as any,
      boxSizing: 'border-box' as any,
    }),
  },
  slideWrapper: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      margin: '0 auto' as any,
      display: 'flex' as any,
      flexDirection: 'column' as any,
      alignItems: 'center' as any,
      justifyContent: 'center' as any,
      width: '100%' as any,
      maxWidth: '500px' as any,
    }),
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    ...(Platform.OS === 'web' && {
      display: 'flex' as any,
      flexDirection: 'column' as any,
      alignItems: 'center' as any,
      justifyContent: 'center' as any,
      width: '100%' as any,
      boxSizing: 'border-box' as any,
      margin: '0' as any,
      padding: '0 24px' as any,
    }),
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' as any,
      display: 'flex' as any,
      alignItems: 'center' as any,
      justifyContent: 'center' as any,
      marginLeft: '0' as any,
      marginRight: '0' as any,
      paddingLeft: '0' as any,
      paddingRight: '0' as any,
    }),
  },
  title: {
    ...theme.typography.styles.heroTitle,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: Platform.OS === 'web' ? 36 : theme.typography.sizes['3xl'],
    marginBottom: theme.spacing.lg,
    width: '100%',
    ...(Platform.OS === 'web' && {
      textAlign: 'center' as any,
      display: 'block' as any,
      width: '100%' as any,
      marginLeft: '0' as any,
      marginRight: '0' as any,
      paddingLeft: '0' as any,
      paddingRight: '0' as any,
      boxSizing: 'border-box' as any,
    }),
  },
  description: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 28 : 24,
    fontSize: Platform.OS === 'web' ? 18 : theme.typography.sizes.base,
    maxWidth: 400,
    width: '100%',
    ...(Platform.OS === 'web' && {
      textAlign: 'center' as any,
      display: 'block' as any,
      marginLeft: 'auto' as any,
      marginRight: 'auto' as any,
      width: '100%' as any,
      maxWidth: '400px' as any,
      boxSizing: 'border-box' as any,
    }),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    gap: theme.spacing.sm,
    width: '100%',
    ...(Platform.OS === 'web' && {
      display: 'flex' as any,
      justifyContent: 'center' as any,
      alignItems: 'center' as any,
    }),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s ease' as any,
    }),
  },
  dotActive: {
    width: 24,
    height: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: Platform.OS === 'web' ? 12 : theme.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    ...theme.shadows.md,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease' as any,
      cursor: 'pointer' as any,
      marginLeft: 'auto' as any,
      marginRight: 'auto' as any,
      display: 'flex' as any,
      ':hover': {
        transform: 'translateY(-2px)' as any,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' as any,
      } as any,
    }),
  },
  buttonText: {
    ...theme.typography.styles.button,
    color: theme.colors.neutral[50],
    fontSize: Platform.OS === 'web' ? 18 : theme.typography.sizes.lg,
    fontWeight: '600' as any,
  },
  buttonIcon: {
    marginLeft: theme.spacing.sm,
  },
});

