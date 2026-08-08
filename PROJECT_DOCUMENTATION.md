# FundsRoom ERP Project Documentation

> [!NOTE]
> This document provides a comprehensive overview of the FundsRoom ERP (FundFlow) project, detailing its architecture, tech stack, database schema, and key components.

## 1. Project Overview
FundsRoom ERP is a full-stack Enterprise Resource Planning application designed for managing customers, products, stock movements, and challans (delivery notes/invoices). The project is structured as a monorepo with distinct `client` and `server` directories.

## 2. Technology Stack

### Frontend (Client)
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4, Framer Motion (for animations)
- **Routing**: React Router DOM (v7)
- **Language**: TypeScript
- **Icons**: Lucide React

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens) & bcrypt (for password hashing)

### Database
- **Engine**: MySQL

## 3. System Architecture
The application follows a standard Client-Server architecture:
- **Client**: A Single Page Application (SPA) that communicates with the backend via RESTful APIs. It handles UI rendering, state management (using React Context like `AuthContext` and `ToastContext`), and client-side routing.
- **Server**: A REST API providing endpoints for authentication and entity management (Customers, Products, Challans). It connects to a MySQL database using Prisma ORM.

## 4. Database Schema
The database is defined using Prisma. The key models are:

### `User`
Manages system users and authentication.
- **Fields**: `id`, `name`, `email`, `password`, `role` (ADMIN, SALES, WAREHOUSE, ACCOUNTS), timestamps.
- **Relations**: Has many `StockMovement` and `Challan` records.

### `Customer`
Manages client/customer information.
- **Fields**: `id`, `name`, `mobile`, `email`, `businessName`, `gstNumber`, `customerType` (RETAIL, WHOLESALE, DISTRIBUTOR), `address`, `status` (LEAD, ACTIVE, INACTIVE), `followUpDate`, `notes`, timestamps.
- **Relations**: Has many `Challan` records.

### `Product`
Manages inventory items.
- **Fields**: `id`, `name`, `sku` (unique), `category`, `unitPrice`, `currentStock`, `minimumStock`, `warehouse`, timestamps.
- **Relations**: Has many `StockMovement` and `ChallanItem` records.

### `StockMovement`
Tracks inventory changes.
- **Fields**: `id`, `productId`, `quantity`, `movementType` (IN, OUT), `reason`, `createdBy`, timestamps.
- **Relations**: Belongs to `Product` and `User`.

### `Challan` & `ChallanItem`
Manages delivery notes/invoices.
- **`Challan`**: `id`, `challanNumber` (unique), `customerId`, `status` (DRAFT, CONFIRMED, CANCELLED), `totalQuantity`, `createdBy`, timestamps. Belongs to `Customer` and `User`.
- **`ChallanItem`**: `id`, `challanId`, `productId`, `productName`, `sku`, `unitPrice`, `quantity`, `total`. Belongs to `Challan` and `Product`.

## 5. Backend Structure
The backend is organized into standard MVC-like layers:
- **Routes (`/server/src/routes`)**:
  - `/api/auth`: Login and authentication.
  - `/api/customers`: CRUD operations for customers.
  - `/api/products`: CRUD operations and stock management for products.
  - `/api/challans`: Creation and management of challans.
  - `/api/test`: Test/utility endpoints.
- **Controllers (`/server/src/controllers`)**: Contain the business logic for handling requests (e.g., `authController.ts`, `customerController.ts`, `productController.ts`, `challanController.ts`).
- **Middleware**: Includes error handling (`errorHandler.ts`) and authentication mechanisms.

## 6. Frontend Structure
The frontend is organized for scalability:
- **Pages (`/client/src/pages`)**:
  - `LoginPage.tsx`: User authentication.
  - `DashboardPage.tsx`: Main dashboard overview.
  - `CustomersPage.tsx` & `CustomerDetailPage.tsx`: Customer management and details.
  - `ProductsPage.tsx` & `ProductDetailPage.tsx`: Inventory and product management.
  - `ChallansPage.tsx`, `CreateChallanPage.tsx` & `ChallanDetailPage.tsx`: Challan processing and creation.
- **Components (`/client/src/components`)**: Separated into `layout` (e.g., `AppLayout`) and `shared` reusable components.
- **Context (`/client/src/context`)**: `AuthContext` for global authentication state and `ToastContext` for notifications.
- **Routing**: Defined in `App.tsx` utilizing `React.Suspense` for lazy loading routes to optimize performance. Uses `ProtectedRoute` and `PublicRoute` wrappers to restrict access.

## 7. Key Workflows
1. **Authentication**: Users log in via the client, which sends credentials to `/api/auth`. The server validates using bcrypt and issues a JWT. The client stores this token (likely in context/local storage) and includes it in subsequent API requests.
2. **Inventory Management**: Products are created and tracked. Stock movements (IN/OUT) adjust the `currentStock` of a product accordingly.
3. **Challan Processing**: Users can create drafts of challans by selecting a customer and adding product items. Confirming a challan will typically trigger stock deductions (OUT movements) for the associated products.

## 8. Development Scripts
- **Client**: `npm run dev` (starts Vite), `npm run build`, `npm run lint`.
- **Server**: `npm run dev` (starts nodemon + tsx), `npm run build` (tsc), `npm start`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`.
