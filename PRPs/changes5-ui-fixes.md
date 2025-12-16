# Implementation Plan: UI Fixes - Dark Mode & Styling Consistency

## Overview
Follow-up fixes to the UI overhaul (changes5-ui-overhaul.md) addressing remaining dark mode issues, modal centering problems, and color consistency across User Management, Spare Parts Inventory, Spare Requests, and Inward Batch pages.

## Requirements Summary
- Fix dark mode text visibility in User Management table rows
- Center modals/sub-screens on viewport regardless of scroll position
- Fix light mode card colors in User Management stats section
- Improve dashboard stat card colors for better visual consistency
- Apply dark mode styling to Spare Parts Inventory section
- Apply dark mode styling to Spare Requests section
- Fix Inward Batch page for dark mode consistency

## Research Findings

### Current Issues Identified

#### 1. User Management (UserManagementClient.tsx)
- **Table rows**: Use `hover:bg-gray-50` and hardcoded `text-gray-900`, `text-gray-600` without dark variants
- **Modal**: Uses `bg-white`, `bg-gray-50/50`, `text-gray-*` without dark mode
- **Stats cards**: Hardcoded `text-gray-500`, `text-gray-800` colors
- **Empty state**: Uses `bg-gray-100`, `text-gray-400` without dark variants
- **Action buttons**: `hover:bg-*-50` patterns need dark mode alternatives

#### 2. Spare Parts Inventory (SparePartsClient.tsx)
- **Form container**: `bg-white` with no dark mode
- **Table body**: `bg-white`, `text-gray-*` hardcoded colors
- **Stock adjustment modal**: `bg-white`, `text-gray-*` with no dark variants
- **Low stock rows**: `bg-yellow-50` without dark mode
- **Category badges**: `bg-gray-100 text-gray-700` light-only

#### 3. Spare Requests (spares/page.tsx)
- **Entire page**: Hardcoded light mode colors throughout
- **Table**: `bg-white`, `bg-gray-50`, `text-gray-*` everywhere
- **Header**: `text-gray-800` without dark variant
- **Form inputs**: Light-only border and focus colors

#### 4. Inward Batch (NewInwardBatchClient.tsx)
- **Form container**: `bg-white` with no dark mode
- **Type buttons**: Light-only selected/unselected states
- **Labels**: `text-gray-700` without dark variant
- **Inputs**: Light-only styling
- **Cancel button**: `text-gray-700 hover:bg-gray-50` light-only

#### 5. Modal Centering
- Current implementation uses `fixed inset-0` but may need additional safeguards
- Should use `fixed inset-0` with proper z-index and prevent body scroll

### Reference Patterns from Existing Code

From DashboardClient.tsx (already fixed):
```typescript
// Good pattern for theme-aware cards
cardBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200/80 dark:from-indigo-900/60 dark:to-indigo-800/40',
iconBg: 'bg-indigo-200/80 dark:bg-indigo-700/50',
borderColor: 'border-indigo-200 dark:border-indigo-700/50',
```

From globals.css CSS variables:
- `bg-card` / `bg-background` for container backgrounds
- `text-foreground` / `text-muted-foreground` for text
- `border-default` for borders
- `bg-muted` for muted backgrounds

## Implementation Tasks

### Phase 1: User Management Dark Mode Fixes

#### 1.1 **Fix Table Row Styling**
- Description: Add dark mode variants to table rows, cells, and hover states
- Files to modify: `src/app/admin/users/UserManagementClient.tsx`
- Changes:
  - Line 329: `hover:bg-gray-50/80` → `hover:bg-gray-50/80 dark:hover:bg-slate-800/50`
  - Line 336: `text-gray-900` → `text-foreground`
  - Line 339: `text-gray-600` → `text-muted-foreground`
  - Line 322: `divide-gray-100 dark:divide-gray-800` → already has dark, verify it works

#### 1.2 **Fix Action Buttons Dark Mode**
- Description: Add dark hover states to action buttons
- Files to modify: `src/app/admin/users/UserManagementClient.tsx`
- Changes:
  - Line 363-379: Add `dark:hover:bg-*-500/20` variants to icon buttons
  - Replace `text-gray-400` with theme-aware colors

#### 1.3 **Fix Modal Dark Mode**
- Description: Apply dark mode styling to the create/edit/password modal
- Files to modify: `src/app/admin/users/UserManagementClient.tsx`
- Changes:
  - Line 438: `bg-white` → `bg-card`
  - Line 440: `border-gray-100` → `border-default`
  - Line 440: `bg-gray-50/50` → `bg-muted/50`
  - Line 441: `text-gray-800` → `text-foreground`
  - Line 448: `hover:bg-gray-100` → `hover:bg-muted`
  - Line 466, 481, 496, etc: `text-gray-700` → `text-foreground`
  - All input fields: `bg-gray-50` → `bg-muted` and add `dark:` variants
  - Line 578: Cancel button `bg-gray-100 text-gray-700` → `bg-muted text-foreground`

#### 1.4 **Fix Stats Cards Colors**
- Description: Update stats cards to use theme-aware colors
- Files to modify: `src/app/admin/users/UserManagementClient.tsx`
- Changes:
  - Lines 405-420: Update GlassCard stats to use theme variables
  - Replace `text-gray-500`, `text-gray-800` with `text-muted-foreground`, `text-foreground`

#### 1.5 **Fix Empty State Dark Mode**
- Description: Update empty state styling for dark mode
- Files to modify: `src/app/admin/users/UserManagementClient.tsx`
- Changes:
  - Lines 393-400: Replace `bg-gray-100`, `text-gray-400`, `text-gray-900`, `text-gray-500` with theme variables

#### 1.6 **Fix Role Badge Dark Mode**
- Description: Update getRoleBadgeColor function for dark mode support
- Files to modify: `src/app/admin/users/UserManagementClient.tsx`
- Changes:
  - Lines 62-89: Add `dark:` variants to all badge colors

### Phase 2: Modal Centering Fix

#### 2.1 **Ensure Viewport-Fixed Modal Position**
- Description: Ensure modals always center on viewport, not document
- Files to modify: `src/app/admin/users/UserManagementClient.tsx`, `src/app/admin/spares/SparePartsClient.tsx`
- Changes:
  - Verify `fixed inset-0` is used (already present)
  - Add `overflow-y-auto` to backdrop for long modals
  - Consider adding body scroll lock when modal is open

### Phase 3: Spare Parts Inventory Dark Mode

#### 3.1 **Fix Add/Edit Form Container**
- Description: Apply dark mode to the form section
- Files to modify: `src/app/admin/spares/SparePartsClient.tsx`
- Changes:
  - Line 124: `bg-white` → `bg-card`
  - Line 125: `text-lg font-semibold` → add `text-foreground`
  - All labels: `text-gray-700` → `text-foreground`
  - All inputs: Add dark mode classes
  - Buttons: Update to use theme colors

#### 3.2 **Fix Table Dark Mode**
- Description: Apply dark mode to spare parts table
- Files to modify: `src/app/admin/spares/SparePartsClient.tsx`
- Changes:
  - Line 325: `bg-white` → `bg-card dark:bg-card`
  - Line 317: `text-gray-500` → `text-muted-foreground`
  - Line 337, 340, etc: Replace hardcoded text colors
  - Line 336: `bg-yellow-50` → `bg-yellow-50 dark:bg-yellow-500/10`
  - Line 349: Badge colors need dark variants

#### 3.3 **Fix Stock Adjustment Modal**
- Description: Apply dark mode to stock adjustment modal
- Files to modify: `src/app/admin/spares/SparePartsClient.tsx`
- Changes:
  - Line 256: `bg-white` → `bg-card`
  - Line 257-258: Text colors to theme variables
  - All inputs and buttons: Add dark mode variants

### Phase 4: Spare Requests Dark Mode

#### 4.1 **Fix Page Header and Container**
- Description: Apply dark mode to entire page
- Files to modify: `src/app/spares/page.tsx`
- Changes:
  - Line 19: `text-gray-800` → `text-foreground`
  - Line 21: `bg-white` → `bg-card`
  - Line 23: `bg-gray-50` → `bg-muted`

#### 4.2 **Fix Table Styling**
- Description: Apply dark mode to table
- Files to modify: `src/app/spares/page.tsx`
- Changes:
  - Line 22, 32: `divide-gray-200` → `divide-gray-200 dark:divide-gray-700`
  - Line 25-29: `text-gray-500` → `text-muted-foreground`
  - Line 32: `bg-white` → `bg-card`
  - Line 35, 42-54: Replace all hardcoded text colors

#### 4.3 **Fix Form Elements**
- Description: Apply dark mode to input and button
- Files to modify: `src/app/spares/page.tsx`
- Changes:
  - Line 63: Input styling needs `bg-card dark:border-border text-foreground`
  - Button: Already green, but verify it works in dark mode

### Phase 5: Inward Batch Dark Mode

#### 5.1 **Fix Page Container**
- Description: Apply dark mode to page wrapper
- Files to modify: `src/app/inward/new/NewInwardBatchClient.tsx`
- Changes:
  - Line 41: Header `text-2xl font-bold` → add `text-foreground`
  - Line 43: `bg-white` → `bg-card`

#### 5.2 **Fix Type Selection Buttons**
- Description: Apply dark mode to inward type buttons
- Files to modify: `src/app/inward/new/NewInwardBatchClient.tsx`
- Changes:
  - Lines 45-67: Label and button styling
  - Selected state: Add `dark:bg-indigo-500/20 dark:border-indigo-400 dark:text-indigo-300`
  - Unselected state: Add `dark:bg-card dark:border-border dark:text-foreground dark:hover:bg-muted`

#### 5.3 **Fix Form Fields**
- Description: Apply dark mode to all form inputs and labels
- Files to modify: `src/app/inward/new/NewInwardBatchClient.tsx`
- Changes:
  - All labels: `text-gray-700` → `text-foreground`
  - All inputs: Add `bg-card dark:border-border text-foreground placeholder:text-muted-foreground`
  - Focus states: `focus:ring-indigo-500 dark:focus:ring-indigo-400`

#### 5.4 **Fix Action Buttons**
- Description: Apply dark mode to cancel and submit buttons
- Files to modify: `src/app/inward/new/NewInwardBatchClient.tsx`
- Changes:
  - Cancel button: `text-gray-700 hover:bg-gray-50` → `text-foreground hover:bg-muted`
  - Submit button: Change from `bg-blue-600` to `bg-indigo-600` for consistency

### Phase 6: Notification Component Dark Mode

#### 6.1 **Fix Notification Styling**
- Description: Update success/error notifications for dark mode
- Files to modify: `src/app/admin/users/UserManagementClient.tsx`
- Changes:
  - Lines 263-266: Add dark mode variants
  - Success: `dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400`
  - Error: `dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400`

## Codebase Integration Points

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/admin/users/UserManagementClient.tsx` | Table, modal, stats cards, empty state, notifications dark mode |
| `src/app/admin/spares/SparePartsClient.tsx` | Form, table, modal dark mode |
| `src/app/spares/page.tsx` | Full page dark mode |
| `src/app/inward/new/NewInwardBatchClient.tsx` | Full page dark mode |

### Existing Patterns to Follow
- Use CSS variables: `bg-card`, `text-foreground`, `text-muted-foreground`, `border-default`, `bg-muted`
- Use `dark:` Tailwind prefix for dark-specific overrides
- For gradient cards: `from-*-100 to-*-200/80 dark:from-*-900/60 dark:to-*-800/40`
- For borders: `border-*-200 dark:border-*-700/50`

### Color Mapping Reference
| Light Mode | Dark Mode |
|------------|-----------|
| `bg-white` | `bg-card` |
| `bg-gray-50` | `bg-muted` |
| `text-gray-900` | `text-foreground` |
| `text-gray-700` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `border-gray-200` | `border-default` |
| `border-gray-300` | `border-default` or `border-input` |
| `hover:bg-gray-50` | `hover:bg-muted` |
| `hover:bg-gray-100` | `hover:bg-muted` |
| `divide-gray-200` | `divide-gray-200 dark:divide-gray-700` |

## Testing Strategy

### Visual Testing Checklist
- [ ] User Management table readable in dark mode
- [ ] User Management modal properly styled in dark mode
- [ ] User Management stats cards visible in both modes
- [ ] User Management empty state visible in dark mode
- [ ] Modals center on viewport when page is scrolled
- [ ] Spare Parts Inventory form visible in dark mode
- [ ] Spare Parts table and badges visible in dark mode
- [ ] Spare Requests table visible in dark mode
- [ ] Inward Batch form visible in dark mode
- [ ] All inputs have proper focus states in dark mode
- [ ] All buttons have proper hover states in dark mode

### Browser Testing
- [ ] Chrome dark mode
- [ ] Firefox dark mode
- [ ] Safari dark mode (if available)
- [ ] Mobile responsiveness maintained

## Success Criteria
- [ ] All text is readable in dark mode across all affected pages
- [ ] Modals always center on viewport regardless of scroll position
- [ ] Color scheme is consistent with the rest of the application
- [ ] No hardcoded light-only colors remain in modified files
- [ ] Light mode appearance is unchanged or improved
- [ ] All interactive elements have visible hover/focus states in both modes

## Implementation Order

```
Phase 1: User Management (Most visible issues)
├── 1.1 Table row styling
├── 1.2 Action buttons
├── 1.3 Modal dark mode
├── 1.4 Stats cards
├── 1.5 Empty state
└── 1.6 Role badges

Phase 2: Modal Centering
└── 2.1 Verify and fix viewport centering

Phase 3: Spare Parts Inventory
├── 3.1 Form container
├── 3.2 Table dark mode
└── 3.3 Stock adjustment modal

Phase 4: Spare Requests
├── 4.1 Page header/container
├── 4.2 Table styling
└── 4.3 Form elements

Phase 5: Inward Batch
├── 5.1 Page container
├── 5.2 Type selection buttons
├── 5.3 Form fields
└── 5.4 Action buttons

Phase 6: Notifications
└── 6.1 Success/error notification styling
```

## Notes and Considerations

### Accessibility
- Ensure sufficient color contrast (WCAG AA minimum)
- Keep focus indicators visible in both modes
- Test with screen readers if possible

### Performance
- CSS-only changes, no JavaScript overhead
- No additional dependencies required

### Potential Issues
- Some components may need GlassCard wrapper updates
- Low stock highlight colors may need careful balancing
- Badge colors should remain distinguishable in both modes

---
*This plan is ready for execution with `/execute-plan PRPs/changes5-ui-fixes.md`*
