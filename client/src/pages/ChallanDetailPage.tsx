import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Calendar, User, Building2, Package, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { hasPermission } from '../lib/permissions';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingState from '../components/shared/LoadingState';
import GlassCard from '../components/shared/GlassCard';
import ConfirmDialog from '../components/shared/ConfirmDialog';

interface ChallanItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

interface ChallanDetail {
  id: number;
  challanNumber: string;
  customerId: number;
  customer: {
    name: string;
    businessName: string;
  };
  totalQuantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  user: {
    name: string;
  };
  items: ChallanItem[];
}

export default function ChallanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [challan, setChallan] = useState<ChallanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const fetchChallan = async () => {
    try {
      const res = await api(`/challans/${id}`, { token });
      setChallan(res.data as ChallanDetail);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch challan', 'error');
      navigate('/challans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id, token]);

  const handleConfirmChallan = async () => {
    setIsActioning(true);
    try {
      await api(`/challans/${id}/confirm`, {
        method: 'POST',
        token,
      });
      showToast('Challan confirmed and stock deducted successfully');
      setIsConfirmDialogOpen(false);
      fetchChallan();
    } catch (err: any) {
      showToast(err.message || 'Failed to confirm challan', 'error');
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancelChallan = async () => {
    setIsActioning(true);
    try {
      await api(`/challans/${id}/cancel`, {
        method: 'POST',
        token,
      });
      showToast('Challan cancelled successfully');
      setIsCancelDialogOpen(false);
      fetchChallan();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel challan', 'error');
    } finally {
      setIsActioning(false);
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

  if (!challan) return null;

  const totalValuation = challan.items.reduce(
    (acc, item) => acc + item.quantity * Number(item.unitPrice),
    0
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button 
          onClick={() => navigate('/challans')}
          className="btn-ghost p-2 -ml-2 -mt-1 hover:bg-white/[0.05]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {challan.challanNumber}
              </h1>
              <StatusBadge status={challan.status} />
            </div>
            <p className="text-sm text-text-muted flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {challan.customer?.name} ({challan.customer?.businessName})
            </p>
          </div>
          
          {challan.status === 'DRAFT' && hasPermission(user?.role, 'challan:confirm') && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCancelDialogOpen(true)}
                className="btn-danger text-xs gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancel Draft
              </button>
              <button 
                onClick={() => setIsConfirmDialogOpen(true)}
                className="btn-success text-xs gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm Challan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard padding="p-5" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-burgundy/10 flex items-center justify-center shrink-0" style={{ background: 'rgba(74, 23, 37, 0.1)' }}>
            <Calendar className="w-5 h-5" style={{ color: 'var(--color-accent-burgundy)' }} />
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Created Date</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {new Date(challan.createdAt).toLocaleString()}
            </p>
          </div>
        </GlassCard>

        <GlassCard padding="p-5" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(5, 150, 105, 0.1)' }}>
            <User className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Created By</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {challan.user?.name || 'System User'}
            </p>
          </div>
        </GlassCard>

        <GlassCard padding="p-5" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(217, 119, 6, 0.1)' }}>
            <Package className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Total Valuation</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              ₹{totalValuation.toLocaleString()}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Snapshot Information Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-border-base">
        <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-accent-burgundy)' }} />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-text-primary">Historical Item Snapshots</h4>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Product name, SKU, and unit price are locked historical snapshots captured at creation. Changes to product records will not affect these details.
          </p>
        </div>
      </div>

      {/* Items List */}
      <GlassCard padding="p-0">
        <div className="p-5 pb-3 border-b border-border-base">
          <h3 className="text-sm font-bold text-text-primary">Challan Line Items</h3>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-text-primary text-sm">{item.productName}</td>
                  <td className="font-mono text-xs">{item.sku}</td>
                  <td>₹{Number(item.unitPrice).toLocaleString()}</td>
                  <td>{item.quantity} units</td>
                  <td className="text-right font-semibold text-text-primary">
                    ₹{(item.quantity * Number(item.unitPrice)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="p-5 bg-white/[0.01] border-t border-border-base flex flex-col items-end gap-2 text-xs">
          <div className="flex justify-between w-64 text-text-muted">
            <span>Total Items Quantity:</span>
            <span className="font-semibold text-text-secondary">{challan.totalQuantity} units</span>
          </div>
          <div className="flex justify-between w-64 text-sm font-bold text-text-primary border-t border-border-subtle pt-2">
            <span>Grand Total:</span>
            <span style={{ color: 'var(--color-accent-burgundy)' }}>₹{totalValuation.toLocaleString()}</span>
          </div>
        </div>
      </GlassCard>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => !isActioning && setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmChallan}
        title="Confirm Sales Challan"
        message="Are you sure you want to confirm this challan? Stock levels will be atomically deducted and movement history logged immediately."
        confirmText="Confirm & Deduct"
        confirmVariant="success"
        isLoading={isActioning}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => !isActioning && setIsCancelDialogOpen(false)}
        onConfirm={handleCancelChallan}
        title="Cancel Draft Challan"
        message="Are you sure you want to cancel this draft? Once cancelled, it cannot be confirmed or modified."
        confirmText="Cancel Challan"
        confirmVariant="danger"
        isLoading={isActioning}
      />
    </div>
  );
}
