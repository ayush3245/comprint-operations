# Comprint Operations - Database Documentation

This document provides comprehensive database schema documentation, entity relationships, and data management guidelines for the Comprint Operations system.

---

## 1. Database Overview

| Property | Value |
|----------|-------|
| **Database** | PostgreSQL 14+ |
| **ORM** | Prisma 7.0 |
| **Adapter** | @prisma/adapter-pg |
| **Schema Location** | `prisma/schema.prisma` |

### Connection Configuration

```typescript
// src/lib/db.ts
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
```

---

## 2. Entity Relationship Diagram

```
+---------------+       +---------------+       +---------------+
|    User       |       | InwardBatch   |       |    Device     |
+---------------+       +---------------+       +---------------+
| id (PK)       |<---+  | id (PK)       |<---+  | id (PK)       |
| email         |    |  | batchId       |    |  | barcode       |
| password      |    |  | type          |    |  | category      |
| name          |    +--| createdById   |    +--| inwardBatchId |
| role          |       | poInvoiceNo   |       | brand         |
| active        |       | supplier      |       | model         |
+---------------+       | customer      |       | cpu/ram/ssd   |
      |                 | rentalRef     |       | serial        |
      |                 +---------------+       | status        |
      |                                         | ownership     |
      |   +-------------------------------------| grade         |
      |   |     +-------------------------------| formFactor    |  (Server)
      |   |     |   +--------------------------| monitorSize   |  (Monitor)
      |   |     |   |   +----------------------| storageType   |  (Storage)
      |   |     |   |   |   +------------------| nicSpeed      |  (NIC)
      v   v     v   v   v   v                  +---------------+
+---------------+       +---------------+              |
|  RepairJob    |       |  PaintPanel   |              |
+---------------+       +---------------+              |
| id (PK)       |       | id (PK)       |<-------------+
| jobId         |       | deviceId (FK) |              |
| deviceId (FK) |<------| panelType     |              |
| inspEngId(FK) |       | status        |              v
| repairEngId   |       | technicianId  |       +---------------+
| reportedIssues|       +---------------+       |   QCRecord    |
| sparesRequired|                               +---------------+
| sparesIssued  |                               | id (PK)       |
| status        |                               | deviceId (FK) |
| notes         |                               | qcEngId (FK)  |
| tatDueDate    |                               | checklistRes  |
+---------------+                               | finalGrade    |
                                                | status        |
+---------------+       +---------------+       +---------------+
| StockMovement |       | OutwardRecord |
+---------------+       +---------------+       +---------------+
| id (PK)       |       | id (PK)       |       |  SparePart    |
| deviceId (FK) |       | outwardId     |       +---------------+
| type          |       | type          |       | id (PK)       |
| fromLocation  |       | customer      |       | partCode      |
| toLocation    |       | reference     |       | description   |
| reference     |       | devices[]     |       | category      |
| userId (FK)   |       | packedById    |       | currentStock  |
+---------------+       | checkedById   |       | minStock      |
                        +---------------+       | maxStock      |
+---------------+                               | binLocation   |
| ActivityLog   |                               +---------------+
+---------------+
| id (PK)       |
| action        |
| details       |
| userId (FK)   |
| metadata      |
+---------------+
```

---

## 3. Models Reference

### 3.1 User

Stores all system users with role-based access control.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| email | String | unique | User email address |
| password | String | required | Hashed password |
| name | String | required | Display name |
| role | Role | enum | Access role |
| active | Boolean | default: true | Account status |
| createdAt | DateTime | auto | Creation timestamp |
| updatedAt | DateTime | auto | Last update timestamp |

**Relations:**
- `createdBatches` → InwardBatch[] (batches created by user)
- `inspections` → RepairJob[] (as inspection engineer)
- `repairs` → RepairJob[] (as repair engineer)
- `paintWork` → PaintPanel[] (as paint technician)
- `qcInspections` → QCRecord[] (as QC engineer)
- `movements` → StockMovement[] (stock movements by user)
- `packedOutwards` → OutwardRecord[] (packed by user)
- `checkedOutwards` → OutwardRecord[] (checked by user)
- `activityLogs` → ActivityLog[] (user activities)

---

### 3.2 Device

Core entity representing IT assets being processed.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| barcode | String | unique | Tracking barcode (X-BRD-NNNN) |
| category | DeviceCategory | enum | Device type |
| brand | String | required | Manufacturer |
| model | String | required | Model name |
| serial | String? | optional | Serial number |
| ownership | Ownership | enum | Stock type |
| status | DeviceStatus | enum, default: RECEIVED | Workflow status |
| grade | Grade? | optional | Quality grade (after QC) |
| location | String? | optional | Rack/Bin location |

**Common Hardware Fields (Laptop/Desktop/Workstation):**
| Field | Type | Description |
|-------|------|-------------|
| cpu | String? | Processor specification |
| ram | String? | Memory specification |
| ssd | String? | Storage specification |
| gpu | String? | Graphics specification |
| screenSize | String? | Display size |

**Server-Specific Fields:**
| Field | Type | Description |
|-------|------|-------------|
| formFactor | String? | e.g., 1U rack, 2U rack, Tower |
| raidController | String? | e.g., P408i-a, RAID 5 |
| networkPorts | String? | e.g., 4x 1GbE + 2x 10GbE |

**Monitor-Specific Fields:**
| Field | Type | Description |
|-------|------|-------------|
| monitorSize | String? | e.g., 24 inch |
| resolution | String? | e.g., 1920x1080 |
| panelType | String? | e.g., IPS, TN, VA |
| refreshRate | String? | e.g., 75Hz, 144Hz |
| monitorPorts | String? | e.g., HDMI + DisplayPort + VGA |

**Storage-Specific Fields:**
| Field | Type | Description |
|-------|------|-------------|
| storageType | String? | HDD / SSD / NVMe |
| capacity | String? | e.g., 1TB, 500GB |
| storageFormFactor | String? | e.g., 2.5", 3.5", M.2 |
| interface | String? | e.g., SATA, SAS, PCIe Gen4 |
| rpm | String? | e.g., 7200 RPM (HDD only) |

**Networking Card-Specific Fields:**
| Field | Type | Description |
|-------|------|-------------|
| nicSpeed | String? | e.g., 10GbE, 25GbE |
| portCount | String? | e.g., 2-port, 4-port |
| connectorType | String? | e.g., RJ45, SFP+, QSFP+ |
| nicInterface | String? | e.g., PCIe x8 |
| bracketType | String? | e.g., Low Profile / Full Height |

**Workflow Flags:**
| Field | Type | Description |
|-------|------|-------------|
| repairRequired | Boolean | Set during inspection |
| paintRequired | Boolean | Set during inspection |
| repairCompleted | Boolean | Set when repair done |
| paintCompleted | Boolean | Set when paint done |

**References:**
| Field | Type | Description |
|-------|------|-------------|
| poInvoiceNo | String? | For Refurb purchases |
| rentalRef | String? | For Rental returns |
| conditionNotes | String? | General notes |

---

### 3.3 InwardBatch

Groups devices received together from a single source.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| batchId | String | unique | Human readable ID (BATCH-YYYY-NNNN) |
| type | InwardType | enum | Refurb or Rental |
| date | DateTime | auto | Receipt date |
| poInvoiceNo | String? | optional | PO/Invoice for Refurb |
| supplier | String? | optional | Supplier name |
| customer | String? | optional | Customer for Rental |
| rentalRef | String? | optional | Rental reference |
| emailSubject | String? | optional | Email subject |
| emailThreadId | String? | optional | Email thread ID |
| createdById | String | FK | User who created batch |

---

### 3.4 RepairJob

Tracks repair work on devices.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| jobId | String | unique | Job reference number |
| deviceId | String | FK | Device being repaired |
| inspectionEngId | String? | FK | Inspector who created job |
| repairEngId | String? | FK | Assigned repair engineer |
| reportedIssues | String? | JSON/text | Issues found during inspection |
| rootCause | String? | optional | Identified root cause |
| sparesRequired | String? | JSON | Parts needed |
| sparesIssued | String? | JSON | Parts issued |
| station | String? | optional | Repair station assigned |
| repairStartDate | DateTime? | optional | When repair started |
| repairEndDate | DateTime? | optional | When repair completed |
| tatDueDate | DateTime? | optional | TAT deadline (5 days from start) |
| status | RepairStatus | enum | Current repair status |
| notes | String? | optional | Repair notes |

---

### 3.5 PaintPanel

Tracks individual panels requiring painting.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| deviceId | String | FK | Parent device |
| panelType | String | required | e.g., Top Cover, Bottom Cover |
| status | PaintStatus | enum | Paint progress |
| technicianId | String? | FK | Assigned technician |
| startedAt | DateTime? | optional | When paint started |
| completedAt | DateTime? | optional | When paint completed |

---

### 3.6 QCRecord

Quality control inspection records.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| deviceId | String | FK | Device inspected |
| qcEngId | String | FK | QC engineer |
| inspectionEngName | String? | optional | Inspector name snapshot |
| repairEngName | String? | optional | Repair engineer name snapshot |
| checklistResults | String? | JSON | Detailed checklist data |
| attachments | String? | JSON | Photo/document URLs |
| remarks | String? | optional | QC notes |
| finalGrade | Grade | enum | A or B |
| status | QCStatus | enum | PASSED or FAILED_REWORK |
| completedAt | DateTime | auto | Inspection timestamp |

**Checklist Structure (JSON):**
```json
{
  "functional": {
    "powerOn": true,
    "display": true,
    "keyboard": true,
    "touchpad": true,
    "usb": true,
    "hdmi": true,
    "wifi": true,
    "bluetooth": true,
    "lan": true,
    "audio": true,
    "battery": true,
    "adapter": true,
    "fan": true,
    "thermal": true,
    "stress": true
  },
  "cosmetic": {
    "topCover": true,
    "bottomCover": true,
    "palmrest": true,
    "bezel": true,
    "paintFinish": true,
    "logo": true,
    "stickers": true
  },
  "notes": "Additional remarks"
}
```

---

### 3.7 SparePart

Spare parts inventory management.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| partCode | String | unique | Part SKU |
| description | String | required | Part description |
| category | String | required | Part category |
| compatibleModels | String? | CSV/JSON | Compatible device models |
| minStock | Int | default: 0 | Minimum stock threshold |
| maxStock | Int | default: 100 | Maximum stock level |
| currentStock | Int | default: 0 | Current quantity |
| binLocation | String? | optional | Storage location |

---

### 3.8 StockMovement

Audit trail for all stock movements.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| deviceId | String | FK | Device moved |
| type | MovementType | enum | Movement type |
| fromLocation | String? | optional | Source location |
| toLocation | String? | optional | Destination location |
| reference | String? | optional | Batch ID, Invoice, etc. |
| userId | String | FK | User who performed movement |
| date | DateTime | auto | Movement timestamp |

---

### 3.9 OutwardRecord

Dispatch records for sales and rentals.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| outwardId | String | unique | Dispatch reference |
| type | OutwardType | enum | SALES or RENTAL |
| customer | String | required | Customer name |
| reference | String | required | Invoice/Rental reference |
| date | DateTime | auto | Dispatch date |
| shippingDetails | String? | optional | Carrier, tracking, address |
| packedById | String? | FK | User who packed |
| checkedById | String? | FK | User who verified |

---

### 3.10 ActivityLog

Audit trail for all system actions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| action | String | required | Action type (e.g., CREATED_INWARD) |
| details | String? | optional | Human-readable description |
| userId | String | FK | User who performed action |
| metadata | String? | JSON | Additional data |
| createdAt | DateTime | auto | Action timestamp |

---

## 4. Enumerations

### 4.1 Role
```prisma
enum Role {
  SUPERADMIN              // Full system access
  ADMIN                   // Administrative access
  MIS_WAREHOUSE_EXECUTIVE // Inward processing
  WAREHOUSE_MANAGER       // Inventory management
  INSPECTION_ENGINEER     // Device inspection
  REPAIR_ENGINEER         // Repair work
  PAINT_SHOP_TECHNICIAN   // Paint operations
  QC_ENGINEER             // Quality control
}
```

### 4.2 DeviceCategory
```prisma
enum DeviceCategory {
  LAPTOP           // Portable computers
  DESKTOP          // Desktop computers
  WORKSTATION      // High-performance workstations
  SERVER           // Server hardware
  MONITOR          // Display monitors
  STORAGE          // Storage devices (HDD/SSD)
  NETWORKING_CARD  // Network interface cards
}
```

### 4.3 DeviceStatus
```prisma
enum DeviceStatus {
  RECEIVED            // Initial state on inward
  PENDING_INSPECTION  // Awaiting inspection
  WAITING_FOR_SPARES  // Needs spare parts
  READY_FOR_REPAIR    // Ready for repair engineer
  UNDER_REPAIR        // Being repaired
  IN_PAINT_SHOP       // Paint work in progress
  AWAITING_QC         // Ready for quality check
  QC_PASSED           // Passed QC (transitional)
  QC_FAILED_REWORK    // Failed QC, needs rework
  READY_FOR_STOCK     // Ready for inventory
  STOCK_OUT_SOLD      // Sold and dispatched
  STOCK_OUT_RENTAL    // Rented and dispatched
  SCRAPPED            // Written off
}
```

### 4.4 Ownership
```prisma
enum Ownership {
  REFURB_STOCK   // Purchased for refurbishment
  RENTAL_RETURN  // Returned from rental
}
```

### 4.5 InwardType
```prisma
enum InwardType {
  REFURB_PURCHASE  // New stock purchase
  RENTAL_RETURN    // Customer rental return
}
```

### 4.6 RepairStatus
```prisma
enum RepairStatus {
  PENDING_INSPECTION  // Created, awaiting action
  WAITING_FOR_SPARES  // Needs parts
  READY_FOR_REPAIR    // Ready to start
  UNDER_REPAIR        // In progress
  IN_PAINT_SHOP       // Waiting for paint
  AWAITING_QC         // Repair done, at QC
  REPAIR_CLOSED       // QC passed, complete
}
```

### 4.7 PaintStatus
```prisma
enum PaintStatus {
  AWAITING_PAINT       // In queue
  IN_PAINT             // Being painted
  READY_FOR_COLLECTION // Done, awaiting pickup
  FITTED               // Installed on device
}
```

### 4.8 QCStatus
```prisma
enum QCStatus {
  PASSED        // Device passed QC
  FAILED_REWORK // Device needs rework
}
```

### 4.9 Grade
```prisma
enum Grade {
  A  // Premium condition
  B  // Acceptable condition
}
```

### 4.10 MovementType
```prisma
enum MovementType {
  INWARD           // Received into warehouse
  MOVE             // Location transfer
  SALES_OUTWARD    // Sold dispatch
  RENTAL_OUTWARD   // Rental dispatch
  RETURN_TO_VENDOR // Returned to supplier
  SCRAP            // Written off
}
```

### 4.11 OutwardType
```prisma
enum OutwardType {
  SALES   // Sale dispatch
  RENTAL  // Rental dispatch
}
```

---

## 5. Workflow State Transitions

### 5.1 Device Status Flow

```
                    +------------------+
                    |     RECEIVED     |
                    +--------+---------+
                             |
                    +--------v---------+
                    | PENDING_INSPECTION|
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v--------+ +--------v--------+ +--------v--------+
|WAITING_FOR_SPARES| |READY_FOR_REPAIR | | IN_PAINT_SHOP   |
+--------+--------+ +--------+--------+ +--------+--------+
         |                   |                   |
         +-------------------+                   |
                    |                            |
            +-------v-------+                    |
            | UNDER_REPAIR  |                    |
            +-------+-------+                    |
                    |                            |
         +----------+----------+                 |
         |                     |                 |
+--------v--------+   +--------v--------+        |
| IN_PAINT_SHOP   |   | AWAITING_QC     |<-------+
+--------+--------+   +--------+--------+
         |                     |
         +----------+----------+
                    |
            +-------v-------+
            |  AWAITING_QC  |
            +-------+-------+
                    |
         +----------+----------+
         |                     |
+--------v--------+   +--------v--------+
|    QC_PASSED    |   |QC_FAILED_REWORK |
+--------+--------+   +--------+--------+
         |                     |
+--------v--------+            |
| READY_FOR_STOCK |            |
+--------+--------+            |
         |                     |
+--------+--------+            |
| STOCK_OUT_SOLD  |   +--------v--------+
| STOCK_OUT_RENTAL|   | READY_FOR_REPAIR|
+-----------------+   +-----------------+
```

### 5.2 RepairJob Status Flow

```
PENDING_INSPECTION → WAITING_FOR_SPARES → READY_FOR_REPAIR
                                      ↓
                               UNDER_REPAIR
                                      ↓
                   +------------------+------------------+
                   ↓                                     ↓
            IN_PAINT_SHOP                          AWAITING_QC
                   ↓                                     ↓
            AWAITING_QC ─────────────────────────→ REPAIR_CLOSED
```

### 5.3 PaintPanel Status Flow

```
AWAITING_PAINT → IN_PAINT → READY_FOR_COLLECTION → FITTED
```

---

## 6. Database Commands

### 6.1 Development Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes (development)
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Seed database
npm run seed

# Open Prisma Studio
npx prisma studio

# Reset database (CAUTION: destroys data)
npx prisma migrate reset
```

### 6.2 Environment Variables

```env
# Database connection
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

---

## 7. Indexing Strategy

### Recommended Indexes

```sql
-- Frequently queried columns
CREATE INDEX idx_device_barcode ON "Device" (barcode);
CREATE INDEX idx_device_status ON "Device" (status);
CREATE INDEX idx_device_category ON "Device" (category);
CREATE INDEX idx_device_inward_batch ON "Device" ("inwardBatchId");

-- Repair job queries
CREATE INDEX idx_repairjob_status ON "RepairJob" (status);
CREATE INDEX idx_repairjob_device ON "RepairJob" ("deviceId");
CREATE INDEX idx_repairjob_engineer ON "RepairJob" ("repairEngId");

-- Paint panel queries
CREATE INDEX idx_paintpanel_status ON "PaintPanel" (status);
CREATE INDEX idx_paintpanel_device ON "PaintPanel" ("deviceId");

-- Activity log queries
CREATE INDEX idx_activitylog_user ON "ActivityLog" ("userId");
CREATE INDEX idx_activitylog_created ON "ActivityLog" ("createdAt");
```

---

## 8. Data Integrity Rules

### 8.1 Constraints

1. **Device barcode must be unique** - Enforced by database unique constraint
2. **Batch ID must be unique** - Enforced by database unique constraint
3. **User email must be unique** - Enforced by database unique constraint
4. **Part code must be unique** - Enforced by database unique constraint

### 8.2 Business Rules (Application-Enforced)

1. Maximum 10 active repair jobs per engineer
2. Grade can only be set when QC status is PASSED
3. Only READY_FOR_STOCK devices can be dispatched
4. Paint panels only shown after repair is complete (if repair required)

---

## 9. Backup and Recovery

### 9.1 Backup Strategy

```bash
# PostgreSQL backup
pg_dump -h host -U user -d database > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h host -U user -d database < backup_20241201.sql
```

### 9.2 Data Retention

- Activity logs: Retained indefinitely for audit purposes
- Stock movements: Retained indefinitely for audit purposes
- Completed repair jobs: Retained indefinitely
- QC records: Retained indefinitely

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12 | Initial schema with core models |
| 1.1.0 | 2025-12 | Added Server, Monitor, Storage, Networking Card categories |
| 1.1.1 | 2025-12 | Added category-specific fields to Device model |
