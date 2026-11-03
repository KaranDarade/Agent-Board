import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  Lock, 
  Trash2, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  ShieldCheck,
  Key,
  DownloadCloud,
  Laptop
} from 'lucide-react';
import DesktopUpdateModal from './DesktopUpdateModal.jsx';

export default function UserProfileModal({ isOpen, onClose, user, token, onProfileUpdated, onSignOut }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'updates' | 'danger'
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  if (!isOpen || !user) return null;

  // Update profile
  const handleUpdateProfile = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setSuccess('Profile updated successfully');
      onProfileUpdated({ ...user, displayName: data.user.display_name });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      setSuccess('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete account');

      onSignOut();
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const createdDateStr = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Recently';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/35 rounded-3xl shadow-gold-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-ivory-200 dark:bg-obsidian-950 border-b border-gold-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center font-bold text-obsidian-950 shadow-gold-sm">
              {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {user.displayName || 'Fleet Commander'}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-black/5 dark:border-white/5 px-4 pt-2 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('profile'); setError(null); setSuccess(null); }}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => { setActiveTab('password'); setError(null); setSuccess(null); }}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'password'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => { setActiveTab('updates'); setError(null); setSuccess(null); }}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'updates'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Updates
          </button>
          <button
            onClick={() => { setActiveTab('danger'); setError(null); setSuccess(null); }}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'danger'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-red-400'
            }`}
          >
            Danger Zone
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="p-3 rounded-2xl bg-ivory-200/50 dark:bg-obsidian-950/60 border border-black/5 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-gold-500" />
                    <span>Email Address</span>
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{user.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gold-500" />
                    <span>Member Since</span>
                  </span>
                  <span>{createdDateStr}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                  <span className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Provider</span>
                  </span>
                  <span className="capitalize">{user.provider || 'Email'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Display Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Fleet Commander"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 font-bold hover:bg-gold-400 transition"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-850 hover:bg-red-500/10 hover:text-red-400 text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gold-500 text-obsidian-950 font-bold hover:bg-gold-400 transition mt-2"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* TAB: UPDATES */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-ivory-200/50 dark:bg-obsidian-950/60 border border-black/5 dark:border-white/5 space-y-3">
                <div className="flex items-center space-x-2 text-gold-500 font-bold text-xs">
                  <Laptop className="w-4 h-4" />
                  <span>Desktop Cockpit Version & Auto-Updates</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Agent Board delivers background binary updates through GitHub Releases. Whenever a new version is released, the desktop client will download it and allow you to restart to apply immediately.
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  <span>Current Version:</span>
                  <span className="font-bold text-gold-500">v1.0.0 (Production Release)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-bold transition flex items-center justify-center space-x-2 shadow-gold-sm"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Open Update Manager & Check Now</span>
              </button>
            </div>
          )}

          {/* TAB: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2 text-red-300">
                <div className="flex items-center space-x-2 font-bold text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Permanent Account Deletion</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Deleting your account will purge all personal profile records, revoke active desktop and web sessions, and reset your saved local preferences.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">
                  Type <strong className="text-red-400">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-red-500/30 text-red-400 font-mono text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading || confirmDeleteText !== 'DELETE'}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold transition flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete My Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <DesktopUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  );
}
