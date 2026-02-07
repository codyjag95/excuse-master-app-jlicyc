
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import NoiseTexture from '@/components/NoiseTexture';
import Modal from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';
import { getTopRatedExcuses, type TopRatedExcuse } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';

export default function TopRatedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [topRated, setTopRated] = useState<TopRatedExcuse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  
  useEffect(() => {
    loadTopRated();
  }, []);
  
  const loadTopRated = async () => {
    console.log('Loading top rated excuses');
    setLoading(true);
    try {
      const excuses = await getTopRatedExcuses(20);
      setTopRated(excuses);
      console.log('Top rated excuses loaded:', excuses.length);
    } catch (error) {
      console.error('Failed to load top rated excuses:', error);
      setErrorModal({
        visible: true,
        message: 'Failed to load top rated excuses. Please try again.',
      });
    } finally {
      setLoading(false);
    }
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
          title: 'TOP RATED EXCUSES ⭐',
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
              Loading top rated excuses...
            </Text>
          </View>
        ) : topRated.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              ⭐
            </Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No rated excuses yet!
            </Text>
            <Text style={[styles.emptyMessage, { color: textSecondaryColor }]}>
              Be the first to rate some excuses
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.electricOrange }]}
            >
              <Text style={styles.backButtonText}>
                GO RATE SOME EXCUSES
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {topRated.map((excuse, index) => {
              const rankDisplay = `#${index + 1}`;
              const ratingDisplay = `⭐ ${excuse.averageRating.toFixed(1)}/5`;
              const ratingsCountDisplay = `${excuse.totalRatings} ratings`;
              const sharesDisplay = `${excuse.shareCount} shares`;
              
              return (
                <View key={index} style={[styles.excuseCard, { backgroundColor: colors.slimeGreen }]}>
                  <View style={styles.excuseHeader}>
                    <Text style={styles.rank}>
                      {rankDisplay}
                    </Text>
                    <View style={styles.stats}>
                      <Text style={styles.rating}>
                        {ratingDisplay}
                      </Text>
                      <Text style={styles.statDivider}>
                        •
                      </Text>
                      <Text style={styles.statText}>
                        {ratingsCountDisplay}
                      </Text>
                      <Text style={styles.statDivider}>
                        •
                      </Text>
                      <Text style={styles.statText}>
                        {sharesDisplay}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.excuseText}>
                    {excuse.excuse}
                  </Text>
                  
                  <View style={styles.situationBadge}>
                    <Text style={styles.situationText}>
                      {excuse.situation}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
        
        <Modal
          visible={errorModal.visible}
          onClose={() => setErrorModal({ visible: false, message: '' })}
          title="Oops!"
          message={errorModal.message}
          type="error"
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
  },
  excuseCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.text,
  },
  excuseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  statDivider: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  excuseText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  situationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.electricOrange,
    borderWidth: 2,
    borderColor: colors.text,
  },
  situationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
});
