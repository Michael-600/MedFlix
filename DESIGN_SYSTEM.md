# MedFlix Design System

## 🎨 Color Palette

### Primary Purple
Our signature color that represents trust, care, and innovation in healthcare.

```
Purple-50:  #faf5ff  // Lightest backgrounds
Purple-100: #f3e8ff  // Light backgrounds, hover states
Purple-200: #e9d5ff  // Borders, dividers
Purple-300: #d8b4fe  // Secondary accents
Purple-400: #c084fc  // Interactive elements
Purple-500: #a855f7  // Hover states, secondary CTAs
Purple-600: #9333ea  // PRIMARY BRAND COLOR
Purple-700: #7e22ce  // Dark accents, pressed states
Purple-800: #6b21a8  // Very dark purple
Purple-900: #581c87  // Darkest purple
```

### Supporting Colors

**Green (Success & Completion)**
- Green-500: `#22c55e` - Success states
- Green-600: `#16a34a` - Completed tasks

**Orange (Processing & Warnings)**
- Orange-400: `#fb923c` - Processing indicators
- Orange-500: `#f97316` - Warning states

**Red (Errors & Critical)**
- Red-400: `#f87171` - Error messages
- Red-500: `#ef4444` - Error backgrounds
- Red-600: `#dc2626` - Critical actions

**Gray (Neutrals)**
- Gray-50: `#f9fafb` - Page backgrounds
- Gray-100: `#f3f4f6` - Card backgrounds
- Gray-200: `#e5e7eb` - Borders
- Gray-500: `#6b7280` - Secondary text
- Gray-700: `#374151` - Primary text
- Gray-900: `#111827` - Darkest text

## 🎯 Component Patterns

### Buttons

**Primary Button**
```css
bg-gradient-to-r from-purple-600 to-purple-500
hover:from-purple-700 hover:to-purple-600
shadow-lg shadow-purple-500/30
```

**Secondary Button**
```css
border-2 border-purple-600 text-purple-600
hover:bg-purple-50
```

**Success Button**
```css
bg-green-500 hover:bg-green-600
shadow-lg shadow-green-500/30
```

### Cards

**Standard Card**
```css
bg-white rounded-2xl border border-gray-200
shadow-md hover:shadow-xl
```

**Active/Selected Card**
```css
border-purple-600 bg-gradient-to-br from-purple-50 to-white
shadow-lg shadow-purple-500/10
```

**Completed Card**
```css
border-green-500 bg-gradient-to-br from-green-50 to-white
shadow-lg shadow-green-500/10
```

### Badges

**Primary Badge**
```css
bg-purple-50 text-purple-700 border border-purple-200
px-2.5 py-1 rounded-lg font-medium
```

**Status Badge**
```css
// Success
bg-green-500 text-white rounded-lg px-3 py-1.5

// Processing  
bg-orange-500/10 text-orange-600 border border-orange-500/20

// Error
bg-red-500/10 text-red-600 border border-red-500/20
```

## 📐 Spacing & Sizing

### Border Radius
- **sm**: `rounded-lg` (8px) - Small elements, badges
- **md**: `rounded-xl` (12px) - Buttons, inputs
- **lg**: `rounded-2xl` (16px) - Cards, modals
- **full**: `rounded-full` - Avatars, pills

### Shadows
```css
// Subtle
shadow-sm

// Standard
shadow-md

// Elevated
shadow-lg

// Extra elevated
shadow-xl

// With color (purple)
shadow-lg shadow-purple-500/30
```

### Padding
- **Buttons**: `px-5 py-3` or `px-6 py-4` for large
- **Cards**: `p-6` or `p-8` for large
- **Modals**: `p-8` or `p-10` for large

## ✨ Effects & Animations

### Hover States
```css
hover:shadow-xl hover:border-purple-300
transition-all duration-200
```

### Focus States
```css
focus:border-purple-500 
focus:ring-4 focus:ring-purple-500/10
outline-none
```

### Entrance Animations
```css
animate-fadeIn    // Fade in with slight upward motion
animate-slideUp   // Slide up from bottom
animate-scaleIn   // Scale from 95% to 100%
```

### Gradients

**Background Gradients**
```css
// Page backgrounds
bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50

// Button gradients
bg-gradient-to-r from-purple-600 to-purple-500

// Card gradients
bg-gradient-to-br from-purple-50 to-white
```

**Text Gradients**
```css
bg-gradient-to-r from-purple-400 to-purple-300 
bg-clip-text text-transparent
```

## 🎭 Interactive States

### Default → Hover → Active
```css
// Button
bg-purple-600 → hover:bg-purple-700 → active:bg-purple-800

// Card
border-gray-200 → hover:border-purple-300 → (selected) border-purple-600
```

## 📝 Typography

### Font Weights
- **Regular**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

### Text Colors
```css
// Primary
text-gray-900

// Secondary
text-gray-600

// Muted
text-gray-500

// Brand
text-purple-600
```

## 🚀 Usage Examples

### Primary CTA
```jsx
<button className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg shadow-purple-500/30">
  Get Started
</button>
```

### Feature Card
```jsx
<div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 transition-all hover:shadow-xl">
  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
    {icon}
  </div>
  <h3 className="font-semibold text-xl text-gray-900 mb-3">{title}</h3>
  <p className="text-gray-600 leading-relaxed">{description}</p>
</div>
```

### Progress Bar
```jsx
<div className="bg-gray-100 rounded-full h-3 shadow-inner">
  <div 
    className="bg-gradient-to-r from-purple-600 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-purple-500/30 relative overflow-hidden"
    style={{ width: `${progress}%` }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
  </div>
</div>
```

## 🎨 Dark Mode (Landing Page)

For dark sections like the landing page:

```css
// Background
bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900

// Text
text-white

// Cards
bg-white/5 border border-white/10
hover:border-purple-500/30
```

## ✅ Do's and Don'ts

### ✅ Do
- Use purple-600 as the primary brand color consistently
- Apply subtle gradients for depth
- Use appropriate shadows with color tints
- Maintain consistent border radius
- Keep animations smooth and purposeful

### ❌ Don't
- Mix blue colors - stick to purple
- Use harsh shadows without color tints
- Overuse gradients (use strategically)
- Forget hover states on interactive elements
- Use inconsistent spacing
