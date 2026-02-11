
# Excuse Database

This directory contains local excuse data in JSON format. Each file represents a category of excuses.

## New Format (Simplified)

Each excuse is now a simple object with these fields:

```json
{
  "situation": "late-to-work",
  "tone": "believable",
  "length": "short",
  "excuse": "The excuse text here",
  "believabilityRating": 85
}
```

### Fields:

- **situation** (required): The situation category (e.g., "late-to-work", "missed-deadline")
- **tone** (required): Lowercase tone value
  - `believable` - Realistic and plausible
  - `absurd` - Ridiculous and unbelievable
  - `dramatic` - Over-the-top and theatrical
  - `mysterious` - Vague and enigmatic
  - `technical` - Jargon-heavy and complex
  - `detailed` - Overly specific and elaborate
- **length** (required): Simplified length value
  - `short` - Quick one-liner
  - `medium` - Short paragraph
  - `long` - Elaborate story
- **excuse** (required): The actual excuse text
- **believabilityRating** (optional): Number from 1-100. If omitted, will be auto-calculated based on tone:
  - `believable`: 70-100
  - `absurd`: 1-30
  - `dramatic`: 40-60
  - `mysterious`: 50-70
  - `technical`: 45-65
  - `detailed`: 35-55

## File Format Options

You can use either format:

### Single Object (for individual excuses):
```json
{
  "situation": "late-to-work",
  "tone": "believable",
  "length": "short",
  "excuse": "Traffic was terrible this morning."
}
```

### Array of Objects (for multiple excuses):
```json
[
  {
    "situation": "late-to-work",
    "tone": "believable",
    "length": "short",
    "excuse": "Traffic was terrible this morning."
  },
  {
    "situation": "late-to-work",
    "tone": "absurd",
    "length": "medium",
    "excuse": "A UFO landed in the middle of the highway and aliens asked me for directions."
  }
]
```

## Adding New Excuses

1. Create a new JSON file in this directory (e.g., `skipping-gym.json`)
2. Add your excuse(s) using the format above
3. Import the file in `index.ts`:
   ```typescript
   import skippingGym from './skipping-gym.json';
   ```
4. Add it to the `excuseDatabase` object:
   ```typescript
   export const excuseDatabase: Record<string, Excuse[]> = {
     // ... existing entries
     "Skipping the gym": Array.isArray(skippingGym) ? skippingGym : [skippingGym],
   };
   ```

## Bulk Import

To import your 300+ excuses:

1. Place all your JSON files in this directory
2. Each file should contain excuses for one situation
3. Update `index.ts` to import and register all files
4. The system will automatically handle both single objects `{}` and arrays `[]`

## Tone & Length Mapping

The system automatically maps your simplified values to the display format:

**Tone Mapping:**
- `believable` → "Believable"
- `absurd` → "Absurd"
- `dramatic` → "Dramatic"
- `mysterious` → "Mysterious"
- `technical` → "Technical Jargon"
- `detailed` → "Overly Detailed"

**Length Mapping:**
- `short` → "Quick one-liner"
- `medium` → "Short paragraph"
- `long` → "Elaborate story"

This means you can use the simple lowercase values in your JSON files, and they'll display correctly in the app!
