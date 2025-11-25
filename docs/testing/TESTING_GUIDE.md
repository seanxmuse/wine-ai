# Testing Guide: Wine Labs API Chat Integration

## What to Test

### 1. **Wine Labs API Integration** ✅
Test that the chat properly uses Wine Labs API data when available.

**Test Cases:**

#### A. Explicit Wine Labs Request
```
use wine labs api for 2022 Orin Swift Mercury Head Cabernet Sauvignon
```
**Expected:**
- Console log: `[Chat] Searching Wine Labs API for: Orin Swift Mercury Head 2022`
- Response should mention Wine Labs API data
- Should include price stats, critic scores, and wine info from Wine Labs
- Should NOT say "didn't specify the vintage" if data exists

#### B. Price Query (Auto-triggers Wine Labs)
```
what's the current price of 2022 Orin Swift Mercury Head Cabernet Sauvignon?
```
**Expected:**
- Automatically triggers Wine Labs API (no need to say "use wine labs")
- Should show median price, price range, and Wine Labs price
- Should prioritize Wine Labs data over web search

#### C. Wine Name Extraction (Various Formats)
Test different ways users might ask:

1. **With vintage first:**
   ```
   2022 Orin Swift Mercury Head Cabernet Sauvignon
   ```

2. **With search keyword:**
   ```
   search for 2022 Orin Swift Mercury Head
   ```

3. **Without vintage:**
   ```
   Orin Swift Mercury Head Cabernet Sauvignon
   ```

4. **Casual query:**
   ```
   tell me about Orin Swift Mercury Head
   ```

**Expected:**
- All should extract wine name correctly
- Vintage should be extracted when present
- Console logs should show the extracted wine name

---

### 2. **Data Accuracy** 📊
Verify that Wine Labs data is correctly formatted and used.

**What to Check:**

#### A. Price Data
- **Median price** should be shown
- **Price range** (min-max) should be accurate
- **Wine Labs price** should be included
- **Currency** should be USD

#### B. Critic Scores
- Should show individual critic scores (e.g., "Joe Czerwinski: 95 points")
- Should show average score if multiple critics
- Should mention publication names (e.g., "Robert Parker's Wine Advocate")

#### C. Wine Information
- Should include varietal (e.g., "Cabernet Sauvignon")
- Should include producer (e.g., "Orin Swift Cellars")
- Should include region if available

**Test Query:**
```
use wine labs api for 2022 Orin Swift Mercury Head Cabernet Sauvignon
```

**Check Console Logs For:**
```
[WineLabs] Price stats response: {...}
[WineLabs] Critic scores raw response: {...}
[WineLabs] Wine info response: {...}
```

---

### 3. **Fallback to Web Search** 🔍
Test that it falls back to web search when Wine Labs doesn't have the wine.

**Test Cases:**

#### A. Obscure Wine (Not in Wine Labs)
```
use wine labs api for 2025 Local Winery Experimental Blend
```
**Expected:**
- Should try Wine Labs API first
- If no match found, should fall back to web search
- Response should mention both attempts

#### B. Very New Vintage
```
use wine labs api for 2024 Domaine de la Romanée-Conti Romanée-Conti
```
**Expected:**
- May not have 2024 vintage in Wine Labs
- Should try with vintage, then fall back to "ALL" vintage
- If still no data, should use web search

---

### 4. **Response Quality** 💬
Check that AI responses properly prioritize and present Wine Labs data.

**What to Look For:**

#### ✅ Good Response Should:
- **Lead with Wine Labs data** (not bury it)
- **Mention Wine Labs API** when explicitly requested
- **Show specific numbers** (prices, scores) from Wine Labs
- **Combine Wine Labs + Web Search** intelligently (Wine Labs for prices/scores, web search for tasting notes)
- **Not contradict** Wine Labs data with web search data

#### ❌ Bad Response Signs:
- Says "didn't specify the vintage" when Wine Labs has vintage data
- Ignores Wine Labs data entirely
- Shows web search prices instead of Wine Labs prices
- Doesn't mention Wine Labs API when explicitly requested

**Test Query:**
```
use wine labs api for 2022 Orin Swift Mercury Head Cabernet Sauvignon
```

**Good Response Example:**
> "I've looked up the 2022 Orin Swift Mercury Head Cabernet Sauvignon using Wine Labs API. Here's what I found:
> 
> **Price:** Median price is $175 (range: $45-$666), with Wine Labs price at $150.72
> 
> **Critic Scores:** Joe Czerwinski (Robert Parker) gave it 95 points...
> 
> I also found some additional tasting notes via web search..."

---

### 5. **Edge Cases** 🎯

#### A. Partial Wine Name
```
Orin Swift Mercury Head
```
**Expected:** Should still match to full wine name

#### B. Wrong Vintage
```
use wine labs api for 2020 Orin Swift Mercury Head Cabernet Sauvignon
```
**Expected:** Should still find the wine, may show "ALL" vintage data or closest vintage

#### C. Multiple Wines in One Message
```
compare 2022 Orin Swift Mercury Head and 2021 Screaming Eagle
```
**Expected:** Should handle both wines (may need to call API twice)

#### D. No Wine Mentioned
```
what's a good wine for dinner?
```
**Expected:** Should NOT trigger Wine Labs API (no wine name extracted)

---

### 6. **Console Logs** 🔍
Monitor browser console for debugging information.

**What to Look For:**

#### Successful Wine Labs Query:
```
[Chat] Searching Wine Labs API for: [Wine Name] [Vintage]
[WineLabs] Raw API response: {...}
[WineLabs] Matched 1/1 wines
[WineLabs] Price stats response: {...}
[WineLabs] Critic scores raw response: {...}
[WineLabs] Wine info response: {...}
```

#### Failed Match:
```
[Chat] Searching Wine Labs API for: [Wine Name]
[WineLabs] No match found for: [Wine Name]
```

#### Error:
```
[Chat] Error fetching Wine Labs data: [Error message]
```

---

### 7. **Performance** ⚡
Check that API calls don't slow down responses too much.

**What to Check:**
- Response time should be reasonable (< 5 seconds)
- Multiple API calls (match + price + scores + info) should happen in parallel or efficiently
- Should show loading state while fetching Wine Labs data

---

## Quick Test Checklist

- [ ] Explicit "use wine labs api" request works
- [ ] Price queries automatically trigger Wine Labs
- [ ] Wine name extraction works for various formats
- [ ] Vintage extraction works correctly
- [ ] Price data is accurate and formatted correctly
- [ ] Critic scores are shown with critic names
- [ ] Wine info includes varietal, producer, region
- [ ] Falls back to web search when Wine Labs has no data
- [ ] AI response prioritizes Wine Labs data
- [ ] Console logs show all API calls
- [ ] No errors in console
- [ ] Response time is acceptable

---

## Known Issues to Watch For

1. **AI says "didn't specify vintage" when data exists** - The Wine Labs data format might need better emphasis in the prompt
2. **Web search prices override Wine Labs prices** - The system prompt should prioritize Wine Labs data more clearly
3. **Vintage mismatch** - If user asks for 2022 but Wine Labs only has 2021, should clarify this

---

## Test Wines (Known to be in Wine Labs)

- **Orin Swift Mercury Head Cabernet Sauvignon** (LWIN: 1602739)
- **Screaming Eagle Cabernet Sauvignon** (various vintages)
- **Domaine de la Romanée-Conti** wines (various)
- **Opus One** (various vintages)

---

## Reporting Issues

When reporting issues, include:
1. **Exact query used**
2. **Console logs** (copy all Wine Labs related logs)
3. **Expected behavior** vs **Actual behavior**
4. **Screenshot** of the response (if relevant)




