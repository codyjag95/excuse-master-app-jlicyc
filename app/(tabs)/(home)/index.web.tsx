
import { Stack, router } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useColorScheme, Pressable } from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { colors } from "@/styles/commonStyles";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSpring, withTiming, withSequence } from "react-native-reanimated";
import { generateExcuse as apiGenerateExcuse, adjustExcuse as apiAdjustExcuse, getUltimateExcuse } from "@/utils/api";
import Modal from "@/components/ui/Modal";
import NoiseTexture from "@/components/NoiseTexture";
import { IconSymbol } from "@/components/IconSymbol";
import { saveFavorite, isFavorited, removeFavorite, saveRating, getRating } from "@/utils/storage";

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

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const [situation, setSituation] = useState(SITUATIONS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [length, setLength] = useState(LENGTHS[0]);
  const [excuse, setExcuse] = useState("");
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [limitModal, setLimitModal] = useState(false);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [showRatedMessage, setShowRatedMessage] = useState(false);
  
  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);
  const titleRotation = useSharedValue(-3);
  const speechBubbleScale = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const heartScale = useSharedValue(1);
  const starScales = [
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
  ];
  
  // Create animated styles for stars OUTSIDE of render
  const star0AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScales[0].value }],
  }));
  
  const star1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScales[1].value }],
  }));
  
  const star2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScales[2].value }],
  }));
  
  const star3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScales[3].value }],
  }));
  
  const star4AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScales[4].value }],
  }));
  
  const starAnimatedStyles = useMemo(() => [
    star0AnimatedStyle,
    star1AnimatedStyle,
    star2AnimatedStyle,
    star3AnimatedStyle,
    star4AnimatedStyle,
  ], [star0AnimatedStyle, star1AnimatedStyle, star2AnimatedStyle, star3AnimatedStyle, star4AnimatedStyle]);
  
  useEffect(() => {
    console.log("Excuse Generator 3000 initialized (Web)");
    buttonRotation.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 200 }),
        withTiming(-3, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );
  }, [buttonRotation]);
  
  useEffect(() => {
    const loadExcuseData = async () => {
      if (excuse) {
        speechBubbleScale.value = withSpring(1, { damping: 10 });
        
        const favorited = await isFavorited(excuse);
        setIsFavorite(favorited);
        
        const rating = await getRating(excuse);
        setCurrentRating(rating);
        
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
      } else {
        setCurrentRating(null);
      }
    };
    
    loadExcuseData();
  }, [excuse, believabilityRating, usageCount, speechBubbleScale]);
  
  const handleRateExcuse = async (rating: number) => {
    if (!excuse) return;
    
    console.log('Rating excuse (Web):', rating);
    
    starScales[rating - 1].value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    
    setCurrentRating(rating);
    await saveRating(excuse, rating);
    
    setShowRatedMessage(true);
    setTimeout(() => {
      setShowRatedMessage(false);
    }, 1500);
  };
  
  const handleToggleFavorite = async () => {
    if (!excuse) return;
    
    console.log('Toggling favorite (Web)');
    
    heartScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    
    if (isFavorite) {
      const favorites = await import('@/utils/storage').then(m => m.getFavorites());
      const favs = await favorites;
      const fav = favs.find(f => f.excuse === excuse);
      
      if (fav) {
        const success = await removeFavorite(fav.id);
        if (success) {
          setIsFavorite(false);
          setSuccessModal({
            visible: true,
            message: "Removed from favorites! 💔",
          });
          
          setTimeout(() => {
            setSuccessModal({ visible: false, message: "" });
          }, 2000);
        }
      }
    } else {
      const result = await saveFavorite(excuse, situation, tone, length);
      
      if (result.success) {
        setIsFavorite(true);
        setSuccessModal({
          visible: true,
          message: "Added to favorites! ❤️",
        });
        
        setTimeout(() => {
          setSuccessModal({ visible: false, message: "" });
        }, 2000);
      } else if (result.limitReached) {
        setLimitModal(true);
      } else {
        setErrorModal({
          visible: true,
          message: "Failed to save favorite. Please try again.",
        });
      }
    }
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
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    
    if (newCount === 3) {
      console.log("Easter egg triggered! Generating ultimate excuse");
      generateUltimateExcuse();
      setTitleClickCount(0);
    }
  };
  
  const generateExcuse = async () => {
    console.log("Generating excuse with params:", { situation, tone, length });
    setLoading(true);
    buttonScale.value = withSequence(
      withSpring(0.9),
      withSpring(1.1),
      withSpring(1)
    );
    
    try {
      const response = await apiGenerateExcuse({ situation, tone, length });
      
      setExcuse(response.excuse);
      setBelievabilityRating(response.believabilityRating);
      setUsageCount(response.usageCount);
      setHistory(prev => [response.excuse, ...prev.slice(0, 4)]);
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
    
    try {
      const response = await apiAdjustExcuse({
        originalExcuse: excuse,
        situation,
        tone,
        length,
        direction,
      });
      
      setExcuse(response.excuse);
      setBelievabilityRating(response.believabilityRating);
      setHistory(prev => [response.excuse, ...prev.slice(0, 4)]);
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
    
    try {
      const response = await getUltimateExcuse();
      
      setExcuse(response.excuse);
      setBelievabilityRating(response.believabilityRating);
      setUsageCount(1);
      setHistory(prev => [response.excuse, ...prev.slice(0, 4)]);
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
  
  const handleShareExcuse = async () => {
    if (!excuse) return;
    
    console.log("Sharing excuse (Web)");
    
    const shareText = `${excuse} - Generated by Excuse Generator 3000`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Excuse Generator 3000',
          text: shareText,
        });
        
        setSuccessModal({
          visible: true,
          message: "Shared! 🎉",
        });
        
        setTimeout(() => {
          setSuccessModal({ visible: false, message: "" });
        }, 2000);
      } else {
        await navigator.clipboard.writeText(shareText);
        
        setSuccessModal({
          visible: true,
          message: "Excuse copied to clipboard!",
        });
        
        setTimeout(() => {
          setSuccessModal({ visible: false, message: "" });
        }, 2000);
      }
    } catch (error: any) {
      console.error("Failed to share excuse:", error);
      
      if (error.name === 'AbortError') {
        console.log("User cancelled share");
        return;
      }
      
      try {
        await navigator.clipboard.writeText(shareText);
        setSuccessModal({
          visible: true,
          message: "Excuse copied to clipboard!",
        });
        
        setTimeout(() => {
          setSuccessModal({ visible: false, message: "" });
        }, 2000);
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError);
        setErrorModal({
          visible: true,
          message: "Failed to share excuse. Please try again.",
        });
      }
    }
  };
  
  const copyToClipboard = async () => {
    if (!excuse) return;
    
    console.log("Copying excuse to clipboard");
    
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(excuse);
        
        confettiOpacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 1000 })
        );
        
        setSuccessModal({
          visible: true,
          message: "Excuse copied to clipboard! 🎉",
        });
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        setErrorModal({
          visible: true,
          message: "Failed to copy to clipboard. Please try again.",
        });
      }
    }
  };
  
  const startOver = () => {
    console.log("Starting over");
    setExcuse("");
    speechBubbleScale.value = 0;
  };
  
  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "EXCUSE GENERATOR 3000",
          headerStyle: {
            backgroundColor: bgColor,
          },
          headerTintColor: colors.electricOrange,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 16,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                console.log('Navigating to favorites');
                router.push('/favorites');
              }}
              style={styles.favoritesButton}
            >
              <Text style={styles.favoritesButtonText}>
                MY FAVORITES ❤️
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {isDark && <NoiseTexture opacity={0.04} />}
        
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
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
          
          {showWarning && (
            <View style={[styles.warningBanner, { backgroundColor: colors.highlight }]}>
              <Text style={styles.warningText}>
                {warningText}
              </Text>
            </View>
          )}
          
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
          
          {excuse && (
            <Animated.View style={[styles.speechBubble, { backgroundColor: colors.slimeGreen }, speechBubbleAnimatedStyle]}>
              <Animated.View style={[styles.heartButton, heartAnimatedStyle]}>
                <TouchableOpacity onPress={handleToggleFavorite}>
                  <IconSymbol
                    ios_icon_name={isFavorite ? "heart.fill" : "heart"}
                    android_material_icon_name={isFavorite ? "favorite" : "favorite-border"}
                    size={28}
                    color={isFavorite ? colors.hotPink : colors.text}
                  />
                </TouchableOpacity>
              </Animated.View>
              
              {currentRating && (
                <View style={[styles.ratingBadge, { backgroundColor: colors.electricOrange }]}>
                  <Text style={styles.ratingBadgeText}>
                    ⭐ 
                  </Text>
                  <Text style={styles.ratingBadgeText}>
                    {currentRating}
                  </Text>
                </View>
              )}
              
              <Text style={styles.excuseText}>
                {excuse}
              </Text>
              <View style={styles.speechBubbleTriangle} />
            </Animated.View>
          )}
          
          {excuse && (
            <View style={styles.ratingSection}>
              <Text style={[styles.ratingPrompt, { color: textColor }]}>
                How believable is this excuse?
              </Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star, index) => {
                  const isFilled = currentRating !== null && star <= currentRating;
                  const starColor = isFilled ? colors.electricOrange : '#CCCCCC';
                  const starIconName = isFilled ? 'star' : 'star-border';
                  
                  return (
                    <Animated.View key={star} style={starAnimatedStyles[index]}>
                      <TouchableOpacity
                        onPress={() => handleRateExcuse(star)}
                        style={styles.starButton}
                      >
                        <IconSymbol
                          ios_icon_name={isFilled ? "star.fill" : "star"}
                          android_material_icon_name={starIconName}
                          size={24}
                          color={starColor}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
              
              {showRatedMessage && (
                <View style={[styles.ratedMessage, { backgroundColor: colors.electricOrange }]}>
                  <Text style={styles.ratedMessageText}>
                    Rated! ⭐
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {excuse && (
            <TouchableOpacity
              onPress={handleShareExcuse}
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
          
          <Text style={[styles.disclaimer, { color: textSecondaryColor }]}>
            For entertainment purposes only. We are not responsible for any consequences of using these excuses.
          </Text>
          
          <Animated.View style={[styles.confettiOverlay, confettiAnimatedStyle]} pointerEvents="none">
            <Text style={styles.confettiText}>
              🎉 🎊 ✨ 🎉 🎊 ✨
            </Text>
          </Animated.View>
        </ScrollView>
        
        <Modal
          visible={errorModal.visible}
          onClose={() => setErrorModal({ visible: false, message: "" })}
          title="Oops!"
          message={errorModal.message}
          type="error"
          confirmText="OK"
        />
        
        <Modal
          visible={successModal.visible}
          onClose={() => setSuccessModal({ visible: false, message: "" })}
          title="Success!"
          message={successModal.message}
          type="success"
          confirmText="Awesome!"
        />
        
        <Modal
          visible={limitModal}
          onClose={() => setLimitModal(false)}
          title="Favorites Limit Reached"
          message="Free version limited to 10 favorites. Delete one to save another!"
          type="warning"
          confirmText="OK"
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
    paddingTop: 20,
    alignItems: "center",
  },
  favoritesButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  favoritesButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.hotPink,
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
    position: 'relative',
  },
  heartButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  ratingBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
    borderWidth: 2,
    borderColor: colors.text,
  },
  ratingBadgeText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: colors.text,
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
  excuseText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 24,
    paddingRight: 40,
  },
  ratingSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  ratingPrompt: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratedMessage: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.text,
  },
  ratedMessageText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
    borderWidth: 4,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    gap: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 1,
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
});
