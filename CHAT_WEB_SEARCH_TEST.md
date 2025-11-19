# Chat Web Search Testing

## Summary

The chat service now supports web search via Gemini API's Google Search grounding feature. Users can prompt the model to use web search, and it will automatically search for current information when needed.

## Changes Made

1. **Fixed Tool Name**: Changed from `googleSearchRetrieval` to `googleSearch` to match the webSearch service
2. **Updated Model**: Changed from `gemini-2.0-flash-exp` to `gemini-2.5-flash` for better quota availability and consistency

## How It Works

The chat service (`src/services/chat.ts`) now:
- Uses `googleSearch: {}` tool (same as webSearch service)
- Uses `gemini-2.5-flash` model
- Includes web search capability in the system prompt
- Automatically triggers web search when users ask for current information

## Testing

### Test Script
A test script is available at `test-chat-web-search.js` that tests:
1. Explicit web search requests ("Please use web search to find...")
2. Implicit requests that should trigger search ("What is the current price of...")
3. Comparison of different tool names

### How to Test Manually

1. **Start a chat conversation** in the app
2. **Ask for current information** that requires web search:
   - "What is the current price of Château Margaux 2015?"
   - "Search the web for information about Opus One 2019"
   - "Find recent reviews for Domaine de la Romanée-Conti"

3. **Check the response** - it should:
   - Include current information from web search
   - Reference sources or mention searching
   - Provide up-to-date data

### Expected Behavior

- ✅ **Automatic Search**: When users ask for current prices, recent reviews, or specific wine information, the model should automatically use web search
- ✅ **Explicit Requests**: When users explicitly ask to "use web search" or "search the web", the model should use the search capability
- ✅ **Response Quality**: Responses should include current, accurate information from web sources

## Technical Details

### Tool Configuration
```typescript
tools: [
  {
    googleSearch: {},
  },
]
```

### Model Used
- `gemini-2.5-flash` - Stable model with Google Search grounding support

### System Prompt
The system prompt includes:
> "You have access to web search for current wine information, prices, and reviews. Use this capability when users ask about specific wines, current prices, or recent reviews."

## Notes

- Web search is automatically triggered by the model based on the query
- Users can explicitly request web search in their prompts
- The model decides when to use web search based on the context
- Search results are integrated into the response automatically

