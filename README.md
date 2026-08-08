# FundsRoom ERP

A full-stack ERP system for customer management, inventory management, stock movements, and sales challan processing.

## 1. Project Overview

FundsRoom ERP is a full-stack ERP application designed to manage:
- Customers
- Products
- Inventory
- Stock movements
- Sales challans
- Role-based access

## 2. Key Features

**Authentication:**
- JWT authentication
- bcrypt password hashing
- Role-based authorization

**Customer CRM:**
- Customer creation
- Customer updates
- Search
- Filtering
- Pagination
- Follow-up tracking

**Inventory:**
- Product management
- SKU management
- Stock IN/OUT
- Low-stock detection
- Stock movement history

**Sales Challans:**
- Draft challans
- Product snapshots
- Challan confirmation
- Challan cancellation
- Atomic stock deduction

**Security:**
- JWT middleware
- Role-based access control
- Input validation using Zod
- Password hashing

## 3. Technology Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React

**Backend:**
- Node.js
- Express.js
- TypeScript
- Prisma
- Zod
- JWT
- bcrypt

**Database:**
- MySQL

## 4. Architecture

```
React Client
      ↓
REST API
      ↓
Express + TypeScript
      ↓
Prisma ORM
      ↓
MySQL
```
The backend follows a modular controller/route/middleware structure.

## 5. Role-Based Access

| Role | Access |
|------|--------|
| ADMIN | Full system access |
| SALES | Customers, products, challans |
| WAREHOUSE | Inventory and stock operations |
| ACCOUNTS | Read-only relevant records |

## 6. Main API Endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PUT /api/customers/:id`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `POST /api/products/:id/stock-movements`
- `GET /api/products/:id/stock-movements`
- `GET /api/challans`
- `POST /api/challans`
- `GET /api/challans/:id`
- `POST /api/challans/:id/confirm`
- `POST /api/challans/:id/cancel`

## 7. Database Models

- **User**: Manages system users and authentication credentials.
- **Customer**: Manages client profiles and business information.
- **Product**: Represents inventory items with current and minimum stock levels.
- **StockMovement**: Logs every IN and OUT transaction for products.
- **Challan**: Delivery note or invoice header linking customers and items.
- **ChallanItem**: Line items of a challan capturing a snapshot of product state and quantities.

## 8. Important Business Logic

**Inventory Flow:**
`Product` → `Stock Movement` → `Inventory update`

**Challan Flow:**
`Create Challan` → `DRAFT` → `CONFIRM` → `Atomic stock deduction` → `Stock movement created`

Stock deduction during challan confirmation is handled transactionally so failed confirmations do not partially modify stock.

## 9. Project Structure

```
fundsroom-erp/
├── client/
│   └── src/
├── server/
│   ├── src/
│   └── prisma/
├── .gitignore
└── README.md
```

## 10. Local Setup

### Frontend:
```bash
cd client
npm install
npm run dev
```

### Backend:
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```
Create a `.env` file from `.env.example` and configure your local MySQL connection.

## 11. Environment Variables

Variables required (see `.env.example`):
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL`

## 12. Demo Credentials
(For case-study evaluation in development environments)
- **Admin**: admin@fundsroom.com / password123
- **Sales**: sales@fundsroom.com / password123
- **Warehouse**: warehouse@fundsroom.com / password123

## 13. Case Study Workflow

`Login` → `Dashboard` → `Customers` → `Products` → `Stock Movement` → `Create Challan` → `Confirm Challan` → `Inventory Updated`

## 14. Future Improvements

- Cloud deployment
- Advanced reporting
- Audit dashboard
- Notifications
- Automated testing
