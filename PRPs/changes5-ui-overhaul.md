# Implementation Plan: UI Overhaul - Zenith CRM Design System

## Overview
Complete UI overhaul of the Comprint Operations portal to incorporate the Zenith CRM design system with **full light/dark mode support**. This includes updating the color scheme, typography, shadows, component styles, theme switching, and overall visual aesthetic to create a modern, professional SaaS interface.

## Requirements Summary
- Extract design elements from https://zenith-crm-five.vercel.app/
- Apply indigo-based color scheme with slate neutrals
- Implement new typography (Rajdhani, Chakra Petch, Inter fonts)
- Add soft shadows and glow effects
- **Implement light/dark mode with system preference detection**
- **Add theme toggle in header with persistence**
- Update all components to match the new design system
- Maintain existing functionality while improving visual appearance

## Research Findings

### Zenith CRM Design System

#### Light Mode Colors
| Element | Value |
|---------|-------|
| **Primary** | Indigo (#4f46e5, #6366f1) |
| **Background** | Slate-50 (#f8fafc) |
| **Card Background** | White (#ffffff) |
| **Text Primary** | Slate-900 (#0f172a) |
| **Text Secondary** | Slate-600 (#475569) |
| **Border** | Slate-200 (#e2e8f0) |

#### Dark Mode Colors
| Element | Value |
|---------|-------|
| **Primary** | Indigo (#818cf8, #6366f1) |
| **Background** | Slate-950 (#020617) |
| **Card Background** | Slate-900 (#0f172a) |
| **Text Primary** | Slate-50 (#f8fafc) |
| **Text Secondary** | Slate-400 (#94a3b8) |
| **Border** | Slate-700 (#334155) |

#### Typography
| Element | Value |
|---------|-------|
| **Display Font** | Rajdhani (sans-serif) |
| **Brand Font** | Chakra Petch (sans-serif) |
| **Body Font** | Inter (sans-serif) |

#### Effects
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Soft Shadow** | 0 4px 20px -2px rgba(0,0,0,0.05) | 0 4px 20px -2px rgba(0,0,0,0.3) |
| **Glow Effect** | 0 0 15px rgba(79,70,229,0.3) | 0 0 20px rgba(99,102,241,0.4) |
| **Card Shadow** | 0 1px 3px rgba(0,0,0,0.1) | 0 1px 3px rgba(0,0,0,0.4) |

### Current Application State
- Uses blue/cyan gradient for branding
- Slate-900 sidebar with glassmorphism
- Basic card shadows
- System fonts (Arial, Helvetica)
- **No dark mode support currently**
- 22 pages requiring updates
- 5 UI components in src/components/ui/

## Implementation Tasks

### Phase 1: Theme System Foundation

#### 1.1 **Create Theme Provider and Context**
- Description: Create React context for theme state management with localStorage persistence
- Files to create: `src/components/ThemeProvider.tsx`
- Features:
  - Theme state: 'light' | 'dark' | 'system'
  - localStorage persistence
  - System preference detection via matchMedia
  - Real-time system preference changes
  - SSR-safe implementation

```typescript
// Expected API
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}
```

#### 1.2 **Update Global CSS with Theme Variables**
- Description: Add CSS custom properties for both themes, import Google Fonts
- Files to modify: `src/app/globals.css`
- Changes:
  - Import Rajdhani, Chakra Petch, Inter from Google Fonts
  - Define `:root` variables for light mode (default)
  - Define `.dark` class variables for dark mode
  - Add `@media (prefers-color-scheme: dark)` for system default
  - Add utility classes for theme-aware styling
  - Custom scrollbar styling for both themes

```css
/* CSS Variable Structure */
:root {
  --background: #f8fafc;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --primary: #4f46e5;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --accent: #f1f5f9;
  --accent-foreground: #0f172a;
  --destructive: #ef4444;
  --border: #e2e8f0;
  --ring: #4f46e5;
  --shadow-soft: 0 4px 20px -2px rgba(0,0,0,0.05);
  --shadow-glow: 0 0 15px rgba(79,70,229,0.3);
}

.dark {
  --background: #020617;
  --foreground: #f8fafc;
  --card: #0f172a;
  --card-foreground: #f8fafc;
  /* ... etc */
}
```

#### 1.3 **Update Root Layout with Theme Provider**
- Description: Wrap application with ThemeProvider, add theme class to html
- Files to modify: `src/app/layout.tsx`
- Changes:
  - Import and wrap with ThemeProvider
  - Add suppressHydrationWarning to html element
  - Add script for flash prevention (inline)

#### 1.4 **Create Theme Toggle Component**
- Description: Create toggle button for switching themes
- Files to create: `src/components/ui/ThemeToggle.tsx`
- Features:
  - Sun/Moon/Monitor icons for light/dark/system
  - Dropdown menu for selection
  - Keyboard accessible
  - Smooth icon transitions
  - Current theme indicator

#### 1.5 **Add Theme Toggle to Header/Sidebar**
- Description: Integrate theme toggle into the UI
- Files to modify: `src/components/Sidebar.tsx`
- Changes:
  - Add theme toggle button in header area
  - Position similar to Zenith (top-right area or sidebar footer)

### Phase 2: Design Tokens & Utilities

#### 2.1 **Create Design System Utility Classes**
- Description: Add reusable utility classes using CSS variables
- Files to modify: `src/app/globals.css`
- Classes to add:
```css
/* Typography */
.font-display { font-family: 'Rajdhani', sans-serif; }
.font-brand { font-family: 'Chakra Petch', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }

/* Backgrounds */
.bg-background { background-color: var(--background); }
.bg-card { background-color: var(--card); }
.bg-primary { background-color: var(--primary); }

/* Text */
.text-foreground { color: var(--foreground); }
.text-muted { color: var(--muted-foreground); }
.text-primary { color: var(--primary); }

/* Borders */
.border-default { border-color: var(--border); }

/* Shadows */
.shadow-soft { box-shadow: var(--shadow-soft); }
.shadow-glow { box-shadow: var(--shadow-glow); }
```

#### 2.2 **Create cn() Utility Enhancement**
- Description: Ensure cn() utility properly merges theme classes
- Files to verify: `src/lib/utils.ts`
- Already exists - verify it uses clsx + tailwind-merge

### Phase 3: Core Component Updates

#### 3.1 **Create Card Component**
- Description: Create versatile card component with theme support
- Files to create: `src/components/ui/Card.tsx`
- Features:
  - Uses CSS variables for colors
  - Variants: default, elevated, outlined, glow
  - Dark mode: darker background, lighter borders
  - Consistent padding and border-radius
  - Optional header/footer sections

```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glow'
  className?: string
  children: React.ReactNode
}
```

#### 3.2 **Create Button Component**
- Description: Standardize button styles with theme support
- Files to create: `src/components/ui/Button.tsx`
- Features:
  - Variants: primary, secondary, ghost, danger, outline
  - Sizes: sm, md, lg
  - Loading state with spinner
  - Icon support (left/right)
  - Theme-aware colors using CSS variables

#### 3.3 **Create Badge Component**
- Description: Create status badge component
- Files to create: `src/components/ui/Badge.tsx`
- Features:
  - Variants: success, warning, error, info, neutral
  - Sizes: sm, md
  - Optional dot indicator
  - Theme-aware colors

#### 3.4 **Create Input Component**
- Description: Standardize form input styling
- Files to create: `src/components/ui/Input.tsx`
- Features:
  - Theme-aware backgrounds and borders
  - Focus ring with primary color
  - Error state styling
  - Label and helper text support
  - Disabled state

#### 3.5 **Create Table Component**
- Description: Standardize table styling
- Files to create: `src/components/ui/Table.tsx`
- Features:
  - Theme-aware header background
  - Row hover effects (different for light/dark)
  - Border styling
  - Responsive behavior

#### 3.6 **Update Sidebar Component**
- Description: Apply theme-aware styling to sidebar
- Files to modify: `src/components/Sidebar.tsx`
- Changes:
  - Keep dark sidebar (consistent in both themes)
  - Update brand gradient to indigo
  - Add theme toggle button
  - Update active tab to indigo
  - Ensure proper contrast in both themes

#### 3.7 **Update GlassCard Component**
- Description: Make glass effect theme-aware
- Files to modify: `src/components/ui/GlassCard.tsx`
- Changes:
  - Light: white/80 with blur
  - Dark: slate-800/80 with blur
  - Theme-aware gradient overlays

#### 3.8 **Update DashboardStats Component**
- Description: Theme-aware stats cards
- Files to modify: `src/components/DashboardStats.tsx`
- Changes:
  - Use Card component or CSS variables
  - Theme-aware icon backgrounds
  - Proper text contrast in both modes

#### 3.9 **Update Toast Component**
- Description: Theme-aware notifications
- Files to modify: `src/components/ui/Toast.tsx`
- Changes:
  - Dark: darker background, lighter text
  - Light: white background, dark text
  - Theme-aware shadows

### Phase 4: Page Updates

#### 4.1 **Update Dashboard Page**
- Description: Full theme support for analytics dashboard
- Files to modify: `src/app/dashboard/DashboardClient.tsx`
- Changes:
  - Update all cards to use CSS variables
  - Chart colors: use theme-aware palette
  - Activity feed: theme-aware styling
  - Section headers with display font
  - Progress bars with primary color

#### 4.2 **Update Login Page**
- Description: Theme-aware login experience
- Files to modify: `src/app/login/page.tsx`
- Changes:
  - Centered card with theme-aware styling
  - Background adapts to theme
  - Form inputs use Input component
  - Primary button styling

#### 4.3 **Update Inward Pages**
- Description: Theme support for inward management
- Files to modify:
  - `src/app/inward/page.tsx`
  - `src/app/inward/new/page.tsx`
  - `src/app/inward/[id]/page.tsx`
  - `src/app/inward/[id]/BulkUploadForm.tsx`
  - `src/app/inward/[id]/InwardDeviceList.tsx`
- Changes:
  - Page headers with display font
  - Cards use Card component
  - Tables use Table component
  - Forms use Input component
  - Buttons use Button component

#### 4.4 **Update Inspection Pages**
- Description: Theme support for inspection workflow
- Files to modify:
  - `src/app/inspection/page.tsx`
  - `src/app/inspection/InspectionSearchClient.tsx`
  - `src/app/inspection/[barcode]/page.tsx`
  - `src/app/inspection/[barcode]/InspectionForm.tsx`
- Changes:
  - Search input with Input component
  - Checklist cards theme-aware
  - Status badges with Badge component

#### 4.5 **Update Repair Station Pages**
- Description: Theme support for L2/L3 repair
- Files to modify:
  - `src/app/l2-repair/L2RepairClient.tsx`
  - `src/app/l3-repair/page.tsx`
  - `src/app/display-repair/DisplayRepairClient.tsx`
  - `src/app/battery-boost/BatteryBoostClient.tsx`
  - `src/app/repair/page.tsx`
- Changes:
  - Tab styling theme-aware
  - Device cards use Card component
  - Action buttons use Button component
  - Tables use Table component

#### 4.6 **Update Paint Shop Page**
- Description: Theme support for paint shop
- Files to modify: `src/app/paint/page.tsx`
- Changes:
  - Panel status badges
  - Table styling
  - Action buttons

#### 4.7 **Update QC Pages**
- Description: Theme support for quality control
- Files to modify:
  - `src/app/qc/page.tsx`
  - `src/app/qc/QCSearchClient.tsx`
  - `src/app/qc/[barcode]/page.tsx`
- Changes:
  - Checklist styling theme-aware
  - Grade selection buttons
  - Pass/fail button variants

#### 4.8 **Update Inventory & Outward Pages**
- Description: Theme support for stock and dispatch
- Files to modify:
  - `src/app/inventory/page.tsx`
  - `src/app/outward/OutwardClient.tsx`
- Changes:
  - Filter controls theme-aware
  - Data tables with Table component
  - Modal dialogs theme-aware

#### 4.9 **Update Admin Pages**
- Description: Theme support for admin interfaces
- Files to modify:
  - `src/app/admin/users/page.tsx`
  - `src/app/admin/users/UserManagementClient.tsx`
  - `src/app/admin/spares/page.tsx`
- Changes:
  - User management cards/table
  - Form dialogs theme-aware
  - Role badges with Badge component

#### 4.10 **Update Spares Page**
- Description: Theme support for spare parts
- Files to modify: `src/app/spares/page.tsx`
- Changes:
  - Request cards theme-aware
  - Status indicators with Badge
  - Action buttons

### Phase 5: Polish & Testing

#### 5.1 **Update All Modal Dialogs**
- Description: Standardize modal styling across app
- Files to modify: All files with modal implementations
- Changes:
  - Theme-aware backdrop
  - Card-style modal body
  - Consistent header/footer
  - Close button styling

#### 5.2 **Update BarcodeScanner Component**
- Description: Theme-aware barcode scanner
- Files to modify: `src/components/BarcodeScanner.tsx`
- Changes:
  - Camera overlay theme-aware
  - Button styling

#### 5.3 **Update DynamicDeviceForm Component**
- Description: Theme-aware device form
- Files to modify: `src/components/DynamicDeviceForm.tsx`
- Changes:
  - All inputs use Input component
  - Section headers styled
  - Category tabs theme-aware

#### 5.4 **Flash Prevention Script**
- Description: Prevent theme flash on page load
- Files to modify: `src/app/layout.tsx`
- Add inline script before body content:
```javascript
// Inline script to set theme class before React hydrates
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      const theme = localStorage.getItem('theme') || 'system';
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = theme === 'dark' || (theme === 'system' && systemDark);
      document.documentElement.classList.toggle('dark', isDark);
    })();
  `
}} />
```

#### 5.5 **Accessibility Review**
- Description: Ensure color contrast meets WCAG AA
- Checks:
  - Text contrast in both modes
  - Focus indicators visible
  - Icon contrast sufficient
  - Interactive elements distinguishable

#### 5.6 **Final Consistency Pass**
- Description: Review all pages for consistency
- Checklist:
  - All pages support both themes
  - No hardcoded colors (use variables)
  - Smooth theme transitions
  - No flash on navigation

## Codebase Integration Points

### Files to Create (New)
| File | Purpose |
|------|---------|
| `src/components/ThemeProvider.tsx` | Theme context and provider |
| `src/components/ui/ThemeToggle.tsx` | Theme toggle button |
| `src/components/ui/Card.tsx` | Versatile card component |
| `src/components/ui/Badge.tsx` | Status badges |
| `src/components/ui/Button.tsx` | Standardized buttons |
| `src/components/ui/Input.tsx` | Form inputs |
| `src/components/ui/Table.tsx` | Data tables |

### Files to Modify (Existing)
| File | Changes |
|------|---------|
| `src/app/globals.css` | Theme variables, fonts, utilities |
| `src/app/layout.tsx` | ThemeProvider wrapper, flash prevention |
| `src/components/Sidebar.tsx` | Indigo colors, theme toggle |
| `src/components/DashboardStats.tsx` | Theme-aware cards |
| `src/components/ui/GlassCard.tsx` | Theme-aware glass effect |
| `src/components/ui/Toast.tsx` | Theme-aware notifications |
| All 22 page files | Apply new components, CSS variables |

### Existing Patterns to Follow
- Motion animations from Framer Motion
- Client/Server component separation
- Lucide icons for consistency
- `cn()` utility for class merging
- Server actions for mutations

## Technical Design

### Theme System Architecture
```
┌─────────────────────────────────────────────────────┐
│                    layout.tsx                        │
│  ┌───────────────────────────────────────────────┐  │
│  │              ThemeProvider                     │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  theme: 'light' | 'dark' | 'system'     │  │  │
│  │  │  resolvedTheme: 'light' | 'dark'        │  │  │
│  │  │  localStorage ←→ state sync             │  │  │
│  │  │  matchMedia listener for system pref    │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                     ↓                         │  │
│  │         document.documentElement              │  │
│  │         class="dark" (conditional)            │  │
│  │                     ↓                         │  │
│  │  CSS Variables (.dark overrides :root)        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Color System (CSS Variables)
```css
/* Light Mode (Default) */
:root {
  /* Backgrounds */
  --background: 248 250 252;      /* slate-50 */
  --card: 255 255 255;            /* white */
  --popover: 255 255 255;         /* white */

  /* Foregrounds */
  --foreground: 15 23 42;         /* slate-900 */
  --card-foreground: 15 23 42;    /* slate-900 */
  --muted-foreground: 100 116 139; /* slate-500 */

  /* Primary (Indigo) */
  --primary: 79 70 229;           /* indigo-600 */
  --primary-foreground: 255 255 255;

  /* Secondary */
  --secondary: 241 245 249;       /* slate-100 */
  --secondary-foreground: 15 23 42;

  /* Accent */
  --accent: 241 245 249;          /* slate-100 */
  --accent-foreground: 15 23 42;

  /* Destructive */
  --destructive: 239 68 68;       /* red-500 */
  --destructive-foreground: 255 255 255;

  /* Border & Ring */
  --border: 226 232 240;          /* slate-200 */
  --ring: 79 70 229;              /* indigo-600 */

  /* Shadows */
  --shadow-soft: 0 4px 20px -2px rgba(0,0,0,0.05);
  --shadow-glow: 0 0 15px rgba(79,70,229,0.3);
}

/* Dark Mode */
.dark {
  --background: 2 6 23;           /* slate-950 */
  --card: 15 23 42;               /* slate-900 */
  --popover: 15 23 42;            /* slate-900 */

  --foreground: 248 250 252;      /* slate-50 */
  --card-foreground: 248 250 252;
  --muted-foreground: 148 163 184; /* slate-400 */

  --primary: 129 140 248;         /* indigo-400 */
  --primary-foreground: 15 23 42;

  --secondary: 30 41 59;          /* slate-800 */
  --secondary-foreground: 248 250 252;

  --accent: 30 41 59;             /* slate-800 */
  --accent-foreground: 248 250 252;

  --destructive: 239 68 68;
  --destructive-foreground: 255 255 255;

  --border: 51 65 85;             /* slate-700 */
  --ring: 129 140 248;            /* indigo-400 */

  --shadow-soft: 0 4px 20px -2px rgba(0,0,0,0.3);
  --shadow-glow: 0 0 20px rgba(99,102,241,0.4);
}
```

### Typography Scale
```css
/* Font Families */
--font-display: 'Rajdhani', sans-serif;
--font-brand: 'Chakra Petch', sans-serif;
--font-body: 'Inter', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Component Usage Examples

```tsx
// Card with theme support
<Card variant="elevated" className="p-6">
  <h2 className="font-display text-xl text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</Card>

// Button variants
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">More</Button>
<Button variant="danger">Delete</Button>

// Badge variants
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>

// Theme toggle
<ThemeToggle />
```

## Dependencies and Libraries
- Google Fonts (Rajdhani, Chakra Petch, Inter) - CDN import
- No new npm packages required
- Existing: Tailwind CSS v4, Framer Motion, Lucide React

## Testing Strategy

### Theme Testing Checklist
- [ ] Theme persists across page navigation
- [ ] Theme persists across browser sessions
- [ ] System preference is detected correctly
- [ ] System preference changes are reflected in real-time
- [ ] No flash of wrong theme on initial load
- [ ] No flash of wrong theme on page navigation
- [ ] Theme toggle works correctly

### Visual Testing
- [ ] All pages render correctly in light mode
- [ ] All pages render correctly in dark mode
- [ ] Charts display properly in both modes
- [ ] Images and icons have proper contrast
- [ ] Form inputs are readable in both modes
- [ ] Modal dialogs work in both modes

### Accessibility Testing
- [ ] Text contrast meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] Focus indicators visible in both modes
- [ ] Interactive elements distinguishable
- [ ] Screen reader compatibility maintained

## Success Criteria
- [ ] Theme provider implemented with localStorage persistence
- [ ] System preference detection works
- [ ] Theme toggle added to UI
- [ ] No theme flash on page load
- [ ] All 22 pages support both themes
- [ ] All components use CSS variables
- [ ] Typography updated with new fonts
- [ ] Sidebar updated with indigo colors
- [ ] Dashboard charts use theme-aware colors
- [ ] Forms use standardized Input component
- [ ] Tables use standardized Table component
- [ ] Buttons use standardized Button component
- [ ] Status badges use Badge component
- [ ] Cards use Card component
- [ ] Color contrast meets WCAG AA
- [ ] Responsive design maintained in both modes

## Implementation Order (Recommended)

```
Phase 1: Theme Foundation (Do First)
├── 1.1 ThemeProvider.tsx
├── 1.2 globals.css (variables)
├── 1.3 layout.tsx (provider + flash prevention)
├── 1.4 ThemeToggle.tsx
└── 1.5 Sidebar.tsx (add toggle)

Phase 2: Design Tokens
├── 2.1 Utility classes
└── 2.2 Verify cn() utility

Phase 3: Core Components (Build Once, Use Everywhere)
├── 3.1 Card.tsx
├── 3.2 Button.tsx
├── 3.3 Badge.tsx
├── 3.4 Input.tsx
├── 3.5 Table.tsx
├── 3.6 Update Sidebar
├── 3.7 Update GlassCard
├── 3.8 Update DashboardStats
└── 3.9 Update Toast

Phase 4: Page Updates (Apply Components)
├── 4.1 Dashboard
├── 4.2 Login
├── 4.3 Inward pages
├── 4.4 Inspection pages
├── 4.5 Repair pages
├── 4.6 Paint page
├── 4.7 QC pages
├── 4.8 Inventory & Outward
├── 4.9 Admin pages
└── 4.10 Spares page

Phase 5: Polish
├── 5.1 Modal dialogs
├── 5.2 BarcodeScanner
├── 5.3 DynamicDeviceForm
├── 5.4 Flash prevention verification
├── 5.5 Accessibility review
└── 5.6 Final consistency pass
```

## Notes and Considerations

### Performance
- Font loading uses `display: swap` to prevent FOIT
- Theme script is inline to prevent flash
- CSS variables are more performant than JS-based theming

### Browser Support
- CSS variables: All modern browsers
- matchMedia: All modern browsers
- localStorage: All modern browsers

### Potential Challenges
- Recharts may need custom theme colors passed as props
- Some third-party components may need wrapper styling
- Ensuring all hardcoded colors are converted to variables

### Future Enhancements
- Additional theme options (high contrast, custom colors)
- Theme scheduling (auto dark mode at night)
- Per-page theme overrides if needed

---
*This plan is ready for execution with `/execute-plan PRPs/changes5-ui-overhaul.md`*
