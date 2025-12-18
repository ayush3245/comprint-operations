# Comprint Operations - Technical Design Document

## 1. High-Level Architecture

### 1.1 System Overview

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|   Web Browser    |<--->|   Next.js App    |<--->|   PostgreSQL     |
|   (Client)       |     |   (Server)       |     |   (Database)     |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
                               |
                               |
                         +-----+-----+
                         |           |
                    +----+----+ +----+----+
                    |         | |         |
                    | Server  | | Server  |
                    | Actions | | Comps   |
                    |         | |         |
                    +---------+ +---------+
```

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React | 19.2.0 |
| **Framework** | Next.js | 16.0.7 (Turbopack) |
| **Styling** | Tailwind CSS | 4.0.0 |
| **Animations** | Framer Motion | 12.23.24 |
| **Icons** | Lucide React | 0.554.0 |
| **Charts** | Recharts | 3.5.1 |
| **ORM** | Prisma | 7.0.0 |
| **Database** | PostgreSQL | 14+ |
| **DB Adapter** | @prisma/adapter-pg | 7.0.0 |
| **Barcode Gen** | JsBarcode | 3.12.1 |
| **Barcode Scan** | @zxing/library | 0.21.3 |
| **PDF Gen** | jsPDF | 3.0.4 |
| **PDF Parse** | pdfjs-dist | 5.4.449 |
| **Excel** | xlsx (SheetJS) | 0.18.5 |
| **Email** | Resend | 6.5.2 |
| **Language** | TypeScript | 5.x |

### 1.3 Design Patterns

**Server-Side Rendering (SSR)**
- All pages are server components by default
- Data fetching happens on the server
- Reduces client-side JavaScript bundle

**Server Actions**
- Form submissions handled via 'use server' functions
- Direct database mutations without API routes
- Automatic form validation and error handling

**Singleton Pattern**
- Prisma client instantiated once globally
- Prevents connection exhaustion in development

---

## 2. Database Design

### 2.1 Entity Relationship Diagram

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
| createdAt     |       | customer      |       | cpu           |
| updatedAt     |       | rentalRef     |       | ram           |
+---------------+       +---------------+       | ssd           |
      |                                         | gpu           |
      |   +-------------------------------------| screenSize    |
      |   |     +-------------------------------| serial        |
      |   |     |   +--------------------------| status        |
      |   |     |   |   +----------------------| ownership     |
      |   |     |   |   |                      | grade         |
      |   |     |   |   |                      | repairRequired|
      v   v     v   v   v                      | paintRequired |
+---------------+       +---------------+       | repairCompleted
|  RepairJob    |       |  PaintPanel   |       | paintCompleted|
+---------------+       +---------------+       +---------------+
| id (PK)       |       | id (PK)       |              |
| jobId         |       | deviceId (FK) |<-------------+
| deviceId (FK) |<------| panelType     |              |
| inspEngId(FK) |       | status        |              |
| repairEngId   |       | technicianId  |              v
| reportedIssues|       | startedAt     |       +---------------+
| sparesRequired|       | completedAt   |       |   QCRecord    |
| sparesIssued  |       +---------------+       +---------------+
| status        |                               | id (PK)       |
| notes         |                               | deviceId (FK) |
| tatDueDate    |                               | qcEngId (FK)  |
+---------------+                               | checklistRes  |
                                                | remarks       |
+---------------+       +---------------+       | finalGrade    |
| StockMovement |       | OutwardRecord |       | status        |
+---------------+       +---------------+       +---------------+
| id (PK)       |       | id (PK)       |
| deviceId (FK) |       | outwardId     |
| type          |       | type          |
| fromLocation  |       | customer      |
| toLocation    |       | reference     |
| reference     |       | packedById    |
| userId (FK)   |       | checkedById   |
| date          |       | devices[]     |
+---------------+       +---------------+

+---------------+       +---------------+
|  SparePart    |       | ActivityLog   |
+---------------+       +---------------+
| id (PK)       |       | id (PK)       |
| partCode      |       | action        |
| description   |       | details       |
| category      |       | userId (FK)   |
| minStock      |       | metadata      |
| maxStock      |       | createdAt     |
| currentStock  |       +---------------+
| binLocation   |
+---------------+
```

### 2.2 Enumerations

**Device Status Flow**
```
RECEIVED --> PENDING_INSPECTION --> WAITING_FOR_SPARES
                                 --> READY_FOR_REPAIR
                                 --> IN_PAINT_SHOP
                                 --> AWAITING_QC

READY_FOR_REPAIR --> UNDER_REPAIR --> IN_PAINT_SHOP --> AWAITING_QC
                                  --> AWAITING_QC

AWAITING_QC --> QC_PASSED --> READY_FOR_STOCK --> STOCK_OUT_SOLD
                                              --> STOCK_OUT_RENTAL
           --> QC_FAILED_REWORK --> READY_FOR_REPAIR
```

**RepairJob Status**
```typescript
enum RepairStatus {
  PENDING_INSPECTION    // Initial state after device received
  WAITING_FOR_SPARES    // Awaiting spare parts
  READY_FOR_REPAIR      // Spares issued, ready for engineer
  UNDER_REPAIR          // Engineer actively working
  IN_PAINT_SHOP         // Repair done, awaiting paint
  AWAITING_QC           // All work done, ready for QC
  REPAIR_CLOSED         // QC passed, job complete
}
```

**PaintPanel Status**
```typescript
enum PaintStatus {
  AWAITING_PAINT         // Panel queued for painting
  IN_PAINT               // Actively being painted
  READY_FOR_COLLECTION   // Painting done, ready for pickup
  FITTED                 // Installed back on device
}
```

### 2.3 Key Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| User -> InwardBatch | 1:N | User creates batches |
| InwardBatch -> Device | 1:N | Batch contains devices |
| Device -> RepairJob | 1:N | Device can have multiple repair jobs |
| Device -> PaintPanel | 1:N | Device can have multiple panels |
| Device -> QCRecord | 1:N | Device can have multiple QC attempts |
| User -> RepairJob | 1:N | Engineer assigned to jobs |
| User -> PaintPanel | 1:N | Technician assigned to panels |
| User -> QCRecord | 1:N | QC engineer performs inspections |

---

## 3. Application Architecture

### 3.1 Directory Structure

```
comprint-operations/
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── clear-data.js          # Data reset utility
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with sidebar
│   │   ├── page.tsx           # Root redirect
│   │   ├── login/             # Authentication
│   │   ├── dashboard/         # Main dashboard
│   │   ├── inward/            # Inward management
│   │   │   ├── page.tsx       # Batch list
│   │   │   ├── new/           # Create batch
│   │   │   └── [id]/          # Batch details
│   │   ├── inspection/        # Device inspection
│   │   │   ├── page.tsx       # Scanner interface
│   │   │   └── [barcode]/     # Inspection form
│   │   ├── spares/            # Spare parts management
│   │   ├── repair/            # L2 Repair station
│   │   ├── l3-repair/         # L3 Repair (complex issues)
│   │   ├── display-repair/    # Display/screen repairs
│   │   ├── battery/           # Battery boost station
│   │   ├── paint/             # Paint shop
│   │   ├── qc/                # Quality control
│   │   │   ├── page.tsx       # Scanner interface
│   │   │   └── [barcode]/     # QC form
│   │   ├── inventory/         # Stock management
│   │   ├── reports/           # Reports
│   │   │   └── rental-returns/
│   │   └── admin/
│   │       └── users/         # User management
│   ├── components/
│   │   ├── Sidebar.tsx              # Navigation
│   │   ├── BarcodeScanner.tsx       # Camera/image barcode scanner
│   │   ├── BarcodePrintButton.tsx   # Print labels
│   │   ├── DynamicDeviceForm.tsx    # Category-aware device form
│   │   ├── Providers.tsx            # Toast/popup context provider
│   │   ├── ThemeProvider.tsx        # Dark/light mode provider
│   │   ├── ThemeToggle.tsx          # Theme switcher component
│   │   └── ui/
│   │       ├── Toast.tsx            # Confirmation popup component
│   │       └── GlassCard.tsx        # Animated glass-morphism card
│   └── lib/
│       ├── actions.ts         # Server actions
│       ├── auth.ts            # Authentication
│       ├── db.ts              # Prisma client
│       ├── activity.ts        # Audit logging
│       └── utils.ts           # Utilities
└── public/
```

### 3.2 Route Access Control

| Route | Allowed Roles |
|-------|---------------|
| `/login` | Public |
| `/dashboard` | All authenticated |
| `/inward/*` | MIS_WAREHOUSE_EXECUTIVE, WAREHOUSE_MANAGER, ADMIN |
| `/inspection/*` | INSPECTION_ENGINEER, ADMIN |
| `/spares` | WAREHOUSE_MANAGER, ADMIN |
| `/repair` | L2_ENGINEER, ADMIN |
| `/l3-repair` | L3_ENGINEER, ADMIN |
| `/display-repair` | DISPLAY_TECHNICIAN, ADMIN |
| `/battery` | BATTERY_TECHNICIAN, ADMIN |
| `/paint` | PAINT_SHOP_TECHNICIAN, ADMIN |
| `/qc/*` | QC_ENGINEER, ADMIN |
| `/inventory` | WAREHOUSE_MANAGER, ADMIN |
| `/outward/*` | WAREHOUSE_MANAGER, ADMIN |
| `/reports/*` | WAREHOUSE_MANAGER, ADMIN |
| `/admin/*` | ADMIN |

*Note: SUPERADMIN has access to all routes. REPAIR_ENGINEER is deprecated in favor of L2_ENGINEER.*

---

## 4. Sequence Diagrams

### 4.1 Device Inspection Flow

```
Inspector          Browser           Server Action       Database
    |                 |                    |                 |
    |--Scan Barcode-->|                    |                 |
    |                 |--GET /inspection/[barcode]---------->|
    |                 |<---------------Device Data-----------|
    |<--Display Form--|                    |                 |
    |                 |                    |                 |
    |--Submit Form--->|                    |                 |
    |                 |--submitInspection()--------------->  |
    |                 |                    |--Update Device--|
    |                 |                    |--Create RepairJob (if needed)
    |                 |                    |--Create PaintPanels (if needed)
    |                 |                    |<----Success-----|
    |                 |<--revalidatePath---|                 |
    |<--Redirect------|                    |                 |
```

### 4.2 QC Pass/Fail Flow

```
QC Engineer        Browser           Server Action       Database
    |                 |                    |                 |
    |--Scan Device--->|                    |                 |
    |                 |--GET /qc/[barcode]----------------->|
    |                 |<---------------Device + History------|
    |<--Display Form--|                    |                 |
    |                 |                    |                 |
    |--Submit QC----->|                    |                 |
    |                 |--submitQC()------------------------>|
    |                 |                    |                 |
    |                 |   [IF PASSED]      |                 |
    |                 |                    |--Create QCRecord|
    |                 |                    |--Update Device (READY_FOR_STOCK)
    |                 |                    |--Close RepairJob|
    |                 |                    |                 |
    |                 |   [IF FAILED]      |                 |
    |                 |                    |--Create QCRecord|
    |                 |                    |--Update Device (READY_FOR_REPAIR)
    |                 |                    |--Reopen RepairJob with notes
    |                 |                    |                 |
    |                 |<--revalidatePath---|                 |
    |<--Redirect------|                    |                 |
```

### 4.3 Paint Panel Send and Collect Flow

```
L2 Engineer        Paint Tech        Server Action       Database
    |                 |                    |                 |
    |--Send to Paint->|                    |                 |
    |                 |--sendPanelsToPaint()--------------->|
    |                 |                    |--Create PaintPanel records
    |                 |                    |--Set paintRequired=true
    |                 |                    |                 |
    |                 |--Mark In Paint--->|                 |
    |                 |--updatePanelStatus()--------------->|
    |                 |                    |--Update Panel status
    |                 |                    |                 |
    |                 |--Mark Ready------>|                 |
    |                 |--updatePanelStatus()--------------->|
    |                 |                    |--Update Panel---|
    |                 |                    |--Check All Panels Ready
    |                 |                    |                 |
    |<--Panel Ready Notification-------------------------|
    |                 |                    |                 |
    |--Collect from Paint--------------->|                 |
    |                 |--collectFromPaint()--------------->|
    |                 |                    |--Update Panels to FITTED
    |                 |                    |--Set paintCompleted=true
    |                 |                    |--Check Repair Status
    |                 |                    |                 |
    |                 |   [REPAIR COMPLETED]                |
    |                 |                    |--Move to AWAITING_QC
    |                 |   [REPAIR NOT DONE]                 |
    |                 |                    |--Move to UNDER_REPAIR
```

**Note:** Paint panels are created by L2 Engineer using `sendPanelsToPaint()`, NOT during inspection.
Inspection only saves paint panel recommendations in the RepairJob record.

**Legacy Data Migration:** For devices created before this workflow change (where inspection auto-created paint panels), use the migration tool at `/admin/migrations` to:
- Delete orphaned paint panels that were auto-created at inspection
- Reset paintRequired/paintCompleted flags on affected devices

### 4.4 Sales Outward Flow

```
Warehouse Mgr      Browser           Server Action       Database
    |                 |                    |                 |
    |--Create Outward->|                   |                 |
    |                 |--GET /outward/new----------------->|
    |                 |<---------READY_FOR_STOCK Devices----|
    |<--Display Form--|                    |                 |
    |                 |                    |                 |
    |--Select Devices->|                   |                 |
    |--Enter Details-->|                   |                 |
    |--Submit-------->|                    |                 |
    |                 |--createOutward()------------------>|
    |                 |                    |--Create OutwardRecord
    |                 |                    |--For Each Device:
    |                 |                    |   --Update Status STOCK_OUT_SOLD
    |                 |                    |   --Create StockMovement
    |                 |                    |<----Success-----|
    |                 |<--revalidatePath---|                 |
    |<--Redirect------|                    |                 |
```

---

## 5. API Specification (Server Actions)

### 5.1 Inward Actions

#### `createInwardBatch(data)`
Creates a new inward batch.

**Input:**
```typescript
{
  type: 'REFURB_PURCHASE' | 'RENTAL_RETURN'
  poInvoiceNo?: string    // For refurb
  supplier?: string       // For refurb
  customer?: string       // For rental
  rentalRef?: string      // For rental
}
```

**Output:** `InwardBatch` object

**Side Effects:**
- Generates batch ID (BATCH-YYYY-NNNN)
- Creates activity log entry

---

#### `addDeviceToBatch(batchId, data)`
Adds a device to an existing batch.

**Input:**
```typescript
{
  category: 'LAPTOP' | 'DESKTOP' | 'WORKSTATION' | 'SERVER' | 'MONITOR' | 'STORAGE' | 'NETWORKING_CARD'
  brand: string
  model: string
  // Common fields (Laptop/Desktop/Workstation)
  cpu?: string
  ram?: string
  ssd?: string
  gpu?: string
  screenSize?: string
  // Server-specific
  formFactor?: string       // e.g., 1U rack, 2U rack, Tower
  raidController?: string   // e.g., P408i-a, RAID 5
  networkPorts?: string     // e.g., 4x 1GbE + 2x 10GbE
  // Monitor-specific
  monitorSize?: string      // e.g., 24 inch
  resolution?: string       // e.g., 1920x1080
  panelType?: string        // e.g., IPS, TN, VA
  refreshRate?: string      // e.g., 75Hz, 144Hz
  monitorPorts?: string     // e.g., HDMI + DisplayPort + VGA
  // Storage-specific
  storageType?: string      // HDD / SSD / NVMe
  capacity?: string         // e.g., 1TB, 500GB
  storageFormFactor?: string // e.g., 2.5", 3.5", M.2
  interface?: string        // e.g., SATA, SAS, PCIe Gen4
  rpm?: string              // e.g., 7200 RPM (HDD only)
  // Networking Card-specific
  nicSpeed?: string         // e.g., 10GbE, 25GbE
  portCount?: string        // e.g., 2-port, 4-port
  connectorType?: string    // e.g., RJ45, SFP+, QSFP+
  nicInterface?: string     // e.g., PCIe x8
  bracketType?: string      // e.g., Low Profile / Full Height
  // Common
  serial?: string
  ownership: 'REFURB_STOCK' | 'RENTAL_RETURN'
}
```

**Output:** `Device` object with generated barcode

**Side Effects:**
- Generates barcode (X-BRD-NNNN)
- Creates stock movement record (INWARD)

---

#### `bulkUploadDevices(batchId, devices[])`
Bulk imports devices from Excel data.

**Output:**
```typescript
{
  success: number
  failed: number
  errors: Array<{ row: number, error: string, data: any }>
}
```

---

### 5.2 Inspection Actions

#### `submitInspection(deviceId, data)`
Submits inspection findings and routes device.

**Input:**
```typescript
{
  inspectionEngId: string
  reportedIssues: string
  cosmeticIssues: string
  paintRequired: boolean
  paintPanels: string[]
  sparesRequired: string
}
```

**Routing Logic:**
1. If spares required → WAITING_FOR_SPARES
2. Else if repair needed → READY_FOR_REPAIR
3. Else if paint only → IN_PAINT_SHOP
4. Else → AWAITING_QC

**Side Effects:**
- Creates RepairJob if repair needed
- Saves paint panel recommendations (does NOT create PaintPanel records)
- Updates device workflow flags
- Creates activity log

**Note:** Paint panels are only created when L2 Engineer explicitly sends them to paint shop using `sendPanelsToPaint()`. Inspection only saves recommendations.

---

### 5.3 Repair Actions

#### `startRepair(jobId, userId)`
Assigns repair job to engineer.

**Constraints:**
- Max 10 active jobs per engineer

**Side Effects:**
- Sets TAT due date (5 days from now)
- Updates device status to UNDER_REPAIR

---

#### `completeRepair(jobId, notes)`
Marks repair as complete.

**Routing Logic:**
1. If paint required and not done → IN_PAINT_SHOP
2. Else → AWAITING_QC

**Side Effects:**
- Sets repairCompleted flag on device
- Creates activity log

---

#### `collectFromPaint(jobId)`
Collects device from paint shop.

**Routing Logic:**
1. If repair not completed → UNDER_REPAIR
2. Else → AWAITING_QC

**Side Effects:**
- Updates all panels to FITTED
- Sets paintCompleted flag

---

### 5.4 QC Actions

#### `submitQC(deviceId, data)`
Submits QC inspection result.

**Input:**
```typescript
{
  qcEngId: string
  checklistResults: string   // JSON
  remarks: string
  finalGrade: 'A' | 'B' | null
  status: 'PASSED' | 'FAILED_REWORK'
}
```

**On PASSED:**
- Device → READY_FOR_STOCK
- RepairJob → REPAIR_CLOSED
- Grade assigned to device

**On FAILED:**
- Device → READY_FOR_REPAIR
- repairCompleted = false
- QC context appended to RepairJob notes

---

### 5.5 Outward Actions

#### `createOutward(data)`
Creates an outward dispatch record.

**Input:**
```typescript
{
  type: 'SALES' | 'RENTAL'
  customer: string
  reference: string        // Invoice No or Rental Ref
  deviceIds: string[]      // Array of device IDs
  shippingDetails: string  // Address, carrier, tracking
  packedById: string
  checkedById: string
}
```

**Constraints:**
- All devices must have status READY_FOR_STOCK
- packedById and checkedById should be different users (dual verification)

**Side Effects:**
- Creates OutwardRecord
- Updates each device status to STOCK_OUT_SOLD or STOCK_OUT_RENTAL
- Creates StockMovement for each device
- Creates activity log

---

### 5.6 QC Checklist Structure

The QC checklist is stored as JSON in `checklistResults`:

```typescript
interface QCChecklist {
  functional: {
    powerOn: boolean           // Power-on & boot sequence
    display: boolean           // Display quality
    keyboard: boolean          // All keys functional
    touchpad: boolean          // Touchpad/trackpoint
    usb: boolean              // USB ports
    hdmi: boolean             // HDMI/display ports
    wifi: boolean             // Wi-Fi connectivity
    bluetooth: boolean        // Bluetooth
    lan: boolean              // Ethernet port
    audio: boolean            // Audio jack/speakers
    battery: boolean          // Battery health (if applicable)
    adapter: boolean          // Adapter/charging
    fan: boolean              // Fan noise acceptable
    thermal: boolean          // Thermal performance
    stress: boolean           // Stress test passed
  }
  cosmetic: {
    topCover: boolean         // Top cover condition
    bottomCover: boolean      // Bottom cover
    palmrest: boolean         // Palm rest
    bezel: boolean            // Screen bezel
    paintFinish: boolean      // Paint quality
    logo: boolean             // Logo intact
    stickers: boolean         // Required stickers present
  }
  notes: string               // Additional remarks
}
```

**Attachments Storage:**
```typescript
interface QCAttachments {
  photos: string[]            // Array of file URLs
  documents: string[]         // PDF reports, screenshots
}
```

---

## 6. Component Architecture

### 6.1 Theme System

**ThemeProvider:** `src/components/ThemeProvider.tsx`

The application supports light and dark mode with system preference detection.

**CSS Custom Properties:** `src/app/globals.css`

```css
:root {
  /* Light mode defaults */
  --color-foreground: theme(colors.slate.900);
  --color-muted-foreground: theme(colors.slate.600);
  --color-background: theme(colors.slate.50);
  --color-card: theme(colors.white);
  --color-muted: theme(colors.slate.100);
  --color-border: theme(colors.slate.200);
  --shadow-soft: 0 2px 8px -2px rgba(0, 0, 0, 0.08);
}

.dark {
  --color-foreground: theme(colors.slate.100);
  --color-muted-foreground: theme(colors.slate.400);
  --color-background: theme(colors.slate.950);
  --color-card: theme(colors.slate.900);
  --color-muted: theme(colors.slate.800);
  --color-border: theme(colors.slate.700);
  --shadow-soft: 0 2px 8px -2px rgba(0, 0, 0, 0.3);
}
```

**Semantic Utility Classes:**
- `text-foreground` - Primary text color
- `text-muted-foreground` - Secondary/muted text
- `bg-card` - Card backgrounds
- `bg-muted` - Muted backgrounds
- `border-default` - Standard borders
- `shadow-soft` - Subtle elevation

**ThemeToggle:** `src/components/ThemeToggle.tsx`

Provides a toggle button in the sidebar for switching between light/dark modes.

### 6.2 Sidebar Component

**Location:** `src/components/Sidebar.tsx`

**Features:**
- Dynamic navigation based on user role
- Active route highlighting
- Collapsible menu sections
- User info display
- Theme toggle integration
- Logout functionality

**Role-based Menu Items:**
```typescript
const menuConfig = {
  SUPERADMIN: [/* all items */],
  ADMIN: ['dashboard', 'inward', 'inspection', 'spares', 'repair', 'l3-repair', 'display-repair', 'battery', 'paint', 'qc', 'inventory', 'admin'],
  MIS_WAREHOUSE_EXECUTIVE: ['dashboard', 'inward', 'inventory'],
  WAREHOUSE_MANAGER: ['dashboard', 'inward', 'spares', 'inventory', 'reports'],
  INSPECTION_ENGINEER: ['dashboard', 'inspection'],
  L2_ENGINEER: ['dashboard', 'repair'],
  L3_ENGINEER: ['dashboard', 'l3-repair'],
  DISPLAY_TECHNICIAN: ['dashboard', 'display-repair'],
  BATTERY_TECHNICIAN: ['dashboard', 'battery'],
  PAINT_SHOP_TECHNICIAN: ['dashboard', 'paint'],
  QC_ENGINEER: ['dashboard', 'qc'],
}
```

### 6.3 BarcodeScanner Component

**Location:** `src/components/BarcodeScanner.tsx`

**Features:**
- Camera-based CODE128 barcode scanning
- ZXing library integration
- Real-time scanning feedback
- Manual input fallback

**Props:**
```typescript
interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  placeholder?: string
}
```

### 6.4 BarcodePrintButton Component

**Location:** `src/components/BarcodePrintButton.tsx`

**Features:**
- Generates CODE128 barcode image
- Browser print dialog integration
- Label formatting for thermal printers

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
User                Browser              Server              Database
  |                   |                    |                    |
  |--Login Form------>|                    |                    |
  |                   |--POST credentials--|                    |
  |                   |                    |--Verify Password---|
  |                   |                    |<---User Data-------|
  |                   |<--Set userId Cookie|                    |
  |<--Redirect--------|                    |                    |
  |                   |                    |                    |
  |--Access Page----->|                    |                    |
  |                   |--Read Cookie------>|                    |
  |                   |                    |--Fetch User--------|
  |                   |                    |<---User + Role-----|
  |                   |                    |--Check Role--------|
  |                   |<--Page or Redirect-|                    |
```

### 7.2 Authorization Functions

**`getCurrentUser()`**
- Reads userId from cookies
- Returns user object or null

**`requireUser()`**
- Calls getCurrentUser()
- Redirects to /login if not authenticated

**`checkRole(allowedRoles[])`**
- Calls requireUser()
- SUPERADMIN bypasses role check
- Redirects to dashboard if role not allowed

---

## 8. Data Flow Patterns

### 8.1 Form Submission Pattern

```tsx
// Server Component (page.tsx)
async function Page() {
  const user = await checkRole(['ROLE1', 'ROLE2'])

  async function handleSubmit(formData: FormData) {
    'use server'
    const field1 = formData.get('field1')
    await serverAction(field1)
  }

  return (
    <form action={handleSubmit}>
      <input name="field1" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 8.2 Cache Invalidation

Server actions use `revalidatePath()` to invalidate cached pages:

```typescript
await performMutation()
revalidatePath('/affected-route')  // Triggers re-render
```

### 8.3 Activity Logging

All major actions are logged with full audit trail:

```typescript
await logActivity({
  action: 'ACTION_NAME',
  details: 'Human readable description',
  userId: user.id,
  metadata: {
    entityType: 'Device' | 'RepairJob' | 'QCRecord' | etc.,
    entityId: string,
    previousValue?: any,    // For updates - what was changed from
    newValue?: any,         // For updates - what was changed to
    sourceAction: 'Inward' | 'Inspection' | 'Repair' | 'Paint' | 'QC' | 'Outward'
  }
})
```

**Audit Log Entry Structure:**
```typescript
interface AuditEntry {
  id: string
  action: string           // e.g., 'STATUS_CHANGED', 'DEVICE_CREATED'
  details: string          // Human readable
  userId: string
  timestamp: Date
  metadata: {
    entityType: string
    entityId: string
    previousValue: any
    newValue: any
    sourceAction: string
    ipAddress?: string
  }
}
```

**Actions to Log:**
- Device creation, status changes, updates
- Repair job creation, status changes, assignments
- QC record creation, pass/fail decisions
- Stock movements (inward, outward, relocation)
- User login/logout
- All edits to existing records

---

## 9. Deployment Considerations

### 9.1 Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
RESEND_API_KEY=re_xxxxx  # Optional: for email notifications
```

### 9.2 Database Connection

Uses PostgreSQL with `@prisma/adapter-pg` for connection pooling:

```typescript
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
```

### 9.3 Build Configuration

```javascript
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: true
  }
}
```

---

## 10. Performance Considerations

### 10.1 Database Queries
- Use `include` judiciously to avoid N+1 queries
- Index frequently filtered columns (barcode, status)
- Limit query results where appropriate

### 10.2 UI Performance
- Server components reduce client JS bundle
- Framer Motion for smooth animations
- Lazy loading for non-critical components

### 10.3 Caching
- Next.js automatic page caching
- Manual revalidation after mutations
- Static generation where possible
