# 📁 Folder Roles & Architecture Guide

A high-level explanation of what each folder does and why it exists.

---

## 🎯 **Core Application Folders**

### **`src/` - Your Main Application Code**
**Role:** The heart of your app - all your React components, logic, and features live here.

```
src/
├── screens/      # Full-page views (like pages in a website)
├── components/   # Reusable UI pieces (like LEGO blocks)
├── services/     # External API connections (talking to other services)
├── utils/        # Helper functions (tools you use everywhere)
├── theme/        # Design system (colors, fonts, spacing)
└── types/        # TypeScript type definitions (data shapes)
```

---

## 📱 **`src/screens/` - Full Page Views**
**Role:** Complete screens/pages that users see and interact with.

**Think of it as:** Different rooms in a house - each screen is a different room.

| File | What It Does |
|------|--------------|
| `AuthScreen.tsx` | Login/signup page - handles user authentication |
| `CameraScreen.tsx` | Camera interface - where users scan wine lists |
| `ResultsScreen.tsx` | Results page - displays ranked wines after scanning |
| `OnboardingScreen.tsx` | First-time user tutorial/intro |

**Key Concept:** Screens are full-page components that handle major user flows.

---

## 🧩 **`src/components/` - Reusable UI Pieces**
**Role:** Small, reusable UI components that can be used across multiple screens.

**Think of it as:** LEGO blocks - build once, use everywhere.

| File | What It Does |
|------|--------------|
| `WineCard.tsx` | Displays a single wine with all its info (name, price, score, etc.) |

**Why separate?** 
- If you need to show a wine card in 5 different places, you write it once
- Easy to update - change the card design in one place, updates everywhere
- Keeps code organized and DRY (Don't Repeat Yourself)

**Example:** `WineCard` is used in `ResultsScreen` to display each wine.

---

## 🔌 **`src/services/` - External API Connections**
**Role:** Handles all communication with external services (databases, APIs, etc.)

**Think of it as:** Translators - they speak to external services and translate responses for your app.

| File | What It Does |
|------|--------------|
| `supabase.ts` | Connects to Supabase (database, auth, storage) |
| `winelabs.ts` | Calls Wine Labs API (wine matching, pricing, scores) |
| `vision.ts` | Calls AI vision APIs (Gemini/OpenAI/Claude for image parsing) |
| `supabase-mock.ts` | Mock/test version of Supabase (for development) |

**Key Concept:** Services abstract away API complexity. Your screens just call `matchWinesToLwin()` instead of writing fetch code everywhere.

**Example Flow:**
```
CameraScreen → calls → winelabs.ts → talks to → Wine Labs API
```

---

## 🛠️ **`src/utils/` - Helper Functions**
**Role:** Utility functions used throughout the app - pure functions that don't depend on React.

**Think of it as:** Toolbox - tools you grab when you need them.

| File | What It Does |
|------|--------------|
| `wineRanking.ts` | Algorithms for ranking wines (highest rated, best value, etc.) |
| `logger.ts` | Logging utility for debugging |
| `sampleData.ts` | Sample/test data (probably for development) |

**Key Concept:** These are pure functions - same input = same output, no side effects.

**Example:** `calculateMarkup(restaurantPrice, realPrice)` - just math, no API calls.

---

## 🎨 **`src/theme/` - Design System**
**Role:** Centralized design tokens - colors, fonts, spacing, shadows.

**Think of it as:** Brand guidelines - ensures consistent look across the app.

| File | What It Does |
|------|--------------|
| `colors.ts` | Color palette (gold, burgundy, neutrals) |
| `typography.ts` | Font families, sizes, weights |
| `spacing.ts` | Consistent spacing values (padding, margins) |
| `index.ts` | Exports everything as `theme` object |

**Why separate?**
- Change colors in one place → updates everywhere
- Ensures consistency (no random colors scattered in code)
- Easy to create dark mode later (just swap color files)

**Usage:** `theme.colors.gold[500]` instead of hardcoding `"#d4af37"`

---

## 📝 **`src/types/` - TypeScript Type Definitions**
**Role:** Defines the shape/structure of your data.

**Think of it as:** Blueprints - tells TypeScript what your data looks like.

| File | What It Does |
|------|--------------|
| `index.ts` | Defines interfaces like `Wine`, `Scan`, `WineListItem` |

**Why separate?**
- Type safety - catch errors before runtime
- Better IDE autocomplete
- Self-documenting code

**Example:**
```typescript
interface Wine {
  displayName: string;
  restaurantPrice: number;
  criticScore?: number;
}
```
Now TypeScript knows what a `Wine` object should look like!

---

## 🗄️ **`supabase/` - Database Migrations**
**Role:** SQL files that define your database structure.

**Think of it as:** Blueprints for your database - version-controlled schema changes.

| Folder/File | What It Does |
|-------------|--------------|
| `migrations/` | SQL migration files (changes to database over time) |
| `supabase-schema.sql` | Complete database schema |

**Key Concept:** Migrations track database changes over time. Each migration file is a snapshot of a change.

**Example:** `20251115T034633_initial_schema.sql` - creates tables on Nov 15, 2024

---

## 🚀 **`gcp-functions/` - Cloud Functions (Backend Proxy)**
**Role:** Serverless functions that run on Google Cloud Platform.

**Think of it as:** A middleman server that helps your app talk to Wine Labs API (avoids CORS issues).

| Folder/File | What It Does |
|-------------|--------------|
| `winelabs-proxy/` | Cloud function that proxies Wine Labs API calls |

**Why needed?** 
- Browsers block direct API calls to Wine Labs (CORS)
- Cloud function acts as proxy - your app calls it, it calls Wine Labs

---

## 📜 **`scripts/` - Setup & Utility Scripts**
**Role:** Node.js scripts for setup, database management, and testing.

**Think of it as:** Automation tools - run once to set things up, or run regularly for maintenance.

| File | What It Does |
|------|--------------|
| `setup-supabase.sh` | Sets up Supabase database |
| `run-schema.js` | Runs database migrations |
| `test-winelabs-proxy.js` | Tests Wine Labs API connection |
| `setup-storage-bucket.js` | Creates storage bucket for images |

**Key Concept:** These are run from terminal, not part of your React app.

**Example:** `npm run setup:db` runs one of these scripts.

---

## 📦 **`api/` - API Code (Alternative Backend)**
**Role:** Alternative API implementation (might be unused or for different deployment).

**Note:** You have both `api/` and `gcp-functions/` - likely different approaches to the same problem.

---

## 🖼️ **`assets/` - Images & Static Files**
**Role:** App icons, splash screens, images.

| File | What It Does |
|------|--------------|
| `icon.png` | App icon |
| `splash-icon.png` | Loading screen icon |
| `favicon.png` | Browser tab icon |

---

## 📄 **Root Level Files**

### **`App.js`** - Application Entry Point
**Role:** The main file that starts your app. Sets up navigation, auth, fonts.

**Think of it as:** The front door of your app - everything starts here.

---

### **`package.json`** - Dependencies & Scripts
**Role:** Lists all npm packages your app needs and defines commands.

**Key sections:**
- `dependencies` - packages needed to run the app
- `scripts` - commands like `npm start`, `npm run build`

---

### **`app.json`** - Expo Configuration
**Role:** Expo-specific settings (app name, version, icons, etc.)

---

### **`tsconfig.json`** - TypeScript Configuration
**Role:** TypeScript compiler settings.

---

## 📚 **Documentation Files**

All the `.md` files are documentation:
- `README.md` - Main project documentation
- `ARCHITECTURE.md` - System architecture explanation
- `CHANGELOG.md` - History of changes
- `SETUP.md` - Setup instructions
- etc.

---

## 🔄 **How Folders Work Together**

```
User opens app
    ↓
App.js (entry point)
    ↓
AuthScreen (if not logged in) OR CameraScreen (if logged in)
    ↓
CameraScreen uses:
    - services/vision.ts (parse image)
    - services/winelabs.ts (match wines)
    - services/supabase.ts (save to database)
    ↓
ResultsScreen displays:
    - components/WineCard.tsx (for each wine)
    - utils/wineRanking.ts (to rank wines)
    - theme/ (for styling)
```

---

## 🎓 **Key Concepts for Beginners**

### **Separation of Concerns**
Each folder has a specific job:
- **Screens** = What users see
- **Services** = Talking to external APIs
- **Utils** = Helper functions
- **Components** = Reusable UI pieces
- **Theme** = Design consistency

### **Why This Structure?**
1. **Organization** - Easy to find code
2. **Reusability** - Write once, use many times
3. **Maintainability** - Change one thing, update everywhere
4. **Scalability** - Easy to add new features

### **Common Patterns**
- **Screens** import from **components**, **services**, **utils**, **theme**
- **Services** don't import from screens (they're independent)
- **Utils** are pure functions (no React dependencies)
- **Theme** is imported everywhere for styling

---

## 🚦 **Quick Reference**

| Need to... | Go to... |
|------------|----------|
| Add a new page | `src/screens/` |
| Create reusable UI | `src/components/` |
| Connect to an API | `src/services/` |
| Add a helper function | `src/utils/` |
| Change colors/fonts | `src/theme/` |
| Define data structure | `src/types/` |
| Set up database | `supabase/migrations/` |
| Run setup scripts | `scripts/` |

---

## 💡 **Pro Tips**

1. **Start with screens** - They're the most visible part
2. **Extract to components** - When you repeat code, make it a component
3. **Keep services thin** - They should just call APIs, not contain business logic
4. **Use theme everywhere** - Never hardcode colors/spacing
5. **Type everything** - Use TypeScript types for better code quality

---

This structure follows React Native/Expo best practices and scales well as your app grows!

