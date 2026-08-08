import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, Building2, FileText, Calendar, MapPin, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { hasPermission } from '../lib/permissions';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingState from '../components/shared/LoadingState';
import GlassCard from '../components/shared/GlassCard';

interface CustomerDetail {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string | null;
  type: string;
  status: string;
  address: string | null;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api(`/customers/${id}`, { token });
        setCustomer(res.data as CustomerDetail);
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch customer', 'error');
        navigate('/customers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomer();
  }, [id, token, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button className="btn-ghost p-2 -ml-2 mb-2"><ArrowLeft className="w-5 h-5" /></button>
        <LoadingState type="detail" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button 
          onClick={() => navigate('/customers')}
          className="btn-ghost p-2 -ml-2 -mt-1 hover:bg-white/[0.05]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{customer.name}</h1>
              <StatusBadge status={customer.status} />
              <StatusBadge status={customer.type} />
            </div>
            <p className="text-sm text-text-muted flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {customer.businessName}
            </p>
          </div>
          {hasPermission(user?.role, 'customer:edit') && (
            <button 
              onClick={() => navigate('/customers')} // Typically opens an edit modal or navigates to edit page
              className="btn-secondary"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <GlassCard padding="p-6">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-accent-burgundy/10 flex items-center justify-center" style={{ background: 'rgba(74, 23, 37, 0.1)' }}>
              <Phone className="w-3.5 h-3.5" style={{ color: 'var(--color-accent-burgundy)' }} />
            </span>
            Contact Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-text-muted mt-0.5" />
              <div>
                <p className="text-xs text-text-muted font-medium mb-0.5">Email Address</p>
                <p className="text-sm font-medium text-text-primary">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-text-muted mt-0.5" />
              <div>
                <p className="text-xs text-text-muted font-medium mb-0.5">Mobile Number</p>
                <p className="text-sm font-medium text-text-primary">{customer.mobile}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Business Information */}
        <GlassCard padding="p-6">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-accent-emerald/10 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-accent-emerald" />
            </span>
            Business Details
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Hash className="w-4 h-4 text-text-muted mt-0.5" />
              <div>
                <p className="text-xs text-text-muted font-medium mb-0.5">GST Number</p>
                <p className="text-sm font-medium text-text-primary">
                  {customer.gstNumber || <span className="text-text-muted text-xs italic">Not provided</span>}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-text-muted mt-0.5" />
              <div>
                <p className="text-xs text-text-muted font-medium mb-0.5">Address</p>
                <p className="text-sm font-medium text-text-primary leading-relaxed">
                  {customer.address || <span className="text-text-muted text-xs italic">Not provided</span>}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes & Follow-up */}
        <GlassCard padding="p-6">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-accent-amber/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-accent-amber" />
            </span>
            Notes & Follow-up
          </h3>
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Calendar className="w-5 h-5 text-accent-amber" />
              <div>
                <p className="text-xs font-medium text-text-muted">Next Follow-up</p>
                <p className="text-sm font-bold text-text-primary">
                  {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No date scheduled'}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-text-muted font-medium mb-2">General Notes</p>
              <div className="p-4 rounded-xl bg-bg-elevated border border-border-base min-h-[100px]">
                {customer.notes ? (
                  <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
                ) : (
                  <p className="text-sm text-text-muted italic">No notes have been added yet.</p>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* System Info */}
        <GlassCard padding="p-6">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5 text-accent-cyan" />
            </span>
            System Record
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Record ID</p>
              <p className="text-sm font-medium text-text-primary">#{customer.id}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Created At</p>
              <p className="text-sm font-medium text-text-primary">
                {new Date(customer.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Last Updated</p>
              <p className="text-sm font-medium text-text-primary">
                {new Date(customer.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
