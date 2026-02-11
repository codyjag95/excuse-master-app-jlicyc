
import { excuseDatabase, getRandomExcuse } from '@/data/excuses';

/**
 * Load a random excuse from local JSON files
 * Falls back to API if no local excuse is found
 */
export function loadLocalExcuse(
  situation: string,
  tone: string,
  length: string
): { excuse: string; believabilityRating: number; usageCount: number } | null {
  console.log('[ExcuseLoader] Loading local excuse for:', { situation, tone, length });
  
  const result = getRandomExcuse(situation, tone, length);
  
  if (result) {
    console.log('[ExcuseLoader] Found local excuse:', result);
    return {
      ...result,
      usageCount: Math.floor(Math.random() * 1000), // Random usage count for fun
    };
  }
  
  console.log('[ExcuseLoader] No local excuse found, will fall back to API');
  return null;
}

/**
 * Check if a situation has local excuses available
 */
export function hasLocalExcuses(situation: string): boolean {
  return situation in excuseDatabase && excuseDatabase[situation].length > 0;
}

/**
 * Get statistics about loaded excuses
 */
export function getExcuseStats() {
  const situations = Object.keys(excuseDatabase);
  const totalExcuses = situations.reduce(
    (sum, situation) => sum + excuseDatabase[situation].length,
    0
  );
  
  return {
    totalSituations: situations.length,
    totalExcuses,
    situations,
  };
}
