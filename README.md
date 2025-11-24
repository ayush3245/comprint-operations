# Comprint Operations App

A comprehensive operations management portal for Comprint, designed to handle the end-to-end lifecycle of IT assets. This application manages inward processing, inspection, repairs, paint shop operations, quality control (QC), and inventory management for both refurbished stock and rental returns.

## 🚀 Features

The application is divided into several key workflows based on user roles:

*   **Dashboard**: Real-time overview of key metrics (Pending Inward, Inspection, Repairs, QC, etc.).
*   **Inward Processing**: 
    *   Create batches for Refurb Purchases or Rental Returns.
    *   Add devices to batches with details like Category, Brand, Model, Config, and Serial Number.
    *   Automatic barcode generation for tracking.
*   **Inspection**:
    *   Scan device barcodes to initiate inspection.
    *   Record functional and cosmetic issues.
    *   Identify required spare parts and paint panels.
*   **Spares Management**:
    *   View devices waiting for spares.
    *   Issue spares to move devices to the repair queue.
*   **Repair Station**:
    *   Technicians can pick up jobs assigned to them or from the queue.
    *   Track repair start/end times and TAT.
    *   Send devices to the Paint Shop or directly to QC.
*   **Paint Shop**:
    *   Track panels requiring painting (Top Cover, Bottom Cover, etc.).
    *   Update status of paint jobs (In Paint, Ready, Fitted).
*   **Quality Control (QC)**:
    *   Final verification of devices after repair/paint.
    *   Comprehensive checklist (Boot, Display, Keyboard, etc.).
    *   Assign final grades (A/B) and move to Stock or send back for Rework.
*   **Inventory**:
    *   View all devices ready for stock.
    *   Filter by batch, model, or grade.
*   **Reports**:
    *   Specialized reporting for Rental Returns.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Database**: PostgreSQL
*   **ORM**: [Prisma](https://www.prisma.io/) (v7.0)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Testing**: [Vitest](https://vitest.dev/)
*   **Authentication**: Custom role-based cookie authentication

## 📋 Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   PostgreSQL Database (Local or Cloud)

## ⚙️ Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ayush3245/comprint-operations.git
    cd comprint-operations
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory and add your database connection string:
    ```env
    DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
    ```

4.  **Database Setup:**
    Push the Prisma schema to your database:
    ```bash
    npx prisma db push
    ```

5.  **Seed the Database:**
    Populate the database with initial test users and data:
    ```bash
    npm run seed
    ```
    *This will create users like Admin, Warehouse Manager, Inspection Engineer, etc., for testing.*

## 🏃‍♂️ Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Login Credentials (from Seed)
You can use the following users to test different roles (no password required for this MVP auth):

*   **Admin**: Select "Admin User" (Access to all modules)
*   **Warehouse**: Select "Warehouse Manager" (Inward, Inventory)
*   **Inspection**: Select "Inspection Engineer" (Inspection)
*   **Repair**: Select "Repair Engineer" (Repair Station)
*   **Paint**: Select "Paint Technician" (Paint Shop)
*   **QC**: Select "QC Engineer" (QC)

## 🧪 Testing

Run the unit tests to verify utility functions and core logic:

```bash
npm test
```

## 📂 Project Structure

*   `src/app`: Next.js App Router pages and layouts.
*   `src/components`: Reusable UI components (Sidebar, etc.).
*   `src/lib`: Utility functions, database connection, and server actions.
*   `prisma`: Database schema and seed script.
*   `public`: Static assets.

## 🔒 Security

*   **Authentication**: Currently uses a simplified cookie-based session for internal use.
*   **Role-Based Access**: Middleware and UI checks ensure users only access authorized modules.
*   **Input Validation**: Server actions include basic validation.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.
