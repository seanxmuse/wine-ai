# Responsive Design Guide

## Overview

The Wine Scanner app now includes responsive design utilities to ensure proper scaling across different mobile device sizes. All screens should use these utilities instead of fixed pixel values.

## Responsive Utilities

### Import

```typescript
import { rf, rs, rw, rh, theme } from '../theme';
```

### Functions

#### `rf(size)` - Responsive Font Size
Scales font sizes based on screen width with caps to prevent too large/small text.

```typescript
// Before
fontSize: 24

// After
fontSize: rf(24)
```

#### `rs(size)` - Responsive Spacing
Scales padding, margins, gaps, and other spacing values.

```typescript
// Before
paddingHorizontal: 20,
marginBottom: 16,
gap: 12

// After
paddingHorizontal: rs(20),
marginBottom: rs(16),
gap: rs(12)
```

#### `rw(size)` - Responsive Width
Scales widths based on screen width.

```typescript
// Before
width: 120

// After
width: rw(120)
```

#### `rh(size)` - Responsive Height
Scales heights based on screen height.

```typescript
// Before
height: 200

// After
height: rh(200)
```

## Usage Examples

### Before (Fixed Sizes)

```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  icon: {
    width: 100,
    height: 100,
  },
});
```

### After (Responsive)

```typescript
import { rf, rs } from '../theme';

const styles = StyleSheet.create({
  title: {
    fontSize: rf(28),
    marginBottom: rs(16),
  },
  button: {
    paddingVertical: rs(16),
    paddingHorizontal: rs(32),
    gap: rs(12),
  },
  icon: {
    width: rs(100),
    height: rs(100),
  },
});
```

## Screen Size Detection

```typescript
import { screen } from '../theme';

// Check device type
if (screen.isSmall) {
  // Device width < 375px
}

if (screen.isTablet) {
  // Device width >= 768px
}

// Get dimensions
const { width, height } = screen;
```

## Pre-defined Responsive Typography

Use theme's responsive typography for common text styles:

```typescript
import { theme } from '../theme';

const styles = StyleSheet.create({
  heroTitle: {
    ...theme.responsive.typography.heroTitle,
    color: theme.colors.text.primary,
  },
  body: {
    ...theme.responsive.typography.body,
    color: theme.colors.text.secondary,
  },
});
```

Available styles:
- `heroTitle` - Large hero text (48-72px)
- `pageTitle` - Page headers (36-56px)
- `sectionTitle` - Section headers (28-42px)
- `cardTitle` - Card titles (20-28px)
- `bodyLarge` - Large body text (18-20px)
- `body` - Standard body text (16-18px)
- `bodySmall` - Small body text (13-14px)
- `label` - Labels (12-14px)
- `button` - Button text (14-16px)
- `caption` - Captions (13-14px)
- `finePrint` - Fine print (10-11px)

## Migration Checklist

When updating a screen to be responsive:

1. [ ] Import `rf` and `rs` from theme
2. [ ] Update all `fontSize` values to use `rf()`
3. [ ] Update all spacing values to use `rs()`:
   - `padding`, `paddingVertical`, `paddingHorizontal`
   - `margin`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`
   - `gap`
4. [ ] Update fixed width/height values for UI elements:
   - Buttons: use `rs()` for dimensions
   - Icons: use `rs()` for size
   - Containers: use `rs()` or percentages
5. [ ] Update `lineHeight` to use `rf()` if specified
6. [ ] Test on different screen sizes (small phone, regular phone, tablet)

## Screens Updated

- ✅ SimpleCameraWeb.tsx

## Screens Pending Update

- [ ] CameraScreen.tsx
- [ ] NewResultsScreen.tsx
- [ ] ChatScreen.tsx
- [ ] ChatHistoryScreen.tsx
- [ ] SettingsScreen.tsx
- [ ] AuthScreen.tsx
- [ ] All other screens

## Best Practices

1. **Use base values from standard iPhone (393px width)**
   - Design for iPhone 14 Pro as baseline
   - Values will scale up/down automatically

2. **Apply responsive functions consistently**
   - Don't mix fixed and responsive values in same component
   - Be consistent across the entire screen

3. **Test on multiple devices**
   - Small phones (< 375px): iPhone SE
   - Regular phones (375-414px): iPhone 14/15
   - Large phones (414+px): iPhone 14 Pro Max
   - Tablets (768+px): iPad

4. **Use responsive spacing from theme**
   ```typescript
   padding: theme.responsive.spacing.md // Instead of rs(16)
   ```

5. **Icon sizes should scale too**
   ```typescript
   <Ionicons name="camera" size={rs(24)} color="#fff" />
   ```

## Common Patterns

### Permission Screen
```typescript
permissionTitle: {
  fontSize: rf(24),
  marginBottom: rs(12),
  paddingHorizontal: rs(8),
}
```

### Button
```typescript
button: {
  paddingVertical: rs(14),
  paddingHorizontal: rs(24),
  gap: rs(10),
}
```

### Card
```typescript
card: {
  padding: rs(16),
  borderRadius: rs(12),
  gap: rs(12),
}
```

## Notes

- The scaling caps at ±15% to prevent extreme sizes
- Font sizes are normalized using `PixelRatio.roundToNearestPixel()`
- Small devices (< 375px) get slightly smaller sizes
- Tablets (>= 768px) get slightly larger sizes
- Spacing scales linearly with screen width
