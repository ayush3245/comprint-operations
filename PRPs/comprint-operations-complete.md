# Implementation Plan: Comprint Operations - Complete Feature Set

## Overview
This plan covers the implementation of remaining features and enhancements for the Comprint Operations device refurbishment tracking system. Based on analysis of the requirements document (`docs/requirements.md`) and current codebase state, this plan identifies gaps and provides a structured approach to complete the application.

## Requirements Summary
From the requirements analysis, the following key areas need implementation or enhancement:

### Already Implemented (Core Features)
- Inward batch creation (REFURB_PURCHASE, RENTAL_RETURN)
- Device registration with category-specific fields
- Bulk Excel upload for devices
- Barcode generation and scanning
- Inspection workflow with routing logic
- Repair station with TAT tracking
- Paint shop panel management
- QC station with grading (A/B)
- Basic dashboard with metrics
- Role-based authentication
- Outward dispatch (basic)

### Gaps Identified (Need Implementation)
1. **Spares Management Module** - Complete spare parts inventory and issuance
2. **Outward Enhancements** - Packed By/Checked By fields, shipping details
3. **Rental Returns Reporting** - Filter by email reference, date range, export
4. **Dashboard Enhancements** - QC rates by batch, stock by location
5. **Activity Logging** - Comprehensive audit trail
6. **Admin Features** - Repair station configuration
7. **QC Attachments** - Photo/PDF upload capability
8. **Search Enhancements** - Search by email reference ID

## Research Findings

### Best Practices
- Server actions pattern established in `src/lib/actions.ts` - follow this for new features
- Toast notifications via `useToast()` hook for user feedback
- Role checks via `checkRole()` at page entry points
- `revalidatePath()` after all mutations for cache invalidation
- Activity logging via `logActivity()` helper

### Reference Implementations
- [src/lib/actions.ts](src/lib/actions.ts) - Server actions pattern
- [src/app/inward/page.tsx](src/app/inward/page.tsx) - Page structure with auth
- [src/components/DynamicDeviceForm.tsx](src/components/DynamicDeviceForm.tsx) - Category-aware forms
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) - Dashboard metrics pattern
- [src/components/ui/Toast.tsx](src/components/ui/Toast.tsx) - Toast notification system

### Technology Decisions
- **File Uploads (QC Attachments)**: Use Next.js API routes with local file storage or cloud storage
- **Excel Export**: Continue using SheetJS (xlsx) library already in project
- **Search**: Prisma full-text search or case-insensitive `contains` queries
- **Activity Logging**: Extend existing `logActivity()` pattern

## Implementation Tasks

### Phase 1: Database Schema Updates

1. **Add Spares Management Tables**
   - Description: Add SparePart and SpareIssuance models to track inventory
   - Files to modify/create: [prisma/schema.prisma](prisma/schema.prisma)
   - Dependencies: None
   - New fields:
     ```prisma
     model SparePart {
       id            String   @id @default(cuid())
       name          String
       partNumber    String   @unique
       category      String   // Compatible device category
       quantity      Int      @default(0)
       minStock      Int      @default(5)
       binLocation   String?
       createdAt     DateTime @default(now())
       updatedAt     DateTime @updatedAt
       issuances     SpareIssuance[]
     }

     model SpareIssuance {
       id          String    @id @default(cuid())
       sparePartId String
       sparePart   SparePart @relation(fields: [sparePartId], references: [id])
       repairJobId String
       repairJob   RepairJob @relation(fields: [repairJobId], references: [id])
       quantity    Int       @default(1)
       issuedAt    DateTime  @default(now())
       returnedAt  DateTime?
       issuedById  String
       issuedBy    User      @relation(fields: [issuedById], references: [id])
     }
     ```

2. **Enhance OutwardRecord Model**
   - Description: Add shipping details, packed by, checked by fields
   - Files to modify: [prisma/schema.prisma](prisma/schema.prisma)
   - Dependencies: Task 1
   - New fields:
     ```prisma
     // Add to OutwardRecord
     shippingCarrier  String?
     trackingNumber   String?
     shippingAddress  String?
     packedById       String?
     packedBy         User?    @relation("PackedBy", fields: [packedById], references: [id])
     checkedById      String?
     checkedBy        User?    @relation("CheckedBy", fields: [checkedById], references: [id])
     ```

3. **Add QC Attachments Model**
   - Description: Support file attachments for QC records
   - Files to modify: [prisma/schema.prisma](prisma/schema.prisma)
   - Dependencies: Task 1
   - New model:
     ```prisma
     model QCAttachment {
       id         String   @id @default(cuid())
       qcRecordId String
       qcRecord   QCRecord @relation(fields: [qcRecordId], references: [id])
       fileName   String
       fileUrl    String
       fileType   String   // 'image' | 'pdf'
       uploadedAt DateTime @default(now())
     }
     ```

4. **Add Email Reference to InwardBatch**
   - Description: Add emailReferenceId field for rental returns tracking
   - Files to modify: [prisma/schema.prisma](prisma/schema.prisma)
   - Dependencies: None
   - New field: `emailReferenceId String?`

5. **Run Prisma Migration**
   - Description: Generate and apply database migration
   - Commands: `npx prisma db push` or `npx prisma migrate dev`
   - Dependencies: Tasks 1-4

### Phase 2: Spares Management Module

6. **Create Spares Server Actions**
   - Description: Implement CRUD operations for spare parts
   - Files to create: [src/lib/spares-actions.ts](src/lib/spares-actions.ts)
   - Dependencies: Task 5
   - Actions:
     - `getSpareParts()` - List all spare parts with filters
     - `createSparePart()` - Add new spare part
     - `updateSparePart()` - Edit spare part details
     - `deleteSparePart()` - Remove spare part
     - `issueSparesToDevice()` - Issue spares to repair job
     - `returnSpares()` - Return unused spares to inventory
     - `getSparesByCompatibility()` - Get spares for device category

7. **Create Spares Inventory Page**
   - Description: Admin page to manage spare parts inventory
   - Files to create:
     - [src/app/spares/page.tsx](src/app/spares/page.tsx)
     - [src/app/spares/SparesClient.tsx](src/app/spares/SparesClient.tsx)
   - Dependencies: Task 6
   - Features:
     - List all spare parts with stock levels
     - Add/edit spare parts
     - Low stock alerts (below minStock)
     - Search by name/part number

8. **Create Spares Issuance Page**
   - Description: Page for warehouse to issue spares to devices
   - Files to create:
     - [src/app/spares/issue/page.tsx](src/app/spares/issue/page.tsx)
     - [src/app/spares/issue/IssueClient.tsx](src/app/spares/issue/IssueClient.tsx)
   - Dependencies: Tasks 6, 7
   - Features:
     - List devices WAITING_FOR_SPARES
     - Select and issue spares
     - Auto-transition to READY_FOR_REPAIR after issuance

9. **Integrate Spares with Inspection**
   - Description: Allow inspector to specify required spares
   - Files to modify:
     - [src/app/inspection/[barcode]/page.tsx](src/app/inspection/[barcode]/page.tsx)
     - [src/lib/actions.ts](src/lib/actions.ts) - `submitInspection()`
   - Dependencies: Task 6
   - Changes:
     - Add spare parts selector to inspection form
     - Create spare requirements when inspection submitted

### Phase 3: Outward Enhancements

10. **Enhance Outward Form**
    - Description: Add shipping details, packed by, checked by
    - Files to modify:
      - [src/app/outward/page.tsx](src/app/outward/page.tsx)
      - [src/app/outward/OutwardClient.tsx](src/app/outward/OutwardClient.tsx)
    - Dependencies: Task 2
    - New fields:
      - Shipping carrier dropdown
      - Tracking number input
      - Shipping address textarea
      - Packed By user selector
      - Checked By user selector

11. **Update Outward Server Action**
    - Description: Save new outward fields
    - Files to modify: [src/lib/actions.ts](src/lib/actions.ts) - `createOutward()`
    - Dependencies: Tasks 2, 10
    - Changes: Include new fields in create operation

12. **Add Stock Movement Logging**
    - Description: Create stock movement records for outward dispatch
    - Files to modify: [src/lib/actions.ts](src/lib/actions.ts)
    - Dependencies: Task 11
    - Create StockMovement record for each device dispatched

### Phase 4: Rental Returns Reporting

13. **Create Rental Returns Report Page**
    - Description: Dedicated reporting page for rental returns
    - Files to create:
      - [src/app/reports/rental-returns/page.tsx](src/app/reports/rental-returns/page.tsx)
      - [src/app/reports/rental-returns/ReportClient.tsx](src/app/reports/rental-returns/ReportClient.tsx)
    - Dependencies: Task 4
    - Features:
      - Date range filter
      - Customer filter
      - Email reference ID filter
      - Device status breakdown
      - Final grades display

14. **Create Report Server Actions**
    - Description: Backend queries for rental returns reporting
    - Files to create/modify: [src/lib/report-actions.ts](src/lib/report-actions.ts)
    - Dependencies: Task 4
    - Actions:
      - `getRentalReturnBatches()` - Filtered batch query
      - `getRentalReturnStats()` - Aggregated statistics

15. **Add Excel Export for Reports**
    - Description: Export rental returns report to Excel
    - Files to modify: [src/app/reports/rental-returns/ReportClient.tsx](src/app/reports/rental-returns/ReportClient.tsx)
    - Dependencies: Task 13
    - Use SheetJS (xlsx) library already in project

### Phase 5: Dashboard Enhancements

16. **Add QC Rates by Batch Chart**
    - Description: Show QC pass/fail rates grouped by inward batch
    - Files to modify: [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
    - Dependencies: None
    - Query QCRecord grouped by device.batchId

17. **Add Stock by Location Chart**
    - Description: Show stock distribution by warehouse location
    - Files to modify: [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
    - Dependencies: None (if location field exists)
    - Display pie/bar chart of stock by location

18. **Add Recent Activity Feed**
    - Description: Show timeline of recent actions
    - Files to modify: [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
    - Dependencies: Activity logging (Task 19)
    - Query ActivityLog ordered by timestamp

### Phase 6: Activity Logging & Audit Trail

19. **Enhance Activity Logging**
    - Description: Ensure all major actions are logged
    - Files to modify: [src/lib/activity.ts](src/lib/activity.ts), [src/lib/actions.ts](src/lib/actions.ts)
    - Dependencies: None
    - Add logging to:
      - Device status changes (with previous/new values)
      - Outward dispatches
      - Spare issuances
      - User management actions

20. **Create Activity Log Viewer**
    - Description: Admin page to view activity logs
    - Files to create:
      - [src/app/admin/activity/page.tsx](src/app/admin/activity/page.tsx)
    - Dependencies: Task 19
    - Features:
      - Filter by user, action type, date range
      - Search by device barcode

### Phase 7: QC Attachments

21. **Create File Upload API**
    - Description: API route to handle file uploads
    - Files to create: [src/app/api/upload/route.ts](src/app/api/upload/route.ts)
    - Dependencies: Task 3
    - Handle multipart form data, save files, return URLs

22. **Add Attachments to QC Form**
    - Description: Allow QC engineer to upload photos/PDFs
    - Files to modify:
      - [src/app/qc/[barcode]/page.tsx](src/app/qc/[barcode]/page.tsx)
    - Dependencies: Tasks 3, 21
    - Add file input, preview, upload functionality

23. **Display Attachments in QC History**
    - Description: Show uploaded attachments on device detail
    - Files to modify: Device detail views
    - Dependencies: Task 22
    - Display thumbnails/links to uploaded files

### Phase 8: Search Enhancements

24. **Add Email Reference Search**
    - Description: Search devices by email reference ID
    - Files to modify:
      - [src/app/inventory/page.tsx](src/app/inventory/page.tsx)
      - [src/lib/actions.ts](src/lib/actions.ts)
    - Dependencies: Task 4
    - Add search field, query by batch.emailReferenceId

25. **Enhance Global Search**
    - Description: Unified search across barcode, serial, PO, email ref
    - Files to modify: Search components throughout app
    - Dependencies: Task 24
    - Implement search across multiple fields

### Phase 9: Admin Features

26. **Create Repair Station Configuration**
    - Description: Admin page to configure repair stations
    - Files to create:
      - [src/app/admin/repair-stations/page.tsx](src/app/admin/repair-stations/page.tsx)
    - Dependencies: Schema may need RepairStation model
    - Features:
      - List repair stations
      - Configure max capacity (default 10)
      - Assign engineers to stations

### Phase 10: Testing & Polish

27. **Write Unit Tests for New Features**
    - Description: Vitest tests for new server actions
    - Files to create:
      - [src/lib/spares-actions.test.ts](src/lib/spares-actions.test.ts)
      - [src/lib/report-actions.test.ts](src/lib/report-actions.test.ts)
    - Dependencies: All implementation tasks
    - Test coverage for:
      - Spare issuance logic
      - Report filtering
      - Status transitions

28. **Integration Testing**
    - Description: Test full workflows end-to-end
    - Files to create: [tests/integration/](tests/integration/)
    - Dependencies: Task 27
    - Test scenarios:
      - Device lifecycle with spares
      - Rental return reporting flow
      - Outward dispatch with all fields

29. **UI/UX Polish**
    - Description: Ensure consistent styling and animations
    - Files to modify: Various components
    - Dependencies: All UI tasks
    - Tasks:
      - Consistent toast messages
      - Loading states for all actions
      - Mobile responsiveness check

## Codebase Integration Points

### Files to Modify
- [prisma/schema.prisma](prisma/schema.prisma) - Add new models and fields
- [src/lib/actions.ts](src/lib/actions.ts) - Update existing actions
- [src/lib/activity.ts](src/lib/activity.ts) - Enhance logging
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) - New dashboard cards
- [src/app/outward/](src/app/outward/) - Outward enhancements
- [src/app/inspection/](src/app/inspection/) - Spares integration
- [src/components/Sidebar.tsx](src/components/Sidebar.tsx) - New navigation items

### New Files to Create
- [src/lib/spares-actions.ts](src/lib/spares-actions.ts) - Spares management
- [src/lib/report-actions.ts](src/lib/report-actions.ts) - Reporting queries
- [src/app/spares/](src/app/spares/) - Spares module pages
- [src/app/reports/rental-returns/](src/app/reports/rental-returns/) - Report page
- [src/app/api/upload/route.ts](src/app/api/upload/route.ts) - File uploads
- [src/app/admin/activity/](src/app/admin/activity/) - Activity log viewer
- [src/app/admin/repair-stations/](src/app/admin/repair-stations/) - Station config

### Existing Patterns to Follow
- Server actions in `src/lib/` with `'use server'` directive
- Page components with `checkRole()` at entry
- Client components with `'use client'` and `useTransition()`
- Toast notifications via `useToast()` hook
- `revalidatePath()` after all mutations
- Activity logging via `logActivity()`
- Prisma queries via shared `prisma` instance from `src/lib/db.ts`

## Technical Design

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js App Router)            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Dashboard│ │  Inward  │ │Inspection│ │  Repair  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Paint  │ │    QC    │ │ Outward  │ │ Inventory│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │  Spares  │ │  Reports │ │  Admin   │ (NEW/ENHANCED)         │
│  └──────────┘ └──────────┘ └──────────┘                        │
├─────────────────────────────────────────────────────────────────┤
│                     SERVER ACTIONS (src/lib/)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ actions.ts  │ │spares-actions│ │report-actions│              │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   auth.ts   │ │ activity.ts │ │    db.ts    │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│                     DATABASE (PostgreSQL + Prisma)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Device  │ │RepairJob│ │QCRecord │ │SparePart│ (NEW)         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐             │
│  │  User   │ │  Batch  │ │ Outward │ │QCAttachment│ (NEW)      │
│  └─────────┘ └─────────┘ └─────────┘ └───────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow - Spares Issuance
```
1. Inspector marks device needs spares → Device.status = WAITING_FOR_SPARES
2. Warehouse views pending spares list → Query Device where status = WAITING_FOR_SPARES
3. Warehouse issues spares:
   a. Create SpareIssuance record
   b. Decrease SparePart.quantity
   c. Update Device.status = READY_FOR_REPAIR
   d. Log activity
4. Repair engineer can return unused spares:
   a. Update SpareIssuance.returnedAt
   b. Increase SparePart.quantity
   c. Log activity
```

### Data Flow - QC Attachments
```
1. QC engineer uploads file via /api/upload
2. API validates file type (image/pdf)
3. File saved to storage (local or cloud)
4. QCAttachment record created with fileUrl
5. On QC form submit, attachments linked to QCRecord
6. Device detail shows attachment thumbnails/links
```

## Dependencies and Libraries
- **Existing (no changes)**:
  - Prisma 7.0 - ORM
  - xlsx (SheetJS) - Excel export
  - Recharts - Dashboard charts
  - Framer Motion - Animations
  - Lucide React - Icons
  - ZXing - Barcode scanning
  - JsBarcode - Barcode generation

- **Potential New**:
  - None required - existing stack sufficient

## Testing Strategy
- **Unit tests** for:
  - Spares actions (issuance, returns, inventory)
  - Report actions (filtering, aggregation)
  - Status transition logic

- **Integration tests** for:
  - Full device lifecycle with spares
  - Rental returns reporting workflow
  - Outward dispatch with new fields

- **Edge cases to cover**:
  - Insufficient spare stock
  - Concurrent spare issuance
  - File upload size limits
  - Invalid file types
  - Report with no data

## Success Criteria
- [ ] Spares module fully functional (CRUD, issuance, returns)
- [ ] Outward form captures all required fields
- [ ] Rental returns report with all filters and export
- [ ] Dashboard shows QC rates by batch and stock by location
- [ ] Activity logging covers all major actions
- [ ] QC attachments can be uploaded and viewed
- [ ] Search works by email reference ID
- [ ] All new features have appropriate test coverage
- [ ] No regression in existing functionality

## Notes and Considerations

### Potential Challenges
- **File Storage**: Need to decide between local storage (simpler) vs cloud storage (scalable)
- **Spare Parts Compatibility**: Need clear rules for which spares work with which categories
- **Report Performance**: Large date ranges may need pagination or async export

### Future Enhancements (Out of Scope)
- Real-time notifications via WebSockets
- Mobile app for barcode scanning
- Integration with external ERP systems
- Automated spare parts reordering
- Machine learning for issue prediction

### Migration Notes
- Schema changes should use `prisma migrate dev` for proper versioning
- Existing data should not be affected by new optional fields
- Test thoroughly in staging before production deployment

---
*This plan is ready for execution with `/execute-plan PRPs/comprint-operations-complete.md`*
