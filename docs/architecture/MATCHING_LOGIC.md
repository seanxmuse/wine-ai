# Wine Matching Logic

This document explains how the Wine Scanner app handles fuzzy matching from image → wine database.

## Overview

The matching pipeline has **3 layers** of smart processing:

```
Wine List Photo
    ↓
[1] Vision AI Extraction (Gemini 2.0)
    ↓
[2] Query Preprocessing
    ↓
[3] Wine Labs Fuzzy Matching
    ↓
[4] Confidence Scoring
    ↓
Results
```

---

## Layer 1: Vision AI Extraction

**Location:** [src/services/vision.ts](src/services/vision.ts)

**Model:** Gemini 2.0 Flash (or OpenAI/Anthropic fallback)

### Improved Prompt Strategy

The vision model is instructed to:

1. **Extract FULL producer names**
   - ✅ "Château Margaux" (correct)
   - ❌ "Ch. Margaux" (abbreviated - harder to match)

2. **Preserve proper spelling**
   - Keep accented characters: Château, Pérignon, Pétrus
   - Don't abbreviate common wine terms

3. **Include complete wine names**
   - "Domaine de la Romanée-Conti La Tâche" (full)
   - Not just "La Tâche"

4. **Return structured data**
   ```json
   {
     "wineName": "Château Margaux",
     "vintage": "2015",
     "price": 450
   }
   ```

5. **Quality control**
   - Only include wines with 80%+ OCR confidence
   - Skip unclear prices or names
   - Don't hallucinate wine names

### Why This Helps Matching

By getting clean, complete wine names from the vision model, we reduce the burden on fuzzy matching. The Wine Labs API works best with full, properly formatted wine names.

---

## Layer 2: Query Preprocessing

**Location:** [src/services/winelabs.ts:16-43](src/services/winelabs.ts#L16-L43)

Before sending to Wine Labs, we preprocess queries to handle OCR errors:

### Common OCR Corrections

```javascript
// Character confusions
"l" → "I"          // lowercase L confused with I
"0" → "O"          // zero confused with O

// Common abbreviations → Full forms
"Ch."  → "Château"
"Dom." → "Domaine"
"St."  → "Saint"

// Noise removal
"$", "•", "·"     → removed
Multiple spaces   → single space
```

### Example Transformations

| Original (OCR)          | Preprocessed            | Wine Labs Match |
|------------------------|------------------------|-----------------|
| "Ch. Margaux 2015"     | "Château Margaux 2015" | ✅ Match       |
| "Dom.  Romanée-Conti"  | "Domaine Romanée-Conti"| ✅ Match       |
| "St-Emilion $450"      | "Saint-Emilion 450"    | ✅ Match       |
| "0pus 0ne 2018"        | "Opus One 2018"        | ✅ Match       |

---

## Layer 3: Wine Labs Fuzzy Matching

**API Endpoint:** `POST /match_to_lwin_batch`

**Location:** [src/services/winelabs.ts:84-135](src/services/winelabs.ts#L84-L135)

Wine Labs has a proprietary fuzzy matching algorithm that handles:

### What Wine Labs Handles

1. **Producer Name Variations**
   - "Château Pétrus" = "Petrus" = "Ch. Pétrus"
   - "Domaine de la Romanée-Conti" = "DRC" = "Romanée-Conti"

2. **Regional Synonyms**
   - "Hermitage" = "Ermitage"
   - "Bourgogne" = "Burgundy"

3. **Vintage Flexibility**
   - Can match with or without vintage
   - Handles "2015" = "'15" = "15"

4. **Spelling Variations**
   - Accented vs non-accented characters
   - Common misspellings

### What Wine Labs Returns

```typescript
{
  lwin7: "1014304",           // Base wine ID
  lwin: "10143042015",        // Wine + vintage ID
  display_name: "Château Margaux"
}
```

**Note:** Wine Labs does **NOT** return a confidence score. They either match or return null.

---

## Layer 4: Confidence Scoring

**Location:** [src/services/winelabs.ts:45-81](src/services/winelabs.ts#L45-L81)

Since Wine Labs doesn't provide confidence, we calculate our own:

### Algorithm

```javascript
function calculateMatchConfidence(originalQuery, matchedName) {
  // Exact match = 100%
  if (query === match) return 1.0;

  // Word overlap analysis
  queryWords = ["Château", "Margaux", "2015"]
  matchWords = ["Château", "Margaux"]

  matchedWords = count(overlap)
  wordMatchRatio = matchedWords / queryWords.length

  // Confidence tiers
  if (wordMatchRatio >= 0.8) return 0.9   // 90% confidence
  if (wordMatchRatio >= 0.6) return 0.75  // 75% confidence
  if (wordMatchRatio >= 0.4) return 0.6   // 60% confidence
  return 0.4                              // 40% confidence (low)
}
```

### Example Confidence Scores

| Original Query | Wine Labs Match | Confidence | Reason |
|---------------|----------------|-----------|---------|
| "Château Margaux 2015" | "Château Margaux" | 90% | High word overlap |
| "Margaux 2015" | "Château Margaux" | 75% | Missing "Château" |
| "Ch. Margaux" | "Château Margaux" | 60% | Abbreviation |
| "Red Wine 2015" | "Château Margaux" | 40% | Low overlap |

---

## Complete Flow Example

### Input: Blurry wine list photo

**Vision AI extracts:**
```json
{
  "wineName": "Ch. Pétrus",
  "vintage": "2018",
  "price": "1200"
}
```

**Query preprocessing:**
```
"Ch. Pétrus 2018" → "Château Pétrus 2018"
```

**Wine Labs matches:**
```json
{
  "lwin7": "1002845",
  "lwin": "10028452018",
  "display_name": "Pétrus"
}
```

**Confidence calculation:**
```
Original: "Ch. Pétrus 2018"
Matched:  "Pétrus"
Overlap:  "Pétrus" matches (1/3 words)
Confidence: 75%
```

**Final result:**
```json
{
  "displayName": "Pétrus",
  "vintage": "2018",
  "restaurantPrice": 1200,
  "lwin": "10028452018",
  "confidence": 0.75,
  "matched": true
}
```

---

## Handling Match Failures

If Wine Labs can't match a wine:

```typescript
{
  matched: false,
  confidence: 0,
  display_name: null,
  lwin: null
}
```

The wine is **still included in results** but:
- No price data available
- No critic scores available
- Marked as "unmatched" in UI
- Uses OCR-extracted name as display name

---

## Future Improvements

1. **Add fallback matching**
   - If Wine Labs fails, try alternate spellings
   - Query with/without producer name
   - Query with/without vintage

2. **Machine learning confidence**
   - Train ML model on successful matches
   - Learn which transformations improve match rate

3. **User feedback loop**
   - Let users confirm/correct matches
   - Use feedback to improve preprocessing rules

4. **Regional wine databases**
   - For wines not in Wine Labs (e.g., local wines)
   - Use alternative APIs or manual database

---

## Debugging Matches

Console logs show the matching process:

```javascript
console.log('Original queries:', [
  "Ch. Margaux 2015",
  "Dom. Romanée-Conti 2018"
]);

console.log('Preprocessed queries:', [
  "Château Margaux 2015",
  "Domaine Romanée-Conti 2018"
]);

console.log('Match result for "Ch. Margaux 2015":', {
  matched: true,
  display_name: "Château Margaux",
  confidence: 0.9
});
```

Check browser console or terminal for these logs when testing.
