# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server (Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run all tests
npm test

# Run tests in watch mode
npx vitest --watch

# Run a single test file
npx vitest src/lib/__tests__/workflow-logic.test.ts

# Database commands
npx prisma db push          # Push schema to database
npx prisma migrate dev      # Create migration
npx prisma studio           # Open Prisma Studio GUI
npm run seed                # Seed database with test data
```

## Architecture Overview

**Comprint Operations** is an IT asset lifecycle management portal tracking devices from inward receipt through inspection, repair, paint, QC, to final dispatch.

### Code Organization

```
src/
├── app/           # Next.js 16 App Router - one directory per workflow module
├── components/    # React components (ui/ for base, feature-specific at root)
├── lib/           # Server-side logic
│   ├── actions.ts     # All server actions (mutations)
│   ├── auth.ts        # Cookie-based auth helpers (getCurrentUser, checkRole)
│   ├── db.ts          # Prisma client singleton
│   └── activity.ts    # Audit logging
└── __tests__/     # Vitest tests with mocks
prisma/
├── schema.prisma  # Single source of truth for DB schema
└── seed.ts        # Test data seeding
```

### Key Architectural Patterns

**Server Actions Pattern**: All mutations go through `src/lib/actions.ts` using Next.js server actions with `'use server'` directive. Each action: validates auth → performs DB operation → calls `revalidatePath()` → logs activity.

**Authentication Flow**: Cookie-based with `userId` in HTTP-only cookie. Use `getCurrentUser()` for optional auth, `requireUser()` for mandatory, `checkRole(['ROLE'])` for role-restricted routes. SUPERADMIN bypasses all role checks.

**Device Workflow State Machine**:
```
RECEIVED → PENDING_INSPECTION → [WAITING_FOR_SPARES] → READY_FOR_REPAIR
→ UNDER_REPAIR → [IN_PAINT_SHOP] → AWAITING_QC → READY_FOR_STOCK
→ STOCK_OUT_SOLD/STOCK_OUT_RENTAL
```
Status transitions are enforced in server actions. When QC fails, device returns to READY_FOR_REPAIR with rework notes.

**Component Patterns**:
- Server pages fetch data and define server actions
- Client components (`'use client'`) use `useTransition` for pending states
- Toast notifications via `useToast()` hook from context provider

### Database Models

Core entities: `Device`, `InwardBatch`, `RepairJob`, `PaintPanel`, `QCRecord`, `OutwardRecord`, `SparePart`, `User`

Device has workflow flags (`repairRequired`, `paintRequired`, `repairCompleted`, `paintCompleted`) that control routing logic.

Seven device categories with category-specific fields: LAPTOP, DESKTOP, WORKSTATION, SERVER, MONITOR, STORAGE, NETWORKING_CARD.

### Roles

SUPERADMIN, ADMIN, MIS_WAREHOUSE_EXECUTIVE, WAREHOUSE_MANAGER, INSPECTION_ENGINEER, REPAIR_ENGINEER, PAINT_SHOP_TECHNICIAN, QC_ENGINEER

## Critical Constraints

**Schema Changes**: Edit only `prisma/schema.prisma`, never hand-edit `generated/`. Run `npx prisma db push` after changes. Changing enums or relations can break workflows.

**Workflow Integrity**: Status transitions, the `repairRequired`/`paintRequired` flags, and TAT tracking are tightly coupled. Changes must update all dependent code (actions, dashboard metrics, filters).

**Auth Security**: Always enforce role checks server-side in actions using `checkRole()`. UI checks are supplementary only.

**Import/Export Compatibility**: Bulk Excel upload, barcode generation (JsBarcode), and PDF export (jsPDF) are core operations features - preserve format compatibility.

## Testing

Tests are in `src/lib/__tests__/` using Vitest. Current coverage includes:
- Workflow logic and status transitions
- Password hashing
- Device/category validation
- QC, paint shop, outward dispatch business rules
- User management and permissions

Mock infrastructure in `__tests__/mocks/prisma.ts` provides factories for all models.

## Environment Variables

Required in `.env`:
```
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

Optional:
```
RESEND_API_KEY="re_xxxxx"  # For email notifications
```
