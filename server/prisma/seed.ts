import { PrismaClient, Role, CustomerType, CustomerStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with updated passwords...');

  // 1. Seed Users
  const usersData = [
    { name: 'Admin User', email: 'admin@fundsroom.com', role: Role.ADMIN, password: 'Admin@123' },
    { name: 'Sales User', email: 'sales@fundsroom.com', role: Role.SALES, password: 'Sales@123' },
    { name: 'Warehouse User', email: 'warehouse@fundsroom.com', role: Role.WAREHOUSE, password: 'Warehouse@123' },
    { name: 'Accounts User', email: 'accounts@fundsroom.com', role: Role.ACCOUNTS, password: 'Accounts@123' },
  ];

  for (const user of usersData) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword, // Update to new password if user already exists
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });
  }
  console.log('Users seeded with role-specific passwords.');

  // 2. Seed Customers (5 sample customers with realistic Indian business data)
  const customersData = [
    {
      name: 'Rajesh Sharma',
      mobile: '+919876543210',
      email: 'rajesh@sharmadistributors.com',
      businessName: 'Sharma Distributors',
      gstNumber: '07AAAAA1111A1Z1',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Shop No. 12, Chandni Chowk, New Delhi, Delhi - 110006',
      status: CustomerStatus.ACTIVE,
      notes: 'Key distributor in North Delhi area.',
    },
    {
      name: 'Priya Patel',
      mobile: '+919988776655',
      email: 'priya@patelretail.com',
      businessName: 'Patel General Store',
      gstNumber: '24BBBBB2222B2Z2',
      customerType: CustomerType.RETAIL,
      address: 'A-402, Satellite Road, Ahmedabad, Gujarat - 380015',
      status: CustomerStatus.ACTIVE,
      notes: 'Consistently orders retail household items.',
    },
    {
      name: 'Amit Verma',
      mobile: '+919123456789',
      email: 'amit@vermawwholesale.com',
      businessName: 'Verma Wholesale Traders',
      gstNumber: '09CCCCC3333C3Z3',
      customerType: CustomerType.WHOLESALE,
      address: 'Plot 45, Sector 5, Noida, Uttar Pradesh - 201301',
      status: CustomerStatus.ACTIVE,
      notes: 'Requests bulk pricing quotes.',
    },
    {
      name: 'Sunita Krishnan',
      mobile: '+918877665544',
      email: 'sunita@krishnanenterprises.com',
      businessName: 'Krishnan Enterprises',
      gstNumber: null,
      customerType: CustomerType.RETAIL,
      address: '12, MG Road, Bangalore, Karnataka - 560001',
      status: CustomerStatus.LEAD,
      notes: 'Interested in becoming a retailer. Follow-up required.',
      followUpDate: new Date('2026-09-01'),
    },
    {
      name: 'Vikram Singh',
      mobile: '+919888877777',
      email: 'vikram@singhtraders.com',
      businessName: 'Singh & Sons Trading Co.',
      gstNumber: '03DDDDD4444D4Z4',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'GT Road, Jalandhar, Punjab - 144001',
      status: CustomerStatus.INACTIVE,
      notes: 'Temporary inactive due to warehouse relocation.',
    },
  ];

  for (const customer of customersData) {
    const existing = await prisma.customer.findFirst({
      where: {
        AND: [
          { email: customer.email },
          { businessName: customer.businessName }
        ]
      }
    });

    if (!existing) {
      await prisma.customer.create({
        data: {
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email,
          businessName: customer.businessName,
          gstNumber: customer.gstNumber,
          customerType: customer.customerType,
          address: customer.address,
          status: customer.status,
          notes: customer.notes,
          followUpDate: customer.followUpDate,
        }
      });
    }
  }
  console.log('Customers seeded.');

  // 3. Seed Products (5 sample products)
  const productsData = [
    {
      name: 'Premium Basmati Rice (1kg)',
      sku: 'PROD-RICE-001',
      category: 'Grains',
      unitPrice: 110.0,
      currentStock: 500,
      minimumStock: 50,
      warehouse: 'Delhi Main Warehouse',
    },
    {
      name: 'Organic Mustard Oil (1L)',
      sku: 'PROD-OIL-002',
      category: 'Edible Oils',
      unitPrice: 195.0,
      currentStock: 300,
      minimumStock: 30,
      warehouse: 'Delhi Main Warehouse',
    },
    {
      name: 'Refined Sugar (5kg)',
      sku: 'PROD-SUGAR-003',
      category: 'Sweeteners',
      unitPrice: 220.0,
      currentStock: 150,
      minimumStock: 25,
      warehouse: 'Noida Sub-Depot',
    },
    {
      name: 'Tata Tea Gold (500g)',
      sku: 'PROD-TEA-004',
      category: 'Beverages',
      unitPrice: 320.0,
      currentStock: 200,
      minimumStock: 40,
      warehouse: 'Noida Sub-Depot',
    },
    {
      name: 'Aashirvaad Atta (10kg)',
      sku: 'PROD-ATTA-005',
      category: 'Flour',
      unitPrice: 460.0,
      currentStock: 400,
      minimumStock: 60,
      warehouse: 'Delhi Main Warehouse',
    },
  ];

  for (const product of productsData) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitPrice: product.unitPrice,
        currentStock: product.currentStock,
        minimumStock: product.minimumStock,
        warehouse: product.warehouse,
      },
    });
  }
  console.log('Products seeded.');
  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
