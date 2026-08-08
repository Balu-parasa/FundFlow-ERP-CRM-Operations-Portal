type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

// Which sidebar navigation items each role can see
export const ROLE_NAV_ACCESS: Record<string, Role[]> = {
  dashboard: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  customers: ['ADMIN', 'SALES', 'ACCOUNTS'],
  products: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  challans: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
};

// Which write actions each role can perform
export const ROLE_PERMISSIONS: Record<string, Role[]> = {
  'customer:create': ['ADMIN', 'SALES'],
  'customer:edit': ['ADMIN', 'SALES'],
  'product:create': ['ADMIN', 'WAREHOUSE'],
  'product:edit': ['ADMIN', 'WAREHOUSE'],
  'product:stock': ['ADMIN', 'WAREHOUSE'],
  'challan:create': ['ADMIN', 'SALES'],
  'challan:confirm': ['ADMIN', 'SALES'],
  'challan:cancel': ['ADMIN', 'SALES'],
};

export function hasNavAccess(role: Role | undefined, navKey: string): boolean {
  if (!role) return false;
  return ROLE_NAV_ACCESS[navKey]?.includes(role) ?? false;
}

export function hasPermission(role: Role | undefined, permissionKey: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[permissionKey]?.includes(role) ?? false;
}
