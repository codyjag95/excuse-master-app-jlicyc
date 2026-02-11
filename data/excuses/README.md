
# Excuse Database - Import Instructions

This directory contains the local excuse database for the Excuse Generator 3000 app.

## 🚀 Quick Start: Import Your Master JSON File

You have a master JSON file with 25,962 excuses? Perfect! Here's how to import it:

### Step 1: Open the Master File

Open `data/excuses/master-excuses.json` in your code editor.

### Step 2: Replace the Contents

Replace the entire contents of `master-excuses.json` with your master JSON file.

Your file should look like this:

```json
{
  "Didn't do homework": [
    {
      "excuse": "My laptop crashed and I lost everything...",
      "believabilityRating": 85,
      "tone": "Believable",
      "length": "Elaborate story"
    },
    {
      "excuse": "Another excuse here...",
      "believabilityRating": 45,
      "tone": "Absurd",
      "length": "Quick one-liner"
    }
  ],
  "Late to work": [
    {
      "excuse": "Traffic was insane this morning...",
      "believabilityRating": 90,
      "tone": "Believable",
      "length": "Short paragraph"
    }
  ],
  "Ghosting someone": [
    ...
  ]
}
```

### Step 3: That's It!

Once you paste your JSON into `master-excuses.json`, the app will automatically:
- ✅ Load all 25,962 excuses
- ✅ Organize them by situation
- ✅ Filter by tone and length
- ✅ Display statistics in the app

### Step 4: Verify the Import

After pasting your JSON:

1. Restart the app (if it's running)
2. The app will log how many excuses were loaded for each situation
3. Check the console for messages like:
   ```
   [ExcuseDB] Loaded 1298 excuses for "Didn't do homework"
   [ExcuseDB] Loaded 1297 excuses for "Late to work"
   ...
   ```

## 📋 Expected Format

Your master JSON file should have this structure:

```json
{
  "Situation Name": [
    {
      "excuse": "The excuse text",
      "believabilityRating": 85,
      "tone": "Believable",
      "length": "Elaborate story"
    }
  ]
}
```

### Supported Values:

**Tones:**
- `"Believable"` - Realistic excuses (rating: 70-100)
- `"Absurd"` - Ridiculous excuses (rating: 1-30)
- `"Dramatic"` - Over-the-top excuses (rating: 40-60)
- `"Mysterious"` - Vague excuses (rating: 50-70)
- `"Technical Jargon"` - Complex excuses (rating: 45-65)
- `"Funny"` - Humorous excuses (mapped to Believable)

**Lengths:**
- `"Quick one-liner"` - Short, punchy excuses
- `"Short paragraph"` - Medium-length excuses
- `"Elaborate story"` - Long, detailed excuses

**Situations (20 total):**
- "Didn't do homework"
- "Late to work"
- "Ghosting someone"
- "Missed deadline"
- "Forgot birthday"
- "Can't attend event"
- "Need to leave early"
- "Breaking up with someone"
- "Canceling plans"
- "Not answering phone"
- "Skipping the gym"
- "Eating junk food"
- "Not replying to texts"
- "Missing a meeting"
- "Being late to class"
- "Not doing chores"
- "Spending too much money"
- "Not visiting family"
- "Forgetting an anniversary"
- "Not going to a party"

## 🔧 How It Works

1. **Import**: The `data/excuses/index.ts` file imports `master-excuses.json`
2. **Process**: It processes all excuses and organizes them by situation
3. **Filter**: When a user generates an excuse, it filters by situation, tone, and length
4. **Random**: It picks a random excuse from the filtered results
5. **Fallback**: If no local excuse matches, it falls back to AI generation

## 📊 Statistics

The app tracks:
- Total number of situations
- Total number of excuses
- Excuses per situation
- Excuses per tone
- Excuses per length

You can view these stats in the app console when it loads.

## 🐛 Troubleshooting

**Problem: App shows "No excuses found"**
- Check that `master-excuses.json` has valid JSON syntax
- Verify situation names match exactly (case-sensitive)
- Check the console for error messages

**Problem: Excuses not filtering correctly**
- Verify tone and length values match the expected format
- Check for typos in tone/length values
- The system is case-insensitive for filtering

**Problem: JSON syntax errors**
- Use a JSON validator (like jsonlint.com) to check your file
- Ensure all strings are in double quotes
- Check for missing commas between objects
- Verify all brackets are properly closed

## 💡 Tips

- **Backup**: Keep a backup of your master JSON file before pasting
- **Validate**: Use a JSON validator to ensure your file is valid
- **Test**: After importing, test a few situations to verify everything works
- **Console**: Check the browser/app console for detailed loading logs

## 🎯 Next Steps

After importing your master file:

1. The app will use local excuses by default
2. Users can toggle between local and AI-generated excuses
3. The app will show how many excuses are available
4. All 25,962 excuses will be instantly accessible offline!

---

**Need help?** Check the console logs for detailed information about what's being loaded.
