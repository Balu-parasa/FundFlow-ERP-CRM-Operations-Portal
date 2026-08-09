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

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  customerType: string;
  status: string;
  followUpDate: string | null;
}

export default function CustomersPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'RETAIL',
    status: 'ACTIVE',
    address: '',
    followUpDate: '',
    notes: '',
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (customerType) params.append('customerType', customerType);

      const res = await api(`/customers?${params.toString()}`, { token });
      setCustomers((res.data as any)?.customers || res.data || []);
      
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch customers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, status, customerType, page, token]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'RETAIL',
      status: 'ACTIVE',
      address: '',
      followUpDate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const res = await api(`/customers/${id}`, { token });
      const customer = res.data as any;
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        businessName: customer.businessName,
        gstNumber: customer.gstNumber || '',
        customerType: customer.customerType || 'RETAIL',
        status: customer.status,
        address: customer.address || '',
        followUpDate: customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : '',
        notes: customer.notes || '',
      });
      setIsModalOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch customer details', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        ...formData,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
      };

      if (editingCustomer) {
        await api(`/customers/${editingCustomer.id}`, {
          method: 'PUT',
          token,
          body: payload,
        });
        showToast('Customer updated successfully');
      } else {
        await api('/customers', {
          method: 'POST',
          token,
          body: payload,
        });
        showToast('Customer created successfully');
      }
      
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customer relationships and follow-ups."
        actions={
          hasPermission(user?.role, 'customer:create') && (
            <button onClick={openAddModal} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Customer
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
              placeholder="Search customers..."
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="input-field pl-9 py-1.5 text-xs w-full md:w-36"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LEAD">Lead</option>
              </select>
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <select
                value={customerType}
                onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
                className="input-field pl-9 py-1.5 text-xs w-full md:w-36"
              >
                <option value="">All Types</option>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingState type="table" />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            message="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar w-8 h-8 opacity-80 shrink-0">
                          {c.name.substring(0, 2)}
                        </div>
                        <span className="font-medium text-text-primary">{c.name}</span>
                      </div>
                    </td>
                    <td>{c.businessName}</td>
                    <td>
                      <div className="flex flex-col text-xs">
                        <span>{c.mobile}</span>
                        <span className="text-text-muted">{c.email}</span>
                      </div>
                    </td>
                    <td><StatusBadge status={c.customerType} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      {c.followUpDate 
                        ? new Date(c.followUpDate).toLocaleDateString() 
                        : <span className="text-text-muted">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/customers/${c.id}`)}
                          className="btn-ghost p-1.5"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission(user?.role, 'customer:edit') && (
                          <button 
                            onClick={() => openEditModal(c.id)}
                            className="btn-ghost p-1.5"
                            title="Edit Customer"
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
        {!isLoading && customers.length > 0 && (
          <div className="p-4 border-t border-border-base flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Showing <span className="font-medium text-text-secondary">{customers.length}</span> of <span className="font-medium text-text-secondary">{totalRecords}</span> records
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
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        subtitle="Provide the customer's contact and business information."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border-base pb-2">Basic Information</h4>
              <div>
                <label className="input-label">Customer Name *</label>
                <input required type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Business Name *</label>
                <input required type="text" className="input-field" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Mobile *</label>
                  <input required type="text" className="input-field" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Email *</label>
                  <input required type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border-base pb-2">Business Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Customer Type *</label>
                  <select className="input-field" value={formData.customerType} onChange={(e) => setFormData({...formData, customerType: e.target.value})}>
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Status *</label>
                  <select className="input-field" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="LEAD">Lead</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">GST Number</label>
                <input type="text" className="input-field" value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Follow-up Date</label>
                <input type="date" className="input-field text-text-primary dark:[color-scheme:dark]" value={formData.followUpDate} onChange={(e) => setFormData({...formData, followUpDate: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="input-label">Address</label>
              <textarea className="input-field" rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}></textarea>
            </div>
            <div>
              <label className="input-label">Notes</label>
              <textarea className="input-field" rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-base">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
