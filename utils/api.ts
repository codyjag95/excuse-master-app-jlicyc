
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get backend URL from app.json configuration
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

console.log('[API] Backend URL configured:', BACKEND_URL);

/**
 * Generic API call wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}:`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[API] Success:`, data);
    return data as T;
  } catch (error) {
    console.error('[API] Request failed:', error);
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(endpoint: string, body: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' });
}

// ============================================
// Excuse Generator API Types & Functions
// ============================================

export interface GenerateExcuseRequest {
  situation: string;
  tone: string;
  length: string;
}

export interface GenerateExcuseResponse {
  id: string;
  excuse: string;
  believabilityRating: number;
  usageCount: number;
}

export interface AdjustExcuseRequest {
  originalExcuse: string;
  situation: string;
  tone: string;
  length: string;
  direction: 'better' | 'worse';
}

export interface AdjustExcuseResponse {
  id: string;
  excuse: string;
  believabilityRating: number;
}

export interface UltimateExcuseResponse {
  id: string;
  excuse: string;
  believabilityRating: number;
}

/**
 * Generate a new excuse based on parameters
 */
export async function generateExcuse(
  params: GenerateExcuseRequest
): Promise<GenerateExcuseResponse> {
  return apiPost<GenerateExcuseResponse>('/api/excuses/generate', params);
}

/**
 * Adjust an existing excuse to make it better or worse
 */
export async function adjustExcuse(
  params: AdjustExcuseRequest
): Promise<AdjustExcuseResponse> {
  return apiPost<AdjustExcuseResponse>('/api/excuses/adjust', params);
}

/**
 * Get the ultimate excuse (Easter egg)
 */
export async function getUltimateExcuse(): Promise<UltimateExcuseResponse> {
  return apiGet<UltimateExcuseResponse>('/api/excuses/ultimate');
}

// ============================================
// Rating System API
// ============================================

export interface RateExcuseRequest {
  rating: number;
}

export interface RateExcuseResponse {
  success: boolean;
  averageRating: number;
  totalRatings: number;
}

export interface ExcuseRatingResponse {
  averageRating: number;
  totalRatings: number;
}

export interface TopRatedExcuse {
  excuse: string;
  situation: string;
  averageRating: number;
  totalRatings: number;
  shareCount: number;
  excuseId: string;
}

/**
 * Rate an excuse (1-5 stars)
 */
export async function rateExcuse(
  excuseId: string,
  rating: number
): Promise<RateExcuseResponse> {
  return apiPost<RateExcuseResponse>(`/api/excuses/${excuseId}/rate`, { rating });
}

/**
 * Get rating for an excuse
 */
export async function getExcuseRating(
  excuseId: string
): Promise<ExcuseRatingResponse> {
  return apiGet<ExcuseRatingResponse>(`/api/excuses/${excuseId}/rating`);
}

/**
 * Get top rated excuses
 */
export async function getTopRatedExcuses(
  limit: number = 10
): Promise<TopRatedExcuse[]> {
  return apiGet<TopRatedExcuse[]>(`/api/excuses/top-rated?limit=${limit}`);
}

// ============================================
// Share Tracking API
// ============================================

export interface ShareExcuseRequest {
  shareMethod: string;
}

export interface ShareExcuseResponse {
  success: boolean;
  totalShares: number;
}

/**
 * Track excuse share
 */
export async function shareExcuse(
  excuseId: string,
  shareMethod: string
): Promise<ShareExcuseResponse> {
  return apiPost<ShareExcuseResponse>(`/api/excuses/${excuseId}/share`, { shareMethod });
}

// ============================================
// Favorites API
// ============================================

export interface AddFavoriteRequest {
  excuseId: string;
  deviceId: string;
}

export interface AddFavoriteResponse {
  success: boolean;
  favorite: {
    id: string;
    excuseId: string;
    deviceId: string;
    createdAt: string;
  };
}

export interface FavoriteExcuse {
  id: string;
  excuseId: string;
  excuse: string;
  situation: string;
  tone: string;
  length: string;
  averageRating: number;
  createdAt: string;
}

export interface ClearFavoritesResponse {
  success: boolean;
  deletedCount: number;
}

/**
 * Add excuse to favorites
 */
export async function addFavorite(
  excuseId: string,
  deviceId: string
): Promise<AddFavoriteResponse> {
  return apiPost<AddFavoriteResponse>('/api/favorites', { excuseId, deviceId });
}

/**
 * Remove excuse from favorites
 */
export async function removeFavorite(
  excuseId: string,
  deviceId: string
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/api/favorites/${excuseId}?deviceId=${deviceId}`);
}

/**
 * Get all favorites for a device
 */
export async function getFavorites(
  deviceId: string
): Promise<FavoriteExcuse[]> {
  return apiGet<FavoriteExcuse[]>(`/api/favorites?deviceId=${deviceId}`);
}

/**
 * Clear all favorites for a device
 */
export async function clearAllFavorites(
  deviceId: string
): Promise<ClearFavoritesResponse> {
  return apiDelete<ClearFavoritesResponse>(`/api/favorites/clear?deviceId=${deviceId}`);
}

// ============================================
// Device ID & Storage Utilities
// ============================================

const DEVICE_ID_KEY = '@excuse_generator_device_id';
const GENERATION_COUNT_KEY = '@excuse_generator_generation_count';

/**
 * Get or create a unique device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('[Storage] Created new device ID:', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('[Storage] Failed to get device ID:', error);
    return `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Get generation count for interstitial ad tracking
 */
export async function getGenerationCount(): Promise<number> {
  try {
    const count = await AsyncStorage.getItem(GENERATION_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('[Storage] Failed to get generation count:', error);
    return 0;
  }
}

/**
 * Increment generation count
 */
export async function incrementGenerationCount(): Promise<number> {
  try {
    const count = await getGenerationCount();
    const newCount = count + 1;
    await AsyncStorage.setItem(GENERATION_COUNT_KEY, newCount.toString());
    console.log('[Storage] Generation count incremented to:', newCount);
    return newCount;
  } catch (error) {
    console.error('[Storage] Failed to increment generation count:', error);
    return 0;
  }
}

/**
 * Reset generation count (on app close/restart)
 */
export async function resetGenerationCount(): Promise<void> {
  try {
    await AsyncStorage.setItem(GENERATION_COUNT_KEY, '0');
    console.log('[Storage] Generation count reset');
  } catch (error) {
    console.error('[Storage] Failed to reset generation count:', error);
  }
}
