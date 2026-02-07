
import { Stack, router } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useColorScheme, Pressable, Platform } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { colors } from "@/styles/commonStyles";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSpring, withTiming, withSequence } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  generateExcuse as apiGenerateExcuse,
  adjustExcuse as apiAdjustExcuse,
  getUltimateExcuse,
  rateExcuse,
  getExcuseRating,
  shareExcuse,
  addFavorite,
  removeFavorite,
  getFavorites,
  getDeviceId,
  getGenerationCount,
  incrementGenerationCount,
  type FavoriteExcuse,
} from "@/utils/api";
import Modal from "@/components/ui/Modal";
import NoiseTexture from "@/components/NoiseTexture";
import { IconSymbol } from "@/components/IconSymbol";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import MobileAds, { BannerAd, BannerAdSize, InterstitialAd, AdEventType, TestIds } from "react-native-google-mobile-ads";

const SITUATIONS = [
  "Late to work",
  "Missed deadline",
  "Forgot birthday",
  "Can't attend event",
  "Didn't do homework",
  "Need to leave early",
];

const TONES = [
  "Believable",
  "Absurd",
  "Overly Detailed",
  "Dramatic",
  "Technical Jargon",
  "Mysterious",
];

const LENGTHS = [
  "Quick one-liner",
  "Short paragraph",
  "Elaborate story",
];

// Initialize AdMob
MobileAds()
  .initialize()
  .then(adapterStatuses => {
    console.log('[AdMob] Initialized:', adapterStatuses);
  });

// Create interstitial ad
const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
  requestNonPersonalizedAdsOnly: true,
});

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const [situation, setSituation] = useState(SITUATIONS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [length, setLength] = useState(LENGTHS[0]);
  const [excuse, setExcuse] = useState("");
  const [excuseId, setExcuseId] = useState("");
  const [believabilityRating, setBelievabilityRating] = useState(0);
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const [successModal, setSuccessModal] = useState({ visible: false, message: "" });
  
  // Rating system state
  const [userRating, setUserRating] = useState(0);
  const [communityRating, setCommunityRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  
  // Favorites state
  const [isFavorite, setIsFavorite] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [favoritesList, setFavoritesList] = useState<FavoriteExcuse[]>([]);
  
  // Ad state
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  
  // Ref for screenshot
  const excuseBubbleRef = useRef<View>(null);
  
  // Animations
  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);
  const titleRotation = useSharedValue(-3);
  const speechBubbleScale = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const heartScale = useSharedValue(1);
  
  useEffect(() => {
    console.log("Excuse Generator 3000 initialized");
    initializeApp();
    
    // Wobble animation for button
    buttonRotation.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 200 }),
        withTiming(-3, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );
    
    // Load interstitial ad
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('[AdMob] Interstitial loaded');
      setInterstitialLoaded(true);
    });
    
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[AdMob] Interstitial closed');
      setShowingAd(false);
      interstitial.load();
    });
    
    interstitial.load();
    
    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);
  
  const initializeApp = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
    console.log('[App] Device ID:', id);
    
    // Load favorites
    try {
      const favs = await getFavorites(id);
      setFavoritesList(favs);
    } catch (error) {
      console.error('[App] Failed to load favorites:', error);
    }
  };
  
  useEffect(() => {
    if (excuse && excuseId) {
      speechBubbleScale.value = withSpring(1, { damping: 10 });
      
      // Show random warning
      const warnings = [
        `WARNING: This excuse has a ${believabilityRating}% believability rating`,
        `FUN FACT: This excuse has been used ${usageCount} times today`,
        `CAUTION: Use at your own risk!`,
        `TIP: Confidence is key when delivering this excuse`,
        `ALERT: May cause raised eyebrows`,
      ];
      const randomWarningText = warnings[Math.floor(Math.random() * warnings.length)];
      setWarningText(randomWarningText);
      setShowWarning(true);
      
      setTimeout(() => setShowWarning(false), 5000);
      
      // Load rating
      loadExcuseRating();
      
      // Check if favorited
      checkIfFavorited();
    }
  }, [excuse, excuseId]);
  
  const loadExcuseRating = async () => {
    if (!excuseId) return;
    
    try {
      const rating = await getExcuseRating(excuseId);
      setCommunityRating(rating.averageRating);
      setTotalRatings(rating.totalRatings);
    } catch (error) {
      console.error('[Rating] Failed to load rating:', error);
    }
  };
  
  const checkIfFavorited = () => {
    const favorited = favoritesList.some(f => f.excuseId === excuseId);
    setIsFavorite(favorited);
  };
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
      { rotate: `${buttonRotation.value}deg` },
    ],
  }));
  
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${titleRotation.value}deg` }],
  }));
  
  const speechBubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speechBubbleScale.value }],
  }));
  
  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));
  
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  
  const handleTitlePress = () => {
    console.log("Title tapped, count:", titleClickCount + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    
    if (newCount === 3) {
      console.log("Easter egg triggered! Generating ultimate excuse");
      generateUltimateExcuse();
      setTitleClickCount(0);
    }
  };
  
  const showInterstitialAd = async (): Promise<boolean> => {
    const count = await getGenerationCount();
    console.log('[AdMob] Generation count:', count);
    
    // Show ad every 5 generations, but not on first generation
    if (count > 0 && count % 5 === 0 && interstitialLoaded) {
      console.log('[AdMob] Showing interstitial ad');
      setShowingAd(true);
      setAdCountdown(5);
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Show ad after countdown
      setTimeout(() => {
        interstitial.show();
      }, 5000);
      
      return true;
    }
    
    return false;
  };
  
  const generateExcuse = async () => {
    console.log("Generating excuse with params:", { situation, tone, length });
    
    // Check if we should show ad
    const shouldShowAd = await showInterstitialAd();
    
    if (shouldShowAd) {
      // Wait for ad to finish
      await new Promise(resolve => {
        const checkAd = setInterval(() => {
          if (!showingAd) {
            clearInterval(checkAd);
            resolve(true);
          }
        }, 100);
      });
    }
    
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSequence(
      withSpring(0.9),
      withSpring(1.1),
      withSpring(1)
    );
    
    try {
      const response = await apiGenerateExcuse({ situation, tone, length });
      
      setExcuse(response.excuse);
      setExcuseId(response.id || '');
      setBelievabilityRating(response.believabilityRating);
      setUsageCount(response.usageCount);
      setHistory(prev => [response.excuse, ...prev.slice(0, 4)]);
      setUserRating(0);
      setHasRated(false);
      
      // Increment generation count
      await incrementGenerationCount();
      
      console.log("Excuse generated successfully:", response);
    } catch (error) {
      console.error("Failed to generate excuse:", error);
      setErrorModal({
        visible: true,
        message: "Failed to generate excuse. Please check your internet connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const adjustExcuse = async (direction: "better" | "worse") => {
    console.log(`Adjusting excuse to make it ${direction}`);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const response = await apiAdjustExcuse({
        originalExcuse: excuse,
        situation,
        tone,
        length,
        direction,
      });
      
      setExcuse(response.excuse);
      setExcuseId(response.id || '');
      setBelievabilityRating(response.believabilityRating);
      setHistory(prev => [response.excuse, ...prev.slice(0, 4)]);
      setUserRating(0);
      setHasRated(false);
      console.log(`Excuse adjusted successfully:`, response);
    } catch (error) {
      console.error("Failed to adjust excuse:", error);
      setErrorModal({
        visible: true,
        message: "Failed to adjust excuse. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateUltimateExcuse = async () => {
    console.log("Generating ULTIMATE excuse");
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const response = await getUltimateExcuse();
      
      setExcuse(response.excuse);
      setExcuseId(response.id || '');
      setBelievabilityRating(response.believabilityRating);
      setUsageCount(1);
      setHistory(prev => [response.excuse, ...prev.slice(0, 4)]);
      setUserRating(0);
      setHasRated(false);
      console.log("Ultimate excuse generated successfully:", response);
    } catch (error) {
      console.error("Failed to generate ultimate excuse:", error);
      setErrorModal({
        visible: true,
        message: "The ultimate excuse is currently unavailable. Try again later!",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRating = async (rating: number) => {
    if (hasRated || !excuseId) return;
    
    console.log('[Rating] User rated:', rating);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUserRating(rating);
    setHasRated(true);
    
    try {
      const response = await rateExcuse(excuseId, rating);
      setCommunityRating(response.averageRating);
      setTotalRatings(response.totalRatings);
      console.log('[Rating] Rating submitted:', response);
    } catch (error) {
      console.error('[Rating] Failed to submit rating:', error);
      setHasRated(false);
      setUserRating(0);
    }
  };
  
  const handleFavorite = async () => {
    if (!excuseId || !deviceId) return;
    
    console.log('[Favorites] Toggling favorite');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    heartScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    
    try {
      if (isFavorite) {
        await removeFavorite(excuseId, deviceId);
        setIsFavorite(false);
        setFavoritesList(prev => prev.filter(f => f.excuseId !== excuseId));
        console.log('[Favorites] Removed from favorites');
      } else {
        // Check limit
        if (favoritesList.length >= 10) {
          setErrorModal({
            visible: true,
            message: "You've reached the limit of 10 favorites! Remove some to add more, or upgrade for unlimited favorites.",
          });
          return;
        }
        
        await addFavorite(excuseId, deviceId);
        setIsFavorite(true);
        console.log('[Favorites] Added to favorites');
        
        // Reload favorites list
        const favs = await getFavorites(deviceId);
        setFavoritesList(favs);
      }
    } catch (error) {
      console.error('[Favorites] Failed to toggle favorite:', error);
      setErrorModal({
        visible: true,
        message: "Failed to update favorites. Please try again.",
      });
    }
  };
  
  const handleShare = async () => {
    if (!excuse || !excuseId) return;
    
    console.log('[Share] Sharing excuse');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Capture screenshot of excuse bubble
      if (excuseBubbleRef.current) {
        const uri = await captureRef(excuseBubbleRef, {
          format: 'png',
          quality: 1,
        });
        
        console.log('[Share] Screenshot captured:', uri);
        
        // Track share
        await shareExcuse(excuseId, 'native_share');
        
        // Share
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            dialogTitle: 'Share this excuse!',
          });
          
          // Show success with confetti
          confettiOpacity.value = withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 2000 })
          );
          
          setSuccessModal({
            visible: true,
            message: "Excuse shared! 🎉",
          });
          
          setTimeout(() => {
            setSuccessModal({ visible: false, message: "" });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('[Share] Failed to share:', error);
      setErrorModal({
        visible: true,
        message: "Failed to share excuse. Please try again.",
      });
    }
  };
  
  const copyToClipboard = async () => {
    if (!excuse) return;
    
    console.log("Copying excuse to clipboard");
    
    // Use Expo Clipboard
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(excuse);
    } else {
      const Clipboard = require('react-native').Clipboard;
      Clipboard.setString(excuse);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Track as share
    if (excuseId) {
      try {
        await shareExcuse(excuseId, 'clipboard');
      } catch (error) {
        console.error('[Share] Failed to track clipboard share:', error);
      }
    }
    
    // Confetti animation
    confettiOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 1000 })
    );
    
    // Show success message
    setSuccessModal({
      visible: true,
      message: "Excuse copied to clipboard! 🎉",
    });
  };
  
  const startOver = () => {
    console.log("Starting over");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExcuse("");
    setExcuseId("");
    setUserRating(0);
    setHasRated(false);
    setCommunityRating(0);
    setTotalRatings(0);
    setIsFavorite(false);
    speechBubbleScale.value = 0;
  };
  
  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;
  
  const communityRatingDisplay = communityRating > 0 ? `⭐ ${communityRating.toFixed(1)}/5` : 'Not rated yet';
  const totalRatingsDisplay = `${totalRatings} ratings`;
  const favoritesCountDisplay = `${favoritesList.length}/10`;
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Noise texture overlay - only visible in dark mode */}
        {isDark && <NoiseTexture opacity={0.04} />}
        
        {/* Ad Countdown Overlay */}
        {showingAd && (
          <View style={styles.adOverlay}>
            <View style={[styles.adCountdownBox, { backgroundColor: cardColor }]}>
              <Text style={[styles.adCountdownTitle, { color: textColor }]}>
                Loading Ad...
              </Text>
              <Text style={[styles.adCountdownText, { color: colors.electricOrange }]}>
                {adCountdown}
              </Text>
              <Text style={[styles.adCountdownSubtext, { color: textSecondaryColor }]}>
                Ad will close in {adCountdown} seconds
              </Text>
            </View>
          </View>
        )}
        
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
          {/* Menu Buttons */}
          <View style={styles.menuButtons}>
            <TouchableOpacity
              onPress={() => router.push('/favorites')}
              style={[styles.menuButton, { backgroundColor: colors.accent }]}
            >
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={20}
                color={colors.text}
              />
              <Text style={styles.menuButtonText}>
                MY FAVORITES
              </Text>
              <Text style={styles.menuButtonBadge}>
                {favoritesCountDisplay}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/top-rated')}
              style={[styles.menuButton, { backgroundColor: colors.electricOrange }]}
            >
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={20}
                color={colors.text}
              />
              <Text style={styles.menuButtonText}>
                TOP RATED
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Title */}
          <Pressable onPress={handleTitlePress}>
            <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
              <Text style={[styles.title, { color: colors.electricOrange }]}>
                EXCUSE
              </Text>
              <Text style={[styles.title, { color: colors.slimeGreen }]}>
                GENERATOR
              </Text>
              <Text style={[styles.title, { color: colors.electricOrange }]}>
                3000
              </Text>
            </Animated.View>
          </Pressable>
          
          <Text style={[styles.tagline, { color: textSecondaryColor }]}>
            Your AI-Powered Get-Out-Of-Jail-Free Card
          </Text>
          
          {/* Warning Banner */}
          {showWarning && (
            <View style={[styles.warningBanner, { backgroundColor: colors.highlight }]}>
              <Text style={styles.warningText}>
                {warningText}
              </Text>
            </View>
          )}
          
          {/* Dropdowns */}
          <View style={styles.dropdownContainer}>
            <Text style={[styles.label, { color: textColor }]}>
              Situation:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {SITUATIONS.map((s, index) => {
                const isSelected = situation === s;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSituation(s);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.optionButton,
                      { backgroundColor: isSelected ? colors.slimeGreen : cardColor },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: isSelected ? colors.text : textColor }]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <Text style={[styles.label, { color: textColor }]}>
              Tone:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {TONES.map((t, index) => {
                const isSelected = tone === t;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setTone(t);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.optionButton,
                      { backgroundColor: isSelected ? colors.electricOrange : cardColor },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: isSelected ? colors.text : textColor }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <Text style={[styles.label, { color: textColor }]}>
              Length:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {LENGTHS.map((l, index) => {
                const isSelected = length === l;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setLength(l);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.optionButton,
                      { backgroundColor: isSelected ? colors.accent : cardColor },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: isSelected ? colors.text : textColor }]}>
                      {l}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          
          {/* Generate Button */}
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              onPress={generateExcuse}
              disabled={loading}
              style={[styles.generateButton, { backgroundColor: colors.electricOrange }]}
            >
              <Text style={styles.generateButtonText}>
                {loading ? "GENERATING..." : "GENERATE EXCUSE"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Excuse Display */}
          {excuse && (
            <View ref={excuseBubbleRef} collapsable={false}>
              <Animated.View style={[styles.speechBubble, { backgroundColor: colors.slimeGreen }, speechBubbleAnimatedStyle]}>
                {/* Favorite Heart */}
                <Animated.View style={[styles.favoriteHeart, heartAnimatedStyle]}>
                  <TouchableOpacity onPress={handleFavorite}>
                    <IconSymbol
                      ios_icon_name={isFavorite ? "heart.fill" : "heart"}
                      android_material_icon_name={isFavorite ? "favorite" : "favorite-border"}
                      size={28}
                      color={isFavorite ? colors.accent : colors.text}
                    />
                  </TouchableOpacity>
                </Animated.View>
                
                {/* Rating Badge */}
                {communityRating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>
                      ⭐ {communityRating.toFixed(1)}
                    </Text>
                  </View>
                )}
                
                <Text style={styles.excuseText}>
                  {excuse}
                </Text>
                <View style={styles.speechBubbleTriangle} />
              </Animated.View>
            </View>
          )}
          
          {/* Rating System */}
          {excuse && (
            <View style={styles.ratingSection}>
              <Text style={[styles.ratingQuestion, { color: textColor }]}>
                How believable is this excuse?
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isSelected = star <= userRating;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRating(star)}
                      disabled={hasRated}
                    >
                      <IconSymbol
                        ios_icon_name={isSelected ? "star.fill" : "star"}
                        android_material_icon_name={isSelected ? "star" : "star-border"}
                        size={40}
                        color={isSelected ? colors.electricOrange : textSecondaryColor}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              {hasRated && (
                <View style={styles.communityRating}>
                  <Text style={[styles.communityRatingText, { color: textColor }]}>
                    Community Rating: {communityRatingDisplay}
                  </Text>
                  <Text style={[styles.communityRatingSubtext, { color: textSecondaryColor }]}>
                    {totalRatingsDisplay}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Share Button */}
          {excuse && (
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.shareButton, { backgroundColor: colors.electricOrange }]}
            >
              <IconSymbol
                ios_icon_name="square.and.arrow.up"
                android_material_icon_name="share"
                size={20}
                color={colors.text}
              />
              <Text style={styles.shareButtonText}>
                SHARE THIS EXCUSE
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Action Buttons */}
          {excuse && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => adjustExcuse("worse")}
                disabled={loading}
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.actionButtonText}>
                  TOO GOOD? MAKE IT WORSE
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => adjustExcuse("better")}
                disabled={loading}
                style={[styles.actionButton, { backgroundColor: colors.slimeGreen }]}
              >
                <Text style={styles.actionButtonText}>
                  TOO OBVIOUS? MAKE IT BETTER
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={generateExcuse}
                disabled={loading}
                style={[styles.actionButton, { backgroundColor: colors.electricOrange }]}
              >
                <Text style={styles.actionButtonText}>
                  GIVE ME ANOTHER
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={copyToClipboard}
                style={[styles.actionButton, { backgroundColor: cardColor }]}
              >
                <Text style={[styles.actionButtonText, { color: textColor }]}>
                  COPY TO CLIPBOARD
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={startOver}
                style={[styles.actionButton, { backgroundColor: cardColor }]}
              >
                <Text style={[styles.actionButtonText, { color: textColor }]}>
                  START OVER
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* History Toggle */}
          {history.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowHistory(!showHistory)}
              style={[styles.historyToggle, { backgroundColor: cardColor }]}
            >
              <Text style={[styles.historyToggleText, { color: textColor }]}>
                {showHistory ? "HIDE HISTORY" : "SHOW HISTORY"}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* History */}
          {showHistory && history.length > 0 && (
            <View style={[styles.historyContainer, { backgroundColor: cardColor }]}>
              <Text style={[styles.historyTitle, { color: textColor }]}>
                Recent Excuses:
              </Text>
              {history.map((h, index) => {
                const historyNumber = `${index + 1}. `;
                return (
                  <Text key={index} style={[styles.historyItem, { color: textSecondaryColor }]}>
                    {historyNumber}
                    {h}
                  </Text>
                );
              })}
            </View>
          )}
          
          {/* Disclaimer */}
          <Text style={[styles.disclaimer, { color: textSecondaryColor }]}>
            For entertainment purposes only. We are not responsible for any consequences of using these excuses.
          </Text>
          
          {/* Confetti Overlay */}
          <Animated.View style={[styles.confettiOverlay, confettiAnimatedStyle]} pointerEvents="none">
            <Text style={styles.confettiText}>
              🎉 🎊 ✨ 🎉 🎊 ✨
            </Text>
          </Animated.View>
          
          {/* Bottom padding for banner ad */}
          <View style={{ height: 80 }} />
        </ScrollView>
        
        {/* Banner Ad */}
        <View style={styles.bannerAdContainer}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
        
        {/* Error Modal */}
        <Modal
          visible={errorModal.visible}
          onClose={() => setErrorModal({ visible: false, message: "" })}
          title="Oops!"
          message={errorModal.message}
          type="error"
          confirmText="OK"
        />
        
        {/* Success Modal */}
        <Modal
          visible={successModal.visible}
          onClose={() => setSuccessModal({ visible: false, message: "" })}
          title="Success!"
          message={successModal.message}
          type="success"
          confirmText="Awesome!"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  menuButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    width: '100%',
  },
  menuButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.text,
    gap: 6,
  },
  menuButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  menuButtonBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  warningBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  warningText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  dropdownContainer: {
    width: "100%",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
  },
  optionScroll: {
    marginBottom: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: colors.text,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  generateButton: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 4,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  generateButtonText: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 1,
  },
  speechBubble: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    width: "100%",
    borderWidth: 4,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  speechBubbleTriangle: {
    position: "absolute",
    bottom: -20,
    left: 40,
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderTopWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.slimeGreen,
  },
  favoriteHeart: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.electricOrange,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  excuseText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 24,
    marginTop: 40,
  },
  ratingSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  communityRating: {
    marginTop: 12,
    alignItems: 'center',
  },
  communityRatingText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  communityRatingSubtext: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: colors.text,
    gap: 8,
    width: '100%',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  actionButtons: {
    width: "100%",
    gap: 10,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  historyToggle: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.text,
  },
  historyToggleText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  historyContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    width: "100%",
    borderWidth: 2,
    borderColor: colors.text,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  historyItem: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 30,
    fontStyle: "italic",
  },
  confettiOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  confettiText: {
    fontSize: 60,
  },
  bannerAdContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: colors.text,
  },
  adOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  adCountdownBox: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: colors.text,
    alignItems: 'center',
  },
  adCountdownTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  adCountdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  adCountdownSubtext: {
    fontSize: 14,
    fontWeight: '600',
  },
});
