# Implementation Plan: Workflow Enhancements (Phase 2)

## Overview

This plan covers enhancements to the L2/QC workflow and dashboard improvements:
1. QC Engineer can check/uncheck checklist items
2. L2 "Completed" tab for handed-over devices
3. L2 can perform display/battery work directly
4. L2 receives inspection notes, failed items, spare parts with request option
5. Universal dashboard showing pending/in-progress/completed devices per user

## Requirements Summary

- QC Engineer needs ability to toggle checklist item status during review
- L2 Engineer needs visibility into completed/handed-over devices (read-only)
- L2 Engineer should have option to do display/battery work without dispatching
- L2 Engineer must see inspection notes, failed items, and spare parts list
- L2 Engineer needs spare parts request functionality
- All users need personalized dashboard with device status breakdown

## Research Findings

### Existing Patterns

**Tab Pattern** (from `L2RepairClient.tsx`):
```typescript
const [activeTab, setActiveTab] = useState<'assigned' | 'available'>('assigned')
// Extend to: 'assigned' | 'available' | 'completed'
```

**Checklist Display** (from `QCForm.tsx`):
- Items displayed read-only with status icons
- No existing toggle functionality
- Need to add `updateChecklistItem` server action

**Spare Parts Flow** (from `actions.ts`):
- `sparesRequired` stored on RepairJob
- `notifySparesRequested()` exists for notifications
- Need to expose request capability to L2

### Reference Implementations

- **Tab UI**: [L2RepairClient.tsx:214-233](src/app/l2-repair/L2RepairClient.tsx#L214-L233)
- **Checklist Display**: [QCForm.tsx:277-354](src/app/qc/[barcode]/QCForm.tsx#L277-L354)
- **Spare Parts Notify**: [actions.ts:359-370](src/lib/actions.ts#L359-L370)
- **Device Card Pattern**: [L2RepairClient.tsx:250-313](src/app/l2-repair/L2RepairClient.tsx#L250-L313)

## Implementation Tasks

### Phase 1: QC Checklist Toggle

#### Task 1.1: Add updateChecklistItemStatus Server Action
- **Description**: Create server action to update a checklist item's status
- **Files to modify**: `src/lib/actions.ts`
- **Implementation**:
  ```typescript
  export async function updateChecklistItemStatus(
    itemId: string,
    status: ChecklistStatus,
    notes?: string
  ) {
    // Verify user is QC_ENGINEER
    // Update InspectionChecklistItem
    // Set checkedById to current user, stage to QC
    // Log activity
    revalidatePath('/qc')
  }
  ```
- **Dependencies**: None

#### Task 1.2: Update QCForm with Toggle UI
- **Description**: Add toggle buttons to checklist items in QC form
- **Files to modify**: `src/app/qc/[barcode]/QCForm.tsx`
- **Implementation**:
  - Add state for editing: `const [editingItem, setEditingItem] = useState<string | null>(null)`
  - Add toggle buttons (Pass/Fail/N/A) for each item
  - Call server action on toggle
  - Show loading state during update
- **Dependencies**: Task 1.1

#### Task 1.3: Add QC Checklist Toggle Tests
- **Description**: Unit tests for checklist toggle logic
- **Files to create**: Add tests to `src/lib/__tests__/qc-inspection.test.ts`
- **Dependencies**: Task 1.1

---

### Phase 2: L2 Completed Tab

#### Task 2.1: Add getL2CompletedDevices Server Action
- **Description**: Fetch devices that L2 has completed and sent to QC
- **Files to modify**: `src/lib/actions.ts`
- **Implementation**:
  ```typescript
  export async function getL2CompletedDevices(userId: string) {
    return prisma.device.findMany({
      where: {
        repairJob: {
          l2EngineerId: userId,
          status: { in: ['REPAIR_CLOSED', 'SENT_FOR_QC'] }
        }
      },
      include: {
        repairJob: true,
        qcInspection: { include: { qcEngineer: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }
  ```
- **Dependencies**: None

#### Task 2.2: Update L2RepairClient with Completed Tab
- **Description**: Add third tab showing completed devices as read-only cards
- **Files to modify**:
  - `src/app/l2-repair/page.tsx` - fetch completed devices
  - `src/app/l2-repair/L2RepairClient.tsx` - add tab UI
- **Implementation**:
  - Extend tab type: `'assigned' | 'available' | 'completed'`
  - Add "Completed" tab button with count
  - Display read-only cards showing:
    - Device info (barcode, model)
    - Completion date
    - QC status (if available)
    - No action buttons
- **Dependencies**: Task 2.1

---

### Phase 3: L2 Direct Display/Battery Work

#### Task 3.1: Add L2 Direct Work Actions
- **Description**: Allow L2 to mark display/battery work as done without dispatching
- **Files to modify**: `src/lib/actions.ts`
- **Implementation**:
  ```typescript
  export async function l2CompleteDisplayWork(deviceId: string, notes?: string) {
    // Create DisplayRepairJob with status COMPLETED
    // Set startedById and completedById to current L2 user
    // Update device flags
    revalidatePath('/l2-repair')
  }

  export async function l2CompleteBatteryWork(
    deviceId: string,
    finalCapacity: string,
    notes?: string
  ) {
    // Create BatteryBoostJob with status COMPLETED
    // Set startedById and completedById to current L2 user
    revalidatePath('/l2-repair')
  }
  ```
- **Dependencies**: None

#### Task 3.2: Update L2RepairClient UI for Direct Work
- **Description**: Add "Do it myself" option for display/battery in dispatch modal
- **Files to modify**: `src/app/l2-repair/L2RepairClient.tsx`
- **Implementation**:
  - In dispatch modal, add checkbox: "I'll handle this myself"
  - If checked, call direct work action instead of dispatch
  - Show appropriate completion form (battery needs final capacity input)
- **Dependencies**: Task 3.1

---

### Phase 4: L2 Inspection Data & Spare Parts

#### Task 4.1: Enhance L2 Device Card with Inspection Data
- **Description**: Display inspection notes, failed items, and spares prominently
- **Files to modify**: `src/app/l2-repair/L2RepairClient.tsx`
- **Implementation**:
  - Add collapsible "Inspection Summary" section in expanded card
  - Show:
    - Inspection engineer name
    - Overall notes from inspection
    - Failed checklist items (already partially implemented)
    - Required spare parts list
  - Style with appropriate colors/icons
- **Dependencies**: None (data already available)

#### Task 4.2: Add L2 Spare Parts Request Action
- **Description**: Allow L2 to request additional spare parts
- **Files to modify**: `src/lib/actions.ts`
- **Implementation**:
  ```typescript
  export async function l2RequestSpares(
    deviceId: string,
    sparesRequired: string,
    notes?: string
  ) {
    // Update RepairJob.sparesRequired (append to existing)
    // Set device status to WAITING_FOR_SPARES
    // Call notifySparesRequested()
    // Log activity
    revalidatePath('/l2-repair')
  }
  ```
- **Dependencies**: None

#### Task 4.3: Add Spare Parts Request UI to L2
- **Description**: Add spare parts request form in L2 device card
- **Files to modify**: `src/app/l2-repair/L2RepairClient.tsx`
- **Implementation**:
  - Add "Request Spares" button in expanded card
  - Modal with textarea for spare part codes
  - Show current spare parts status (requested/issued)
  - Disable button if already waiting for spares
- **Dependencies**: Task 4.2

---

### Phase 5: Universal Dashboard

#### Task 5.1: Create getUserDashboardStats Server Action
- **Description**: Fetch device counts by status for current user
- **Files to modify**: `src/lib/actions.ts`
- **Implementation**:
  ```typescript
  export async function getUserDashboardStats(userId: string, role: Role) {
    // Based on role, query appropriate tables
    // Return: { pending: number, inProgress: number, completed: number }
    //
    // L2_ENGINEER: Check repairJob.l2EngineerId
    // INSPECTION_ENGINEER: Check device.inspectionEngId
    // QC_ENGINEER: Check qcInspection.qcEngineerId
    // DISPLAY_TECHNICIAN: Check displayRepairJobs.startedById
    // etc.
  }
  ```
- **Dependencies**: None

#### Task 5.2: Create DashboardStats Component
- **Description**: Reusable component showing pending/in-progress/completed counts
- **Files to create**: `src/components/DashboardStats.tsx`
- **Implementation**:
  - Three stat cards with counts and icons
  - Click to filter/navigate to relevant list
  - Color-coded (yellow/blue/green)
- **Dependencies**: Task 5.1

#### Task 5.3: Integrate Dashboard Stats Across Pages
- **Description**: Add DashboardStats to role-specific pages
- **Files to modify**:
  - `src/app/l2-repair/page.tsx`
  - `src/app/l3-repair/page.tsx`
  - `src/app/display-repair/page.tsx`
  - `src/app/battery-boost/page.tsx`
  - `src/app/qc/page.tsx`
  - `src/app/inspection/page.tsx`
- **Dependencies**: Task 5.2

---

## Codebase Integration Points

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/actions.ts` | Add 6 new server actions |
| `src/app/qc/[barcode]/QCForm.tsx` | Add checklist toggle UI |
| `src/app/l2-repair/page.tsx` | Fetch completed devices |
| `src/app/l2-repair/L2RepairClient.tsx` | Add completed tab, inspection summary, spare parts request, direct work options |
| `src/app/l2-repair/page.tsx` | Add completed devices fetch |
| Role-specific pages (6 files) | Add dashboard stats |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/DashboardStats.tsx` | Reusable stats component |

### Existing Patterns to Follow

1. **Server Actions**: Use `'use server'` directive, call `revalidatePath()`
2. **Role Checks**: Use `checkRole()` at start of server actions
3. **Activity Logging**: Call `logActivity()` for significant actions
4. **Toast Notifications**: Use `useToast()` for user feedback
5. **Tab UI**: Follow existing pattern from L2RepairClient

## Technical Design

### Data Flow

```
QC Checklist Toggle:
QCForm → updateChecklistItemStatus() → DB → revalidatePath → UI refresh

L2 Completed Tab:
page.tsx → getL2CompletedDevices() → L2RepairClient → read-only cards

L2 Direct Work:
L2RepairClient → l2CompleteDisplayWork() → DB → revalidatePath → UI refresh

L2 Spare Parts:
L2RepairClient → l2RequestSpares() → DB + notify → revalidatePath → UI refresh

Dashboard Stats:
page.tsx → getUserDashboardStats() → DashboardStats component
```

### New Server Actions

| Action | Parameters | Returns |
|--------|------------|---------|
| `updateChecklistItemStatus` | itemId, status, notes? | Updated item |
| `getL2CompletedDevices` | userId | Device[] |
| `l2CompleteDisplayWork` | deviceId, notes? | Success/error |
| `l2CompleteBatteryWork` | deviceId, finalCapacity, notes? | Success/error |
| `l2RequestSpares` | deviceId, sparesRequired, notes? | Success/error |
| `getUserDashboardStats` | userId, role | Stats object |

## Testing Strategy

### Unit Tests
- QC checklist status transitions
- L2 direct work logic
- Dashboard stats calculation per role

### Integration Tests
- QC toggle → verify database update
- L2 completed tab → verify correct devices shown
- Spare parts request → verify notification sent

### Manual Testing
- QC Engineer: Toggle items, verify UI updates
- L2 Engineer: Test all tabs, spare parts request, direct work
- All roles: Verify dashboard stats accuracy

## Success Criteria

- [ ] QC Engineer can toggle checklist items between Pass/Fail/N/A
- [ ] L2 Engineer sees "Completed" tab with handed-over devices (read-only)
- [ ] L2 Engineer can complete display/battery work directly
- [ ] L2 Engineer sees inspection notes, failed items, spare parts
- [ ] L2 Engineer can request additional spare parts
- [ ] All users see pending/in-progress/completed counts on their dashboard
- [ ] All 409+ tests pass
- [ ] No TypeScript errors

## Notes and Considerations

1. **QC Toggle Audit**: Track who changed checklist items and when (stage = QC)
2. **Completed Tab Performance**: Limit to last 50 devices to avoid slow queries
3. **Direct Work vs Dispatch**: Clear UI distinction to avoid confusion
4. **Spare Parts Append**: Don't overwrite existing spare parts, append new ones
5. **Dashboard Stats Cache**: Consider caching stats for performance

## Archon Task Creation

After plan approval, create tasks in Archon:
```
Project: 515bada7-e5ef-43aa-bf6e-3b2b390337a1

Tasks (in order):
1. QC Checklist Toggle - Server Action (Phase 1)
2. QC Checklist Toggle - UI (Phase 1)
3. L2 Completed Tab - Server Action (Phase 2)
4. L2 Completed Tab - UI (Phase 2)
5. L2 Direct Work Actions (Phase 3)
6. L2 Direct Work UI (Phase 3)
7. L2 Inspection Data Display (Phase 4)
8. L2 Spare Parts Request (Phase 4)
9. Dashboard Stats Component (Phase 5)
10. Dashboard Stats Integration (Phase 5)
11. Unit Tests for New Features
```

---

*This plan is ready for execution with `/execute-plan PRPs/workflow-enhancements-prp.md`*
