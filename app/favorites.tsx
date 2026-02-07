
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import NoiseTexture from '@/components/NoiseTexture';
import Modal from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';
import {
  getFavorites,
  removeFavorite,
  clearAllFavorites,
  getDeviceId,
  generateExcuse,
  type FavoriteExcuse,
} from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';
import * as Sharing from 'expo-sharing';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [favorites, setFavorites] = useState<FavoriteExcuse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });
  const [confirmModal, setConfirmModal] = useState({ visible: false, message: '', onConfirm: () => {} });
  
  useEffect(() => {
    loadFavorites();
  }, []);
  
  const loadFavorites = async () => {
    console.log('Loading favorites');
    setLoading(true);
    try {
      const id = await getDeviceId();
      setDeviceId(id);
      const favs = await getFavorites(id);
      setFavorites(favs);
      console.log('Favorites loaded:', favs.length);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setErrorModal({
        visible: true,
        message: 'Failed to load favorites. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (excuseId: string) => {
    console.log('Deleting favorite:', excuseId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await removeFavorite(excuseId, deviceId);
      setFavorites(prev => prev.filter(f => f.excuseId !== excuseId));
      setSuccessModal({
        visible: true,
        message: 'Favorite removed! 💔',
      });
    } catch (error) {
      console.error('Failed to delete favorite:', error);
      setErrorModal({
        visible: true,
        message: 'Failed to remove favorite. Please try again.',
      });
    }
  };
  
  const handleClearAll = () => {
    console.log('Clear all favorites requested');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setConfirmModal({
      visible: true,
      message: 'Are you sure you want to clear all favorites? This cannot be undone.',
      onConfirm: async () => {
        try {
          const result = await clearAllFavorites(deviceId);
          setFavorites([]);
          setSuccessModal({
            visible: true,
            message: `Cleared ${result.deletedCount} favorites! 🧹`,
          });
        } catch (error) {
          console.error('Failed to clear favorites:', error);
          setErrorModal({
            visible: true,
            message: 'Failed to clear favorites. Please try again.',
          });
        }
      },
    });
  };
  
  const handleRegenerateSimilar = async (fav: FavoriteExcuse) => {
    console.log('Regenerating similar excuse for:', fav.excuseId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await generateExcuse({
        situation: fav.situation,
        tone: fav.tone,
        length: fav.length,
      });
      
      setSuccessModal({
        visible: true,
        message: 'New excuse generated! Check the home screen.',
      });
      
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Failed to regenerate excuse:', error);
      setErrorModal({
        visible: true,
        message: 'Failed to generate new excuse. Please try again.',
      });
    }
  };
  
  const handleShare = async (excuse: string) => {
    console.log('Sharing excuse from favorites');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync('data:text/plain;base64,' + btoa(excuse));
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          title: 'MY FAVORITES ❤️',
          headerStyle: {
            backgroundColor: bgColor,
          },
          headerTintColor: colors.electricOrange,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        }}
      />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {isDark && <NoiseTexture opacity={0.04} />}
        
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.slimeGreen} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Loading favorites...
            </Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              💚
            </Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No excuses saved yet!
            </Text>
            <Text style={[styles.emptyMessage, { color: textSecondaryColor }]}>
              Tap the heart on any excuse to save it for later
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.slimeGreen }]}
            >
              <Text style={styles.backButtonText}>
                GO GENERATE SOME EXCUSES
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {favorites.map((fav, index) => {
                const ratingDisplay = fav.averageRating > 0 ? `⭐ ${fav.averageRating.toFixed(1)}` : 'Not rated';
                const dateDisplay = formatDate(fav.createdAt);
                
                return (
                  <View key={index} style={[styles.favoriteCard, { backgroundColor: colors.slimeGreen }]}>
                    <View style={styles.favoriteHeader}>
                      <Text style={styles.favoriteRating}>
                        {ratingDisplay}
                      </Text>
                      <Text style={styles.favoriteDate}>
                        {dateDisplay}
                      </Text>
                    </View>
                    
                    <Text style={styles.favoriteExcuse}>
                      {fav.excuse}
                    </Text>
                    
                    <View style={styles.favoriteSettings}>
                      <Text style={styles.favoriteSettingText}>
                        {fav.situation}
                      </Text>
                      <Text style={styles.favoriteSettingText}>
                        •
                      </Text>
                      <Text style={styles.favoriteSettingText}>
                        {fav.tone}
                      </Text>
                      <Text style={styles.favoriteSettingText}>
                        •
                      </Text>
                      <Text style={styles.favoriteSettingText}>
                        {fav.length}
                      </Text>
                    </View>
                    
                    <View style={styles.favoriteActions}>
                      <TouchableOpacity
                        onPress={() => handleShare(fav.excuse)}
                        style={[styles.favoriteActionButton, { backgroundColor: colors.electricOrange }]}
                      >
                        <IconSymbol
                          ios_icon_name="square.and.arrow.up"
                          android_material_icon_name="share"
                          size={18}
                          color={colors.text}
                        />
                        <Text style={styles.favoriteActionText}>
                          Share
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleRegenerateSimilar(fav)}
                        style={[styles.favoriteActionButton, { backgroundColor: colors.accent }]}
                      >
                        <IconSymbol
                          ios_icon_name="arrow.clockwise"
                          android_material_icon_name="refresh"
                          size={18}
                          color={colors.text}
                        />
                        <Text style={styles.favoriteActionText}>
                          Re-generate
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleDelete(fav.excuseId)}
                        style={[styles.favoriteActionButton, { backgroundColor: cardColor }]}
                      >
                        <IconSymbol
                          ios_icon_name="trash"
                          android_material_icon_name="delete"
                          size={18}
                          color={textColor}
                        />
                        <Text style={[styles.favoriteActionText, { color: textColor }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleClearAll}
                style={[styles.clearButton, { backgroundColor: cardColor }]}
              >
                <Text style={[styles.clearButtonText, { color: textColor }]}>
                  CLEAR ALL FAVORITES
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        <Modal
          visible={errorModal.visible}
          onClose={() => setErrorModal({ visible: false, message: '' })}
          title="Oops!"
          message={errorModal.message}
          type="error"
          confirmText="OK"
        />
        
        <Modal
          visible={successModal.visible}
          onClose={() => setSuccessModal({ visible: false, message: '' })}
          title="Success!"
          message={successModal.message}
          type="success"
          confirmText="Awesome!"
        />
        
        <Modal
          visible={confirmModal.visible}
          onClose={() => setConfirmModal({ visible: false, message: '', onConfirm: () => {} })}
          title="Confirm"
          message={confirmModal.message}
          type="warning"
          confirmText="Yes, Clear All"
          cancelText="Cancel"
          onConfirm={confirmModal.onConfirm}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.text,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  favoriteCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.text,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  favoriteRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  favoriteDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  favoriteExcuse: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  favoriteSettings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  favoriteSettingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  favoriteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  favoriteActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.text,
    gap: 4,
  },
  favoriteActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: colors.text,
  },
  clearButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
