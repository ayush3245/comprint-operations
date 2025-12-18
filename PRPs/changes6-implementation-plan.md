# Implementation Plan: Changes 6 - Feature Updates & Improvements

## Overview

This plan covers 10 feature requests for the Comprint Operations platform, including workflow fixes, UI improvements, and new functionality. The changes span L2/Paint workflow, spare parts, inward batches, inspection/QC, user management, dropdowns, and inventory management.

## Requirements Summary

| # | Requirement | Priority | Complexity |
|---|-------------|----------|------------|
| 1 | Fix L2 → Paint → L2 collection workflow | HIGH | Medium |
| 2 | Remove legacy Repair Engineer tab | MEDIUM | Low |
| 3 | Spare parts issuance: warning instead of error | HIGH | Low |
| 4 | Add edit option for inward batches | MEDIUM | Medium |
| 5 | Add back button in inward batch detail | LOW | Low |
| 6 | Better notification for wrong barcode in Inspection/QC | MEDIUM | Low |
| 7 | Move user management stat cards to top | LOW | Low |
| 8 | Add dropdown arrow indicators globally | MEDIUM | Low |
| 9 | Add date field to inward batch creation | LOW | Low |
| 10 | Inventory: search, filters, sort, pagination | HIGH | High |

## Research Findings

### Best Practices (from codebase analysis)

1. **Form Handling**: Use `FormWithToast` wrapper or `useTransition()` + `useToast()` pattern
2. **Modals**: Use fixed overlay with backdrop blur, animated content, header/content/footer structure
3. **Server Actions**: Always check auth, throw descriptive errors, use `revalidatePath()` after mutations
4. **Client/Server Split**: Server component for data fetching, client component for interactivity
5. **Filtering**: Use existing `FilterPanel` and `Pagination` components from `src/components/ui/`

### Reference Implementations

| Pattern | Reference File |
|---------|----------------|
| Edit Modal | `src/app/inward/[id]/InwardDeviceList.tsx` |
| Toast Notifications | `src/app/inspection/[barcode]/InspectionForm.tsx` |
| Filter Panel | `src/components/ui/FilterPanel.tsx` |
| Pagination | `src/components/ui/Pagination.tsx` |
| Server Actions CRUD | `src/lib/actions.ts` (createInwardBatch, updateDevice) |
| Client Component Pattern | `src/app/outward/OutwardClient.tsx` |

### Technology Decisions

- **Toast System**: Use existing `useToast()` hook from `@/components/ui/Toast`
- **Icons**: Use `lucide-react` (already installed)
- **Styling**: Follow Tailwind CSS patterns with theme-aware classes
- **State Management**: Local React state + `useTransition()` for mutations

---

## Implementation Tasks

### Phase 1: Quick Wins (LOW effort, immediate impact)

#### Task 1.1: Add Back Button to Inward Batch Detail
- **Description**: Add navigation back to batch list from detail page
- **Files to modify**: `src/app/inward/[id]/page.tsx`
- **Dependencies**: None
- **Estimated effort**: 15 minutes

**Implementation**:
```tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Add after page header, before content
<Link
  href="/inward"
  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
>
  <ArrowLeft size={18} />
  <span>Back to Batches</span>
</Link>
```

---

#### Task 1.2: Move User Management Stat Cards to Top
- **Description**: Reposition stat cards from bottom to after header
- **Files to modify**: `src/app/admin/users/UserManagementClient.tsx`
- **Dependencies**: None
- **Estimated effort**: 15 minutes

**Implementation**:
1. Cut the stat cards JSX block (currently after the table, around lines 403-421)
2. Paste after the header section (after line 254)
3. Adjust spacing (change `mt-6` to `mb-6`)

---

#### Task 1.3: Add Date Field to Inward Batch Creation
- **Description**: Allow user to select receipt date when creating batch
- **Files to modify**:
  - `src/app/inward/new/NewInwardBatchClient.tsx`
  - `src/lib/actions.ts` (createInwardBatch)
- **Dependencies**: None
- **Estimated effort**: 30 minutes

**Implementation in NewInwardBatchClient.tsx**:
```tsx
// Add after type selection field
<div>
  <label className="block text-sm font-medium text-foreground mb-1">
    Receipt Date
  </label>
  <input
    type="date"
    name="date"
    defaultValue={new Date().toISOString().split('T')[0]}
    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-colors"
  />
</div>
```

**Implementation in actions.ts** (createInwardBatch):
```tsx
export async function createInwardBatch(data: {
  type: InwardType
  date?: string  // Add this parameter
  poInvoiceNo?: string
  // ... existing fields
}) {
  // ... existing code
  const batch = await prisma.inwardBatch.create({
    data: {
      date: data.date ? new Date(data.date) : new Date(),  // Use provided date
      // ... existing fields
    }
  })
}
```

---

### Phase 2: UI Improvements (LOW-MEDIUM effort)

#### Task 2.1: Add Dropdown Arrow Indicators
- **Description**: Add chevron icon to all select elements globally
- **Files to modify**: `src/app/globals.css`
- **Dependencies**: None
- **Estimated effort**: 1 hour

**Implementation** (CSS approach - global fix):
```css
/* Add to globals.css after the select appearance-none rule */

/* Dropdown arrow indicator for selects */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.5rem !important;
}

/* Dark mode arrow */
.dark select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
}
```

---

#### Task 2.2: Improve Wrong Barcode Notification in Inspection/QC
- **Description**: Better error UI when device not found
- **Files to modify**:
  - `src/app/inspection/[barcode]/page.tsx`
  - `src/app/qc/[barcode]/page.tsx`
- **Dependencies**: None
- **Estimated effort**: 1 hour

**Implementation** (for both files):
```tsx
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

// Replace the simple "Device not found" div with:
if (!device) {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-center animate-fade-in">
      <AlertCircle className="mx-auto text-red-500 dark:text-red-400 mb-4" size={48} />
      <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
        Device Not Found
      </h2>
      <p className="text-red-600 dark:text-red-400 mb-4">
        No device found with barcode: <strong className="font-mono">{barcode}</strong>
      </p>
      <p className="text-sm text-red-500 dark:text-red-400 mb-6">
        Please verify the barcode is correct and the device has been registered in the system.
      </p>
      <Link
        href="/inspection"  {/* or "/qc" for QC page */}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        <ArrowLeft size={16} />
        Scan Another Device
      </Link>
    </div>
  )
}
```

---

#### Task 2.3: Spare Parts Issuance - Warning Instead of Error
- **Description**: Show toast notification instead of crashing when spare not available
- **Files to modify**: `src/app/spares/page.tsx`
- **Dependencies**: None
- **Estimated effort**: 1 hour

**Implementation** - Convert to client component pattern:

1. Create `src/app/spares/SparesClient.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { issueSpares } from '@/lib/actions'

interface SparesRequest {
  // ... type definition from existing code
}

interface Props {
  requests: SparesRequest[]
}

export default function SparesClient({ requests }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  async function handleIssue(jobId: string, sparesIssued: string) {
    if (!sparesIssued.trim()) {
      toast.warning('Please enter spare parts to issue')
      return
    }

    startTransition(async () => {
      try {
        await issueSpares(jobId, sparesIssued)
        toast.success('Spare parts issued successfully', {
          title: 'Spares Issued',
          details: [
            { label: 'Job ID', value: jobId },
            { label: 'Parts', value: sparesIssued }
          ]
        })
        router.refresh()
      } catch (error) {
        // Show warning toast instead of crashing
        toast.error(error instanceof Error ? error.message : 'Failed to issue spares', {
          title: 'Cannot Issue Spares',
          details: [
            { label: 'Reason', value: 'Some parts may be out of stock or not found' }
          ]
        })
      }
    })
  }

  return (
    // ... existing table JSX with handleIssue integration
  )
}
```

2. Update `src/app/spares/page.tsx` to use the client component:
```tsx
import { checkRole } from '@/lib/auth'
import { getSparesRequests } from '@/lib/actions'
import SparesClient from './SparesClient'

export default async function SparesPage() {
  await checkRole(['MIS_WAREHOUSE_EXECUTIVE', 'WAREHOUSE_MANAGER', 'ADMIN', 'SUPERADMIN'])
  const requests = await getSparesRequests()
  return <SparesClient requests={requests} />
}
```

---

### Phase 3: Feature Additions (MEDIUM effort)

#### Task 3.1: Add Edit Option for Inward Batches
- **Description**: Allow editing batch metadata after creation
- **Files to create**: `src/app/inward/[id]/EditBatchModal.tsx`
- **Files to modify**:
  - `src/app/inward/[id]/page.tsx`
  - `src/lib/actions.ts`
- **Dependencies**: None
- **Estimated effort**: 3-4 hours

**Step 1: Add server action in actions.ts**:
```tsx
export async function updateInwardBatch(
  batchId: string,
  data: {
    date?: Date
    poInvoiceNo?: string
    supplier?: string
    customer?: string
    rentalRef?: string
    emailSubject?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Verify batch exists
  const batch = await prisma.inwardBatch.findUnique({
    where: { batchId }
  })
  if (!batch) throw new Error('Batch not found')

  // Update batch
  const updated = await prisma.inwardBatch.update({
    where: { batchId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })

  // Log activity
  await logActivity({
    action: 'UPDATED_BATCH',
    details: `Updated batch ${batchId}`,
    userId: user.id,
    metadata: { batchId, changes: data }
  })

  revalidatePath('/inward')
  revalidatePath(`/inward/${batchId}`)

  return updated
}
```

**Step 2: Create EditBatchModal.tsx** (see reference in InwardDeviceList.tsx for modal pattern)

**Step 3: Add edit button and modal to page.tsx**

---

#### Task 3.2: Remove Legacy Repair Engineer Tab
- **Description**: Completely remove the /repair page and all references
- **Files to delete**:
  - `src/app/repair/page.tsx`
  - `src/app/repair/RepairClient.tsx`
- **Files to modify**:
  - `src/components/Sidebar.tsx` - Remove repair links (lines 59, 75)
  - `src/app/dashboard/DashboardClient.tsx` - Remove REPAIR_ENGINEER role checks
  - `src/app/admin/users/UserManagementClient.tsx` - Remove REPAIR_ENGINEER role option
  - `src/app/l2-repair/page.tsx` - Remove REPAIR_ENGINEER from role check
  - `src/lib/actions.ts` - Deprecate/remove repair actions (optional, keep for safety)
- **Dependencies**: None
- **Estimated effort**: 1-2 hours

**Implementation Steps**:

1. **Delete files**:
```bash
rm -rf src/app/repair/
```

2. **Sidebar.tsx** - Remove these lines:
```tsx
// Line 59 (SUPERADMIN section)
{ href: '/repair', label: 'Repair (Legacy)', icon: Wrench, roles: ['SUPERADMIN'] },

// Line 75 (regular users section)
{ href: '/repair', label: 'Repair (Legacy)', icon: Wrench, roles: ['REPAIR_ENGINEER', 'ADMIN'] },
```

3. **DashboardClient.tsx** - Remove REPAIR_ENGINEER from roles arrays:
```tsx
// Line 153: Remove from roles array
// Line 189: Remove from roles array
// Line 210: Remove from roles array
```

4. **UserManagementClient.tsx** - Remove role option:
```tsx
// Line 57: Remove { value: 'REPAIR_ENGINEER', label: 'Repair Engineer (Legacy)' }
// Lines 81-82: Remove REPAIR_ENGINEER case from getRoleBadgeColor
```

5. **l2-repair/page.tsx** - Update role check:
```tsx
// Change from:
const user = await checkRole(['L2_ENGINEER', 'REPAIR_ENGINEER', 'ADMIN', 'SUPERADMIN'])
// To:
const user = await checkRole(['L2_ENGINEER', 'ADMIN', 'SUPERADMIN'])
```

---

#### Task 3.3: Verify L2 → Paint → L2 Collection Workflow
- **Description**: Verify and fix the paint panel collection flow
- **Files to verify**:
  - `src/app/l2-repair/L2RepairClient.tsx`
  - `src/app/paint/PaintClient.tsx`
  - `src/lib/actions.ts` (collectFromPaint, updatePanelStatus)
- **Dependencies**: None
- **Estimated effort**: 2-4 hours (mostly testing)

**Verification Steps**:
1. Test sending panels from L2 to Paint
2. Test Paint shop processing (AWAITING_PAINT → IN_PAINT → READY_FOR_COLLECTION)
3. Verify L2 sees "Collect" button when panels are ready
4. Test `collectFromPaint()` action transitions device properly
5. Verify device returns to correct status after collection

**Potential Fixes** (if needed):
- Ensure `getParallelWorkStatus()` correctly identifies ready-to-collect panels
- Verify `collectFromPaint()` sets `paintCompleted = true`
- Check notification sent to L2 engineer when paint complete

---

### Phase 4: Major Feature - Inventory Search/Filter/Pagination (HIGH effort)

#### Task 4.1: Create Inventory Server Action with Filtering
- **Description**: Add `searchInventory()` action with filtering, sorting, pagination
- **Files to modify**: `src/lib/actions.ts`
- **Dependencies**: None
- **Estimated effort**: 2 hours

**Implementation**:
```tsx
export async function searchInventory(params: {
  search?: string
  category?: DeviceCategory[]
  ownership?: Ownership
  status?: DeviceStatus[]
  grade?: Grade
  sortBy?: 'barcode' | 'brand' | 'model' | 'updatedAt' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}) {
  const {
    search = '',
    category,
    ownership,
    status,
    grade,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 25
  } = params

  // Build where clause
  const where: Prisma.DeviceWhereInput = {
    // Exclude stock-out and scrapped
    status: {
      notIn: [
        DeviceStatus.STOCK_OUT_SOLD,
        DeviceStatus.STOCK_OUT_RENTAL,
        DeviceStatus.SCRAPPED
      ]
    }
  }

  // Search filter
  if (search) {
    where.OR = [
      { barcode: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Category filter
  if (category && category.length > 0) {
    where.category = { in: category }
  }

  // Ownership filter
  if (ownership) {
    where.ownership = ownership
  }

  // Status filter (override default exclusion)
  if (status && status.length > 0) {
    where.status = { in: status }
  }

  // Grade filter
  if (grade) {
    where.grade = grade
  }

  // Execute queries in parallel
  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      include: {
        inwardBatch: true,
        repairJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.device.count({ where })
  ])

  return {
    devices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}
```

---

#### Task 4.2: Create InventoryClient Component
- **Description**: Client component with search, filters, table, and pagination
- **Files to create**: `src/app/inventory/InventoryClient.tsx`
- **Dependencies**: Task 4.1
- **Estimated effort**: 4 hours

**Implementation Structure**:
```tsx
'use client'

import { useState, useTransition, useEffect } from 'react'
import { searchInventory } from '@/lib/actions'
import { FilterPanel } from '@/components/ui/FilterPanel'
import { Pagination } from '@/components/ui/Pagination'
import { Search, Filter, Loader2 } from 'lucide-react'

// ... (full implementation with state management, filter config, table rendering)
```

---

#### Task 4.3: Update Inventory Page
- **Description**: Convert page to use client component
- **Files to modify**: `src/app/inventory/page.tsx`
- **Dependencies**: Task 4.2
- **Estimated effort**: 30 minutes

**Implementation**:
```tsx
import { checkRole } from '@/lib/auth'
import { searchInventory } from '@/lib/actions'
import InventoryClient from './InventoryClient'

export default async function InventoryPage() {
  await checkRole(['WAREHOUSE_MANAGER', 'MIS_WAREHOUSE_EXECUTIVE', 'ADMIN', 'SUPERADMIN'])

  // Get initial data
  const initialData = await searchInventory({ page: 1, limit: 25 })

  return <InventoryClient initialData={initialData} />
}
```

---

## Codebase Integration Points

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/Sidebar.tsx` | Remove repair links |
| `src/app/globals.css` | Add dropdown arrow styles |
| `src/lib/actions.ts` | Add updateInwardBatch, searchInventory |
| `src/app/inward/[id]/page.tsx` | Add back button, edit button |
| `src/app/inward/new/NewInwardBatchClient.tsx` | Add date field |
| `src/app/spares/page.tsx` | Convert to client component pattern |
| `src/app/inventory/page.tsx` | Convert to use client component |
| `src/app/inspection/[barcode]/page.tsx` | Improve error UI |
| `src/app/qc/[barcode]/page.tsx` | Improve error UI |
| `src/app/admin/users/UserManagementClient.tsx` | Move stat cards, remove REPAIR_ENGINEER |
| `src/app/dashboard/DashboardClient.tsx` | Remove REPAIR_ENGINEER references |
| `src/app/l2-repair/page.tsx` | Remove REPAIR_ENGINEER from role check |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/inventory/InventoryClient.tsx` | Client component with search/filter/pagination |
| `src/app/spares/SparesClient.tsx` | Client component with toast error handling |
| `src/app/inward/[id]/EditBatchModal.tsx` | Modal for editing batch metadata |

### Files to Delete

| File | Reason |
|------|--------|
| `src/app/repair/page.tsx` | Legacy repair page removal |
| `src/app/repair/RepairClient.tsx` | Legacy repair client removal |

### Existing Patterns to Follow

1. **Modal Pattern**: Reference `src/app/inward/[id]/InwardDeviceList.tsx`
2. **Toast Pattern**: Reference `src/app/inspection/[barcode]/InspectionForm.tsx`
3. **Filter Pattern**: Use `src/components/ui/FilterPanel.tsx`
4. **Pagination Pattern**: Use `src/components/ui/Pagination.tsx`
5. **Server Action Pattern**: Reference existing CRUD in `src/lib/actions.ts`

---

## Technical Design

### Data Flow for Inventory Search

```
┌─────────────────────────────────────────────────────────────────┐
│                        InventoryClient                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Search Box  │  │ FilterPanel │  │      Pagination         │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│                          ▼                                      │
│              ┌──────────────────────┐                          │
│              │  searchInventory()   │  ◄─── Server Action      │
│              │  params: {           │                          │
│              │    search, category, │                          │
│              │    status, grade,    │                          │
│              │    page, limit,      │                          │
│              │    sortBy, sortOrder │                          │
│              │  }                   │                          │
│              └──────────┬───────────┘                          │
│                         │                                      │
│                         ▼                                      │
│              ┌──────────────────────┐                          │
│              │   Prisma Query       │                          │
│              │   with WHERE clause  │                          │
│              └──────────┬───────────┘                          │
│                         │                                      │
│                         ▼                                      │
│              ┌──────────────────────┐                          │
│              │   Return {devices,   │                          │
│              │   total, page, limit}│                          │
│              └──────────┬───────────┘                          │
│                         │                                      │
│                         ▼                                      │
│              ┌──────────────────────┐                          │
│              │   Update Table +     │                          │
│              │   Pagination State   │                          │
│              └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### State Management for Inventory

```typescript
// Local state in InventoryClient
const [searchTerm, setSearchTerm] = useState('')
const [filters, setFilters] = useState<FilterState>({})
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(25)
const [sortBy, setSortBy] = useState<SortField>('updatedAt')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
const [data, setData] = useState(initialData)
const [isPending, startTransition] = useTransition()

// Debounced search effect
useEffect(() => {
  const timer = setTimeout(() => {
    fetchData()
  }, 300)
  return () => clearTimeout(timer)
}, [searchTerm, filters, currentPage, itemsPerPage, sortBy, sortOrder])
```

---

## Testing Strategy

### Unit Tests
- `updateInwardBatch()` action validation
- `searchInventory()` filter building logic
- Date parsing in batch creation

### Integration Tests
- L2 → Paint → L2 workflow end-to-end
- Spare parts issuance with unavailable parts
- Inventory search with various filter combinations

### Manual Testing Checklist
- [ ] Dropdown arrows visible on all select elements
- [ ] Back button works in inward batch detail
- [ ] Date field accepts and saves custom dates
- [ ] Stat cards appear at top of user management
- [ ] Wrong barcode shows proper error with return link
- [ ] Spare parts shows toast on unavailable parts
- [ ] Edit batch modal saves changes
- [ ] Repair tab completely removed from sidebar
- [ ] Paint collection flow returns device to L2
- [ ] Inventory search, filter, sort, pagination all work

---

## Success Criteria

- [ ] L2 engineers can send panels to paint and collect them back
- [ ] Legacy repair tab is completely removed
- [ ] Spare parts issuance shows warning toast instead of error crash
- [ ] Inward batches can be edited after creation
- [ ] Back button available in batch detail view
- [ ] Wrong barcode in Inspection/QC shows helpful error with return link
- [ ] User management stat cards appear at top of page
- [ ] All dropdown fields have visible arrow indicator
- [ ] Inward batch creation includes date picker
- [ ] Inventory page has search, filters, sorting, and pagination

---

## Implementation Order

1. **Day 1 - Quick Wins** (Tasks 1.1, 1.2, 1.3)
   - Back button
   - Stat cards position
   - Date field

2. **Day 1-2 - UI Improvements** (Tasks 2.1, 2.2, 2.3)
   - Dropdown arrows
   - Wrong barcode notification
   - Spare parts toast

3. **Day 2-3 - Feature Additions** (Tasks 3.1, 3.2, 3.3)
   - Edit batch modal
   - Remove repair tab
   - Verify paint workflow

4. **Day 3-4 - Major Feature** (Tasks 4.1, 4.2, 4.3)
   - Inventory search action
   - Inventory client component
   - Update inventory page

---

## Notes and Considerations

1. **Paint Workflow**: May already be working - verify before making changes
2. **REPAIR_ENGINEER Role**: Keep in database schema for historical data, just remove from UI
3. **Inventory Performance**: With pagination, should handle large datasets well
4. **Date Field**: Use native HTML5 date input for best cross-browser support
5. **Dropdown CSS**: May need to verify SVG works in all browsers

---

## Estimated Total Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Quick Wins | 3 tasks | 1 hour |
| Phase 2: UI Improvements | 3 tasks | 3 hours |
| Phase 3: Feature Additions | 3 tasks | 6-8 hours |
| Phase 4: Inventory | 3 tasks | 6-7 hours |
| **Total** | **12 tasks** | **16-19 hours** |

---

*This plan is ready for execution with `/execute-plan PRPs/changes6-implementation-plan.md`*
