# Comprint Operations - Product Requirements Document

## 1. Project Overview

### 1.1 Purpose
Comprint Operations is a comprehensive device refurbishment and repair tracking system designed to manage the complete lifecycle of laptops, desktops, and workstations from receiving to final dispatch. The system tracks devices through various workflow stages including inspection, repair, painting, quality control, and inventory management.

### 1.2 Scope
The application supports two primary business operations:
- **Refurb Stock**: Devices purchased for refurbishment and resale
- **Rental Returns**: Devices returned from rental customers requiring refurbishment before re-deployment

### 1.3 Target Users
- Warehouse staff (receiving and dispatch)
- Inspection engineers
- Repair engineers
- Paint shop technicians
- Quality control engineers
- Administrators and supervisors

---

## 2. User Roles & Personas

### 2.1 Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| **SUPERADMIN** | System administrator with full access | All features |
| **ADMIN** | Operations administrator | Most features except system config |
| **MIS_WAREHOUSE_EXECUTIVE** | Handles inward receiving and batch creation | Inward, Inventory |
| **WAREHOUSE_MANAGER** | Manages inventory and stock movements | Inventory, Reports, Outward |
| **INSPECTION_ENGINEER** | Performs initial device inspection | Inspection module |
| **REPAIR_ENGINEER** | Performs device repairs | Repair station |
| **PAINT_SHOP_TECHNICIAN** | Handles cosmetic painting of panels | Paint shop |
| **QC_ENGINEER** | Performs quality control checks | QC module |

### 2.2 User Personas

**Warehouse Executive (Rajesh)**
- Receives devices from suppliers or rental returns
- Creates inward batches with PO/Invoice references
- Adds devices to batches individually or via bulk upload
- Generates barcode labels for tracking

**Inspection Engineer (Priya)**
- Scans device barcode to start inspection
- Documents functional and cosmetic issues
- Determines if repair/paint is needed
- Identifies required spare parts
- Routes device to appropriate workflow

**Repair Engineer (Suresh)**
- Views queue of devices ready for repair
- Starts work on devices (max 10 concurrent)
- Records repair actions and notes
- Handles QC rework items with context
- Collects devices from paint shop when ready

**Paint Shop Technician (Amit)**
- Views panels awaiting painting
- Updates panel status through painting stages
- Marks panels ready for collection

**QC Engineer (Meera)**
- Performs comprehensive quality checks
- Uses checklists for functional and cosmetic inspection
- Assigns grade (A or B) to passed devices
- Sends failed devices back for rework with detailed remarks

---

## 3. User Stories

### 3.1 Inward Management

**US-001**: As a Warehouse Executive, I want to create a new inward batch with supplier/PO details, so that I can group related devices together.

**US-002**: As a Warehouse Executive, I want to add individual devices to a batch with specifications (brand, model, CPU, RAM, etc.), so that each device is registered in the system.

**US-003**: As a Warehouse Executive, I want to bulk upload devices from an Excel file, so that I can efficiently register multiple devices at once.

**US-004**: As a Warehouse Executive, I want to generate and print barcode labels for devices, so that they can be tracked throughout the workflow.

### 3.2 Inspection

**US-005**: As an Inspection Engineer, I want to scan a device barcode to start inspection, so that I can quickly access the device record.

**US-006**: As an Inspection Engineer, I want to document functional issues found during inspection, so that repair engineers know what to fix.

**US-007**: As an Inspection Engineer, I want to mark which panels need painting, so that the paint shop knows what work is required.

**US-008**: As an Inspection Engineer, I want to specify spare parts required, so that the warehouse can issue them before repair.

**US-009**: As an Inspection Engineer, I want devices to automatically route to the correct next stage based on my findings, so that workflow is efficient.

### 3.3 Spares Management

**US-010**: As a Warehouse Manager, I want to view all devices waiting for spares, so that I can prioritize spare part issuance.

**US-011**: As a Warehouse Manager, I want to mark spares as issued to a device, so that it can proceed to repair.

### 3.4 Repair Station

**US-012**: As a Repair Engineer, I want to see all devices in my repair queue, so that I know what work is pending.

**US-013**: As a Repair Engineer, I want to start working on a device with automatic TAT tracking, so that turnaround times are monitored.

**US-014**: As a Repair Engineer, I want to record repair notes when completing work, so that there is documentation of work done.

**US-015**: As a Repair Engineer, I want to see QC failure remarks when a device returns for rework, so that I know exactly what needs fixing.

**US-016**: As a Repair Engineer, I want to collect devices from paint shop when panels are ready, so that I can complete the repair workflow.

### 3.5 Paint Shop

**US-017**: As a Paint Shop Technician, I want to see all panels awaiting painting, so that I know what work is pending.

**US-018**: As a Paint Shop Technician, I want to update panel status through painting stages (Awaiting -> In Paint -> Ready for Collection), so that progress is tracked.

**US-019**: As a Paint Shop Technician, I want panels to only appear after repair is completed (if repair was required), so that workflow sequence is maintained.

### 3.6 Quality Control

**US-020**: As a QC Engineer, I want to scan a device barcode to start QC inspection, so that I can quickly access the device record.

**US-021**: As a QC Engineer, I want to use a detailed checklist to verify functional and cosmetic aspects, so that inspection is consistent.

**US-021a**: QC Checklist must include:
- Power-on & boot sequence
- Display quality (dead pixels, backlight, brightness)
- Keyboard functionality (all keys)
- Touchpad/trackpoint operation
- All ports & connectivity (USB, HDMI, Wi-Fi, Bluetooth, LAN, audio jack)
- Battery health (if applicable)
- Adapter/charging verification
- Fan noise & thermal performance
- Stress test results
- Cosmetic condition (panels, paint finish, logo, stickers)

**US-022**: As a QC Engineer, I want to assign a grade (A or B only) to passed devices, so that quality is documented with a strict 2-option grading system.

**US-023**: As a QC Engineer, I want to fail devices with detailed remarks, so that repair engineers know what needs rework.

**US-023a**: As a QC Engineer, I want to attach photos, screenshots, or PDF reports to the QC record, so that there is visual evidence.

**US-023b**: As a QC Engineer, I want the QC record to capture the inspection engineer name and repair engineer name from the workflow, so that the final report shows who did what.

### 3.7 Inventory Management

**US-024**: As a Warehouse Manager, I want to view all devices in the warehouse with their current status, so that I have visibility of inventory.

**US-025**: As a Warehouse Manager, I want to filter devices by status, category, grade, ownership type, and location, so that I can find specific devices.

**US-026**: As a Warehouse Manager, I want to search devices by barcode, serial number, customer, PO/Invoice, or email reference ID, so that I can quickly locate specific items.

**US-027**: As a Warehouse Manager, I want to filter devices by age in process, so that I can identify stalled items.

### 3.8 Outward - Sales Dispatch

**US-028**: As a Warehouse Manager, I want to create a Sales Outward record with customer and invoice details, so that dispatch is documented.

**US-029**: As a Warehouse Manager, I want to select multiple devices from inventory for a single outward, so that bulk dispatches are efficient.

**US-030**: As a Warehouse Manager, I want to capture shipping details (carrier, tracking, address), so that shipments can be tracked.

**US-031**: As a Warehouse Manager, I want to record who packed the order and who verified it, so that there is accountability.

**US-032**: As a Warehouse Manager, I want device status to automatically update to STOCK_OUT_SOLD after dispatch, so that inventory is accurate.

### 3.9 Outward - Rental Dispatch

**US-033**: As a Warehouse Manager, I want to create a Rental Outward record with customer and rental reference, so that rental dispatches are tracked.

**US-034**: As a Warehouse Manager, I want device status to automatically update to STOCK_OUT_RENTAL after dispatch, so that inventory reflects rental assets.

**US-035**: As a Warehouse Manager, I want all outward movements logged in the stock ledger, so that there is a complete audit trail.

### 3.10 Rental Returns Reporting

**US-036**: As a Warehouse Manager, I want to view all rental return batches for a given date range, so that I can track returns.

**US-037**: As a Warehouse Manager, I want to filter rental returns by customer, so that I can see all returns from a specific client.

**US-038**: As a Warehouse Manager, I want to filter rental returns by email reference ID, so that I can answer "Show me all inventory returned on this email chain."

**US-039**: As a Warehouse Manager, I want to see device statuses (Pending Inspection, Under Repair, Ready for Stock, Scrapped) for returned devices, so that I can track progress.

**US-040**: As a Warehouse Manager, I want to export rental return reports to Excel/CSV, so that I can share with stakeholders.

### 3.11 Dashboard & KPIs

**US-041**: As a Manager, I want to see devices grouped by workflow stage, so that I have operational visibility.

**US-042**: As a Manager, I want to see TAT breach count (repairs exceeding 5 days), so that I can address delays.

**US-043**: As a Manager, I want to see QC pass/fail rates by engineer and by batch, so that I can identify quality trends.

**US-044**: As a Manager, I want to see stock snapshot by grade (A/B), category, and location, so that I know available inventory.

### 3.12 Administration

**US-045**: As an Admin, I want to manage user accounts (create, edit, activate/deactivate), so that system access is controlled.

**US-046**: As an Admin, I want to assign roles to users, so that they have appropriate access levels.

**US-047**: As an Admin, I want to configure repair stations, so that workload can be distributed.

---

## 4. User Flows

### 4.1 Device Lifecycle Flow

```
[Received] --> [Pending Inspection] --> [Inspection]
                                              |
                    +-------------------------+-------------------------+
                    |                         |                         |
              [No Issues]           [Repair Required]           [Paint Only]
                    |                         |                         |
                    v                         v                         v
              [Awaiting QC]        [Waiting for Spares]        [In Paint Shop]
                                          |                         |
                                          v                         v
                                   [Ready for Repair]        [Awaiting QC]
                                          |
                                          v
                                   [Under Repair]
                                          |
                    +---------------------+---------------------+
                    |                                           |
              [Paint Required]                           [No Paint]
                    |                                           |
                    v                                           v
              [In Paint Shop]                            [Awaiting QC]
                    |
                    v
              [Awaiting QC]

[Awaiting QC] --> [QC Check]
                      |
        +-------------+-------------+
        |                           |
   [QC Passed]               [QC Failed]
        |                           |
        v                           v
 [Ready for Stock]          [Ready for Repair]
        |                     (with QC context)
        v
 [Stock Out: Sold/Rental]
```

### 4.2 Inward Flow
1. User navigates to Inward section
2. Clicks "Create New Batch"
3. Selects type (Refurb Purchase or Rental Return)
4. Enters reference details (PO/Invoice or Rental Reference)
5. System generates batch ID (BATCH-YYYY-NNNN)
6. User adds devices individually or via bulk upload
7. System generates unique barcode for each device (X-BRD-NNNN)
8. User prints barcode labels

### 4.3 Inspection Flow
1. Inspector scans device barcode
2. System displays device details
3. Inspector examines device and records:
   - Functional issues found
   - Cosmetic issues found
   - Panels requiring painting
   - Spare parts required
4. Inspector submits inspection
5. System routes device:
   - If spares required: WAITING_FOR_SPARES
   - If repair needed (no spares): READY_FOR_REPAIR
   - If paint only: IN_PAINT_SHOP
   - If no issues: AWAITING_QC

### 4.4 Repair Flow
1. Repair engineer views queue of available devices
2. Clicks "Start" to begin work on a device
3. System assigns device to engineer and sets 5-day TAT
4. Engineer performs repairs
5. Enters repair notes and clicks "Complete Repair"
6. System routes device:
   - If paint required: IN_PAINT_SHOP
   - If no paint: AWAITING_QC

### 4.5 QC Rework Flow
1. QC fails a device with remarks
2. Device status changes to READY_FOR_REPAIR
3. QC remarks are appended to repair job notes
4. Device appears in repair queue with red indicator
5. Repair engineer sees QC failure context
6. After rework, device returns to QC

### 4.6 Sales Outward Flow
1. Warehouse manager navigates to Outward section
2. Selects "Sales Dispatch" type
3. Enters customer name and Sales Invoice number
4. Selects devices from inventory (QC Passed devices only)
5. Enters shipping details (carrier, tracking, address)
6. Records "Packed By" user
7. Records "Checked By" user (double verification)
8. Submits outward record
9. System creates stock movement records
10. Device statuses update to STOCK_OUT_SOLD

### 4.7 Rental Outward Flow
1. Warehouse manager navigates to Outward section
2. Selects "Rental Dispatch" type
3. Enters customer name and rental reference
4. Selects devices from inventory
5. Enters shipping details
6. Submits outward record
7. System creates stock movement records
8. Device statuses update to STOCK_OUT_RENTAL

### 4.8 Rental Returns Reporting Flow
1. Warehouse manager navigates to Reports > Rental Returns
2. Selects date range filter
3. Optionally filters by customer or email reference ID
4. Views list of rental return batches with device statuses
5. Sees final grades (A/B) for QC-passed devices
6. Exports report to Excel/CSV if needed

---

## 5. Acceptance Criteria

### 5.1 Inward Module
- [ ] Batch creation generates unique batch ID in format BATCH-YYYY-NNNN
- [ ] Device barcode generated in format X-BRD-NNNN (X = category initial)
- [ ] Bulk upload accepts Excel files with device specifications
- [ ] Bulk upload reports success/failure counts and error details
- [ ] Stock movement record created for each device received

### 5.2 Inspection Module
- [ ] Barcode scanner successfully retrieves device information
- [ ] Multiple paint panels can be selected simultaneously
- [ ] Device routes correctly based on inspection findings
- [ ] Repair job created only when repair is actually required
- [ ] Paint panels created only when paint is required

### 5.3 Repair Module
- [ ] Maximum 10 active repairs per engineer enforced
- [ ] 5-day TAT calculated from repair start date
- [ ] Overdue devices highlighted in red
- [ ] QC rework items show failure context prominently
- [ ] "Collect from Paint" button appears only when all panels ready

### 5.4 Paint Module
- [ ] Only panels for devices with completed repairs shown
- [ ] Panel status progression: Awaiting -> In Paint -> Ready for Collection
- [ ] Automatic routing to QC when no repair required
- [ ] Ready panels trigger notification to repair engineer

### 5.5 QC Module
- [ ] Device must be in AWAITING_QC status to perform QC
- [ ] Grade assignment mandatory for passed devices (A or B only - no other options)
- [ ] Remarks mandatory for failed devices
- [ ] QC failure appends context to repair job
- [ ] Repair job closed when QC passes
- [ ] QC record stores inspection engineer and repair engineer names
- [ ] Attachments (photos/PDF) can be uploaded and stored
- [ ] Complete checklist results stored as JSON for future reference

### 5.6 Outward Module
- [ ] Only QC Passed (READY_FOR_STOCK) devices selectable for outward
- [ ] Sales outward requires customer and invoice number
- [ ] Rental outward requires customer and rental reference
- [ ] Shipping details captured (carrier, tracking, address)
- [ ] Packed By and Checked By users recorded
- [ ] Stock movement created for each device dispatched
- [ ] Device status updated to STOCK_OUT_SOLD or STOCK_OUT_RENTAL

### 5.7 Rental Returns Reporting
- [ ] Filter by date range
- [ ] Filter by customer
- [ ] Filter by email reference ID / thread ID
- [ ] Shows all device statuses in workflow
- [ ] Shows final grades for QC-passed devices
- [ ] Export to Excel/CSV functionality

### 5.8 Dashboard
- [ ] Device count by workflow stage
- [ ] TAT breach count (repairs > 5 days)
- [ ] QC pass/fail rates by engineer
- [ ] QC pass/fail rates by batch
- [ ] Stock snapshot by grade (A/B)
- [ ] Stock snapshot by category and location

### 5.9 General
- [ ] Role-based access control enforced on all routes
- [ ] Activity logging for all major actions with user, timestamp, previous/new values
- [ ] Page revalidation after mutations
- [ ] Responsive design for all pages
- [ ] Search by barcode, serial, customer, PO/Invoice, email reference

---

## 6. Business Rules

### 6.1 Workflow Rules

**BR-001**: A device cannot proceed to QC unless both repair (if required) and paint (if required) are completed.

**BR-002**: Paint panels should only be visible in paint shop after repair is completed (if repair was required).

**BR-003**: A repair engineer can have maximum 10 active (UNDER_REPAIR status) jobs simultaneously.

**BR-004**: TAT is calculated as 5 calendar days from when repair is started.

**BR-005**: When QC fails, the device must return to the repair station with complete QC context (remarks and checklist results).

**BR-006**: Repair job must be closed (REPAIR_CLOSED status) when QC passes to prevent it from showing in repair queue.

**BR-007**: When collecting from paint, if repair is not completed, device returns to repair station (not QC).

### 6.2 Barcode Rules

**BR-008**: Device barcodes follow format: [Category Initial]-[Brand First 3 Letters]-[4 Digit Random]
- Example: L-DEL-4521 (Laptop, Dell)

**BR-009**: Batch IDs follow format: BATCH-[Year]-[4 Digit Sequential]
- Example: BATCH-2025-0042

### 6.3 Grading Rules

**BR-010**: Only devices that pass QC receive a grade (A or B).

**BR-011**: Grade A indicates premium condition; Grade B indicates acceptable condition.

### 6.4 Outward Rules

**BR-012**: Only devices with status READY_FOR_STOCK can be selected for outward dispatch.

**BR-013**: Every outward dispatch must create a stock movement entry for audit trail.

**BR-014**: Sales outward updates device status to STOCK_OUT_SOLD.

**BR-015**: Rental outward updates device status to STOCK_OUT_RENTAL.

### 6.5 Spare Parts Rules

**BR-016**: When spares are issued, the spare parts inventory must decrease.

**BR-017**: Unused issued spares can be returned to stock by the repair engineer.

**BR-018**: Spare parts issuance must be linked to the specific repair job.

### 6.6 Audit Logging Rules

**BR-019**: All status changes must be logged with user, timestamp, previous value, and new value.

**BR-020**: All stock movements must be logged with from-location, to-location, and reference.

**BR-021**: All edits to device, repair job, or QC records must be logged.

### 6.7 Access Control Rules

**BR-022**: SUPERADMIN role has unrestricted access to all features.

**BR-023**: Users can only access pages permitted by their role.

**BR-024**: Deactivated users cannot log in to the system.

### 6.8 Repair Station Rules

**BR-025**: Multiple repair stations can be configured in the system.

**BR-026**: Maximum 10 active devices per repair station at any given time.

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Page load time < 3 seconds
- Barcode scan to device display < 1 second
- Bulk upload handles minimum 100 devices

### 7.2 Security
- Cookie-based authentication
- Role-based access control
- Password hashing for user accounts

### 7.3 Usability
- Mobile-responsive design
- Clear visual indicators for device status
- Consistent color coding for statuses

### 7.4 Reliability
- Activity logging for audit trail
- Data integrity maintained through database constraints
- Graceful error handling with user feedback

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **Inward Batch** | A group of devices received together from a single source |
| **TAT** | Turnaround Time - the expected completion time for repair |
| **QC** | Quality Control - final inspection before stock |
| **Rework** | Returning a device to repair after QC failure |
| **Grade** | Quality classification (A or B) assigned after QC pass |
| **Panel** | External device component requiring painting (Top Cover, Bottom Cover, etc.) |
| **Spares** | Replacement parts required for repair |
