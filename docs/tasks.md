# Comprint Operations - Development Tasks

This document outlines completed features, known issues, and planned enhancements for the Comprint Operations system.

---

## 1. Completed Features

### 1.1 Core Infrastructure
- [x] Next.js 16 project setup with App Router (Turbopack)
- [x] PostgreSQL database with Prisma ORM 7.0
- [x] Prisma adapter for PostgreSQL connection pooling
- [x] TypeScript configuration
- [x] Tailwind CSS 4 styling setup
- [x] Framer Motion animations
- [x] Recharts for dashboard visualizations
- [x] Resend for email notifications

### 1.2 Authentication & Authorization
- [x] Cookie-based authentication system
- [x] Role-based access control (11 roles including specialized technicians)
- [x] SUPERADMIN bypass for all permissions
- [x] Protected route middleware
- [x] User management (CRUD for admins)

### 1.3 Inward Management
- [x] Create inward batches (Refurb/Rental Return)
- [x] Add individual devices to batches
- [x] Bulk upload devices from Excel (multi-sheet template for all device types)
- [x] Auto-generate barcodes (X-BRD-NNNN format)
- [x] Auto-generate batch IDs (BATCH-YYYY-NNNN format)
- [x] View batch details and device list
- [x] Print barcode labels
- [x] Dynamic form fields based on device category
- [x] Support for 7 device categories: LAPTOP, DESKTOP, WORKSTATION, SERVER, MONITOR, STORAGE, NETWORKING_CARD

### 1.4 Inspection Module
- [x] Barcode scanner integration (ZXing)
- [x] Manual barcode entry fallback
- [x] Functional issue documentation
- [x] Cosmetic issue documentation
- [x] Paint panel selection
- [x] Spare parts requirement specification
- [x] Smart workflow routing based on findings

### 1.5 Spares Management
- [x] View devices waiting for spares
- [x] Issue spares to devices
- [x] Automatic status update after spares issued

### 1.6 L2 Repair Station
- [x] View repair queue (assigned + unassigned)
- [x] Start repair with TAT tracking (5-day SLA)
- [x] Maximum 10 concurrent jobs per engineer
- [x] Complete repair with notes
- [x] QC rework indicator with context
- [x] Collect from paint functionality
- [x] TAT overdue highlighting
- [x] Send to parallel work streams (L3, Display, Battery, Paint)
- [x] Collect from parallel work streams when ready

### 1.7 Paint Shop
- [x] View panels awaiting paint
- [x] Update panel status (Awaiting -> In Paint -> Ready)
- [x] Filter to show only panels where repair is completed
- [x] Auto-route to QC when complete (if no repair needed)

### 1.8 Quality Control
- [x] Barcode scanner for device lookup
- [x] QC checklist interface
- [x] Grade assignment (A/B)
- [x] Pass/Fail determination
- [x] QC failure sends device back to repair with context
- [x] Close repair job on QC pass

### 1.9 Inventory Management
- [x] View all warehouse devices
- [x] Status filtering
- [x] Device search by barcode

### 1.10 Activity Logging
- [x] Audit trail for major actions
- [x] User attribution
- [x] Metadata storage (JSON)

### 1.11 User Experience
- [x] Dismissible confirmation popups for all workflow actions
- [x] Toast/popup system with React Context
- [x] Color-coded popup types (success, warning, error)
- [x] Details display in confirmation popups (barcode, device info, status)
- [x] Page transitions with Framer Motion
- [x] Confetti effect on significant completions
- [x] Dark mode / light mode support with system preference detection
- [x] ThemeProvider component for theme state management
- [x] ThemeToggle component in sidebar for manual theme switching
- [x] Semantic CSS utility classes (text-foreground, bg-card, border-default, etc.)
- [x] CSS custom properties for theme colors
- [x] GlassCard UI component with glass-morphism effect

### 1.12 L2/L3 Parallel Work System
- [x] L2 Repair Station with device assignment and queue management
- [x] L3 Repair queue for complex repairs (motherboard, BIOS lock, domain lock, power issues)
- [x] Display Repair queue for screen/display component repairs
- [x] Battery Boost station for battery reconditioning
- [x] Parallel work coordination from L2 station
- [x] Self-complete options for L2 engineers handling specialist tasks
- [x] Status indicators for parallel work streams
- [x] New user roles: L2_ENGINEER, L3_ENGINEER, DISPLAY_TECHNICIAN, BATTERY_TECHNICIAN

---

## 2. Known Issues & Bug Fixes Completed

### 2.1 Recently Fixed
| Issue | Status | Fix Applied |
|-------|--------|-------------|
| Repair jobs not showing when waiting for spares | Fixed | Updated query to include WAITING_FOR_SPARES status |
| Paint panels showing before repair complete | Fixed | Added filter to exclude panels where device.repairRequired && !device.repairCompleted |
| Devices not leaving repair station after QC pass | Fixed | Added REPAIR_CLOSED status update in submitQC |
| READY_FOR_COLLECTION panels appearing in paint shop | Fixed | Changed query from `NOT FITTED` to explicit `IN ['AWAITING_PAINT', 'IN_PAINT']` |
| Clear data script failing with PrismaClient error | Fixed | Added pg adapter initialization to match main application |
| QC context not visible on rework | Fixed | Added QC records to repair job query and UI indicator |

### 2.2 Known Technical Debt
| Item | Priority | Description |
|------|----------|-------------|
| ~~Error toast notifications~~ | ~~Medium~~ | ✅ Implemented confirmation popup system |
| Form validation | Medium | Add client-side validation for better UX |
| Loading states | Low | Add skeleton loaders for data fetching |
| Mobile responsiveness | Medium | Some forms need mobile optimization |

---

## 3. Planned Enhancements

### 3.1 High Priority

#### T-001: Outward/Dispatch Module ✅ COMPLETED
**Complexity:** High
**Dependencies:** Inventory module
**Description:** Implement complete outward workflow for sales and rental dispatch

**Tasks:**
- [x] Create outward page route `/outward`
- [x] Outward type selection (Sales / Rental)
- [x] Sales Outward form:
  - [x] Customer name input
  - [x] Sales Invoice number input
  - [x] Device selection interface (multi-select from READY_FOR_STOCK devices)
  - [x] Shipping details capture (carrier, tracking, address)
  - [x] Packed By user selection
  - [x] Checked By user selection (dual verification)
- [x] Rental Outward form:
  - [x] Customer name input
  - [x] Rental reference input
  - [x] Device selection interface
  - [x] Shipping details capture
- [x] Create `createOutward()` server action
- [x] Update device status to STOCK_OUT_SOLD or STOCK_OUT_RENTAL
- [x] Create stock movement records for each device
- [x] Generate dispatch documentation (packing list)
- [x] Activity logging for outward dispatch
- [x] Confirmation popup with dispatch details

---

#### T-002: Spare Parts Inventory Management ✅ COMPLETED
**Complexity:** Medium
**Dependencies:** None
**Description:** Full spare parts inventory tracking

**Tasks:**
- [x] Spare parts catalog management (CRUD)
  - [x] Create spare part form (code, description, category, compatible models)
  - [x] Edit spare part details
  - [x] Delete/deactivate spare parts
- [x] Stock level tracking (current, min, max)
- [x] Bin location management
- [x] Stock alerts for low inventory (when current < min)
- [x] Spare parts issuance tracking:
  - [x] Link issued spares to specific repair jobs
  - [x] Decrease inventory when issued
  - [ ] **Return unused spares to stock** (repair engineer can mark spares as unused) - Pending
  - [ ] Track actual spares used vs issued - Pending
- [x] Stock movement history per part
- [ ] Spare parts usage reports - Pending

---

#### T-003: Dashboard Analytics ✅ COMPLETED
**Complexity:** Medium
**Dependencies:** All workflow modules
**Description:** Real-time operational dashboard with KPIs per original requirements

**Tasks:**
- [x] **Devices by stage** (Pending Inspection / Under Repair / In Paint / Awaiting QC / Ready for Stock)
- [x] **TAT breaches** - Count of repair jobs exceeding 5 days
- [x] **QC pass/fail rates by engineer** - Individual engineer performance with Recharts visualization
- [ ] **QC pass/fail rates by batch** - Batch quality tracking - Pending
- [x] **Stock snapshot by grade (A/B)** - Ready inventory by quality
- [x] **Stock snapshot by category** (Laptop/Desktop/Workstation/Server/Monitor/Storage/NIC)
- [ ] **Stock snapshot by location** (Rack/Bin) - Pending
- [x] Daily/weekly throughput metrics (bar chart)
- [ ] Repair engineer workload distribution - Pending
- [ ] Average time per workflow stage - Pending
- [ ] Batch completion tracking - Pending
- [x] Overdue device alerts

---

#### T-004: Email Notifications ✅ COMPLETED
**Complexity:** Medium
**Dependencies:** User management
**Description:** Automated email notifications for key events

**Tasks:**
- [x] Set up email service (Resend)
- [x] Notification triggers:
  - [x] TAT approaching deadline
  - [x] TAT breached
  - [x] Spares requested
  - [x] QC failed
  - [x] Paint panels ready for collection
- [ ] User notification preferences - Pending
- [x] Email templates

---

#### T-005: QC Attachments & Photo Upload
**Complexity:** Medium
**Dependencies:** QC module
**Description:** Allow QC engineers to upload photos and documents as evidence

**Tasks:**
- [ ] File upload component for QC form
- [ ] Support image formats (JPG, PNG)
- [ ] Support document formats (PDF)
- [ ] Store files (local storage or cloud - S3/Cloudinary)
- [ ] Update QCRecord schema to include attachments field
- [ ] Display uploaded attachments in QC record view
- [ ] Generate QC report with embedded photos (PDF export)
- [ ] Store inspection engineer name and repair engineer name in QC record

---

#### T-006: Enhanced Rental Returns Reporting
**Complexity:** Medium
**Dependencies:** Inward module
**Description:** Comprehensive rental returns reporting with email trail filtering

**Tasks:**
- [ ] Rental returns report page `/reports/rental-returns`
- [ ] Date range filter
- [ ] Customer filter dropdown
- [ ] **Email reference ID / Thread ID filter** (query by email trail)
- [ ] Display device statuses (Pending Inspection, Under Repair, Awaiting QC, Ready for Stock, Scrapped)
- [ ] Display final grades (A/B) for QC-passed devices
- [ ] Export to Excel (xlsx format)
- [ ] Export to CSV format
- [ ] Print-friendly report view

---

#### T-007: Enhanced Audit Logging
**Complexity:** Medium
**Dependencies:** ActivityLog model
**Description:** Capture previous and new values for all edits

**Tasks:**
- [ ] Update ActivityLog metadata to include previousValue and newValue
- [ ] Log all Device status changes with before/after
- [ ] Log all RepairJob status changes with before/after
- [ ] Log all QCRecord creation with details
- [ ] Log user edits to any record
- [ ] Create audit log viewer page
- [ ] Filter audit logs by entity type, user, date range
- [ ] Export audit logs

---

#### T-008: Repair Station Configuration
**Complexity:** Low
**Dependencies:** Repair module
**Description:** Configure multiple repair stations with capacity limits

**Tasks:**
- [ ] Create RepairStation model in schema
- [ ] Admin UI to manage repair stations (add/edit/delete)
- [ ] Assign devices to specific stations
- [ ] Enforce max 10 active devices per station
- [ ] Station-wise repair queue view
- [ ] Station utilization dashboard

---

### 3.2 Medium Priority

#### T-009: Device History Timeline
**Complexity:** Low
**Dependencies:** Activity logging
**Description:** Visual timeline showing complete device journey

**Tasks:**
- [ ] Query all events for a device
- [ ] Timeline UI component
- [ ] Include stock movements, repair jobs, QC records
- [ ] Show responsible users and timestamps
- [ ] Add to device detail views

---

#### T-010: Barcode Label Customization
**Complexity:** Low
**Dependencies:** None
**Description:** Configurable barcode label formats

**Tasks:**
- [ ] Label template settings page
- [ ] Include device details on label (model, serial)
- [ ] Support different label sizes
- [ ] Batch printing for multiple devices
- [ ] QR code option

---

#### T-011: Reporting Module Enhancement
**Complexity:** Medium
**Dependencies:** All modules
**Description:** Comprehensive reporting capabilities

**Tasks:**
- [ ] Daily operations report
- [ ] Batch-wise summary report
- [ ] Engineer productivity report
- [ ] TAT compliance report
- [ ] QC yield report (pass/fail by engineer and batch)
- [ ] Export to Excel/PDF
- [ ] Scheduled report generation

---

#### T-012: Device Search Enhancements
**Complexity:** Low
**Dependencies:** Inventory module
**Description:** Advanced search and filtering per original requirements

**Tasks:**
- [ ] Search by barcode
- [ ] Search by serial number
- [ ] Search by customer name
- [ ] Search by PO/Invoice number
- [ ] **Search by email reference ID** (for rental returns)
- [ ] Filter by device status
- [ ] Filter by grade (A/B)
- [ ] Filter by location (rack/bin)
- [ ] Filter by age in process (days since received)
- [ ] Date range filters
- [ ] Batch filter
- [ ] Brand/Model filter
- [ ] Export search results to Excel
- [ ] Save search presets

---

### 3.3 Low Priority

#### T-013: User Activity Dashboard
**Complexity:** Low
**Dependencies:** Activity logging
**Description:** Per-user activity view for admins

**Tasks:**
- [ ] Activity log filtering by user
- [ ] Daily activity summary
- [ ] Actions per user chart
- [ ] Login history

---

#### T-014: Bulk Operations
**Complexity:** Medium
**Dependencies:** Various modules
**Description:** Batch operations for efficiency

**Tasks:**
- [ ] Bulk status update
- [ ] Bulk device transfer between batches
- [ ] Bulk QC pass (with grade)
- [ ] Bulk print labels

---

#### T-015: Mobile App
**Complexity:** High
**Dependencies:** All core modules
**Description:** Mobile application for floor operations

**Tasks:**
- [ ] React Native or PWA setup
- [ ] Camera barcode scanning
- [ ] Repair job management
- [ ] Paint status updates
- [ ] Push notifications
- [ ] Offline support

---

#### T-016: API Integration Layer
**Complexity:** High
**Dependencies:** None
**Description:** REST/GraphQL API for external integrations

**Tasks:**
- [ ] API route setup
- [ ] Authentication (API keys/JWT)
- [ ] Rate limiting
- [ ] Documentation (OpenAPI/Swagger)
- [ ] Webhook support for events

---

#### T-017: Detailed QC Checklist UI
**Complexity:** Medium
**Dependencies:** QC module
**Description:** Implement the complete QC checklist form per design.md specification (US-021a)

**Tasks:**
- [ ] Update QC form with all functional check fields:
  - [ ] Power-on & boot sequence checkbox
  - [ ] Display quality checkbox
  - [ ] Keyboard functionality checkbox
  - [ ] Touchpad/trackpoint checkbox
  - [ ] USB ports checkbox
  - [ ] HDMI/display ports checkbox
  - [ ] Wi-Fi connectivity checkbox
  - [ ] Bluetooth checkbox
  - [ ] Ethernet port checkbox
  - [ ] Audio jack/speakers checkbox
  - [ ] Battery health checkbox
  - [ ] Adapter/charging checkbox
  - [ ] Fan noise checkbox
  - [ ] Thermal performance checkbox
  - [ ] Stress test checkbox
- [ ] Update QC form with all cosmetic check fields:
  - [ ] Top cover condition checkbox
  - [ ] Bottom cover checkbox
  - [ ] Palm rest checkbox
  - [ ] Screen bezel checkbox
  - [ ] Paint finish checkbox
  - [ ] Logo intact checkbox
  - [ ] Required stickers checkbox
- [ ] Store checklist results as JSON per design.md structure
- [ ] Display checklist results in QC record view

---

#### T-018: Scrap Workflow
**Complexity:** Low
**Dependencies:** Inventory module
**Description:** Implement device scrapping functionality

**Tasks:**
- [ ] Add "Scrap Device" action to inventory
- [ ] Capture scrap reason/notes
- [ ] Update device status to SCRAPPED
- [ ] Create stock movement record (type: SCRAP)
- [ ] Activity logging for scrap action
- [ ] Scrap report (list of scrapped devices with reasons)

---

#### T-019: Stock Relocation
**Complexity:** Low
**Dependencies:** Inventory module
**Description:** Move devices between warehouse locations (racks/bins)

**Tasks:**
- [ ] Add location field to device record (rack/bin)
- [ ] "Move Device" action in inventory
- [ ] Select from-location and to-location
- [ ] Create stock movement record (type: MOVE)
- [ ] Activity logging for relocation
- [ ] Location-wise inventory view

---

#### T-020: Return to Vendor Workflow
**Complexity:** Low
**Dependencies:** Inventory, Inward module
**Description:** Return defective devices to vendor

**Tasks:**
- [ ] "Return to Vendor" action
- [ ] Link to original inward batch/PO
- [ ] Capture return reason and RMA reference
- [ ] Update device status appropriately
- [ ] Create stock movement record (type: RETURN_TO_VENDOR)
- [ ] Activity logging

---

## 4. Technical Improvements

### 4.1 Code Quality

| Task | Priority | Description |
|------|----------|-------------|
| Unit tests | High | Add Jest tests for server actions |
| Integration tests | Medium | Playwright tests for critical flows |
| Error boundaries | Medium | React error boundaries for graceful failures |
| Input validation | Medium | Zod schemas for form validation |
| Type safety | Low | Stricter TypeScript configuration |

### 4.2 Performance

| Task | Priority | Description |
|------|----------|-------------|
| Query optimization | Medium | Index frequently queried columns |
| Pagination | Medium | Add pagination to inventory and batch lists |
| Caching strategy | Low | Redis for session and frequent queries |
| Image optimization | Low | Optimize barcode generation |

### 4.3 DevOps

| Task | Priority | Description |
|------|----------|-------------|
| CI/CD pipeline | High | GitHub Actions for build and deploy |
| Environment configs | Medium | Separate dev/staging/prod configs |
| Database migrations | Medium | Automated migration scripts |
| Monitoring | Medium | Error tracking (Sentry) |
| Logging | Low | Structured logging with log aggregation |

---

## 5. Task Dependencies Graph

```
                    +----------------+
                    | Core Auth/RBAC |
                    +-------+--------+
                            |
        +-------------------+-------------------+
        |                   |                   |
+-------v-------+   +-------v-------+   +-------v-------+
| Inward Module |   | User Mgmt     |   | Activity Log  |
+-------+-------+   +---------------+   +-------+-------+
        |                                       |
+-------v-------+                       +-------v-------+
| Inspection    |                       | Device History|
+-------+-------+                       | (T-005)       |
        |                               +---------------+
+-------v-------+
| Spares Mgmt   |
+-------+-------+
        |
+-------v-------+
| Repair Module |
+-------+-------+
        |
+-------v-------+
| Paint Module  |
+-------+-------+
        |
+-------v-------+
| QC Module     |
+-------+-------+
        |
+-------v-------+     +----------------+
| Inventory     +---->| Outward (T-001)|
+-------+-------+     +----------------+
        |
+-------v-------+
| Dashboard     |
| (T-003)       |
+-------+-------+
        |
+-------v-------+
| Reports       |
| (T-007)       |
+---------------+
```

---

## 6. Complexity Estimates

| Complexity | Description | Typical Scope |
|------------|-------------|---------------|
| **Low** | Single component/function, minimal DB changes | 1-2 files, <100 lines |
| **Medium** | Multiple components, new DB tables, business logic | 3-5 files, 100-500 lines |
| **High** | New module, significant architecture changes | 5+ files, 500+ lines |

---

## 7. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12 | Initial release with core workflow modules |
| 1.0.1 | 2025-12 | Bug fixes for workflow routing |
| 1.0.2 | 2025-12 | QC rework context and repair job closure fixes |
| 1.1.0 | 2025-12 | Added device categories (Server, Monitor, Storage, NIC) with dynamic form fields |
| 1.1.1 | 2025-12 | Replaced toast notifications with dismissible confirmation popups for all workflow actions |
| 1.1.2 | 2025-12 | Updated to Next.js 16, Prisma 7.0, added comprehensive documentation |
| 1.2.0 | 2025-12 | L2/L3 parallel work system with specialized roles (L2_ENGINEER, L3_ENGINEER, DISPLAY_TECHNICIAN, BATTERY_TECHNICIAN) |
| 1.2.1 | 2025-12 | Dark mode / light mode UI overhaul with ThemeProvider, semantic CSS classes, and full component theme support |

---

## 8. Contributing Guidelines

### Branch Naming
- `feature/T-XXX-description` for new features
- `bugfix/issue-description` for bug fixes
- `refactor/area-description` for refactoring

### Commit Messages
```
type(scope): description

Types: feat, fix, refactor, docs, test, chore
Scope: inward, inspection, repair, paint, qc, inventory, auth
```

### Pull Request Checklist
- [ ] Code follows existing patterns
- [ ] Server actions have proper error handling
- [ ] revalidatePath called after mutations
- [ ] Activity logging added for user actions
- [ ] Role-based access control verified
- [ ] No console.log statements in production code
