
// Import the master excuse database
import masterExcuses from './master-excuses.json';

// Import individual excuse files (legacy support)
import lateToWork from './late-to-work.json';
import missedDeadline from './missed-deadline.json';
import forgotBirthday from './forgot-birthday.json';

// Type definition for excuse format
export interface RawExcuseData {
  excuse: string;
  believabilityRating: number;
  tone: string;
  length: string;
}

export interface ProcessedExcuse {
  excuse: string;
  believabilityRating: number;
  tone: string;
  length: string;
}

// Tone mapping: display format to normalized
const toneMap: Record<string, string> = {
  'Believable': 'believable',
  'Absurd': 'absurd',
  'Dramatic': 'dramatic',
  'Mysterious': 'mysterious',
  'Technical Jargon': 'technical',
  'Overly Detailed': 'detailed',
  'Funny': 'believable', // Mapped to believable as per user's spec
};

// Length mapping: display format to normalized
const lengthMap: Record<string, string> = {
  'Quick one-liner': 'short',
  'Short paragraph': 'medium',
  'Elaborate story': 'long',
};

// Reverse mappings for display
const reverseToneMap: Record<string, string> = {
  'believable': 'Believable',
  'absurd': 'Absurd',
  'dramatic': 'Dramatic',
  'mysterious': 'Mysterious',
  'technical': 'Technical Jargon',
  'detailed': 'Overly Detailed',
};

const reverseLengthMap: Record<string, string> = {
  'short': 'Quick one-liner',
  'medium': 'Short paragraph',
  'long': 'Elaborate story',
};

// Auto-calculate believability rating based on tone
function calculateBelievabilityRating(tone: string): number {
  const lowerTone = tone.toLowerCase();
  
  switch (lowerTone) {
    case 'believable':
      return Math.floor(Math.random() * (100 - 70 + 1)) + 70; // 70-100
    case 'absurd':
      return Math.floor(Math.random() * (30 - 1 + 1)) + 1; // 1-30
    case 'dramatic':
      return Math.floor(Math.random() * (60 - 40 + 1)) + 40; // 40-60
    case 'mysterious':
      return Math.floor(Math.random() * (70 - 50 + 1)) + 50; // 50-70
    case 'technical':
    case 'technical jargon':
      return Math.floor(Math.random() * (65 - 45 + 1)) + 45; // 45-65
    case 'detailed':
    case 'overly detailed':
      return Math.floor(Math.random() * (55 - 35 + 1)) + 35; // 35-55
    default:
      return Math.floor(Math.random() * (70 - 30 + 1)) + 30; // 30-70 for unknown tones
  }
}

// Process master excuses database
const processedMasterExcuses: Record<string, ProcessedExcuse[]> = {};

// Type assertion for the master excuses structure
const masterExcusesData = masterExcuses as Record<string, RawExcuseData[]>;

// Process each situation from the master file
Object.keys(masterExcusesData).forEach((situation) => {
  const excusesArray = masterExcusesData[situation];
  
  if (Array.isArray(excusesArray) && excusesArray.length > 0) {
    processedMasterExcuses[situation] = excusesArray.map((excuse) => ({
      excuse: excuse.excuse,
      believabilityRating: excuse.believabilityRating || calculateBelievabilityRating(excuse.tone),
      tone: excuse.tone,
      length: excuse.length,
    }));
    
    console.log(`[ExcuseDB] Loaded ${excusesArray.length} excuses for "${situation}"`);
  }
});

// Merge with legacy individual files (for backward compatibility)
const legacyExcuses: Record<string, any> = {
  "Late to work": lateToWork,
  "Missed deadline": missedDeadline,
  "Forgot birthday": forgotBirthday,
};

// Process legacy files and merge (master file takes precedence)
Object.keys(legacyExcuses).forEach((situation) => {
  if (!processedMasterExcuses[situation] || processedMasterExcuses[situation].length === 0) {
    const legacyData = legacyExcuses[situation];
    const excusesArray = Array.isArray(legacyData) ? legacyData : [legacyData];
    
    processedMasterExcuses[situation] = excusesArray.map((excuse: any) => ({
      excuse: excuse.excuse,
      believabilityRating: excuse.believabilityRating || calculateBelievabilityRating(excuse.tone),
      tone: excuse.tone,
      length: excuse.length,
    }));
  }
});

// Export the final excuse database
export const excuseDatabase: Record<string, ProcessedExcuse[]> = processedMasterExcuses;

// Helper function to normalize tone/length for comparison
function normalizeTone(tone: string): string {
  const lowerTone = tone.toLowerCase();
  return toneMap[tone] || lowerTone;
}

function normalizeLength(length: string): string {
  const lowerLength = length.toLowerCase();
  return lengthMap[length] || lowerLength;
}

// Helper function to get a random excuse based on filters
export function getRandomExcuse(
  situation: string,
  tone?: string,
  length?: string
): { excuse: string; believabilityRating: number } | null {
  const excuses = excuseDatabase[situation];
  
  if (!excuses || excuses.length === 0) {
    console.log(`[ExcuseDB] No excuses found for situation: ${situation}`);
    return null;
  }
  
  console.log(`[ExcuseDB] Found ${excuses.length} excuses for "${situation}"`);
  
  // Filter by tone and length if provided
  let filteredExcuses = excuses;
  
  if (tone) {
    const normalizedTone = normalizeTone(tone);
    filteredExcuses = filteredExcuses.filter(e => {
      const excuseTone = e.tone.toLowerCase();
      return excuseTone === normalizedTone || excuseTone === tone.toLowerCase();
    });
    console.log(`[ExcuseDB] After tone filter (${tone}): ${filteredExcuses.length} excuses`);
  }
  
  if (length) {
    const normalizedLength = normalizeLength(length);
    filteredExcuses = filteredExcuses.filter(e => {
      const excuseLength = e.length.toLowerCase();
      return excuseLength === normalizedLength || excuseLength === length.toLowerCase();
    });
    console.log(`[ExcuseDB] After length filter (${length}): ${filteredExcuses.length} excuses`);
  }
  
  // If no matches after filtering, use all excuses for that situation
  if (filteredExcuses.length === 0) {
    console.log(`[ExcuseDB] No exact matches found, using all excuses for ${situation}`);
    filteredExcuses = excuses;
  }
  
  // Pick a random excuse
  const randomIndex = Math.floor(Math.random() * filteredExcuses.length);
  const selectedExcuse = filteredExcuses[randomIndex];
  
  console.log(`[ExcuseDB] Selected excuse #${randomIndex + 1}/${filteredExcuses.length}`);
  
  return {
    excuse: selectedExcuse.excuse,
    believabilityRating: selectedExcuse.believabilityRating,
  };
}

// Helper to get all situations that have excuse data
export function getAvailableSituations(): string[] {
  return Object.keys(excuseDatabase);
}

// Get statistics about the excuse database
export function getExcuseStats() {
  const situations = Object.keys(excuseDatabase);
  const totalExcuses = situations.reduce(
    (sum, situation) => sum + excuseDatabase[situation].length,
    0
  );
  
  const stats = {
    totalSituations: situations.length,
    totalExcuses,
    situations,
    excusesBySituation: {} as Record<string, number>,
  };
  
  situations.forEach((situation) => {
    stats.excusesBySituation[situation] = excuseDatabase[situation].length;
  });
  
  return stats;
}
