# Implementation Plan: UI/UX Overhaul - Nexus WMS Integration

## Overview

Integrate UI/UX elements from the Nexus WMS repository (https://github.com/SameerSahu456/WMS) into the COMPRINT Operations platform. This involves enhancing the dashboard with role-based views, improving the login page with a modern two-column layout, adding advanced visual indicators across workflow pages, and implementing new reusable UI components.

## Requirements Summary

- **Dashboard**: Role-based views, enhanced stats cards with trends, advanced charts, alert cards, activity feed, performance metrics
- **Login Page**: Two-column layout with glassmorphism, branded section, animated backgrounds
- **Sidebar**: Animated active indicators, scale transforms on interactions
- **Inspection**: Issue tags, routing preview, device grid cards
- **Repair Station**: Capacity indicators, overdue/rework badges, status visual enhancements
- **Inventory**: Collapsible filters, CSV export, device detail modal
- **Common Components**: Pagination, enhanced status badges, improved modals, empty states
- **Animations**: Page transitions, card stagger animations, button interactions
- **Mobile**: Touch targets, iOS compatibility, improved mobile menu

## Research Findings

### Best Practices (From Nexus WMS)

1. **Role-Based Dashboard Rendering**: Use a `renderDashboardContent()` function that switches based on user role
2. **StatCard Component**: Reusable component with 16 color variants, trend indicators, and click handlers
3. **Animated Sidebar**: Framer Motion `layoutId` for smooth active state transitions with glowing effect
4. **Issue Tags**: Toggle-able buttons with counter badges and custom input fields
5. **Capacity Indicators**: Visual badges showing "X / 10 active" with color changes at capacity

### Reference Implementations (Current Codebase)

- **GlassCard**: `src/components/ui/GlassCard.tsx` - Existing glassmorphism pattern
- **Badge**: `src/components/ui/Badge.tsx` - 6 variants with dark mode support
- **Sidebar Active State**: `src/components/Sidebar.tsx:72-80` - Already uses `layoutId="activeTab"`
- **Dashboard Stats**: `src/app/dashboard/DashboardClient.tsx` - Existing stat cards with gradients
- **Theme System**: `src/app/globals.css` - CSS variables for light/dark modes

### Technology Decisions

| Decision | Rationale |
|----------|-----------|
| Keep Tailwind CSS v4 | Already in use, extensive styling exists |
| Extend Framer Motion usage | Already installed, used for animations |
| Keep Recharts | Already integrated for dashboard charts |
| Add new CSS variables | Extend theme system for new color tokens |
| No new dependencies | All required libraries already installed |

---

## Implementation Tasks

### Phase 1: Foundation (High Impact)

#### Task 1.1: Create StatCard Component
**Description**: Build a reusable stat card component with multiple color variants, trend indicators, and click handlers

**Files to create:**
- `src/components/ui/StatCard.tsx`

**Implementation Details:**
```tsx
interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'pink' | 'teal' | 'indigo' | 'cyan'
  trend?: { value: number; isPositive: boolean }
  onClick?: () => void
}
```

**Color Map:**
- Each color variant needs light/dark mode backgrounds
- Pattern: `from-{color}-100 to-{color}-200/80` light, `from-{color}-900/60 to-{color}-800/40` dark
- Icon backgrounds: `bg-{color}-500/20` with `text-{color}-600 dark:text-{color}-400`

**Features:**
- ArrowUpRight/ArrowDownRight icons for trends
- Percentage display with color (green positive, red negative)
- Hover animation: `hover:shadow-xl hover:scale-[1.02]`
- Click cursor when onClick provided

**Dependencies**: None
**Estimated effort**: 1-2 hours

---

#### Task 1.2: Create AlertCard Component
**Description**: Build alert cards for TAT breaches, waiting spares, and QC pass rate

**Files to create:**
- `src/components/ui/AlertCard.tsx`

**Implementation Details:**
```tsx
interface AlertCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  type: 'danger' | 'warning' | 'success' | 'info'
  description?: string
  action?: { label: string; onClick: () => void }
}
```

**Styling by Type:**
- danger: Red border-left, red icon, red/50 background tint
- warning: Orange/amber theme
- success: Green theme
- info: Blue theme

**Dependencies**: Task 1.1 (similar patterns)
**Estimated effort**: 1 hour

---

#### Task 1.3: Create ActivityFeed Component
**Description**: Timeline of recent activities with relative timestamps and user avatars

**Files to create:**
- `src/components/ui/ActivityFeed.tsx`

**Implementation Details:**
```tsx
interface ActivityItem {
  id: string
  user: { name: string; initials: string }
  action: string
  target: string
  timestamp: Date
  type: 'inspection' | 'repair' | 'qc' | 'inward' | 'outward'
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxHeight?: string
}
```

**Features:**
- Relative time display: "2 hours ago", "yesterday", etc.
- User avatar with initials (gradient circle)
- Action type badges with colors
- Scrollable container with max-height
- Empty state when no activities

**Utility Function:**
```tsx
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return formatDate(date)
}
```

**Dependencies**: None
**Estimated effort**: 1.5 hours

---

#### Task 1.4: Login Page Redesign
**Description**: Transform login page to two-column layout with branded section and glassmorphism

**Files to modify:**
- `src/app/login/page.tsx`

**Left Section (Dark branded area):**
- Full-height dark background (slate-900)
- Brand name "COMPRINT Operations Management" with gradient text
- Background image or gradient overlay
- Stats cards: "5000+ Devices Processed", "98% QC Pass Rate"
- Version info at bottom
- Abstract animated shapes (gradient blobs with blur)

**Right Section (Login form):**
- White/card background with backdrop-blur
- Icon-prefixed inputs (User, Lock icons)
- Password visibility toggle
- Error animation (shake + red)
- Loading spinner on submit
- Demo credentials as clickable tags (optional)

**Layout:**
```tsx
<div className="min-h-screen flex">
  {/* Left - Hidden on mobile */}
  <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
    {/* Animated background shapes */}
    {/* Brand content */}
  </div>

  {/* Right - Full width mobile, half on desktop */}
  <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
    {/* Login form with glassmorphism */}
  </div>
</div>
```

**Animated Background Shapes:**
```tsx
<div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
<div className="absolute bottom-40 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
```

**Dependencies**: None
**Estimated effort**: 3-4 hours

---

#### Task 1.5: Dashboard Role-Based Views
**Description**: Implement role-specific dashboard content rendering

**Files to modify:**
- `src/app/dashboard/DashboardClient.tsx`

**Role Mappings:**
| Role | Dashboard Focus |
|------|-----------------|
| SUPERADMIN/ADMIN | Full analytics, all metrics |
| WAREHOUSE_MANAGER | Inward/outward stats, inventory |
| INSPECTION_ENGINEER | Pending inspections queue |
| L2_ENGINEER | Repair queue, active jobs |
| L3_ENGINEER | L3 repair queue |
| DISPLAY_TECHNICIAN | Display repair jobs |
| BATTERY_TECHNICIAN | Battery boost queue |
| PAINT_SHOP_TECHNICIAN | Paint shop status |
| QC_ENGINEER | QC queue, pass rates |

**Implementation Pattern:**
```tsx
function renderDashboardContent(role: string) {
  switch (role) {
    case 'SUPERADMIN':
    case 'ADMIN':
      return <AdminDashboard data={data} />
    case 'INSPECTION_ENGINEER':
      return <InspectorDashboard data={data} />
    // ... other roles
    default:
      return <DefaultDashboard data={data} />
  }
}
```

**New Dashboard Sections for Admin:**
- Alert cards row (TAT breach, waiting spares, QC rate)
- Weekly flow AreaChart with gradient
- Workflow distribution PieChart
- Overdue devices list (scrollable)
- Recent activity feed
- QC engineer performance grid

**Dependencies**: Tasks 1.1, 1.2, 1.3
**Estimated effort**: 4-5 hours

---

#### Task 1.6: Sidebar Animation Enhancements
**Description**: Add scale transforms and improve active indicator glow

**Files to modify:**
- `src/components/Sidebar.tsx`

**Current State**: Already has `layoutId="activeTab"` with gradient background

**Enhancements:**
1. Add glowing box-shadow to active indicator:
```tsx
<motion.div
  layoutId="activeTab"
  className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

2. Add scale transforms to navigation items:
```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
>
  {/* Link content */}
</motion.div>
```

**Dependencies**: None
**Estimated effort**: 1 hour

---

### Phase 2: Core Workflows

#### Task 2.1: Inspection Issue Tags System
**Description**: Add toggleable issue tags for functional and cosmetic issues

**Files to modify:**
- `src/app/inspection/[barcode]/InspectionForm.tsx`

**New Components to create:**
- `src/components/ui/IssueTag.tsx`

**IssueTag Component:**
```tsx
interface IssueTagProps {
  label: string
  selected: boolean
  onToggle: () => void
  color: 'orange' | 'pink' | 'purple'
}

// Styling
const colorMap = {
  orange: 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-500/20 dark:border-orange-500/50 dark:text-orange-400',
  pink: 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-500/20 dark:border-pink-500/50 dark:text-pink-400',
  purple: 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-500/20 dark:border-purple-500/50 dark:text-purple-400'
}
```

**Predefined Issue Tags:**
- Functional (orange): Power Issue, Display Problem, Keyboard Issue, Touchpad Issue, Port Damage, Audio Problem, Battery Issue, Overheating
- Cosmetic (pink): Scratches, Dents, Cracks, Discoloration, Missing Parts, Sticker Damage
- Panels (purple): Top Cover, Bottom Cover, Palmrest, Bezel, Hinge Cover

**Features:**
- Multi-select with visual feedback
- Counter badge showing selected count
- Custom input field for "Other"
- Clear all button

**Dependencies**: None
**Estimated effort**: 2-3 hours

---

#### Task 2.2: Repair Station Status Indicators
**Description**: Add capacity indicator, overdue badges, and rework visual enhancements

**Files to modify:**
- `src/app/repair/RepairClient.tsx`
- `src/app/l2-repair/L2RepairClient.tsx`

**Capacity Indicator Badge:**
```tsx
<div className={cn(
  "px-3 py-1 rounded-full text-sm font-medium",
  activeCount >= 10
    ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
    : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
)}>
  {activeCount} / 10 active repairs
</div>
```

**Overdue Card Styling:**
```tsx
// Add to card when overdue
className={cn(
  "bg-card rounded-xl shadow-soft p-6 border",
  isOverdue && "border-red-500 bg-red-50/50 dark:bg-red-500/10"
)}

// Overdue badge
{isOverdue && (
  <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded text-xs font-medium">
    <AlertTriangle size={12} />
    OVERDUE
  </span>
)}
```

**Rework Badge:**
```tsx
{isRework && (
  <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">
    <RotateCcw size={12} />
    Rework #{reworkCount}
  </span>
)}
```

**Dependencies**: None
**Estimated effort**: 2 hours

---

#### Task 2.3: Inventory Collapsible Filters
**Description**: Add expandable filter panel with active count badge

**Files to modify:**
- `src/app/inventory/page.tsx` (convert to client component or create InventoryClient.tsx)

**New Component:**
- `src/components/ui/FilterPanel.tsx`

**FilterPanel Implementation:**
```tsx
interface FilterPanelProps {
  filters: FilterConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onClear: () => void
}

interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'text' | 'date'
  options?: { value: string; label: string; color?: string }[]
}
```

**Features:**
- Toggle button with active filter count badge
- Animated expand/collapse (Framer Motion)
- Grid layout: 2 columns mobile, 4 columns desktop
- Clear all filters button (visible when filters active)
- Status options with color indicators

**Animation:**
```tsx
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Filter inputs */}
    </motion.div>
  )}
</AnimatePresence>
```

**Dependencies**: None
**Estimated effort**: 2-3 hours

---

#### Task 2.4: CSV Export Functionality
**Description**: Add export button to inventory page

**Files to modify:**
- `src/app/inventory/page.tsx` or `InventoryClient.tsx`

**Implementation:**
```tsx
function exportToCSV(devices: Device[]) {
  const headers = ['Barcode', 'Serial Number', 'Brand', 'Model', 'Category', 'Status', 'Grade', 'Location']
  const rows = devices.map(d => [
    d.barcode,
    d.serialNumber,
    d.brand,
    d.model,
    d.category,
    d.status,
    d.grade || 'N/A',
    d.location || 'N/A'
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
```

**Button Placement:**
```tsx
<Button variant="outline" onClick={() => exportToCSV(filteredDevices)}>
  <Download size={16} className="mr-2" />
  Export CSV
</Button>
```

**Dependencies**: Task 2.3 (filter integration)
**Estimated effort**: 1 hour

---

#### Task 2.5: Modal Improvements (Sticky Header/Footer)
**Description**: Enhance modal component with fixed header and footer

**Files to modify:**
- `src/components/ui/Toast.tsx` (or create new Modal.tsx)

**New Modal Component:**
```tsx
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Structure
<AnimatePresence>
  {isOpen && (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div className="relative bg-card rounded-2xl shadow-xl border border-default max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-default">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Fixed Footer */}
        {footer && (
          <div className="p-6 border-t border-default">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Dependencies**: None
**Estimated effort**: 2 hours

---

### Phase 3: Polish

#### Task 3.1: Enhanced Charts with Gradients
**Description**: Add gradient fills and dark mode compatibility to all charts

**Files to modify:**
- `src/app/dashboard/DashboardClient.tsx`

**AreaChart with Gradient:**
```tsx
<AreaChart data={weeklyData}>
  <defs>
    <linearGradient id="colorDevices" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <XAxis dataKey="day" stroke="currentColor" className="text-muted-foreground" />
  <YAxis stroke="currentColor" className="text-muted-foreground" />
  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
  <Tooltip
    contentStyle={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '0.5rem'
    }}
  />
  <Area
    type="monotone"
    dataKey="count"
    stroke="#4f46e5"
    fillOpacity={1}
    fill="url(#colorDevices)"
  />
</AreaChart>
```

**Dependencies**: None
**Estimated effort**: 2 hours

---

#### Task 3.2: QC Performance Metrics Grid
**Description**: Add performance metrics display for QC engineers

**Files to modify:**
- `src/app/dashboard/DashboardClient.tsx`

**New Section:**
```tsx
<GlassCard className="p-6">
  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
    <Award size={20} className="text-indigo-500" />
    QC Engineer Performance
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {qcMetrics.map(engineer => (
      <div key={engineer.id} className="p-4 bg-muted rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
            {engineer.initials}
          </div>
          <div>
            <p className="font-medium text-foreground">{engineer.name}</p>
            <p className="text-xs text-muted-foreground">{engineer.devicesHandled} devices</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pass Rate</span>
          <span className={cn(
            "font-bold",
            engineer.passRate >= 90 ? "text-green-600" :
            engineer.passRate >= 70 ? "text-yellow-600" : "text-red-600"
          )}>
            {engineer.passRate}%
          </span>
        </div>
      </div>
    ))}
  </div>
</GlassCard>
```

**Dependencies**: Task 1.5 (dashboard restructure)
**Estimated effort**: 1.5 hours

---

#### Task 3.3: Pagination Component
**Description**: Create reusable pagination component

**Files to create:**
- `src/components/ui/Pagination.tsx`

**Implementation:**
```tsx
interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (count: number) => void
}

// Features:
// - Previous/Next buttons with disabled states
// - Current page / total pages display
// - Items per page selector (10, 25, 50, 100)
// - "Showing X-Y of Z items" text
```

**Dependencies**: None
**Estimated effort**: 1.5 hours

---

#### Task 3.4: Empty State Component
**Description**: Create reusable empty state for lists/tables

**Files to create:**
- `src/components/ui/EmptyState.tsx`

**Implementation:**
```tsx
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

// Default icon: Inbox or Package
// Styling: Centered, muted colors, optional CTA button
```

**Dependencies**: None
**Estimated effort**: 30 minutes

---

#### Task 3.5: Card Stagger Animations
**Description**: Add staggered entrance animations to card lists

**Files to modify:**
- `src/app/repair/RepairClient.tsx`
- `src/app/l2-repair/L2RepairClient.tsx`
- `src/app/inspection/InspectionSearchClient.tsx`

**Implementation Pattern:**
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="show"
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
>
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {/* Card content */}
    </motion.div>
  ))}
</motion.div>
```

**Dependencies**: None
**Estimated effort**: 1.5 hours

---

### Phase 4: Mobile & Accessibility

#### Task 4.1: Touch Target Optimization
**Description**: Ensure all interactive elements meet 44px minimum

**Files to modify:**
- `src/app/globals.css`
- Various component files

**CSS Addition:**
```css
/* Touch target optimization */
@media (hover: none) and (pointer: coarse) {
  button, a, [role="button"], input, select, textarea {
    min-height: 44px;
    min-width: 44px;
  }

  .touch-target {
    min-height: 44px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
}
```

**Dependencies**: None
**Estimated effort**: 1 hour

---

#### Task 4.2: iOS Input Zoom Prevention
**Description**: Prevent iOS zoom on input focus

**Files to modify:**
- `src/app/globals.css`
- `src/components/ui/Input.tsx`

**CSS Addition:**
```css
/* iOS zoom prevention */
@supports (-webkit-touch-callout: none) {
  input, select, textarea {
    font-size: 16px !important;
  }
}

input, select, textarea {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
```

**Dependencies**: None
**Estimated effort**: 30 minutes

---

#### Task 4.3: Mobile Menu Improvements
**Description**: Enhance mobile sidebar with better animations

**Files to modify:**
- `src/components/Sidebar.tsx`

**Enhancements:**
- Slide-in animation from left (translateX)
- Backdrop blur effect
- Touch-to-close on backdrop
- Swipe-to-close gesture (optional)

```tsx
<AnimatePresence>
  {isMobileMenuOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 w-72 z-50 md:hidden"
      >
        {/* Sidebar content */}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

**Dependencies**: None
**Estimated effort**: 1.5 hours

---

#### Task 4.4: Skeleton Loaders
**Description**: Add skeleton loading states for content areas

**Files to create:**
- `src/components/ui/Skeleton.tsx`

**Implementation:**
```tsx
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

// Base styling
className="animate-pulse bg-muted rounded"

// Variants
// text: h-4 rounded
// circular: rounded-full
// rectangular: rounded-lg
```

**Usage Examples:**
```tsx
// Card skeleton
<div className="p-6 bg-card rounded-xl border border-default">
  <Skeleton variant="text" className="w-1/3 h-6 mb-4" />
  <Skeleton variant="text" className="w-full h-4 mb-2" />
  <Skeleton variant="text" className="w-2/3 h-4" />
</div>

// Table row skeleton
<tr>
  <td><Skeleton className="h-4 w-24" /></td>
  <td><Skeleton className="h-4 w-32" /></td>
  <td><Skeleton className="h-4 w-16" /></td>
</tr>
```

**Dependencies**: None
**Estimated effort**: 1 hour

---

## Codebase Integration Points

### Files to Modify

| File | Changes |
|------|---------|
| `src/app/login/page.tsx` | Complete redesign with two-column layout |
| `src/app/dashboard/DashboardClient.tsx` | Add role-based views, new sections |
| `src/components/Sidebar.tsx` | Enhanced animations, scale transforms |
| `src/app/inspection/[barcode]/InspectionForm.tsx` | Issue tags system |
| `src/app/repair/RepairClient.tsx` | Status indicators, capacity badge |
| `src/app/l2-repair/L2RepairClient.tsx` | Status indicators, animations |
| `src/app/inventory/page.tsx` | Convert to client, add filters/export |
| `src/app/globals.css` | Touch targets, iOS fixes, new keyframes |
| `src/lib/utils.ts` | Add formatRelativeTime function |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/StatCard.tsx` | Reusable stat card with trends |
| `src/components/ui/AlertCard.tsx` | Alert/notification cards |
| `src/components/ui/ActivityFeed.tsx` | Recent activity timeline |
| `src/components/ui/IssueTag.tsx` | Toggleable issue tags |
| `src/components/ui/FilterPanel.tsx` | Collapsible filter panel |
| `src/components/ui/Pagination.tsx` | Page navigation |
| `src/components/ui/EmptyState.tsx` | Empty state display |
| `src/components/ui/Modal.tsx` | Enhanced modal with sticky header/footer |
| `src/components/ui/Skeleton.tsx` | Loading skeletons |

### Existing Patterns to Follow

1. **Component Structure**: Props interface → component function → export default
2. **Styling**: Use `cn()` helper for conditional classes
3. **Dark Mode**: Always include `dark:` variants for all colors
4. **Animations**: Use Framer Motion for complex animations, CSS transitions for simple
5. **Icons**: Import from lucide-react
6. **Theme Variables**: Use CSS variables (`var(--foreground)`, etc.)

---

## Technical Design

### Component Architecture

```
src/components/
├── ui/
│   ├── StatCard.tsx      ─┐
│   ├── AlertCard.tsx      │ New dashboard
│   ├── ActivityFeed.tsx   │ components
│   ├── IssueTag.tsx      ─┘
│   ├── FilterPanel.tsx   ─┐ New utility
│   ├── Pagination.tsx     │ components
│   ├── EmptyState.tsx     │
│   ├── Modal.tsx          │
│   ├── Skeleton.tsx      ─┘
│   └── ... (existing)
├── dashboard/
│   └── (role-specific views if needed)
└── ... (existing)
```

### Data Flow

```
User Role (from auth)
       ↓
Dashboard Page
       ↓
renderDashboardContent(role)
       ↓
┌──────────────────────────────────┐
│  Admin      → Full Analytics     │
│  Inspector  → Pending Queue      │
│  L2 Engineer→ Repair Dashboard   │
│  QC Engineer→ QC Queue           │
│  ...                             │
└──────────────────────────────────┘
```

### Animation Patterns

```tsx
// Standard card entrance
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

// Staggered list
const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

// Scale interaction
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}

// Page transition
initial={{ opacity: 0, filter: 'blur(10px)' }}
animate={{ opacity: 1, filter: 'blur(0px)' }}
exit={{ opacity: 0, filter: 'blur(10px)' }}
```

---

## Dependencies and Libraries

**Already Installed (No Changes):**
- `framer-motion` - Animations
- `recharts` - Charts
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `clsx` + `tailwind-merge` - Class utilities

**No New Dependencies Required**

---

## Testing Strategy

### Unit Tests
- StatCard renders with all color variants
- AlertCard displays correct styling by type
- Pagination calculates pages correctly
- FilterPanel handles state changes

### Integration Tests
- Dashboard renders correct content per role
- Login form submission flow
- Filter panel + inventory table interaction
- Export CSV generates valid file

### Visual Testing
- Dark mode compatibility for all new components
- Mobile responsive layouts
- Animation performance (no jank)

### Edge Cases
- Empty activity feed
- Zero devices in inventory
- Maximum capacity reached (10/10)
- Very long text in cards

---

## Success Criteria

- [ ] Login page displays two-column layout on desktop, single column on mobile
- [ ] Dashboard shows role-appropriate content for all 9+ user roles
- [ ] StatCards display trends with correct directional indicators
- [ ] Activity feed shows relative timestamps correctly
- [ ] Sidebar active state animates smoothly between items
- [ ] Inspection issue tags allow multi-select with counter
- [ ] Repair cards show overdue/rework badges correctly
- [ ] Inventory filters collapse/expand with animation
- [ ] CSV export downloads valid file with all fields
- [ ] All components render correctly in dark mode
- [ ] Touch targets meet 44px minimum on mobile
- [ ] No iOS zoom on input focus
- [ ] Page transitions are smooth (no jank)
- [ ] Empty states display when no data

---

## Notes and Considerations

### Potential Challenges
1. **Performance**: Staggered animations with many cards may cause jank - use `will-change` and test on low-end devices
2. **Dark Mode Charts**: Recharts requires manual color handling for dark mode
3. **Mobile Sidebar**: Z-index conflicts with modals - ensure proper stacking context

### Future Enhancements
1. Add more chart types (radar, scatter) for advanced analytics
2. Implement drag-to-reorder for dashboard sections
3. Add notification badges to sidebar items
4. Implement real-time activity feed with WebSocket

### Migration Notes
- Login page redesign is a breaking change - test thoroughly
- Dashboard changes are additive - existing functionality preserved
- New components are opt-in - can be gradually adopted

---

*This plan is ready for execution with `/execute-plan PRPs/ui-ux-overhaul-nexus-integration.md`*
