import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { hasPermission } from '../lib/permissions';
import PageHeader from '../components/shared/PageHeader';
import SearchInput from '../components/shared/SearchInput';
import StatusBadge from '../components/shared/StatusBadge';
import GlassCard from '../components/shared/GlassCard';
import Pagination from '../components/shared/Pagination';
import LoadingState from '../components/shared/LoadingState';
import EmptyState from '../components/shared/EmptyState';
import Modal from '../components/shared/Modal';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
  status: string;
}

export default function ProductsPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minimumStock: 0,
    warehouse: 'Main Warehouse',
    status: 'ACTIVE',
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const endpoint = lowStock ? '/products/low-stock' : '/products';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (warehouse) params.append('warehouse', warehouse);

      const res = await api(`${endpoint}?${params.toString()}`, { token });
      setProducts((res.data as any)?.products || res.data || []);
      
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      } else {
        setTotalPages(1);
        setTotalRecords(Array.isArray(res.data) ? res.data.length : ((res.data as any)?.products?.length || 0));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, warehouse, lowStock, page, token]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 10,
      warehouse: 'Main Warehouse',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const res = await api(`/products/${id}`, { token });
      const product = res.data as Product;
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category || '',
        unitPrice: Number(product.unitPrice),
        currentStock: product.currentStock,
        minimumStock: product.minimumStock,
        warehouse: product.warehouse,
        status: product.status,
      });
      setIsModalOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch product details', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        ...formData,
        unitPrice: Number(formData.unitPrice),
        currentStock: Number(formData.currentStock),
        minimumStock: Number(formData.minimumStock),
      };

      if (editingProduct) {
        await api(`/products/${editingProduct.id}`, {
          method: 'PUT',
          token,
          body: payload,
        });
        showToast('Product updated successfully');
      } else {
        await api('/products', {
          method: 'POST',
          token,
          body: payload,
        });
        showToast('Product created successfully');
      }
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStockBar = (current: number, min: number) => {
    const percentage = min > 0 ? Math.min((current / min) * 100, 100) : 100;
    const level = percentage <= 30 ? 'critical' : percentage <= 60 ? 'low' : 'healthy';
    
    return (
      <div className="flex flex-col gap-1 w-32">
        <div className="flex items-center justify-between text-[10px] font-medium">
          <span className={level === 'critical' ? 'text-danger' : level === 'low' ? 'text-warning' : 'text-success'} style={{ color: level === 'critical' ? 'var(--color-danger)' : level === 'low' ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {current}
          </span>
          <span className="text-text-muted">Min {min}</span>
        </div>
        <div className="stock-bar">
          <div className={`stock-bar-fill ${level}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Monitor products, stock levels and warehouse movement."
        actions={
          hasPermission(user?.role, 'product:create') && (
            <button onClick={openAddModal} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )
        }
      />

      <GlassCard padding="p-0">
        {/* Filters */}
        <div className="p-4 border-b border-border-base flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-72">
            <SearchInput
              value={search}
              onChange={(v: string) => { setSearch(v); setPage(1); }}
              placeholder="Search products or SKU..."
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer p-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
              <input
                type="checkbox"
                checked={lowStock}
                onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
                className="rounded border-border-base bg-transparent focus:ring-offset-bg-surface"
                style={{ color: 'var(--color-accent-burgundy)' }}
              />
              <span className="text-xs font-medium text-text-secondary">Low Stock Only</span>
            </label>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <select
                value={warehouse}
                onChange={(e) => { setWarehouse(e.target.value); setPage(1); }}
                className="input-field pl-9 py-1.5 text-xs w-full md:w-40"
              >
                <option value="">All Warehouses</option>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Secondary Warehouse">Secondary Warehouse</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingState type="table" />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            message="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock Status</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary text-sm">{p.name}</span>
                        <span className="text-xs text-text-muted mt-0.5 font-mono">SKU: {p.sku}</span>
                      </div>
                    </td>
                    <td>{p.category || '—'}</td>
                    <td className="font-medium">₹{Number(p.unitPrice).toLocaleString()}</td>
                    <td>{renderStockBar(p.currentStock, p.minimumStock)}</td>
                    <td className="text-xs">{p.warehouse}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/products/${p.id}`)}
                          className="btn-ghost p-1.5"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission(user?.role, 'product:edit') && (
                          <button 
                            onClick={() => openEditModal(p.id)}
                            className="btn-ghost p-1.5"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Footer info & Pagination */}
        {!isLoading && products.length > 0 && (
          <div className="p-4 border-t border-border-base flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Showing <span className="font-medium text-text-secondary">{products.length}</span> of <span className="font-medium text-text-secondary">{totalRecords}</span> records
            </p>
            <div className="mt-[-1.5rem]">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </GlassCard>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        subtitle="Define product specifications, pricing, and stock alerts."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="input-label">Product Name *</label>
              <input required type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="input-label">SKU/Code *</label>
              <input required type="text" className="input-field" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} disabled={!!editingProduct} />
            </div>
            
            <div>
              <label className="input-label">Category</label>
              <input type="text" className="input-field" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
            </div>
            <div>
              <label className="input-label">Unit Price (₹) *</label>
              <input required type="number" min="0" step="0.01" className="input-field" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})} />
            </div>

            <div>
              <label className="input-label">Current Stock *</label>
              <input required type="number" min="0" className="input-field" value={formData.currentStock} onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})} disabled={!!editingProduct} />
            </div>
            <div>
              <label className="input-label">Minimum Stock Alert *</label>
              <input required type="number" min="0" className="input-field" value={formData.minimumStock} onChange={(e) => setFormData({...formData, minimumStock: Number(e.target.value)})} />
            </div>

            <div>
              <label className="input-label">Warehouse *</label>
              <select required className="input-field" value={formData.warehouse} onChange={(e) => setFormData({...formData, warehouse: e.target.value})}>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Secondary Warehouse">Secondary Warehouse</option>
              </select>
            </div>
            <div>
              <label className="input-label">Status *</label>
              <select className="input-field" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-base">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
