import React, { useState } from 'react';
import { Mail, Lock, User, Briefcase, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SALES');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signup(name, email, password, role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-base)' }}>
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative z-10 p-12">
        <div className="max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'var(--color-accent-burgundy)' }}>
              <span className="text-white text-xl font-bold">F</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                FundsRoom
              </h1>
              <p className="text-xs text-text-muted font-medium tracking-wider uppercase">
                ERP Operations
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-text-primary leading-tight mb-4">
            Join the workspace.
          </h2>
          <p className="text-text-muted text-sm leading-relaxed mb-10">
            Create an account to start managing customers, tracking inventory, and processing sales challans instantly.
          </p>

          {/* Decorative cards */}
          <div className="flex gap-3">
            {['CRM', 'Inventory', 'Challans'].map((label) => (
              <div
                key={label}
                className="glass-card px-4 py-3 flex-1 text-center"
              >
                <p className="text-xs font-semibold text-text-secondary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Signup Form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--color-accent-burgundy)' }}>
              <span className="text-white text-lg font-bold">F</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary">FundsRoom ERP</h1>
          </div>

          <div className="glass-panel p-8">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-text-primary mb-1">
                Create an account
              </h3>
              <p className="text-sm text-text-muted">
                Sign up to access your workspace
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div
                className="flex items-center gap-3 p-3 mb-6 rounded-xl border"
                style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-danger)' }} />
                <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="input-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="input-field !pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="input-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="input-field !pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-field !pl-10"
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="input-label">Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted z-10" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input-field !pl-10"
                    required
                  >
                    <option value="SALES">Sales</option>
                    <option value="WAREHOUSE">Warehouse</option>
                    <option value="ACCOUNTS">Accounts</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center text-sm py-3 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-[spin_0.6s_linear_infinite]" />
                    Signing up...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 pt-5 border-t border-border-base text-center">
              <p className="text-sm text-text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold" style={{ color: 'var(--color-accent-burgundy)' }}>
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
