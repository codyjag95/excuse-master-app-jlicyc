
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Excuse Generator 3000 Color Scheme
export const colors = {
  // Primary colors
  slimeGreen: '#39FF14',
  electricOrange: '#FF6600',
  hotPink: '#FF1493', // Hot pink for favorites
  
  // Background colors - Updated to deep black/dark charcoal
  background: '#FFFEF0', // Cream (light mode)
  backgroundDark: '#0a0a0a', // Deep black (dark mode)
  
  // Text colors
  text: '#000000',
  textDark: '#FFFFFF',
  textSecondary: '#333333',
  textSecondaryDark: '#CCCCCC',
  
  // UI colors
  card: '#FFFFFF',
  cardDark: '#2A2A2A',
  border: '#E0E0E0',
  borderDark: '#404040',
  
  // Accent colors
  primary: '#39FF14',
  secondary: '#FF6600',
  accent: '#FF1493', // Hot pink for extra pop
  highlight: '#FFFF00', // Yellow for warnings
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  titleDark: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitleDark: {
    fontSize: 16,
    color: colors.textSecondaryDark,
    textAlign: 'center',
  },
});
