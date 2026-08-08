import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Calendar, Filter } from 'lucide-react';
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

interface Challan {
  id: number;
  challanNumber: string;
  customer: {
    name: string;
  };
  totalQuantity: number;
  status: string;
  createdAt: string;
}

export default function ChallansPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchChallans = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const res = await api(`/challans?${params.toString()}`, { token });
      setChallans((res.data as any)?.challans || res.data || []);
      
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch challans', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChallans();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, status, page, token]);

  return (
    <div>
      <PageHeader
        title="Sales Challans"
        subtitle="Track outgoing orders and inventory commitments."
        actions={
          hasPermission(user?.role, 'challan:create') && (
            <button onClick={() => navigate('/challans/create')} className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Challan
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
              placeholder="Search challan number..."
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="input-field pl-9 py-1.5 text-xs w-full md:w-40"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingState type="table" />
        ) : challans.length === 0 ? (
          <EmptyState
            title="No challans found"
            message="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Total Quantity</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <span className="font-semibold text-text-primary text-sm">{ch.challanNumber}</span>
                    </td>
                    <td>{ch.customer?.name || '—'}</td>
                    <td>{ch.totalQuantity} items</td>
                    <td><StatusBadge status={ch.status} /></td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/challans/${ch.id}`)}
                          className="btn-ghost p-1.5"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Footer info & Pagination */}
        {!isLoading && challans.length > 0 && (
          <div className="p-4 border-t border-border-base flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Showing <span className="font-medium text-text-secondary">{challans.length}</span> of <span className="font-medium text-text-secondary">{totalRecords}</span> records
            </p>
            <div className="mt-[-1.5rem]">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
