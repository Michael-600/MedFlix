# MedFlix Color System

## Primary Colors

### Purple (Primary Brand)
- **50**: `#faf5ff` - Very light purple backgrounds
- **100**: `#f3e8ff` - Light purple backgrounds, hover states
- **200**: `#e9d5ff` - Borders, subtle accents
- **300**: `#d8b4fe` - Secondary text, disabled states
- **400**: `#c084fc` - Interactive elements
- **500**: `#a855f7` - Primary hover states
- **600**: `#9333ea` - Primary brand color, main buttons
- **700**: `#7e22ce` - Dark purple accents
- **800**: `#6b21a8` - Very dark purple
- **900**: `#581c87` - Darkest purple

### Use Cases
- **Primary Actions**: Purple-600 backgrounds with white text
- **Hover States**: Purple-500 or Purple-700
- **Active States**: Purple-50 backgrounds with Purple-600 text
- **Borders**: Purple-200 for light, Purple-300 for medium
- **Badges**: Purple-50 background, Purple-700 text, Purple-200 border

## Secondary Colors

### Green (Success & Completion)
- **500**: `#22c55e` - Success messages
- **600**: `#16a34a` - Completed states
Use sparingly for:
- Completed tasks/episodes
- Success confirmations
- "Mark Complete" buttons

### Red (Errors & Critical)
- **400**: `#f87171` - Error text
- **500**: `#ef4444` - Error backgrounds
- **600**: `#dc2626` - Critical states
Use for:
- Error messages
- Failed states
- Delete/remove actions

### Orange (Processing & Warnings)
- **400**: `#fb923c` - Processing states
- **500**: `#f97316` - Warning backgrounds
Use for:
- Video processing states
- Warning messages
- Pending states

## Neutral Grays

### Gray Scale
- **50**: `#f9fafb` - Page backgrounds
- **100**: `#f3f4f6` - Card backgrounds
- **200**: `#e5e7eb` - Borders
- **300**: `#d1d5db` - Dividers
- **400**: `#9ca3af` - Disabled text
- **500**: `#6b7280` - Secondary text
- **600**: `#4b5563` - Body text
- **700**: `#374151` - Headings
- **800**: `#1f2937` - Dark text
- **900**: `#111827` - Darkest text

## Gradients

### Purple Gradients
```
from-purple-600 to-purple-500  // Primary buttons
from-purple-50 to-white         // Cards
from-purple-100 to-purple-50    // Selected states
```

### Background Gradients
```
from-gray-50 via-purple-50/30 to-gray-50  // Page backgrounds
from-purple-600 to-purple-500             // Buttons & CTAs
```

## Shadows

### Purple Shadows
```
shadow-purple-500/30  // Medium intensity
shadow-purple-500/20  // Light intensity
shadow-purple-500/40  // Strong intensity
```

## Usage Guidelines

1. **Primary Brand Color**: Always use Purple-600 (#9333ea) for main CTAs
2. **Text on Purple**: Use white text on Purple-600 or darker
3. **Backgrounds**: Use Gray-50 for pages, White for cards
4. **Interactive States**: 
   - Hover: Scale slightly + darker purple
   - Active: Purple-50 background
   - Focus: Purple-500 ring with 20% opacity
5. **Consistency**: Avoid mixing blue colors - stick to purple for all primary actions
