
# Excuse Database

This folder contains JSON files with pre-written excuses that can be loaded instantly without calling the AI API.

## File Structure

Each JSON file corresponds to a situation and contains an array of excuse objects:

```json
[
  {
    "excuse": "The actual excuse text goes here",
    "believabilityRating": 75,
    "tone": "Believable",
    "length": "Quick one-liner"
  }
]
```

## Fields

- **excuse** (string): The excuse text
- **believabilityRating** (number): 0-100, how believable the excuse is
- **tone** (string): Must match one of: "Believable", "Absurd", "Overly Detailed", "Dramatic", "Technical Jargon", "Mysterious"
- **length** (string): Must match one of: "Quick one-liner", "Short paragraph", "Elaborate story"

## Adding New Excuses

### Option 1: Add to Existing Files

1. Open the appropriate JSON file (e.g., `late-to-work.json`)
2. Add a new excuse object to the array
3. Make sure to include a comma after the previous excuse
4. Save the file

Example:
```json
[
  {
    "excuse": "Existing excuse",
    "believabilityRating": 50,
    "tone": "Believable",
    "length": "Quick one-liner"
  },
  {
    "excuse": "Your new excuse here",
    "believabilityRating": 60,
    "tone": "Dramatic",
    "length": "Short paragraph"
  }
]
```

### Option 2: Create New Situation File

1. Create a new JSON file with the situation name (e.g., `running-late.json`)
2. Add your excuses in the same format as above
3. Update `data/excuses/index.ts` to import and register your new file:

```typescript
import runningLate from './running-late.json';

export const excuseDatabase: Record<string, any[]> = {
  // ... existing entries
  "Running late": runningLate,
};
```

4. Add the situation to the SITUATIONS array in `app/(tabs)/(home)/index.tsx`

## Tips for Writing Good Excuses

- **Believable (70-90%)**: Realistic scenarios that could actually happen
- **Absurd (5-30%)**: Completely ridiculous, obviously fake
- **Overly Detailed (40-60%)**: Too much information, suspiciously specific
- **Dramatic (30-50%)**: Exaggerated, theatrical
- **Technical Jargon (50-70%)**: Uses complex terminology to confuse
- **Mysterious (20-40%)**: Vague, leaves questions unanswered

## Bulk Import

If you have 300+ excuses in a spreadsheet or CSV:

1. Convert to JSON format using a tool like [csvjson.com](https://csvjson.com/)
2. Make sure the column names match: `excuse`, `believabilityRating`, `tone`, `length`
3. Split into separate files by situation
4. Import all files in `index.ts`

## Current Statistics

Run the app and check the console logs to see:
- Total situations with local excuses
- Total number of excuses loaded
- Which situations have local data available
