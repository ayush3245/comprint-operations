# Nexus WMS Design System Reference

This document provides a comprehensive guide to replicate the clean, futuristic design of Nexus WMS in our Comprint Operations application.

---

## Table of Contents

1. [Color System](#1-color-system)
2. [Typography](#2-typography)
3. [Card Components](#3-card-components)
4. [Button Styles](#4-button-styles)
5. [Form Elements](#5-form-elements)
6. [Tables](#6-tables)
7. [Badges & Tags](#7-badges--tags)
8. [Modals](#8-modals)
9. [Shadows & Effects](#9-shadows--effects)
10. [Animations](#10-animations)
11. [Charts](#11-charts)
12. [Layout Patterns](#12-layout-patterns)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Color System

### Brand Colors (Tailwind Config)

Add these to `tailwind.config.ts`:

```javascript
colors: {
  nexus: {
    black: '#0A0A0A',      // Deep black - primary dark background
    dark: '#171717',        // Charcoal - secondary dark
    gray: '#262626',        // Medium gray
    accent: '#3B82F6',      // Electric blue - primary actions
    highlight: '#10B981',   // Emerald green - success/positive
    surface: '#FFFFFF',     // White surface
    subtle: '#F5F5F7',      // Apple-like light gray background
  }
}
```

### Dark Mode Surface Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page Background | `bg-nexus-subtle` (#F5F5F7) | `bg-black` (#0A0A0A) |
| Card Background | `bg-white` | `dark:bg-white/5` |
| Card Border | `border-gray-100` | `dark:border-white/10` |
| Elevated Surface | `bg-white` | `dark:bg-white/10` |

### Text Colors

| Usage | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary Text | `text-nexus-dark` | `dark:text-white` |
| Secondary Text | `text-gray-600` | `dark:text-gray-300` |
| Muted Text | `text-gray-400` | `dark:text-gray-500` |
| Labels | `text-gray-500` | `dark:text-gray-400` |

### Status Color System

Complete status colors with dark mode support:

```typescript
// Reference: nexus-wms/WMS/types.ts (lines 653-670)
const STATUS_COLORS = {
  // Warning States
  PENDING_INSPECTION: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-700'
  },

  // Active/Progress States
  UNDER_REPAIR: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-700'
  },

  // Success States
  READY_FOR_STOCK: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700'
  },

  // Error/Danger States
  SCRAPPED: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700'
  },

  // Info States
  WAITING_FOR_SPARES: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-700'
  }
}
```

### Alert Card Colors

```jsx
// Success Alert
className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"

// Warning Alert
className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"

// Error Alert
className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"

// Info Alert
className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
```

---

## 2. Typography

### Font Families

Add Google Fonts to `layout.tsx` or `globals.css`:

```html
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
```

Tailwind config:

```javascript
fontFamily: {
  brand: ['Chakra Petch', 'sans-serif'],    // Stats, headings, numbers
  display: ['Rajdhani', 'sans-serif'],       // Subtitles, labels
  sans: ['Inter', 'sans-serif'],             // Body text, UI elements
}
```

### Typography Usage

```jsx
// Large Stats/Numbers (Dashboard cards)
<span className="text-2xl md:text-3xl font-brand font-bold text-nexus-dark dark:text-white">
  142
</span>

// Section Headings
<h3 className="font-brand font-bold text-base md:text-lg text-nexus-dark dark:text-white">
  Weekly Flow
</h3>

// Uppercase Labels (Small)
<span className="font-display text-[9px] md:text-[10px] text-gray-500 uppercase tracking-[0.15em]">
  TOTAL DEVICES
</span>

// Body Text
<p className="text-sm text-gray-600 dark:text-gray-300">
  Description text here
</p>

// Monospace (Barcodes, IDs)
<span className="font-mono font-bold text-nexus-dark dark:text-cyan-400">
  L-BRD-0001
</span>
```

---

## 3. Card Components

### Standard Card (Stats, Content)

```jsx
// Reference: nexus-wms/WMS/components/Dashboard.tsx (lines 166-180)
<div className="
  bg-white dark:bg-white/5
  p-4 md:p-6
  rounded-xl md:rounded-2xl
  shadow-sm
  border border-gray-100 dark:border-white/10
  hover:shadow-lg hover:-translate-y-1
  transition-all duration-200
  cursor-pointer
  group
  dark:hover:bg-white/10
">
  {/* Card content */}
</div>
```

**Key Features:**
- Semi-transparent dark mode: `dark:bg-white/5`
- Hover lift effect: `hover:shadow-lg hover:-translate-y-1`
- Smooth transition: `transition-all duration-200`
- Responsive corners: `rounded-xl md:rounded-2xl`

### Stat Card Structure

```jsx
<div className="bg-white dark:bg-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  <div className="flex items-start justify-between mb-2">
    {/* Label */}
    <span className="font-display text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      TOTAL DEVICES
    </span>
    {/* Icon */}
    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/20">
      <Package size={16} className="text-blue-500" />
    </div>
  </div>

  {/* Value */}
  <h3 className="text-2xl md:text-3xl font-brand font-bold text-nexus-dark dark:text-white">
    142
  </h3>

  {/* Trend indicator (optional) */}
  <div className="flex items-center gap-1 mt-2">
    <TrendingUp size={14} className="text-emerald-500" />
    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
      +12%
    </span>
  </div>
</div>
```

### Glass Card (Premium/Login)

```jsx
// Reference: nexus-wms/WMS/components/Login.tsx (line 56)
<div className="
  bg-white/80
  backdrop-blur-xl
  rounded-2xl md:rounded-[2rem]
  shadow-premium
  border border-white/50
">
  {/* Glassmorphism effect */}
</div>
```

### Alert/Highlight Card

```jsx
// TAT Breaches (Red Alert)
<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 md:p-6 rounded-xl">
  <div className="flex items-center gap-2 mb-2">
    <AlertTriangle size={16} className="text-red-500" />
    <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase">
      TAT Breaches
    </span>
  </div>
  <h3 className="text-2xl font-brand font-bold text-red-700 dark:text-red-300">5</h3>
  <p className="text-xs text-red-600 dark:text-red-400 mt-1">Repairs exceeding 5-day TAT</p>
</div>

// QC Pass Rate (Green Success)
<div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 md:p-6 rounded-xl">
  <div className="flex items-center gap-2 mb-2">
    <CheckCircle size={16} className="text-emerald-500" />
    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
      QC Pass Rate
    </span>
  </div>
  <h3 className="text-2xl font-brand font-bold text-emerald-700 dark:text-emerald-300">100%</h3>
</div>
```

---

## 4. Button Styles

### Primary Button (CTA)

```jsx
// Reference: nexus-wms/WMS/components/Login.tsx (line 138)
<button className="
  w-full py-3 md:py-4
  rounded-xl
  bg-nexus-black dark:bg-white
  text-white dark:text-nexus-black
  font-medium
  shadow-lg shadow-gray-200 dark:shadow-none
  hover:shadow-xl
  hover:bg-nexus-dark dark:hover:bg-gray-100
  hover:scale-[1.02]
  active:scale-[0.98]
  transition-all duration-300
">
  Sign In
</button>
```

### Secondary Button

```jsx
<button className="
  px-4 py-2
  rounded-lg
  bg-gray-100 dark:bg-white/10
  text-gray-700 dark:text-gray-300
  hover:bg-gray-200 dark:hover:bg-white/20
  transition-all
">
  Cancel
</button>
```

### Icon Button

```jsx
// Reference: nexus-wms/WMS/App.tsx (line 379)
<button className="
  p-2
  rounded-lg
  text-gray-400
  hover:text-nexus-dark dark:hover:text-white
  hover:bg-gray-100 dark:hover:bg-white/10
  active:bg-gray-200 dark:active:bg-white/20
  transition-all
  hover:scale-105
  active:scale-95
">
  <Icon size={20} />
</button>
```

### Danger Button

```jsx
<button className="
  px-4 py-2
  rounded-lg
  bg-red-500/10
  text-red-500
  hover:bg-red-500/20
  hover:text-red-600
  active:bg-red-500/30
  border border-red-500/20
  hover:border-red-500/40
  hover:scale-[1.02]
  active:scale-[0.98]
  transition-all
">
  Delete
</button>
```

### Toggle Button Group

```jsx
<div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
  <button className={`
    px-4 py-2 rounded-lg text-sm font-medium transition-all
    ${isActive
      ? 'bg-white dark:bg-gray-700 shadow-sm text-nexus-dark dark:text-white'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
    }
  `}>
    Option 1
  </button>
</div>
```

---

## 5. Form Elements

### Text Input

```jsx
// Reference: nexus-wms/WMS/components/Login.tsx (line 104)
<input
  type="text"
  className="
    w-full
    px-4 py-3 md:py-4
    rounded-xl
    border border-gray-200 dark:border-white/10
    bg-white/50 dark:bg-white/5
    text-gray-900 dark:text-white
    placeholder:text-gray-400
    focus:bg-white dark:focus:bg-white/10
    focus:ring-2 focus:ring-nexus-accent/20
    focus:border-nexus-accent
    outline-none
    transition-all
    hover:border-blue-300 dark:hover:border-white/20
    hover:shadow-sm
  "
  placeholder="Enter value"
/>
```

### Input with Icon

```jsx
<div className="relative group">
  <User
    className="
      absolute left-3 md:left-4 top-1/2 -translate-y-1/2
      text-gray-400
      group-focus-within:text-nexus-accent
      transition-colors
    "
    size={18}
  />
  <input
    className="pl-10 md:pl-12 pr-4 py-3 ..."
    placeholder="Username"
  />
</div>
```

### Select Dropdown

```jsx
<select className="
  w-full
  px-4 py-3
  rounded-xl
  border border-gray-200 dark:border-white/10
  bg-white dark:bg-white/5
  text-gray-900 dark:text-white
  focus:outline-none
  focus:ring-2 focus:ring-nexus-accent/20
  focus:border-nexus-accent
  cursor-pointer
">
  <option value="">Select option</option>
  <option value="1">Option 1</option>
</select>
```

### Form Label

```jsx
<label className="
  block
  text-xs
  font-semibold
  text-gray-500 dark:text-gray-400
  uppercase
  tracking-wider
  mb-2
  ml-1
">
  Field Name
</label>
```

---

## 6. Tables

### Table Structure

```jsx
// Reference: nexus-wms/WMS/components/Inventory.tsx (lines 276-369)
<div className="overflow-x-auto">
  <table className="w-full text-left">
    <thead className="bg-gray-50 dark:bg-white/5">
      <tr>
        <th className="
          px-6 py-4
          text-xs
          font-semibold
          text-gray-500 dark:text-gray-400
          uppercase
          tracking-wider
        ">
          Column Header
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
      <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
          Cell content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Table Cell Patterns

```jsx
// Primary Cell (Bold, Monospace for IDs)
<td className="px-6 py-4">
  <span className="font-mono font-bold text-nexus-dark dark:text-cyan-400">
    L-BRD-0001
  </span>
</td>

// Secondary Info Cell
<td className="px-6 py-4">
  <div className="text-sm text-gray-900 dark:text-white">Dell Latitude 5520</div>
  <div className="text-xs text-gray-500 dark:text-gray-400">Laptop</div>
</td>

// Status Cell
<td className="px-6 py-4">
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
    Ready
  </span>
</td>

// Actions Cell
<td className="px-6 py-4 text-right">
  <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
    <MoreVertical size={16} className="text-gray-400" />
  </button>
</td>
```

---

## 7. Badges & Tags

### Status Badge (Pill)

```jsx
<span className="
  inline-flex items-center
  px-2.5 py-1
  rounded-full
  text-xs font-bold
  bg-emerald-100 dark:bg-emerald-500/20
  text-emerald-700 dark:text-emerald-400
">
  Active
</span>
```

### Category Badge (Rounded)

```jsx
<span className="
  px-2 py-1
  bg-gray-100 dark:bg-white/10
  rounded
  text-xs
  text-gray-600 dark:text-gray-300
">
  Laptop
</span>
```

### Grade Badges

```jsx
// Grade A
<span className="px-2 py-1 rounded font-bold text-sm bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
  A
</span>

// Grade B
<span className="px-2 py-1 rounded font-bold text-sm bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
  B
</span>

// Grade C
<span className="px-2 py-1 rounded font-bold text-sm bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
  C
</span>
```

### Location Badge (Monospace)

```jsx
<span className="
  font-mono
  text-xs
  bg-gray-100 dark:bg-white/10
  px-2 py-1
  rounded
  text-gray-600 dark:text-gray-300
">
  WAREHOUSE-A12
</span>
```

---

## 8. Modals

### Modal Overlay

```jsx
// Reference: nexus-wms/WMS/components/Inward.tsx (line 453)
<div
  className="
    fixed inset-0
    bg-black/50
    backdrop-blur-sm
    flex items-center justify-center
    z-50
    p-4
  "
  onClick={closeModal}
>
  {/* Modal content */}
</div>
```

### Modal Container

```jsx
<div
  className="
    bg-white dark:bg-gray-900
    rounded-2xl
    shadow-xl
    w-full max-w-lg
    max-h-[90vh] overflow-y-auto
    border border-gray-100 dark:border-white/10
  "
  onClick={e => e.stopPropagation()}
>
  {/* Header */}
  <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
    <h3 className="font-brand font-bold text-xl text-nexus-dark dark:text-white">
      Modal Title
    </h3>
    <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
      <X size={20} className="text-gray-400" />
    </button>
  </div>

  {/* Body */}
  <div className="p-6 space-y-4">
    {/* Content */}
  </div>

  {/* Footer */}
  <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-white/10">
    <button className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
      Cancel
    </button>
    <button className="px-4 py-2 rounded-lg bg-nexus-accent text-white">
      Confirm
    </button>
  </div>
</div>
```

---

## 9. Shadows & Effects

### Custom Shadows (Tailwind Config)

```javascript
boxShadow: {
  'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 12px -4px rgba(0, 0, 0, 0.05)',
  'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  'premium': '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
  'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
  'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
}
```

### Glassmorphism

```jsx
// Light glass effect
<div className="bg-white/80 backdrop-blur-xl border border-white/50">

// Dark overlay with blur
<div className="bg-black/50 backdrop-blur-sm">
```

### Gradient Background Blobs (Login/Hero)

```jsx
// Reference: nexus-wms/WMS/components/Login.tsx (lines 47-50)
<div className="absolute inset-0 overflow-hidden">
  {/* Blue blob */}
  <div className="
    absolute top-[-10%] left-[-10%]
    w-[40%] h-[40%]
    bg-blue-200/30
    blur-[120px]
    rounded-full
    mix-blend-multiply
    opacity-50
  "></div>

  {/* Purple blob */}
  <div className="
    absolute bottom-[-10%] right-[-10%]
    w-[40%] h-[40%]
    bg-purple-200/30
    blur-[120px]
    rounded-full
    mix-blend-multiply
    opacity-50
  "></div>
</div>
```

---

## 10. Animations

### Framer Motion Variants

```jsx
// Staggered fade-in (for lists/grids)
// Reference: nexus-wms/WMS/components/Dashboard.tsx (line 165)
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>
  {/* Card */}
</motion.div>

// Scale animation
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.2 }}
>
  {/* Content */}
</motion.div>

// Slide from right
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.4 }}
>
  {/* Content */}
</motion.div>
```

### Modal Animation

```jsx
<AnimatePresence>
  {showModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="modal-content"
      >
        {/* Modal */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### CSS Transitions

```css
/* Standard transitions */
.transition-all { transition: all 200ms ease; }
.transition-colors { transition: color, background-color, border-color 150ms ease; }

/* Hover lift effect */
.hover-lift {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Button scale */
.btn-scale:hover { transform: scale(1.02); }
.btn-scale:active { transform: scale(0.98); }
```

### Active Indicator (Sidebar)

```jsx
// Reference: nexus-wms/WMS/components/Sidebar.tsx (line 166)
<motion.div
  layoutId="activeIndicator"
  className="
    ml-auto
    w-1.5 h-1.5
    rounded-full
    bg-nexus-accent
    shadow-[0_0_8px_rgba(59,130,246,0.8)]
  "
/>
```

---

## 11. Charts

### Area Chart (Recharts)

```jsx
// Reference: nexus-wms/WMS/components/Dashboard.tsx (lines 232-254)
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorInward" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
      </linearGradient>
      <linearGradient id="colorOutward" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
      </linearGradient>
    </defs>

    <CartesianGrid
      strokeDasharray="3 3"
      vertical={false}
      stroke="#f3f4f6"
      className="dark:stroke-white/10"
    />

    <XAxis
      dataKey="day"
      axisLine={false}
      tickLine={false}
      tick={{ fill: '#9CA3AF', fontSize: 10 }}
      dy={10}
    />

    <YAxis
      axisLine={false}
      tickLine={false}
      tick={{ fill: '#9CA3AF', fontSize: 10 }}
      width={30}
    />

    <Tooltip
      contentStyle={{
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: 'white'
      }}
      itemStyle={{ fontSize: '12px', fontWeight: 600 }}
    />

    <Area
      type="monotone"
      dataKey="inward"
      stroke="#3B82F6"
      strokeWidth={2}
      fillOpacity={1}
      fill="url(#colorInward)"
    />

    <Area
      type="monotone"
      dataKey="outward"
      stroke="#10B981"
      strokeWidth={2}
      fillOpacity={1}
      fill="url(#colorOutward)"
    />
  </AreaChart>
</ResponsiveContainer>
```

### Pie/Donut Chart

```jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = [
  '#F59E0B',  // Amber - Pending
  '#F97316',  // Orange - Waiting
  '#8B5CF6',  // Purple - Ready
  '#6366F1',  // Indigo - Under Repair
  '#EC4899',  // Pink - Paint
  '#06B6D4',  // Cyan - QC
  '#10B981',  // Emerald - Stock
]

<ResponsiveContainer width="100%" height={200}>
  <PieChart>
    <Pie
      data={data}
      cx="50%"
      cy="50%"
      innerRadius={40}  // Makes it a donut
      outerRadius={65}
      paddingAngle={2}
      dataKey="value"
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
```

### Chart Legend

```jsx
<div className="flex flex-wrap gap-4 mt-4 justify-center">
  {data.map((item, index) => (
    <div key={item.name} className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: COLORS[index] }}
      />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {item.name}
      </span>
    </div>
  ))}
</div>
```

---

## 12. Layout Patterns

### Page Container

```jsx
<main className="
  flex-1
  lg:ml-64          /* Sidebar offset */
  p-4 md:p-6 lg:p-8
  min-h-screen
  bg-nexus-subtle dark:bg-black
">
  <div className="max-w-7xl mx-auto">
    {/* Page content */}
  </div>
</main>
```

### Grid Layouts

```jsx
// Stats Grid (2-col mobile, 4-col desktop)
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
  {/* Stat cards */}
</div>

// Content Grid (1-col mobile, 2-col tablet, 3-col desktop)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {/* Cards */}
</div>

// Dashboard Layout (Charts side by side)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Chart cards */}
</div>
```

### Responsive Spacing

```css
/* Gap */
gap-3 md:gap-4 lg:gap-6

/* Padding */
p-4 md:p-6 lg:p-8
px-4 md:px-6
py-3 md:py-4

/* Margin */
mb-4 md:mb-6
mt-6 md:mt-8
```

### Sidebar Layout

```jsx
<div className="flex min-h-screen">
  {/* Sidebar - Fixed on desktop */}
  <aside className="
    hidden lg:flex
    w-64
    h-screen
    fixed left-0 top-0
    flex-col
    bg-white dark:bg-nexus-dark
    border-r border-gray-100 dark:border-white/10
  ">
    {/* Sidebar content */}
  </aside>

  {/* Main content */}
  <main className="flex-1 lg:ml-64">
    {/* Page content */}
  </main>
</div>
```

---

## 13. Implementation Checklist

### Phase 1: Foundation
- [ ] Update `tailwind.config.ts` with nexus colors and fonts
- [ ] Add Google Fonts to layout
- [ ] Update `globals.css` with custom shadows and utilities
- [ ] Create base color CSS variables

### Phase 2: Components
- [ ] Update GlassCard to match Nexus stat cards
- [ ] Create new StatCard component with proper typography
- [ ] Update all buttons to new styles
- [ ] Update form inputs and selects
- [ ] Update table styling
- [ ] Create new badge components

### Phase 3: Pages
- [ ] Redesign Dashboard with new stat cards
- [ ] Update chart styling and colors
- [ ] Update all page layouts
- [ ] Implement proper dark mode everywhere

### Phase 4: Polish
- [ ] Add Framer Motion animations
- [ ] Implement hover effects
- [ ] Add loading states
- [ ] Test responsive behavior

---

## Quick Reference: Key Differences

| Element | Current (Comprint) | Target (Nexus) |
|---------|-------------------|----------------|
| Stat Cards | Colored backgrounds with icons | White/transparent with subtle shadows |
| Typography | Standard fonts | Chakra Petch for stats, Inter for body |
| Card Hover | None | Lift + shadow increase |
| Dark Cards | `bg-card` | `bg-white/5` (semi-transparent) |
| Buttons | Solid colors | Scale animations + shadows |
| Inputs | Basic borders | Rounded-xl with focus glow |
| Charts | Bar charts prominent | Area charts with gradients |

---

*Last updated: December 2024*
*Reference: nexus-wms/WMS codebase*
