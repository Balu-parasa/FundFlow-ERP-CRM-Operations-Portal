import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Minus, History, Package, ShieldAlert, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { hasPermission } from '../lib/permissions';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingState from '../components/shared/LoadingState';
import GlassCard from '../components/shared/GlassCard';
import Modal from '../components/shared/Modal';

interface ProductDetail {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: number;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchProductAndHistory = async () => {
    try {
      const [prodRes, moveRes] = await Promise.all([
        api(`/products/${id}`, { token }),
        api(`/products/${id}/stock-movements`, { token }),
      ]);
      setProduct(prodRes.data as ProductDetail);
      setMovements((moveRes.data as StockMovement[]) || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch product details', 'error');
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndHistory();
  }, [id, token]);

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustQuantity <= 0) {
      showToast('Quantity must be greater than zero', 'warning');
      return;
    }

    if (adjustType === 'OUT' && product && adjustQuantity > product.currentStock) {
      showToast('Cannot adjust stock below available quantity', 'warning');
      return;
    }

    setIsAdjusting(true);
    try {
      await api(`/products/${id}/stock-movements`, {
        method: 'POST',
        token,
        body: {
          type: adjustType,
          quantity: adjustQuantity,
          reason: adjustReason || (adjustType === 'IN' ? 'Stock Inbound Adjustment' : 'Stock Outbound Adjustment'),
        },
      });
      showToast('Stock adjusted successfully');
      setIsAdjustModalOpen(false);
      setAdjustQuantity(0);
      setAdjustReason('');
      fetchProductAndHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button className="btn-ghost p-2 -ml-2 mb-2"><ArrowLeft className="w-5 h-5" /></button>
        <LoadingState type="detail" />
      </div>
    );
  }

  if (!product) return null;

  const stockPercentage = product.minimumStock > 0 ? Math.min((product.currentStock / product.minimumStock) * 100, 100) : 100;
  const stockLevel = stockPercentage <= 30 ? 'critical' : stockPercentage <= 60 ? 'low' : 'healthy';

  const previewStock = adjustType === 'IN' 
    ? product.currentStock + (adjustQuantity || 0)
    : product.currentStock - (adjustQuantity || 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button 
          onClick={() => navigate('/products')}
          className="btn-ghost p-2 -ml-2 -mt-1 hover:bg-white/[0.05]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{product.name}</h1>
              <StatusBadge status={product.status} />
              {product.currentStock <= product.minimumStock && (
                <StatusBadge status="LOW" />
              )}
            </div>
            <p className="text-sm text-text-muted font-mono">
              SKU: {product.sku}
            </p>
          </div>
          {hasPermission(user?.role, 'product:stock') && (
            <button 
              onClick={() => setIsAdjustModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Adjust Stock
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Stock KPI card */}
        <GlassCard padding="p-6" className="flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color: 'var(--color-accent-burgundy)' }} />
              Current Stock
            </h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-extrabold text-text-primary">{product.currentStock}</span>
              <span className="text-xs text-text-muted">units</span>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-border-base">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Minimum Stock Alert:</span>
              <span className="font-semibold text-text-secondary">{product.minimumStock} units</span>
            </div>
            <div className="stock-bar">
              <div className={`stock-bar-fill ${stockLevel}`} style={{ width: `${stockPercentage}%` }} />
            </div>
          </div>
        </GlassCard>

        {/* Pricing Card */}
        <GlassCard padding="p-6">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent-cyan" />
            Pricing & Value
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Unit Price</p>
              <p className="text-2xl font-bold text-text-primary">₹{Number(product.unitPrice).toLocaleString()}</p>
            </div>
            <div className="pt-4 border-t border-border-base">
              <p className="text-xs text-text-muted font-medium mb-0.5">Total Valuation</p>
              <p className="text-lg font-bold text-text-secondary">₹{(product.currentStock * product.unitPrice).toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        {/* Location & Metadata */}
        <GlassCard padding="p-6">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent-amber" />
            Warehouse Details
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted block mb-1">Warehouse Location</span>
              <span className="text-sm font-semibold text-text-primary">{product.warehouse}</span>
            </div>
            <div className="pt-3 border-t border-border-base">
              <span className="text-text-muted block mb-0.5">Category</span>
              <span className="font-semibold text-text-secondary">{product.category || 'Uncategorized'}</span>
            </div>
            <div className="pt-3 border-t border-border-base">
              <span className="text-text-muted block mb-0.5">Last System Update</span>
              <span className="font-semibold text-text-secondary">{new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Stock History */}
      <GlassCard padding="p-0">
        <div className="p-5 pb-3 flex items-center gap-2 border-b border-border-base">
          <History className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-bold text-text-primary">Stock Movement History</h3>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {movements.length > 0 ? (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td className="text-xs">{new Date(m.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${m.type === 'IN' ? 'badge-confirmed' : 'badge-cancelled'}`}>
                        {m.type === 'IN' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td className="font-semibold text-text-primary">{m.quantity} units</td>
                    <td>{m.reason}</td>
                    <td className="text-xs">{m.user?.name || 'System'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-text-muted text-xs">
                    No movements logged for this product.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => !isAdjusting && setIsAdjustModalOpen(false)}
        title="Adjust Inventory"
        subtitle={`Manually increment or decrement stock for ${product.name}.`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjustType('IN')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold ${
                adjustType === 'IN'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-border-base hover:bg-white/[0.03]'
              }`}
            >
              <Plus className="w-4 h-4" />
              Stock In
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('OUT')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold ${
                adjustType === 'OUT'
                  ? 'bg-danger/10 text-danger'
                  : 'border-border-base hover:bg-white/[0.03]'
              }`}
              style={adjustType === 'OUT' ? { borderColor: 'var(--color-danger)', color: 'var(--color-danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)' } : undefined}
            >
              <Minus className="w-4 h-4" />
              Stock Out
            </button>
          </div>

          <div>
            <label className="input-label">Adjustment Quantity *</label>
            <input
              required
              type="number"
              min="1"
              max={adjustType === 'OUT' ? product.currentStock : undefined}
              className="input-field"
              value={adjustQuantity || ''}
              onChange={(e) => setAdjustQuantity(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div>
            <label className="input-label">Reason *</label>
            <textarea
              required
              placeholder="e.g. Inbound shipment arrival, periodic audit, scrap, damage etc."
              className="input-field"
              rows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </div>

          {/* Live Preview Card */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-border-base text-xs space-y-2">
            <div className="flex justify-between text-text-muted">
              <span>Current Stock:</span>
              <span className="font-semibold">{product.currentStock} units</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Adjustment:</span>
              <span className={`font-semibold ${adjustType === 'IN' ? 'text-success' : 'text-danger'}`} style={{ color: adjustType === 'IN' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {adjustType === 'IN' ? '+' : '-'}{adjustQuantity || 0}
              </span>
            </div>
            <div className="flex justify-between text-text-primary border-t border-border-subtle pt-2 font-bold">
              <span>Preview Total:</span>
              <span className={previewStock < product.minimumStock ? 'text-danger' : 'text-success'} style={{ color: previewStock < product.minimumStock ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {previewStock} units
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-base">
            <button type="button" onClick={() => setIsAdjustModalOpen(false)} disabled={isAdjusting} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isAdjusting} className="btn-primary">
              {isAdjusting ? 'Adjusting...' : 'Submit Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
