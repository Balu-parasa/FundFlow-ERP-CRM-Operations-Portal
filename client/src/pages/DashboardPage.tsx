import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  Plus,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { hasPermission, hasNavAccess } from '../lib/permissions';
import MetricCard from '../components/shared/MetricCard';
import GlassCard from '../components/shared/GlassCard';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingState from '../components/shared/LoadingState';

interface DashboardData {
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalChallans: number;
  recentChallans: Array<{
    id: number;
    challanNumber: string;
    customer: { name: string };
    status: string;
    totalQuantity: number;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: number;
    name: string;
    sku: string;
    currentStock: number;
    minimumStock: number;
  }>;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [customersRes, productsRes, challansRes, lowStockRes] = await Promise.all([
          hasNavAccess(user?.role, 'customers')
            ? api('/customers?limit=1', { token })
            : Promise.resolve({ pagination: { total: 0 } }),
          api('/products?limit=1', { token }),
          api('/challans?limit=5', { token }),
          api('/products/low-stock?limit=5', { token }).catch(() => ({ data: [] })),
        ]);

        const customersTotal = (customersRes as { pagination?: { total?: number } })?.pagination?.total || 0;
        const productsTotal = (productsRes as { pagination?: { total?: number } })?.pagination?.total || 0;
        const challansTotal = (challansRes as { pagination?: { total?: number } })?.pagination?.total || 0;
        const recentChallans = (challansRes as { data?: { challans?: unknown[] } })?.data?.challans || (challansRes as { data?: unknown[] })?.data || [];
        const lowStockProducts = (lowStockRes as { data?: unknown[] })?.data || [];

        setData({
          totalCustomers: customersTotal,
          totalProducts: productsTotal,
          lowStockCount: Array.isArray(lowStockProducts) ? lowStockProducts.length : 0,
          totalChallans: challansTotal,
          recentChallans: recentChallans as DashboardData['recentChallans'],
          lowStockProducts: lowStockProducts as DashboardData['lowStockProducts'],
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [token, user?.role]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-72 mb-2" />
        <div className="skeleton h-4 w-96" />
        <LoadingState type="cards" />
      </div>
    );
  }

  const quickActions = [
    {
      label: 'Add Customer',
      icon: Users,
      path: '/customers',
      permission: 'customer:create',
      nav: 'customers',
    },
    {
      label: 'Add Product',
      icon: Package,
      path: '/products',
      permission: 'product:create',
      nav: 'products',
    },
    {
      label: 'Create Challan',
      icon: FileText,
      path: '/challans/create',
      permission: 'challan:create',
      nav: 'challans',
    },
  ].filter(
    (a) => hasPermission(user?.role, a.permission) && hasNavAccess(user?.role, a.nav)
  );

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {getGreeting()},{' '}
          <span style={{ color: 'var(--color-accent-burgundy)' }}>{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Here's what's happening across your operations.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasNavAccess(user?.role, 'customers') && (
          <MetricCard
            icon={Users}
            value={data?.totalCustomers || 0}
            label="Total Customers"
            subtitle="Active CRM records"
            accentColor="rgba(74, 23, 37, 0.1)"
            delay={0}
          />
        )}
        <MetricCard
          icon={Package}
          value={data?.totalProducts || 0}
          label="Total Products"
          subtitle="Tracked inventory items"
          accentColor="rgba(5, 150, 105, 0.1)"
          delay={0.05}
        />
        <MetricCard
          icon={AlertTriangle}
          value={data?.lowStockCount || 0}
          label="Low Stock"
          subtitle="Items below minimum"
          accentColor="rgba(217, 119, 6, 0.1)"
          delay={0.1}
        />
        <MetricCard
          icon={FileText}
          value={data?.totalChallans || 0}
          label="Total Challans"
          subtitle="Sales documents"
          accentColor="rgba(37, 99, 235, 0.1)"
          delay={0.15}
        />
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="btn-secondary text-xs gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Two-column grid: Recent Challans + Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Challans */}
        <GlassCard padding="p-0">
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Recent Challans
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                Latest sales documents
              </p>
            </div>
            <button
              onClick={() => navigate('/challans')}
              className="btn-ghost text-xs gap-1"
            >
              View all
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Qty</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentChallans && data.recentChallans.length > 0 ? (
                  data.recentChallans.map((ch) => (
                    <tr
                      key={ch.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/challans/${ch.id}`)}
                    >
                      <td className="font-medium text-text-primary text-xs">
                        {ch.challanNumber}
                      </td>
                      <td className="text-xs">{ch.customer?.name || '—'}</td>
                      <td>
                        <StatusBadge status={ch.status} />
                      </td>
                      <td className="text-xs">{ch.totalQuantity}</td>
                      <td className="text-xs flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-text-muted" />
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-text-muted text-xs">
                      No challans yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Inventory Alerts */}
        <GlassCard padding="p-0">
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Inventory Alerts
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                Products below minimum stock
              </p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="btn-ghost text-xs gap-1"
            >
              View all
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5 pt-2 space-y-3">
            {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
              data.lowStockProducts.map((product) => {
                const percentage = product.minimumStock > 0
                  ? Math.min((product.currentStock / product.minimumStock) * 100, 100)
                  : 100;
                const level = percentage <= 30 ? 'critical' : percentage <= 60 ? 'low' : 'healthy';

                return (
                  <div
                    key={product.id}
                    className="glass-card p-4 cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-text-primary">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          SKU {product.sku}
                        </p>
                      </div>
                      <span className="badge badge-warning text-[10px]">Low Stock</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="stock-bar flex-1">
                        <div
                          className={`stock-bar-fill ${level}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary font-medium whitespace-nowrap">
                        {product.currentStock} / {product.minimumStock}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-text-muted text-xs">
                No low stock alerts
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
