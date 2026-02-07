
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@excuse_generator_favorites';
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
