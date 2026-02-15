# Primary Colors Design System

## Overview
MedFlix uses a sophisticated child-oriented design that balances **simplicity with elegance**. The design draws inspiration from successful educational apps like Khan Academy Kids, Duolingo, and PBS Kids while maintaining a unique, premium aesthetic.

## Core Philosophy
1. **Simple but Not Simplistic**: Primary colors and geometric shapes create a playful environment without appearing generic or "vibecoded"
2. **Kid-Oriented Elegance**: Large, clear elements with generous spacing ensure accessibility while sophisticated color usage maintains visual quality
3. **Educational Focus**: Design supports learning through clear visual hierarchy, progress indicators, and reward systems

## Color Palette

### Primary Colors
```css
Red:    #ef4444  (medflix-red)
Blue:   #3b82f6  (medflix-blue)
Yellow: #eab308  (medflix-yellow)
Purple: #9333ea  (medflix-purple - accent)
```

### Supporting Colors
```css
Green:  #22c55e  (success, completion)
Orange: #f97316  (warnings, processing)
Gray:   #6b7280  (neutral, secondary text)
White:  #ffffff  (backgrounds, cards)
```

### Color Psychology & Usage
- **Red**: Energy, excitement, primary actions (Watch buttons, key CTAs)
- **Blue**: Trust, knowledge, communication (Chat, doctor elements)
- **Yellow**: Happiness, achievement, rewards (Progress, stars, badges)
- **Purple**: Premium, creative, special features (Avatar, advanced features)
- **Green**: Success, completion, positive feedback
- **Orange**: Attention, processing states (not yellow warnings)

## Typography

### Font Stack
```css
Primary: 'Poppins', sans-serif
Fallback: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

### Font Weights
- **900 (Black)**: Headlines, primary buttons, key labels
- **700-800 (Bold)**: Subheadings, secondary buttons
- **600 (Semibold)**: Body text emphasis
- **400-500 (Regular/Medium)**: Body text

### Font Sizes (Mobile-First)
```css
Titles:         text-4xl (2.25rem / 36px) - text-5xl (3rem / 48px)
Headings:       text-2xl (1.5rem / 24px) - text-3xl (1.875rem / 30px)
Body:           text-base (1rem / 16px) - text-lg (1.125rem / 18px)
Small:          text-sm (0.875rem / 14px)
Tiny:           text-xs (0.75rem / 12px)
```

## Geometric Elements

### Shape Language
1. **Rounded Corners**: 
   - Cards: `rounded-3xl` (1.5rem / 24px)
   - Buttons: `rounded-2xl` (1rem / 16px)
   - Icons: `rounded-xl` (0.75rem / 12px)
   - Circles: `rounded-full`

2. **Decorative Shapes**:
   - Circles: Background accents, floating elements
   - Squares (rotated 45°): Dynamic backgrounds
   - Stars: Achievement badges, completion indicators
   - Rounded rectangles: Primary UI elements

3. **Shape Usage**:
   - Primary UI: Extra-rounded rectangles for comfort
   - Rewards: Stars for achievements
   - Background: Subtle geometric shapes for playfulness
   - Icons: Rounded containers for consistency

### Border Weights
```css
Light:    border-3 (3px) - default for most elements
Medium:   border-4 (4px) - important cards, active states
Heavy:    border-5 (5px) - headers, modal headers, emphasis
```

## Component Patterns

### Buttons
```jsx
// Primary Action (Red)
className="px-8 py-4 bg-medflix-red text-white rounded-2xl font-black text-lg hover:scale-105 shadow-xl"

// Secondary Action (Blue)
className="px-6 py-3 bg-medflix-blue text-white rounded-xl font-bold text-base hover:scale-105 shadow-lg"

// Success Action (Green)
className="px-8 py-4 bg-green-500 text-white rounded-2xl font-black text-lg hover:scale-105 shadow-xl"

// Tertiary/Outline
className="px-6 py-3 bg-white border-4 border-gray-300 text-gray-900 rounded-xl font-bold hover:scale-105"
```

### Cards
```jsx
// Primary Card
className="bg-white rounded-3xl border-5 border-gray-200 p-8 shadow-2xl"

// Color-Coded Card (Day Cards)
className="bg-white rounded-3xl border-5 border-medflix-[color] p-6 shadow-xl hover:shadow-2xl hover:scale-[1.03]"

// Completed Card
className="bg-green-50 rounded-3xl border-5 border-green-500 p-6 shadow-2xl"
```

### Progress Indicators
```jsx
// Star Rating
<div className="w-8 h-8 shape-star bg-yellow-400 flex items-center justify-center">
  <span className="text-white font-bold">★</span>
</div>

// Progress Bar
<div className="bg-gray-100 rounded-full h-8 border-3 border-gray-300">
  <div className="bg-medflix-purple h-full rounded-full transition-all duration-500">
    {/* Progress content */}
  </div>
</div>
```

### Interactive Elements
- **Hover States**: `hover:scale-105` for buttons, `hover:scale-[1.03]` for cards
- **Active States**: Larger borders, brighter colors, subtle shadow increases
- **Disabled States**: `opacity-50`, grayscale colors
- **Focus States**: `ring-4` with matching color

## Animation & Motion

### Transitions
```css
Default:     transition-all
Buttons:     hover:scale-105 transition-all
Cards:       hover:scale-[1.03] transition-all
Colors:      transition-colors
Progress:    transition-all duration-500
```

### Keyframe Animations
```css
/* Gentle floating for background shapes */
.animate-float-gentle {
  animation: float-gentle 6s ease-in-out infinite;
}

/* Entry animations */
.animate-fadeIn
.animate-scaleIn
```

## Layout Principles

### Spacing
```css
Tight:       gap-2, p-2
Normal:      gap-3, p-3 to gap-4, p-4
Generous:    gap-5, p-5 to gap-6, p-6
Luxurious:   gap-8, p-8 to gap-10, p-10
```

### Grid Systems
- **Login Avatars**: 2 columns on mobile, equal width
- **Day Cards**: 1 column on mobile, responsive grid on desktop
- **Visual Styles**: 2 columns
- **Avatar Selection**: 3 columns
- **Quick Actions**: Flexible wrap

### White Space
- Ample padding in all interactive elements (minimum `p-4`)
- Generous margins between sections (minimum `mb-6`)
- Clear visual grouping through consistent spacing

## Accessibility

### Contrast Ratios
- All text meets WCAG AA standards (4.5:1 minimum)
- Interactive elements have clear visual affordances
- Focus indicators are prominent and colorful

### Touch Targets
- Minimum button size: 48x48px
- Generous padding around clickable areas
- Clear spacing between adjacent interactive elements

### Feedback
- Hover states for all interactive elements
- Clear loading and processing states
- Success/error states with color + icon + text

## Icon System

### Icon Library
**Lucide React** - consistent, playful, professional icons

### Icon Sizes
```css
Small:    w-4 h-4  (16px)
Medium:   w-6 h-6  (24px)
Large:    w-8 h-8  (32px)
XLarge:   w-10 h-10 (40px)
```

### Icon Containers
```jsx
// Primary colored container
<div className="w-16 h-16 bg-medflix-red rounded-2xl flex items-center justify-center shadow-lg">
  <Icon className="w-8 h-8 text-white" />
</div>

// Subtle container
<div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
  <Icon className="w-6 h-6 text-gray-600" />
</div>
```

## Color Rotation Patterns

### Day Cards (4-color rotation)
```javascript
const colors = [
  { bg: 'bg-medflix-red', border: 'border-medflix-red' },
  { bg: 'bg-medflix-blue', border: 'border-medflix-blue' },
  { bg: 'bg-medflix-yellow', border: 'border-medflix-yellow' },
  { bg: 'bg-medflix-purple', border: 'border-medflix-purple' },
];
const colorScheme = colors[day.day % colors.length];
```

### Tabs (3-color mapping)
```javascript
Recovery Plan: Red
Live Avatar: Blue
AI Assistant: Yellow
```

## Best Practices

### DO:
✓ Use primary colors for key actions and navigation
✓ Employ generous spacing and large touch targets
✓ Include playful geometric shapes in backgrounds
✓ Use bold, black fonts for emphasis
✓ Add subtle hover animations (scale, shadow)
✓ Show progress with stars and visual indicators
✓ Use rounded corners consistently
✓ Provide clear visual feedback for all interactions

### DON'T:
✗ Use gradients on text or backgrounds (readability issues)
✗ Mix too many colors in a single component
✗ Use thin borders (minimum 3px)
✗ Create sharp corners (minimum 0.75rem border-radius)
✗ Use small fonts (minimum 14px)
✗ Forget white space between elements
✗ Use generic stock imagery or emojis
✗ Create overly complex layouts

## Inspiration Sources

### Educational Apps
- **Khan Academy Kids**: Primary colors, clear hierarchy, reward systems
- **Duolingo**: Gamification, progress tracking, friendly characters
- **PBS Kids**: Bold shapes, accessibility, primary focus
- **ABCmouse**: Organized colorful design, learning paths

### Design Principles
- Material Design (spacing, elevation concepts)
- Apple Human Interface Guidelines (clarity, deference, depth)
- Nielsen Norman Group (UX for kids, readability)

## Implementation Notes

### Tailwind Configuration
Custom colors defined in `tailwind.config.js`:
```javascript
colors: {
  medflix: {
    red: { light: '#fef2f2', DEFAULT: '#ef4444', dark: '#dc2626' },
    blue: { light: '#eff6ff', DEFAULT: '#3b82f6', dark: '#2563eb' },
    yellow: { light: '#fefce8', DEFAULT: '#eab308', dark: '#ca8a04' },
    purple: { light: '#faf5ff', DEFAULT: '#9333ea', dark: '#7e22ce' },
  }
}
```

### Font Loading
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### Custom Utilities
```css
.border-3 { border-width: 3px; }
.border-4 { border-width: 4px; }
.border-5 { border-width: 5px; }
.shape-star { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, ...); }
```

---

**Last Updated**: February 2026  
**Design Version**: 3.0 (Primary Colors + Elegance)
