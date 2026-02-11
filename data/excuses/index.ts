
// Import all excuse JSON files
import lateToWork from './late-to-work.json';
import missedDeadline from './missed-deadline.json';
import forgotBirthday from './forgot-birthday.json';

// Type definition for the new excuse format
export interface Excuse {
  situation: string;
  tone: string; // lowercase: "believable", "absurd", "dramatic", "mysterious", "technical", "detailed"
  length: string; // simplified: "short", "medium", "long"
  excuse: string;
  believabilityRating?: number; // Optional - will be auto-calculated if missing
}

// Map situation names to their excuse data
// Each JSON file can now contain either a single object {} or an array []
export const excuseDatabase: Record<string, Excuse[]> = {
  "Late to work": Array.isArray(lateToWork) ? lateToWork : [lateToWork],
  "Missed deadline": Array.isArray(missedDeadline) ? missedDeadline : [missedDeadline],
  "Forgot birthday": Array.isArray(forgotBirthday) ? forgotBirthday : [forgotBirthday],
  // Add more mappings as you create more JSON files
  // "Can't attend event": cantAttendEvent,
  // "Didn't do homework": didntDoHomework,
  // etc.
};

// Tone mapping: lowercase to display format
const toneMap: Record<string, string> = {
  believable: "Believable",
  absurd: "Absurd",
  dramatic: "Dramatic",
  mysterious: "Mysterious",
  technical: "Technical Jargon",
  detailed: "Overly Detailed",
};

// Length mapping: simplified to display format
const lengthMap: Record<string, string> = {
  short: "Quick one-liner",
  medium: "Short paragraph",
  long: "Elaborate story",
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
      return Math.floor(Math.random() * (65 - 45 + 1)) + 45; // 45-65
    case 'detailed':
      return Math.floor(Math.random() * (55 - 35 + 1)) + 35; // 35-55
    default:
      return Math.floor(Math.random() * (70 - 30 + 1)) + 30; // 30-70 for unknown tones
  }
}

// Helper function to normalize tone/length for comparison
function normalizeTone(tone: string): string {
  const lowerTone = tone.toLowerCase();
  // Map display format back to lowercase
  const reverseMap: Record<string, string> = {
    'believable': 'believable',
    'absurd': 'absurd',
    'overly detailed': 'detailed',
    'dramatic': 'dramatic',
    'technical jargon': 'technical',
    'mysterious': 'mysterious',
  };
  return reverseMap[lowerTone] || lowerTone;
}

function normalizeLength(length: string): string {
  const lowerLength = length.toLowerCase();
  // Map display format back to simplified
  const reverseMap: Record<string, string> = {
    'quick one-liner': 'short',
    'short paragraph': 'medium',
    'elaborate story': 'long',
  };
  return reverseMap[lowerLength] || lowerLength;
}

// Helper function to get a random excuse based on filters
export function getRandomExcuse(
  situation: string,
  tone?: string,
  length?: string
): { excuse: string; believabilityRating: number } | null {
  const excuses = excuseDatabase[situation];
  
  if (!excuses || excuses.length === 0) {
    console.log(`No excuses found for situation: ${situation}`);
    return null;
  }
  
  // Filter by tone and length if provided
  let filteredExcuses = excuses;
  
  if (tone) {
    const normalizedTone = normalizeTone(tone);
    filteredExcuses = filteredExcuses.filter(e => 
      e.tone.toLowerCase() === normalizedTone
    );
  }
  
  if (length) {
    const normalizedLength = normalizeLength(length);
    filteredExcuses = filteredExcuses.filter(e => 
      e.length.toLowerCase() === normalizedLength
    );
  }
  
  // If no matches after filtering, use all excuses for that situation
  if (filteredExcuses.length === 0) {
    console.log(`No exact matches found, using all excuses for ${situation}`);
    filteredExcuses = excuses;
  }
  
  // Pick a random excuse
  const randomIndex = Math.floor(Math.random() * filteredExcuses.length);
  const selectedExcuse = filteredExcuses[randomIndex];
  
  // Auto-calculate believability rating if not present
  const believabilityRating = selectedExcuse.believabilityRating !== undefined
    ? selectedExcuse.believabilityRating
    : calculateBelievabilityRating(selectedExcuse.tone);
  
  return {
    excuse: selectedExcuse.excuse,
    believabilityRating,
  };
}

// Helper to get all situations that have excuse data
export function getAvailableSituations(): string[] {
  return Object.keys(excuseDatabase);
}
