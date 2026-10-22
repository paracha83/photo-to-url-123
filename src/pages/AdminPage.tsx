import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  HardDrive,
  Database,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { AdminStats, ImageRecord } from '../types';
import { formatBytes } from '../lib/imageOptimizer';
import { useToast } from '../components/Toast';

export const AdminPage: React.FC = () => {
  const [adminSecret, setAdminSecret] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: adminSecret }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('imglink_admin_secret', adminSecret);
        showToast('Admin access granted', 'success');
        fetchStats(adminSecret);
      } else {
        showToast(data.message || 'Invalid admin secret', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Network error during authentication', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (secret: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: {
          'x-admin-secret': secret,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('imglink_admin_secret');
        showToast('Session expired or unauthorized', 'error');
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
      showToast('Failed to load admin stats', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('imglink_admin_secret');
    if (saved) {
      setAdminSecret(saved);
      setIsAuthenticated(true);
      fetchStats(saved);
    }
  }, []);

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm(`Permanently delete image ${id}? This cannot be undone.`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/images/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminSecret,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        fetchStats(adminSecret);
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Admin delete failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurgeExpired = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'x-admin-secret': adminSecret,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        fetchStats(adminSecret);
      } else {
        showToast(data.message || 'Cleanup failed', 'error');
      }
    } catch (err) {
      console.error('Cleanup error:', err);
      showToast('Cleanup request failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('imglink_admin_secret');
    setIsAuthenticated(false);
    setAdminSecret('');
    setStats(null);
    showToast('Logged out of admin panel', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-indigo-400" />
            Admin Console
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Server-side metrics, storage health, rate-limiting status, and object lifecycle controls.
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(adminSecret)}
              disabled={isLoading || actionLoading}
              className="p-2 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Refresh stats"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-rose-300 hover:border-rose-900/50 hover:bg-rose-950/20 transition-colors"
            >
              Log Out
            </button>
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        /* Login Card */
        <div className="max-w-md mx-auto py-12">
          <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Restricted Admin Access</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your configured environment secret key to access storage diagnostics and image management.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400 block mb-1.5">
                  Admin Secret Key
                </label>
                <input
                  type="password"
                  placeholder="Enter admin secret..."
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Authenticate</span>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : stats ? (
        /* Authenticated Admin Dashboard */
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Uploads</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{stats.totalUploads}</p>
              <span className="text-[11px] text-zinc-400">Active objects</span>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Storage</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{formatBytes(stats.totalBytes)}</p>
              <span className="text-[11px] text-zinc-400">Aggregated payload</span>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Storage Engine</span>
                <Server className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white uppercase font-mono">{stats.provider}</p>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Online & Healthy</span>
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Rate Limit</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{stats.uploadRateLimit} / hr</p>
              <span className="text-[11px] text-zinc-400">Per IP address</span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Max allowed size: {formatBytes(stats.maxUploadSizeBytes)}</span>
            </div>

            <button
              onClick={handlePurgeExpired}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Purge Expired Images Now</span>
            </button>
          </div>

          {/* Uploads List Table */}
          <div className="rounded-2xl border border-zinc-800 bg-[#18181B] overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Stored Images Inventory</h3>
              <span className="text-xs font-mono text-zinc-400">
                Showing {stats.recentUploads.length} items
              </span>
            </div>

            {stats.recentUploads.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-400">
                No image objects currently stored in the system.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-800 font-mono">
                    <tr>
                      <th className="py-3 px-4">Preview</th>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Filename</th>
                      <th className="py-3 px-4">MIME / Size</th>
                      <th className="py-3 px-4">Dimensions</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4">Retention</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {stats.recentUploads.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 px-4">
                          <img
                            src={item.publicUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-950 border border-zinc-800"
                            loading="lazy"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-mono text-indigo-300 font-semibold">{item.id}</td>
                        <td className="py-2.5 px-4 text-zinc-200 truncate max-w-xs" title={item.originalFilename}>
                          {item.originalFilename}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-zinc-400">
                          {item.mimeType.split('/')[1]?.toUpperCase()} · {formatBytes(item.size)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-zinc-400">
                          {item.width > 0 ? `${item.width}×${item.height}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-400 font-mono">
                          {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Permanent'}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2">
                          <a
                            href={item.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                            title="Open direct image"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteImage(item.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/40 transition-colors"
                            title="Permanently delete object"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
