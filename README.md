# Comprint Operations App

A comprehensive operations management portal for Comprint, designed to handle the end-to-end lifecycle of IT assets. This application manages inward processing, inspection, repairs, paint shop operations, quality control (QC), outward dispatch, and inventory management for both refurbished stock and rental returns.

## Features

The application is divided into several key workflows based on user roles:

### Dashboard
- Real-time overview of key metrics (Pending Inspection, Under Repair, In Paint, Awaiting QC, Ready for Stock)
- TAT (Turnaround Time) breach tracking
- QC pass/fail rates by engineer with visual charts
- Stock distribution by grade (A/B) and category
- Daily throughput and trends analysis
- Interactive charts powered by Recharts

### Inward Processing
- Create batches for Refurb Purchases or Rental Returns
- Add devices with category-specific details
- Support for multiple device categories:
  - **Laptops/Desktops/Workstations**: CPU, RAM, SSD, GPU, Screen Size
  - **Servers**: Form Factor, RAID Controller, Network Ports
  - **Monitors**: Size, Resolution, Panel Type, Refresh Rate, Ports
  - **Storage**: Type (HDD/SSD/NVMe), Capacity, Form Factor, Interface, RPM
  - **Networking Cards**: Speed, Port Count, Connector Type, Interface, Bracket Type
- Automatic barcode generation for tracking
- Bulk upload via Excel with multi-sheet templates for all device types

### Inspection Station
- Scan device barcodes (camera or image/PDF upload) to initiate inspection
- Record functional and cosmetic issues
- Identify required spare parts and paint panels
- Automatic workflow routing based on inspection findings

### Spares Management
- View devices waiting for spares
- Spare parts inventory with stock levels
- Issue spares to move devices to the repair queue
- Track compatible models and bin locations

### Repair Station
- Technicians can pick up jobs assigned to them or from the queue
- Track repair start/end times and TAT
- View QC rework requirements with failure details
- Collect painted panels when ready
- Send devices to Paint Shop or directly to QC

### Paint Shop
- Track panels requiring painting (Top Cover, Bottom Cover, Palmrest, Bezel, etc.)
- Update status of paint jobs (Awaiting Paint, In Paint, Ready for Collection)
- Integration with repair workflow for panel collection

### Quality Control (QC)
- Final verification of devices after repair/paint
- Comprehensive checklist (Power/Boot, Display, Keyboard, Ports, Battery, Thermals, Cosmetic, Cleanliness)
- Assign final grades (A/B)
- Pass to stock or send back for rework with remarks

### Outward Dispatch
- Create Sales or Rental dispatches
- Select multiple devices for dispatch
- Track customer, invoice/rental reference, shipping details
- Record packed by and checked by personnel
- Complete dispatch history

### Inventory
- View all devices ready for stock
- Filter by batch, model, grade, or category

### Admin Features
- User management with role-based access
- Spare parts inventory management

### User Experience
- Dismissible confirmation popups for all workflow actions
- Real-time status updates
- Barcode printing functionality
- PDF export capabilities
- Animated UI with page transitions and confetti effects

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/) (v7.0)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **UI Components**: Custom components with Lucide React icons
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Barcode**: JsBarcode for generation, ZXing for scanning
- **PDF**: jsPDF for generation, PDF.js for parsing
- **Excel**: SheetJS (xlsx) for import/export
- **Email**: [Resend](https://resend.com/) for notifications
- **Testing**: [Vitest](https://vitest.dev/)
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
   Push the Prisma schema to your database:
   ```bash
   npx prisma db push
   ```

5. **Seed the Database:**
   Populate the database with initial test users and data:
   ```bash
   npm run seed
   ```

## Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Login Credentials (from Seed)

Select a user to test different roles (simplified auth for internal use):

| Role | User | Access |
|------|------|--------|
| Admin | Admin User | All modules |
| Warehouse | Warehouse Manager | Inward, Inventory, Outward |
| Inspection | Inspection Engineer | Inspection |
| Repair | Repair Engineer | Repair Station |
| Paint | Paint Technician | Paint Shop |
| QC | QC Engineer | QC |

## Testing

Run the unit tests:

```bash
npm test
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Analytics dashboard
│   ├── inward/             # Batch creation & device entry
│   ├── inspection/         # Device inspection workflow
│   ├── repair/             # Repair station
│   ├── paint/              # Paint shop management
│   ├── qc/                 # Quality control
│   ├── outward/            # Dispatch management
│   ├── inventory/          # Stock viewing
│   ├── spares/             # Spare parts management
│   ├── admin/              # Admin panel (users, spares)
│   └── reports/            # Specialized reports
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components (Toast, Cards, etc.)
│   ├── BarcodeScanner.tsx  # Camera/image barcode scanning
│   ├── DynamicDeviceForm.tsx # Category-aware device form
│   └── Sidebar.tsx         # Navigation sidebar
├── lib/                    # Utilities and server logic
│   ├── actions.ts          # Server actions
│   ├── auth.ts             # Authentication helpers
│   ├── db.ts               # Database connection
│   └── utils.ts            # Utility functions
└── generated/              # Prisma generated client
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Database seeding script
```

## Device Categories

The application supports the following device categories with specialized fields:

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

Devices progress through the following statuses:

```
RECEIVED → PENDING_INSPECTION → [WAITING_FOR_SPARES] → READY_FOR_REPAIR
→ UNDER_REPAIR → [IN_PAINT_SHOP] → AWAITING_QC → QC_PASSED/QC_FAILED_REWORK
→ READY_FOR_STOCK → STOCK_OUT_SOLD/STOCK_OUT_RENTAL
```

## Security

- **Authentication**: Cookie-based session management for internal use
- **Role-Based Access**: Middleware and UI checks ensure users only access authorized modules
- **Input Validation**: Server actions include validation
- **Sensitive Files**: Credentials and environment files excluded via .gitignore

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
