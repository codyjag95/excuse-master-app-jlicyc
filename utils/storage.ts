
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@excuse_generator_favorites';
const RATING_KEY_PREFIX = '@excuse_generator_rating_';
const GENERATION_COUNT_KEY = '@excuse_generator_generation_count';
const MAX_FAVORITES = 10;

export interface FavoriteExcuse {
  id: string;
  excuse: string;
  situation: string;
  tone: string;
  length: string;
  timestamp: number;
}

/**
 * Cross-platform storage wrapper
 * Uses AsyncStorage on mobile, localStorage on web
 */
class Storage {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  }
}

const storage = new Storage();

/**
 * Get all favorite excuses
 */
export async function getFavorites(): Promise<FavoriteExcuse[]> {
  try {
    const data = await storage.getItem(FAVORITES_KEY);
    if (!data) return [];
    
    const favorites = JSON.parse(data) as FavoriteExcuse[];
    console.log('[Storage] Loaded favorites:', favorites.length);
    return favorites;
  } catch (error) {
    console.error('[Storage] Failed to load favorites:', error);
    return [];
  }
}

/**
 * Save a favorite excuse
 * Returns true if saved, false if limit reached
 */
export async function saveFavorite(
  excuse: string,
  situation: string,
  tone: string,
  length: string
): Promise<{ success: boolean; limitReached?: boolean }> {
  try {
    const favorites = await getFavorites();
    
    // Check if already favorited
    const alreadyExists = favorites.some(fav => fav.excuse === excuse);
    if (alreadyExists) {
      console.log('[Storage] Excuse already favorited');
      return { success: true };
    }
    
    // Check limit
    if (favorites.length >= MAX_FAVORITES) {
      console.log('[Storage] Favorites limit reached');
      return { success: false, limitReached: true };
    }
    
    // Add new favorite
    const newFavorite: FavoriteExcuse = {
      id: Date.now().toString(),
      excuse,
      situation,
      tone,
      length,
      timestamp: Date.now(),
    };
    
    const updatedFavorites = [newFavorite, ...favorites];
    await storage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    
    console.log('[Storage] Favorite saved:', newFavorite.id);
    return { success: true };
  } catch (error) {
    console.error('[Storage] Failed to save favorite:', error);
    return { success: false };
  }
}

/**
 * Remove a favorite excuse
 */
export async function removeFavorite(id: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    
    await storage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    
    console.log('[Storage] Favorite removed:', id);
    return true;
  } catch (error) {
    console.error('[Storage] Failed to remove favorite:', error);
    return false;
  }
}

/**
 * Check if an excuse is favorited
 */
export async function isFavorited(excuse: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    return favorites.some(fav => fav.excuse === excuse);
  } catch (error) {
    console.error('[Storage] Failed to check favorite status:', error);
    return false;
  }
}

/**
 * Clear all favorites
 */
export async function clearAllFavorites(): Promise<boolean> {
  try {
    await storage.removeItem(FAVORITES_KEY);
    console.log('[Storage] All favorites cleared');
    return true;
  } catch (error) {
    console.error('[Storage] Failed to clear favorites:', error);
    return false;
  }
}

/**
 * Get favorites count
 */
export async function getFavoritesCount(): Promise<number> {
  const favorites = await getFavorites();
  return favorites.length;
}

/**
 * Hash excuse text to create a unique key for rating storage
 */
function hashExcuseText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}

/**
 * Save a rating for an excuse (1-5 stars)
 */
export async function saveRating(excuseText: string, rating: number): Promise<boolean> {
  try {
    const hash = hashExcuseText(excuseText);
    const key = `${RATING_KEY_PREFIX}${hash}`;
    await storage.setItem(key, rating.toString());
    console.log('[Storage] Rating saved:', rating, 'for excuse hash:', hash);
    return true;
  } catch (error) {
    console.error('[Storage] Failed to save rating:', error);
    return false;
  }
}

/**
 * Get the rating for an excuse
 * Returns null if no rating exists
 */
export async function getRating(excuseText: string): Promise<number | null> {
  try {
    const hash = hashExcuseText(excuseText);
    const key = `${RATING_KEY_PREFIX}${hash}`;
    const ratingStr = await storage.getItem(key);
    
    if (!ratingStr) {
      return null;
    }
    
    const rating = parseInt(ratingStr, 10);
    console.log('[Storage] Rating loaded:', rating, 'for excuse hash:', hash);
    return rating;
  } catch (error) {
    console.error('[Storage] Failed to get rating:', error);
    return null;
  }
}

/**
 * Get the current generation count for interstitial ads
 */
export async function getGenerationCount(): Promise<number> {
  try {
    const countStr = await storage.getItem(GENERATION_COUNT_KEY);
    if (!countStr) {
      return 0;
    }
    const count = parseInt(countStr, 10);
    console.log('[Storage] Generation count loaded:', count);
    return count;
  } catch (error) {
    console.error('[Storage] Failed to get generation count:', error);
    return 0;
  }
}

/**
 * Increment the generation count
 * Returns the new count
 */
export async function incrementGenerationCount(): Promise<number> {
  try {
    const currentCount = await getGenerationCount();
    const newCount = currentCount + 1;
    await storage.setItem(GENERATION_COUNT_KEY, newCount.toString());
    console.log('[Storage] Generation count incremented to:', newCount);
    return newCount;
  } catch (error) {
    console.error('[Storage] Failed to increment generation count:', error);
    return 0;
  }
}

/**
 * Reset the generation count to 0
 */
export async function resetGenerationCount(): Promise<void> {
  try {
    await storage.setItem(GENERATION_COUNT_KEY, '0');
    console.log('[Storage] Generation count reset to 0');
  } catch (error) {
    console.error('[Storage] Failed to reset generation count:', error);
  }
}
