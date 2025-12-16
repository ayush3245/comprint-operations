# Implementation Plan: Changes 3 - Bug Fixes & Enhancements

## Overview
This plan addresses 4 bug fixes and enhancements related to paint panel selection, spare parts inventory management, role-based tab visibility, and reported issues display formatting.

## Requirements Summary
1. **Paint Panel Selection Fix** - Inspection engineer should select panels for painting; L2 sees this data
2. **Spare Parts Inventory Management** - Stock validation and deduction when issuing spares
3. **Role-Based Tab Visibility** - Hide tabs from L2 on Battery/Display pages
4. **Reported Issues Display Format** - Better formatting of JSON issues for L2

## Research Findings

### Current State Analysis

#### Paint Panels
- `PaintPanel` model exists in schema with `panelType`, `status`, `deviceId`
- `submitInspection()` in actions.ts creates paint panels from `paintPanels: string[]` array
- **Issue**: The new checklist-based inspection form (`InspectionForm.tsx`) doesn't have paint panel selection UI
- L2RepairClient checks `device.paintRequired` and `device.paintPanels` for paint status

#### Spare Parts
- `SparePart` model has `currentStock`, `minStock`, `maxStock` fields
- `issueSpares()` function updates `RepairJob.sparesIssued` but doesn't validate or deduct stock
- `adjustSpareStock()` function exists for manual stock adjustments
- Stock is tracked but not linked to issuing workflow

#### Role-Based Tabs
- Both `BatteryBoostClient` and `DisplayRepairClient` have tab components (`activeTab` state)
- Pages pass `userId` and `userName` but NOT user `role`
- Tabs show "Pending" and "In Progress" regardless of user role

#### Reported Issues
- Stored as JSON string in `RepairJob.reportedIssues`
- Format: `{"failedItems": [...], "notes": "..."}` or `{"functional": "...", "cosmetic": "..."}`
- L2RepairClient displays raw `{job.reportedIssues}` without parsing

### Reference Implementations
- Checklist item structure in `InspectionForm.tsx` (lines 56-65)
- Stock adjustment in `adjustSpareStock()` (lines 2553-2581 in actions.ts)
- Tab visibility pattern similar to role checks in page.tsx files

---

## Implementation Tasks

### Phase 1: Paint Panel Selection in Inspection (Issue #1)

#### 1.1 Add Paint Panel Selection UI to InspectionForm
- **Description**: Add a paint panel selection section to the inspection form where engineers can select which panels need painting
- **Files to modify**:
  - `src/app/inspection/[barcode]/InspectionForm.tsx`
- **Changes**:
  - Add state for paint panel selection (`paintPanels: string[]`)
  - Add collapsible section with checkbox options for common panel types:
    - Top Cover, Bottom Cover, Palm Rest, Bezel, Hinge Covers, Side Panels
  - Include in form submission data
- **Dependencies**: None

#### 1.2 Update Inspection Submission to Create Paint Panels
- **Description**: Modify the inspection submission action to create PaintPanel records
- **Files to modify**:
  - `src/app/inspection/[barcode]/page.tsx` - update onSubmit handler
  - `src/lib/actions.ts` - update `submitInspectionChecklist()` function
- **Changes**:
  - Add `paintPanels` parameter to submission
  - Create PaintPanel records when panels are selected
  - Set `device.paintRequired = true` when panels are selected
- **Dependencies**: 1.1

#### 1.3 Display Selected Paint Panels in L2 View
- **Description**: Show which panels were selected for painting in L2's device card
- **Files to modify**:
  - `src/app/l2-repair/L2RepairClient.tsx`
- **Changes**:
  - Parse and display `paintPanels` data in the device expanded view
  - Show panel list with status (AWAITING_PAINT, IN_PAINT, etc.)
- **Dependencies**: 1.2

---

### Phase 2: Spare Parts Inventory Management (Issue #2)

#### 2.1 Create Stock Validation Helper
- **Description**: Create a helper function to check if requested spares are in stock
- **Files to modify**:
  - `src/lib/actions.ts`
- **Changes**:
  - Add `validateSparesInStock(sparesList: string)` function
  - Parse comma-separated or JSON list of part codes
  - Check each part's `currentStock` against requested quantity
  - Return validation result with details on what's missing
- **Dependencies**: None

#### 2.2 Update issueSpares with Stock Validation
- **Description**: Modify `issueSpares()` to validate stock before issuing
- **Files to modify**:
  - `src/lib/actions.ts`
- **Changes**:
  - Call stock validation before updating job
  - Throw descriptive error if stock insufficient
  - Return available stock info in error message
- **Dependencies**: 2.1

#### 2.3 Implement Stock Deduction on Issue
- **Description**: Deduct stock when spares are successfully issued
- **Files to modify**:
  - `src/lib/actions.ts`
- **Changes**:
  - Parse the issued spares list
  - Use transaction to update multiple `SparePart.currentStock` values
  - Log activity with details of what was issued
- **Dependencies**: 2.2

#### 2.4 Update Spares Issue UI with Stock Info
- **Description**: Show available stock in the spares management interface
- **Files to modify**:
  - `src/app/admin/spares/` (if exists) or warehouse interface
- **Changes**:
  - Display current stock when viewing pending spares requests
  - Show warning if stock is low
  - Prevent issue button if stock insufficient
- **Dependencies**: 2.3

---

### Phase 3: Role-Based Tab Visibility (Issue #3)

#### 3.1 Pass User Role to Battery Boost Client
- **Description**: Pass the user's role to the client component
- **Files to modify**:
  - `src/app/battery-boost/page.tsx`
  - `src/app/battery-boost/BatteryBoostClient.tsx`
- **Changes**:
  - Add `userRole` prop to BatteryBoostClient interface
  - Pass `user.role` from page to client
- **Dependencies**: None

#### 3.2 Hide Tabs for L2 in Battery Boost
- **Description**: Conditionally hide tabs when user is L2_ENGINEER
- **Files to modify**:
  - `src/app/battery-boost/BatteryBoostClient.tsx`
- **Changes**:
  - Check if `userRole === 'L2_ENGINEER'`
  - If L2, show simplified view without tabs (just job cards)
  - Show full tabbed interface for BATTERY_TECHNICIAN
- **Dependencies**: 3.1

#### 3.3 Pass User Role to Display Repair Client
- **Description**: Pass the user's role to the client component
- **Files to modify**:
  - `src/app/display-repair/page.tsx`
  - `src/app/display-repair/DisplayRepairClient.tsx`
- **Changes**:
  - Add `userRole` prop to DisplayRepairClient interface
  - Pass `user.role` from page to client
- **Dependencies**: None

#### 3.4 Hide Tabs for L2 in Display Repair
- **Description**: Conditionally hide tabs when user is L2_ENGINEER
- **Files to modify**:
  - `src/app/display-repair/DisplayRepairClient.tsx`
- **Changes**:
  - Check if `userRole === 'L2_ENGINEER'`
  - If L2, show simplified view without tabs
  - Show full tabbed interface for DISPLAY_TECHNICIAN
- **Dependencies**: 3.3

---

### Phase 4: Reported Issues Display Format (Issue #4)

#### 4.1 Create Reported Issues Parser Utility
- **Description**: Create a utility to parse and format reported issues JSON
- **Files to create**:
  - `src/lib/utils/format-issues.ts`
- **Changes**:
  - Parse JSON string safely
  - Handle both formats: `{failedItems, notes}` and `{functional, cosmetic}`
  - Return structured data for display
- **Dependencies**: None

#### 4.2 Create ReportedIssuesDisplay Component
- **Description**: Create a reusable component for displaying formatted issues
- **Files to create**:
  - `src/components/ReportedIssuesDisplay.tsx`
- **Changes**:
  - Accept raw issues string as prop
  - Display failed items as bullet list
  - Show notes in separate section
  - Handle empty/null gracefully
- **Dependencies**: 4.1

#### 4.3 Integrate Component in L2 Repair View
- **Description**: Use the new component in L2RepairClient
- **Files to modify**:
  - `src/app/l2-repair/L2RepairClient.tsx`
- **Changes**:
  - Import ReportedIssuesDisplay component
  - Replace raw `{job.reportedIssues}` display
  - Add styling for better visual hierarchy
- **Dependencies**: 4.2

---

## Codebase Integration Points

### Files to Modify
- `src/app/inspection/[barcode]/InspectionForm.tsx` - Add paint panel selection
- `src/app/inspection/[barcode]/page.tsx` - Update submission handler
- `src/lib/actions.ts` - Stock validation, paint panel creation
- `src/app/battery-boost/page.tsx` - Pass user role
- `src/app/battery-boost/BatteryBoostClient.tsx` - Role-based tabs
- `src/app/display-repair/page.tsx` - Pass user role
- `src/app/display-repair/DisplayRepairClient.tsx` - Role-based tabs
- `src/app/l2-repair/L2RepairClient.tsx` - Issues display, paint panels

### New Files to Create
- `src/lib/utils/format-issues.ts` - Issues parsing utility
- `src/components/ReportedIssuesDisplay.tsx` - Issues display component

### Existing Patterns to Follow
- Form submission pattern from `InspectionForm.tsx`
- Server action pattern from `actions.ts`
- Client component props pattern from existing clients
- Toast notification pattern from `useToast` hook

---

## Technical Design

### Paint Panel Selection
```
Inspection Form
    └── Paint Section (collapsible)
        ├── Checkbox: Top Cover
        ├── Checkbox: Bottom Cover
        ├── Checkbox: Palm Rest
        ├── Checkbox: Bezel
        ├── Checkbox: Hinge Covers
        └── Checkbox: Side Panels
    └── Submit → Creates PaintPanel records
```

### Stock Validation Flow
```
Issue Spares Request
    ├── Parse spare parts list
    ├── Query SparePart.currentStock for each
    ├── If any insufficient:
    │   └── Return error with details
    └── If all available:
        ├── Deduct from currentStock (transaction)
        ├── Update RepairJob.sparesIssued
        └── Log activity
```

### Reported Issues Data Structure
```typescript
// Format 1 (checklist-based inspection)
{
  "failedItems": [
    { "itemIndex": 3, "itemText": "Screen has scratches", "notes": "..." }
  ],
  "notes": "Overall notes from inspection"
}

// Format 2 (legacy inspection)
{
  "functional": "Screen flickering",
  "cosmetic": "Scratches on top cover"
}
```

---

## Testing Strategy

### Unit Tests
- Stock validation helper function
- Issues parsing utility function

### Manual Testing
- Inspection flow with paint panel selection
- Spare parts issuing with stock validation
- L2 viewing Battery Boost page (should not see tabs)
- L2 viewing Display Repair page (should not see tabs)
- L2 viewing formatted reported issues

### Edge Cases
- Empty paint panels selection
- Issuing spares when stock is exactly equal to request
- Issuing spares when some items are in stock, others aren't
- Parsing legacy issues format vs new format
- User with ADMIN role viewing technician pages

---

## Success Criteria
- [ ] Inspection engineers can select paint panels during inspection
- [ ] L2 engineers see which panels need painting
- [ ] Spare parts cannot be issued if stock is insufficient
- [ ] Stock is automatically deducted when spares are issued
- [ ] L2 engineers don't see tabs on Battery Boost page
- [ ] L2 engineers don't see tabs on Display Repair page
- [ ] Reported issues display as formatted list, not raw JSON
- [ ] All existing tests continue to pass
- [ ] No TypeScript errors

---

## Notes and Considerations

### Backwards Compatibility
- Existing devices without paint panels should display correctly
- Legacy issues format should still be parsed and displayed
- L2 engineers can still access Battery/Display pages (just no tabs)

### Future Enhancements
- Add custom panel type input for inspection
- Link spare parts to specific repairs for tracking
- Add stock alerts when below minimum threshold

---

*This plan is ready for execution with `/execute-plan PRPs/changes3-implementation-prp.md`*
