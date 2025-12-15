# Workflow Restructuring PRP - L2/L3 Engineers & Category-Specific Checklists

## Project Overview

Major workflow restructuring to implement:
- Category-specific inspection checklists (~20 items per device type)
- L2 Engineer as central coordinator
- New technician roles for parallel work (L3, Display, Battery)
- Enhanced QC validation with full checklist review

## Implementation Status

### Completed Tasks

| # | Task | Status | Files Modified |
|---|------|--------|----------------|
| 1 | Database Schema Changes | ✅ DONE | `prisma/schema.prisma` |
| 2 | Checklist Definitions | ✅ DONE | `src/lib/checklist-definitions.ts` (new) |
| 3 | L2 Engineer Action Functions | ✅ DONE | `src/lib/actions.ts` |
| 4 | Parallel Work Functions (L3/Display/Battery) | ✅ DONE | `src/lib/actions.ts` |
| 5 | InspectionForm with Category Checklist | ✅ DONE | `src/app/inspection/[barcode]/InspectionForm.tsx`, `page.tsx` |
| 6 | L2 Repair Pages (Coordination Hub) | ✅ DONE | `src/app/l2-repair/page.tsx`, `L2RepairClient.tsx` |
| 7 | Activity Log Types | ✅ DONE | `src/lib/activity.ts` |
| 8 | Unit Tests | ✅ DONE | `src/lib/__tests__/checklist-workflow.test.ts` (54 tests) |
| 9 | L3/Display/Battery Technician Pages | ✅ DONE | `src/app/l3-repair/*`, `src/app/display-repair/*`, `src/app/battery-boost/*` |
| 10 | Technician Workflow Tests | ✅ DONE | `src/lib/__tests__/technician-workflow.test.ts` (44 tests) |
| 11 | QCForm with Checklist Validation | ✅ DONE | `src/app/qc/[barcode]/QCForm.tsx`, `page.tsx`, `src/lib/actions.ts` |

### Recently Completed Tasks

| # | Task | Status | Files Modified |
|---|------|--------|----------------|
| 12 | Update Sidebar and Admin for New Roles | ✅ DONE | `src/components/Sidebar.tsx`, `src/app/admin/users/UserManagementClient.tsx` |
| 13 | Update Seed Data with New Roles | ✅ DONE | `prisma/seed.ts` |

### All Tasks Complete ✅

The workflow restructuring implementation is now complete with all 13 tasks finished.

---

## Detailed Task Specifications

### Task 1: Create L3/Display/Battery Technician Pages

**Files to Create:**
- `src/app/l3-repair/page.tsx` - L3 Engineer page
- `src/app/l3-repair/L3RepairClient.tsx` - L3 job queue UI
- `src/app/display-repair/page.tsx` - Display Technician page
- `src/app/display-repair/DisplayRepairClient.tsx` - Display job queue UI
- `src/app/battery-boost/page.tsx` - Battery Technician page
- `src/app/battery-boost/BatteryBoostClient.tsx` - Battery job queue UI

**Requirements:**
- Role-gated access (L3_ENGINEER, DISPLAY_TECHNICIAN, BATTERY_TECHNICIAN respectively)
- Show pending and in-progress jobs
- Start/Complete workflow buttons
- Display L2 Engineer name for coordination

**Server Actions Available:**
- `getL3RepairJobs()`, `startL3Repair()`, `completeL3Repair()`
- `getDisplayRepairJobs()`, `startDisplayRepair()`, `completeDisplayRepair()`
- `getBatteryBoostJobs()`, `startBatteryBoost()`, `completeBatteryBoost()`

---

### Task 2: Update QCForm with Checklist Validation

**File to Modify:**
- `src/app/qc/[barcode]/QCForm.tsx`

**Requirements:**
1. Display full inspection checklist with:
   - Item index and text
   - Status (PASS/FAIL/NOT_APPLICABLE)
   - Notes if any
   - Who checked it and at what stage
2. Validation before passing:
   - Block if ANY checklist items are PENDING
   - Block if any parallel work is incomplete:
     - `displayRepairRequired && !displayRepairCompleted`
     - `batteryBoostRequired && !batteryBoostCompleted`
     - `l3RepairRequired && !l3RepairCompleted`
     - `paintRequired && !paintCompleted`
3. Allow QC Engineer to add notes to individual items
4. Show parallel work completion status summary

**Server Action to Update:**
- `submitQC()` - Add validation for checklist and parallel work completion

---

### Task 3: Update Sidebar and Admin for New Roles

**Files to Modify:**
- `src/components/Sidebar.tsx` - Add navigation links
- `src/app/admin/users/UserManagementClient.tsx` - Add role dropdown options

**Sidebar Navigation Updates:**
Add links for roles:
- L2_ENGINEER, REPAIR_ENGINEER: `/l2-repair` - "L2 Repair"
- L3_ENGINEER: `/l3-repair` - "L3 Repair"
- DISPLAY_TECHNICIAN: `/display-repair` - "Display Repair"
- BATTERY_TECHNICIAN: `/battery-boost` - "Battery Boost"

**Admin User Management Updates:**
Add roles to dropdown:
- L2_ENGINEER
- L3_ENGINEER
- DISPLAY_TECHNICIAN
- BATTERY_TECHNICIAN

---

### Task 4: Update Seed Data

**File to Modify:**
- `prisma/seed.ts`

**Requirements:**
1. Add test users for new roles:
   - L2 Engineer (update existing REPAIR_ENGINEER)
   - L3 Engineer (new)
   - Display Technician (new)
   - Battery Technician (new)
2. Ensure backward compatibility with existing data

---

## Architecture Overview

### Role Hierarchy
```
SUPERADMIN / ADMIN
    |
INSPECTION_ENGINEER → submits inspection with checklist
    |
L2_ENGINEER (coordinator) → claims device, dispatches work
    |
    ├── DISPLAY_TECHNICIAN → display repairs
    ├── BATTERY_TECHNICIAN → battery boosting
    ├── L3_ENGINEER → major repairs (motherboard, locks, power)
    └── PAINT_SHOP_TECHNICIAN → paint work
    |
L2_ENGINEER → collects all work, sends to QC
    |
QC_ENGINEER → validates all checklist items, grades device
```

### Parallel Work Flow
```
L2 Claims Device
    ↓
L2 Reviews Failed Checklist Items
    ↓
L2 Dispatches to:
    ├── Display Tech (if display issues)
    ├── Battery Tech (if battery < 70%)
    ├── L3 Engineer (if motherboard/lock/power issues)
    └── Paint Shop (if cosmetic issues)
    ↓
Technicians Complete Work
    ↓
L2 Collects All Completed Work
    ↓
L2 Sends to QC (only when ALL work complete)
    ↓
QC Reviews Full Checklist + Grades
```

---

## Database Models Summary

### New Models
- `InspectionChecklistItem` - Category-specific checklist item per device
- `DisplayRepairJob` - Display repair work tracking
- `BatteryBoostJob` - Battery boost work tracking
- `L3RepairJob` - Major repair work tracking

### New Enums
- `ChecklistStatus` - PENDING, PASS, FAIL, NOT_APPLICABLE
- `ChecklistStage` - INSPECTION, L2_ENGINEER, L3_ENGINEER, QC
- `L3IssueType` - MOTHERBOARD, DOMAIN_LOCK, BIOS_LOCK, POWER_ON_ISSUE
- `ParallelWorkStatus` - PENDING, IN_PROGRESS, COMPLETED, CANCELLED

### New Roles
- L2_ENGINEER - Device repair coordinator
- L3_ENGINEER - Major repairs specialist
- DISPLAY_TECHNICIAN - Display repair specialist
- BATTERY_TECHNICIAN - Battery boost specialist

---

## Test Coverage

### All Tests (409 total, all passing)
- `checklist-workflow.test.ts` - 54 tests for:
  - Checklist definitions (17 tests)
  - Checklist-based inspection logic (8 tests)
  - L2 Engineer workflow logic (12 tests)
  - Parallel work status transitions (8 tests)
  - L3 issue types (3 tests)
  - Workflow integration scenarios (6 tests)
- `technician-workflow.test.ts` - 44 tests for:
  - L3 repair job workflows
  - Display repair job workflows
  - Battery boost job workflows
  - QC validation with checklist requirements

---

## Implementation Notes

1. **Backward Compatibility**: REPAIR_ENGINEER role is kept as deprecated for migration
2. **L2 Coordination**: L2 can do work themselves OR delegate to specialists
3. **Parallel Work**: Multiple work types can be dispatched simultaneously
4. **QC Validation**: All checklist items must be reviewed before passing
5. **Grade System**: Kept as A/B (not expanded to A-F)

---

## Archon Project Reference

- **Project ID**: 515bada7-e5ef-43aa-bf6e-3b2b390337a1
- **Project Title**: Comprint Workflow Restructuring

Use Archon MCP tools to track remaining tasks and progress.
