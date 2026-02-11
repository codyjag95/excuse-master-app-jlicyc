
// Import all excuse JSON files
import lateToWork from './late-to-work.json';
import missedDeadline from './missed-deadline.json';
import forgotBirthday from './forgot-birthday.json';

// Map situation names to their excuse data
export const excuseDatabase: Record<string, any[]> = {
  "Late to work": lateToWork,
  "Missed deadline": missedDeadline,
  "Forgot birthday": forgotBirthday,
  // Add more mappings as you create more JSON files
  // "Can't attend event": cantAttendEvent,
  // "Didn't do homework": didntDoHomework,
  // etc.
};

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
    filteredExcuses = filteredExcuses.filter(e => e.tone === tone);
  }
  
  if (length) {
    filteredExcuses = filteredExcuses.filter(e => e.length === length);
  }
  
  // If no matches after filtering, use all excuses for that situation
  if (filteredExcuses.length === 0) {
    console.log(`No exact matches found, using all excuses for ${situation}`);
    filteredExcuses = excuses;
  }
  
  // Pick a random excuse
  const randomIndex = Math.floor(Math.random() * filteredExcuses.length);
  const selectedExcuse = filteredExcuses[randomIndex];
  
  return {
    excuse: selectedExcuse.excuse,
    believabilityRating: selectedExcuse.believabilityRating,
  };
}

// Helper to get all situations that have excuse data
export function getAvailableSituations(): string[] {
  return Object.keys(excuseDatabase);
}
