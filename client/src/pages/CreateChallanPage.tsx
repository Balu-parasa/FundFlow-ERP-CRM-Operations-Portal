import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Users, Package, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import GlassCard from '../components/shared/GlassCard';

interface Customer {
  id: number;
  name: string;
  businessName: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  currentStock: number;
  unitPrice: number;
}

interface ChallanItemInput {
  productId: number;
  quantity: number;
  selectedProduct?: Product;
}

export default function CreateChallanPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [items, setItems] = useState<ChallanItemInput[]>([
    { productId: 0, quantity: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          api('/customers?limit=100', { token }),
          api('/products?limit=100', { token }),
        ]);
        setCustomers((custRes.data as any)?.customers || custRes.data || []);
        setProducts((prodRes.data as any)?.products || prodRes.data || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch initial data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleAddItem = () => {
    setItems([...items, { productId: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      showToast('A challan must contain at least one item', 'warning');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: number) => {
    const selectedProduct = products.find((p) => p.id === productId);
    const newItems = [...items];
    newItems[index] = {
      productId,
      quantity: newItems[index].quantity,
      selectedProduct,
    };
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const calculateTotals = () => {
    let totalQty = 0;
    let totalVal = 0;
    
    items.forEach((item) => {
      if (item.selectedProduct) {
        totalQty += item.quantity;
        totalVal += item.quantity * item.selectedProduct.unitPrice;
      }
    });

    return { totalQty, totalVal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'warning');
      return;
    }

    // Validate items
    const invalidItem = items.find((item) => item.productId === 0 || item.quantity <= 0);
    if (invalidItem) {
      showToast('Please specify valid products and quantities', 'warning');
      return;
    }

    // Check duplicate products
    const productIds = items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (productIds.length !== uniqueProductIds.size) {
      showToast('Cannot add duplicate products to a challan', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: Number(selectedCustomerId),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await api('/challans', {
        method: 'POST',
        token,
        body: payload,
      });

      showToast('Challan created as DRAFT');
      navigate(`/challans/${(res.data as any).id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create challan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { totalQty, totalVal } = calculateTotals();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button className="btn-ghost p-2 -ml-2 mb-2"><ArrowLeft className="w-5 h-5" /></button>
        <div className="skeleton h-8 w-60 mb-4" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/challans')}
          className="btn-ghost p-2 -ml-2 hover:bg-white/[0.05]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Create Sales Challan</h1>
      </div>

      {/* Visual Steps Indicator */}
      <div className="grid grid-cols-3 gap-2 py-2 max-w-lg">
        {[
          { step: '01', title: 'Customer', icon: Users, active: true },
          { step: '02', title: 'Products', icon: Package, active: items.some((i) => i.productId > 0) },
          { step: '03', title: 'Review', icon: FileText, active: selectedCustomerId !== '' && items.every((i) => i.productId > 0 && i.quantity > 0) },
        ].map((s) => (
          <div key={s.step} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
            s.active ? 'border-accent-burgundy/30 bg-accent-burgundy/5 text-text-primary' : 'border-border-base text-text-muted'
          }`} style={s.active ? { borderColor: 'rgba(74, 23, 37, 0.3)', backgroundColor: 'rgba(74, 23, 37, 0.05)' } : undefined}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              s.active ? 'bg-accent-burgundy text-white' : 'bg-white/[0.03] text-text-muted'
            }`} style={s.active ? { backgroundColor: 'var(--color-accent-burgundy)' } : undefined}>{s.step}</span>
            <span>{s.title}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <GlassCard padding="p-6">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: 'var(--color-accent-burgundy)' }} />
              Customer Information
            </h3>
            <div>
              <label className="input-label">Select Customer *</label>
              <select
                required
                className="input-field"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Search and Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.businessName})
                  </option>
                ))}
              </select>
            </div>
          </GlassCard>

          {/* Product Items Selection */}
          <GlassCard padding="p-6">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-ghost text-xs gap-1 py-1 hover:bg-white/[0.05]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </h3>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 rounded-xl bg-white/[0.02] border border-border-base relative"
                >
                  <div className="flex-1">
                    <label className="input-label">Product *</label>
                    <select
                      required
                      className="input-field text-xs"
                      value={item.productId || ''}
                      onChange={(e) => handleProductChange(index, Number(e.target.value))}
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku}) — ₹{Number(p.unitPrice).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="input-label">Qty *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="input-field text-xs text-center"
                      value={item.quantity || ''}
                      onChange={(e) => handleQuantityChange(index, Math.max(1, parseInt(e.target.value) || 0))}
                    />
                  </div>

                  {item.selectedProduct && (
                    <div className="flex flex-col justify-end text-[10px] w-24">
                      <span className="text-text-muted block">Stock: {item.selectedProduct.currentStock} units</span>
                      <span className="text-text-secondary font-semibold mt-1">₹{(item.quantity * item.selectedProduct.unitPrice).toLocaleString()}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="btn-ghost text-danger hover:text-danger hover:bg-danger/10 p-2 rounded-xl shrink-0 self-end"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Sidebar - Summary */}
        <div className="space-y-6">
          <GlassCard padding="p-6" className="sticky top-24">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Summary</h3>
            <div className="space-y-3 text-xs pb-4 border-b border-border-base">
              <div className="flex justify-between text-text-muted">
                <span>Selected Items:</span>
                <span className="font-semibold text-text-secondary">{items.filter((i) => i.productId > 0).length} lines</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Total Quantity:</span>
                <span className="font-semibold text-text-secondary">{totalQty} units</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Total Valuation:</span>
                <span className="font-semibold text-text-secondary">₹{totalVal.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center text-sm"
              >
                {isSubmitting ? 'Creating...' : 'Save Draft Challan'}
              </button>
            </div>
          </GlassCard>
        </div>
      </form>
    </div>
  );
}
