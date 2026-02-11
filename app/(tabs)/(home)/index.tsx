
import { Stack } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useColorScheme, Pressable, Clipboard } from "react-native";
import React, { useState, useEffect } from "react";
import { colors } from "@/styles/commonStyles";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSpring, withTiming, withSequence } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { generateExcuse as apiGenerateExcuse, adjustExcuse as apiAdjustExcuse, getUltimateExcuse } from "@/utils/api";
import { loadLocalExcuse, hasLocalExcuses, getExcuseStats } from "@/utils/excuseLoader";
import Modal from "@/components/ui/Modal";
import NoiseTexture from "@/components/NoiseTexture";

const SITUATIONS = [
  "Late to work",
  "Missed deadline",
  "Forgot birthday",
  "Can't attend event",
  "Didn't do homework",
  "Need to leave early",
  "Why I'm single",
  "Ghosting someone",
  "Skipping the gym",
  "Not replying to texts",
  "Missing family gathering",
  "Returning something late",
  "Why I can't lend money",
  "Avoiding phone calls",
  "Breaking up with someone",
  "Quitting a job",
  "Moving back home",
  "Why I haven't visited",
  "Can't make it to wedding",
  "Caught speeding",
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
  const [useLocalExcuses, setUseLocalExcuses] = useState(true);
  
  // Animations
  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);
  const titleRotation = useSharedValue(-3);
  const speechBubbleScale = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  
  useEffect(() => {
    console.log("Excuse Generator 3000 initialized");
    
    // Log excuse database stats
    const stats = getExcuseStats();
    console.log('[ExcuseLoader] Database stats:', stats);
    
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
  }, []);
  
  useEffect(() => {
    if (excuse) {
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
    }
  }, [excuse]);
  
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
  
  const generateExcuse = async () => {
    console.log("Generating excuse with params:", { situation, tone, length, useLocalExcuses });
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSequence(
      withSpring(0.9),
      withSpring(1.1),
      withSpring(1)
    );
    
    try {
      // Try to load from local JSON files first
      if (useLocalExcuses) {
        const localExcuse = loadLocalExcuse(situation, tone, length);
        
        if (localExcuse) {
          setExcuse(localExcuse.excuse);
          setBelievabilityRating(localExcuse.believabilityRating);
          setUsageCount(localExcuse.usageCount);
          setHistory(prev => [localExcuse.excuse, ...prev.slice(0, 4)]);
          console.log("Loaded excuse from local database");
          setLoading(false);
          return;
        }
      }
      
      // Fall back to API if no local excuse found
      console.log("Falling back to API for excuse generation");
      const seed = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const response = await apiGenerateExcuse({ situation, tone, length, seed });
      
      setExcuse(response.excuse);
      setBelievabilityRating(response.believabilityRating);
      setUsageCount(response.usageCount);
      setHistory(prev => [response.excuse, ...prev.slice(0, 4)]);
      console.log("Excuse generated successfully from API:", response);
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
    // For adjustments, always use API since we need to modify existing excuse
    const seed = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log(`Adjusting excuse to make it ${direction} with seed:`, seed);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const response = await apiAdjustExcuse({
        originalExcuse: excuse,
        situation,
        tone,
        length,
        direction,
        seed,
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
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
  
  const copyToClipboard = () => {
    console.log("Copying excuse to clipboard");
    Clipboard.setString(excuse);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
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
    speechBubbleScale.value = 0;
  };
  
  const toggleExcuseSource = () => {
    const newValue = !useLocalExcuses;
    setUseLocalExcuses(newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log("Excuse source toggled:", newValue ? "Local JSON" : "AI API");
  };
  
  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;
  
  const hasLocal = hasLocalExcuses(situation);
  const sourceText = useLocalExcuses ? "📁 LOCAL" : "🤖 AI";
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {isDark && <NoiseTexture opacity={0.04} />}
        
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
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
          
          {/* Source Toggle */}
          <TouchableOpacity
            onPress={toggleExcuseSource}
            style={[styles.sourceToggle, { backgroundColor: useLocalExcuses ? colors.slimeGreen : colors.electricOrange }]}
          >
            <Text style={styles.sourceToggleText}>
              {sourceText}
              {" "}
              {hasLocal && useLocalExcuses ? "✓" : ""}
            </Text>
          </TouchableOpacity>
          
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
              {SITUATIONS.map((s, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      setSituation(s);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.optionButton,
                      { backgroundColor: situation === s ? colors.slimeGreen : cardColor },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: situation === s ? colors.text : textColor }]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </ScrollView>
            
            <Text style={[styles.label, { color: textColor }]}>
              Tone:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {TONES.map((t, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      setTone(t);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.optionButton,
                      { backgroundColor: tone === t ? colors.electricOrange : cardColor },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: tone === t ? colors.text : textColor }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </ScrollView>
            
            <Text style={[styles.label, { color: textColor }]}>
              Length:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {LENGTHS.map((l, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      setLength(l);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.optionButton,
                      { backgroundColor: length === l ? colors.accent : cardColor },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: length === l ? colors.text : textColor }]}>
                      {l}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
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
            <Animated.View style={[styles.speechBubble, { backgroundColor: colors.slimeGreen }, speechBubbleAnimatedStyle]}>
              <Text style={styles.excuseText}>
                {excuse}
              </Text>
              <View style={styles.speechBubbleTriangle} />
            </Animated.View>
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
              {history.map((h, index) => (
                <React.Fragment key={index}>
                  <Text style={[styles.historyItem, { color: textSecondaryColor }]}>
                    {index + 1}
                    {". "}
                    {h}
                  </Text>
                </React.Fragment>
              ))}
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
        </ScrollView>
        
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
    marginBottom: 10,
    textAlign: "center",
  },
  sourceToggle: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.text,
  },
  sourceToggleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
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
  excuseText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 24,
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
