# Comprint Operations

A comprehensive operations management portal for end-to-end IT asset lifecycle management. Handles inward processing, inspection, multi-tier repairs (L2/L3), specialized services (display repair, battery boost), paint shop operations, quality control, outward dispatch, and inventory management for refurbished stock and rental returns.

## Features

### Dashboard
- Real-time metrics: Pending Inspection, Under Repair, In Paint, Awaiting QC, Ready for Stock
- TAT (Turnaround Time) breach tracking with visual warnings
- QC pass/fail rates by engineer with interactive charts
- Stock distribution by grade (A/B) and category
- Daily throughput and trend analysis
- User-specific stats: pending shows queue size, in-progress/completed show user's own counts

### Inward Processing
- Create batches for Refurb Purchases or Rental Returns
- Category-specific device entry with dynamic forms:
  - **Laptops/Desktops/Workstations**: CPU, RAM, SSD, GPU, Screen Size
  - **Servers**: Form Factor, RAID Controller, Network Ports
  - **Monitors**: Size, Resolution, Panel Type, Refresh Rate, Ports
  - **Storage**: Type (HDD/SSD/NVMe), Capacity, Form Factor, Interface, RPM
  - **Networking Cards**: Speed, Port Count, Connector Type, Interface, Bracket Type
- Automatic barcode generation for tracking
- Bulk upload via Excel with multi-sheet templates (all sheets processed)
- Edit devices in batch before dispatch

### Inspection Station
- Barcode scanning via camera or image/PDF upload
- Category-specific inspection checklists (20+ items per category)
- Record functional and cosmetic issues
- Identify required spare parts and paint panels
- Automatic workflow routing based on inspection findings

### L2 Repair Station (Coordinator Role)
- Three-tab interface: Assigned, Available, Completed devices
- View inspection notes, failed items, and spare parts list
- Request spare parts with notifications
- Dispatch parallel work:
  - Display repair (to Display Technician or self)
  - Battery boost (to Battery Technician or self)
  - L3 repair (for major issues)
  - Paint panels (to Paint Shop)
- Perform display/battery work directly without dispatch
- Send devices to QC when complete
- Track completed/handed-over devices (read-only)
- Job cards display assigned technician names for dispatched work

### L3 Repair Station (Major Repairs)
- Handle complex repairs: Motherboard, Domain Lock, BIOS Lock, Power Issues
- Start/complete repairs with resolution tracking
- Integration with L2 workflow
- Role-based filtering: L3 Engineers see only their assigned jobs; Admins see all

### Display Repair
- Screen and display-specific repairs
- Issue tracking and capacity reporting
- Can be performed by Display Technician or L2 directly
- Role-based filtering: Display Technicians see only their assigned jobs; Admins see all

### Battery Boost
- Battery maintenance and conditioning
- Capacity measurement and notes
- Can be performed by Battery Technician or L2 directly
- Role-based filtering: Battery Technicians see only their assigned jobs; Admins see all

### Spares Management
- View devices waiting for spares
- Spare parts inventory with stock levels
- Issue spares to move devices to repair queue
- Compatible models and bin location tracking
- Low stock alerts

### Paint Shop
- Track panels requiring painting (Top Cover, Bottom Cover, Palmrest, Bezel, etc.)
- Status updates: Awaiting Paint → In Paint → Ready for Collection → Fitted
- Integration with repair workflow for panel collection
- Panels created only when L2 Engineer explicitly sends them (inspection saves recommendations only)

### Quality Control (QC)
- Final device verification with category-aware checklists
- Toggle checklist items during review
- Pass/Fail/N/A status per item
- Assign final grades (A/B)
- Pass to stock or send back for rework with remarks
- Snapshot of inspection and repair engineer details

### Outward Dispatch
- Create Sales or Rental dispatches
- Multi-device selection
- Track customer, invoice/rental reference, shipping details
- Record packed by and checked by personnel
- Edit dispatch records
- Complete dispatch history

### Inventory
- View all devices ready for stock
- Filter by batch, model, grade, or category
- Stock distribution visualization

### Admin Features
- User management with role-based access
- Soft-delete for users (preserves historical data)
- Spare parts inventory management
- Activity audit trail

### User Experience
- Mobile-responsive design across all pages
- Hidden scrollbars with maintained scroll functionality
- Dismissible confirmation popups for workflow actions
- Real-time status updates
- Barcode printing functionality
- PDF export capabilities
- Animated UI with page transitions
- Dark mode / light mode support with system preference detection
- Consistent hover effects and cursor states across all interactive elements
- Reusable UI components: IconButton (bordered action buttons), ToggleSwitch (status toggles)
- Legacy data migration tool at `/admin/migrations` for fixing pre-update records

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/) v7.0
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **UI Components**: Custom components with Lucide React icons
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Barcode**: JsBarcode (generation), ZXing (scanning)
- **PDF**: jsPDF (generation), PDF.js (parsing)
- **Excel**: SheetJS (xlsx) for multi-sheet import/export
- **Email**: [Resend](https://resend.com/) for notifications
- **Testing**: [Vitest](https://vitest.dev/) with Testing Library
- **Authentication**: Custom role-based cookie authentication

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL Database (Local or Cloud)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ayush3245/comprint-operations.git
   cd comprint-operations
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   RESEND_API_KEY="re_xxxxx"  # Optional: for email notifications
   ```

4. **Database Setup:**
   ```bash
   npx prisma db push
   ```

5. **Seed the Database:**
   ```bash
   npm run seed
   ```

## Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Login Credentials (from Seed)

| Role | User | Access |
|------|------|--------|
| Admin | Admin User | All modules |
| Warehouse Manager | Warehouse Manager | Inward, Inventory, Outward, Spares |
| Inspection Engineer | Inspection Engineer | Inspection |
| L2 Engineer | L2 Engineer | L2 Repair, Display Repair, Battery Boost |
| L3 Engineer | L3 Engineer | L3 Repair |
| Display Technician | Display Technician | Display Repair |
| Battery Technician | Battery Technician | Battery Boost |
| Paint Technician | Paint Technician | Paint Shop |
| QC Engineer | QC Engineer | Quality Control |

## Testing

```bash
npm test                 # Run all tests
npx vitest --watch       # Watch mode
npx vitest src/lib/__tests__/workflow-logic.test.ts  # Single file
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Analytics dashboard
│   ├── inward/             # Batch creation & device entry
│   ├── inspection/         # Device inspection workflow
│   ├── l2-repair/          # L2 repair station (coordinator)
│   ├── l3-repair/          # L3 major repairs
│   ├── display-repair/     # Display/screen repairs
│   ├── battery-boost/      # Battery maintenance
│   ├── paint/              # Paint shop management
│   ├── qc/                 # Quality control
│   ├── outward/            # Dispatch management
│   ├── inventory/          # Stock viewing
│   ├── spares/             # Spare parts management
│   ├── admin/              # Admin panel (users, spares)
│   └── reports/            # Specialized reports
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components
│   │   ├── Button.tsx      # Primary button with variants
│   │   ├── IconButton.tsx  # Icon-only button with borders
│   │   └── ToggleSwitch.tsx # Toggle switch for status fields
│   ├── BarcodeScanner.tsx  # Camera/image barcode scanning
│   ├── DynamicDeviceForm.tsx # Category-aware device form
│   ├── ReportedIssuesDisplay.tsx # Issue visualization
│   └── Sidebar.tsx         # Navigation sidebar
├── lib/                    # Utilities and server logic
│   ├── actions.ts          # Server actions (2800+ lines)
│   ├── auth.ts             # Authentication helpers
│   ├── db.ts               # Database connection
│   ├── utils.ts            # Utility functions
│   └── __tests__/          # Unit tests (14 test suites)
└── generated/              # Prisma generated client

prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Database seeding script
```

## Device Categories

| Category | Specific Fields |
|----------|-----------------|
| Laptop | CPU, RAM, SSD, GPU, Screen Size |
| Desktop | CPU, RAM, SSD, GPU |
| Workstation | CPU, RAM, SSD, GPU |
| Server | Form Factor, RAID Controller, Network Ports |
| Monitor | Size, Resolution, Panel Type, Refresh Rate, Ports |
| Storage | Type, Capacity, Form Factor, Interface, RPM |
| Networking Card | Speed, Port Count, Connector Type, Interface, Bracket |

## Workflow States

```
RECEIVED → PENDING_INSPECTION → [WAITING_FOR_SPARES] → READY_FOR_REPAIR
→ UNDER_REPAIR → [Parallel: Display/Battery/L3/Paint] → AWAITING_QC
→ QC_PASSED / QC_FAILED_REWORK → READY_FOR_STOCK
→ STOCK_OUT_SOLD / STOCK_OUT_RENTAL / SCRAPPED
```

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| SUPERADMIN | Full system access | All modules |
| ADMIN | Administrative access | All modules |
| WAREHOUSE_MANAGER | Warehouse operations | Inward, Inventory, Outward, Spares |
| MIS_WAREHOUSE_EXECUTIVE | Warehouse data entry | Inward, Inventory |
| INSPECTION_ENGINEER | Device inspection | Inspection |
| L2_ENGINEER | Repair coordination | L2 Repair, Display, Battery |
| L3_ENGINEER | Major repairs | L3 Repair |
| DISPLAY_TECHNICIAN | Screen repairs | Display Repair |
| BATTERY_TECHNICIAN | Battery service | Battery Boost |
| PAINT_SHOP_TECHNICIAN | Panel painting | Paint Shop |
| QC_ENGINEER | Quality assurance | QC |

## Security

- **Authentication**: Cookie-based session management
- **Role-Based Access**: Server-side middleware and UI checks
- **Input Validation**: Server actions include sanitization
- **Soft Delete**: User data preserved for historical records
- **Activity Logging**: Audit trail for all operations
- **Sensitive Files**: Credentials excluded via .gitignore

## Commands Reference

```bash
npm run dev              # Development server (Turbopack)
npm run build            # Production build
npm start                # Start production server
npm test                 # Run all tests
npm run seed             # Seed database
npx prisma db push       # Push schema to database
npx prisma studio        # Open Prisma Studio
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Commit Convention

```
feat: add new feature
fix: bug fix
chore: maintenance task
test: add/update tests
docs: documentation update
```
