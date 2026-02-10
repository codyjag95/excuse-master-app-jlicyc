
import Constants from 'expo-constants';

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
  seed?: string;
}

export interface GenerateExcuseResponse {
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
  seed?: string;
}

export interface AdjustExcuseResponse {
  excuse: string;
  believabilityRating: number;
}

export interface UltimateExcuseResponse {
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
