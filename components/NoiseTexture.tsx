
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface NoiseTextureProps {
  opacity?: number;
}

export default function NoiseTexture({ opacity = 0.04 }: NoiseTextureProps) {
  // Generate a noise pattern using CSS for web, and a simulated pattern for native
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.noiseContainer,
          {
            opacity,
            // @ts-expect-error - Web-specific CSS property not in React Native types
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          },
        ]}
        pointerEvents="none"
      />
    );
  }

  // For native platforms, create a subtle dotted pattern to simulate noise
  return (
    <View style={[styles.noiseContainer, { opacity }]} pointerEvents="none">
      <View style={styles.noisePattern} />
    </View>
  );
}

const styles = StyleSheet.create({
  noiseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  noisePattern: {
    flex: 1,
    backgroundColor: 'transparent',
    // Create a subtle pattern using background color variations
    // This is a simplified approach for native platforms
  },
});
