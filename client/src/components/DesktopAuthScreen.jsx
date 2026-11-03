import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Eye,
  EyeOff,
  Laptop,
  Terminal,
  Cpu,
  Zap,
  Settings,
  HelpCircle
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function DesktopAuthScreen({ onAuthSuccess }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Google OAuth Config Modal
  const [showGoogleConfig, setShowGoogleConfig] = useState(false);
  const [googleClientIdInput, setGoogleClientIdInput] = useState('');
  const [savingGoogleConfig, setSavingGoogleConfig] = useState(false);

  // Local engine info
  const [engineHealth, setEngineHealth] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(() => setEngineHealth(true))
      .catch(() => setEngineHealth(false));
  }, []);

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setNewPassword('');
  };

  const handleSwitchTab = (newTab) => {
    resetForm();
    setTab(newTab);
    setForgotStep(1);
  };

  // Sign In Handler
  const handleSignIn = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide an email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Real Direct Google OAuth Handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Google OAuth URL from backend
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();

      if (!res.ok || !data.configured || !data.url) {
        // If not configured, open direct config dialog
        setShowGoogleConfig(true);
        setLoading(false);
        return;
      }

      // 2. Open real Google OAuth consent screen in external browser
      if (typeof window !== 'undefined' && window.agentBoardDesktop?.openExternal) {
        window.agentBoardDesktop.openExternal(data.url);
      } else {
        window.open(data.url, '_blank');
      }

      setSuccessMsg('Google OAuth opened in your system browser. Log in there to unlock your cockpit.');
    } catch (err) {
      setError(err.message || 'Failed to initialize Google authentication');
    } finally {
      setLoading(false);
    }
  };

  // Save Google Client ID
  const handleSaveGoogleConfig = async (e) => {
    e?.preventDefault();
    if (!googleClientIdInput.trim()) {
      setError('Please enter a valid Google Client ID');
      return;
    }
    setSavingGoogleConfig(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: googleClientIdInput.trim() })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save Google Client ID');

      setShowGoogleConfig(false);
      setSuccessMsg('Google Client ID configured! Click Continue with Google to authenticate.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingGoogleConfig(false);
    }
  };

  // Forgot Password: Step 1 (Send OTP)
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Please enter your registered email address');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request OTP');

      setSuccessMsg(`Recovery OTP dispatched! Code: ${data.otpPreview}`);
      setForgotStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 2 (Verify OTP)
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otpCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code');

      setSuccessMsg('OTP verified! Now enter your new password.');
      setForgotStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 3 (Reset Password)
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otpCode.trim(), newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMsg('Password reset successfully! Please sign in with your new password.');
      setTab('signin');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Native Workstation Header */}
      <header className="border-b border-gold-500/20 bg-ivory-100/90 dark:bg-obsidian-900/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div 
          onClick={() => {
            if (window.location.pathname === '/' && !window.location.search && !window.location.hash) {
              window.location.reload();
            } else {
              window.location.href = '/';
            }
          }}
          className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition select-none group"
          title="Refresh and return to homepage"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 p-0.5 shadow-gold-sm shrink-0 group-hover:scale-105 transition">
            <div className="w-full h-full bg-ivory-100 dark:bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-4 h-4 text-gold-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-sm tracking-tight text-slate-900 dark:text-white group-hover:text-gold-500 transition">
                AGENT<span className="text-gold-500">BOARD</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/30">
                Desktop Workstation v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Native AI Coding Agent Fleet Mission Control
            </p>
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-ivory-200 dark:bg-obsidian-850 border border-gold-500/25 text-xs">
            <span className={`w-2 h-2 rounded-full ${engineHealth ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
              {engineHealth ? 'Local Daemon Active (3001)' : 'Daemon Disconnected'}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Authentication Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gold-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-md bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 rounded-3xl p-6 sm:p-8 shadow-gold-md relative">
          {/* Header Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {tab === 'signin' && 'Sign In to Workstation'}
              {tab === 'signup' && 'Create Local Account'}
              {tab === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tab === 'signin' && 'Access your local agent fleet and sub-second steering cockpit'}
              {tab === 'signup' && 'Register your local account to manage and steer AI coding agents'}
              {tab === 'forgot' && 'Verify with a 6-digit OTP code to restore access'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-ivory-200 dark:bg-obsidian-950 p-1 mb-6 border border-gold-500/20 text-xs font-bold">
            <button
              onClick={() => handleSwitchTab('signin')}
              className={`flex-1 py-2 rounded-lg transition ${
                tab === 'signin'
                  ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleSwitchTab('signup')}
              className={`flex-1 py-2 rounded-lg transition ${
                tab === 'signup'
                  ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => handleSwitchTab('forgot')}
              className={`flex-1 py-2 rounded-lg transition ${
                tab === 'forgot'
                  ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Forgot
            </button>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Real Direct Google Sign-In Button */}
          {tab !== 'forgot' && (
            <div className="mb-5 space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-xl bg-ivory-200 dark:bg-obsidian-950 hover:bg-ivory-300 dark:hover:bg-obsidian-850 border border-gold-500/30 hover:border-gold-500/60 transition text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm group"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-black/10 dark:border-white/10 w-full" />
                <span className="bg-ivory-100 dark:bg-obsidian-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or with email
                </span>
                <div className="border-t border-black/10 dark:border-white/10 w-full" />
              </div>
            </div>
          )}

          {/* Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@local"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-xs shadow-gold-sm transition hover:scale-[1.01] flex items-center justify-center space-x-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In to Cockpit →</span>}
              </button>
            </form>
          )}

          {/* Create Account Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Agent Commander"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@local"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-xs shadow-gold-sm transition hover:scale-[1.01] flex items-center justify-center space-x-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Account & Unlock Cockpit →</span>}
              </button>
            </form>
          )}

          {/* Forgot Password OTP Flow */}
          {tab === 'forgot' && (
            <div className="space-y-4">
              {forgotStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Enter Your Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="developer@local"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gold-500 text-obsidian-950 font-black text-xs hover:bg-gold-400 transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Recovery OTP Code</span>}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-center font-mono text-base tracking-widest text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gold-500 text-obsidian-950 font-black text-xs hover:bg-gold-400 transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify OTP Code</span>}
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      New Password (min 6 chars)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 font-black text-xs hover:scale-[1.01] transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password & Return to Sign In</span>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal for Google Client ID Configuration */}
        {showGoogleConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/40 rounded-2xl p-6 max-w-lg w-full shadow-gold-lg">
              <div className="flex items-center space-x-2 text-gold-500 mb-2">
                <Settings className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Configure Google OAuth 2.0
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Agent Board uses <strong>real direct Google OAuth 2.0</strong> with Google's official authorization servers. To connect with your Google account:
              </p>

              <div className="bg-ivory-200 dark:bg-obsidian-950 p-3.5 rounded-xl border border-black/10 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 space-y-2 mb-4 font-mono">
                <div>1. Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-gold-500 underline font-semibold">Google Cloud Console → Credentials</a>.</div>
                <div>2. Create an <strong>OAuth 2.0 Client ID</strong> (Web application).</div>
                <div>3. Add Authorized redirect URI:</div>
                <div className="p-2 bg-black/20 dark:bg-black/50 rounded text-gold-400 break-all select-all">
                  http://localhost:3001/api/auth/google/callback
                </div>
              </div>

              <form onSubmit={handleSaveGoogleConfig} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Google Client ID
                  </label>
                  <input
                    type="text"
                    required
                    value={googleClientIdInput}
                    onChange={(e) => setGoogleClientIdInput(e.target.value)}
                    placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleConfig(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel / Use Email
                  </button>
                  <button
                    type="submit"
                    disabled={savingGoogleConfig}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-gold-500 text-obsidian-950 hover:bg-gold-400 transition"
                  >
                    {savingGoogleConfig ? 'Saving...' : 'Save & Enable Google Login'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Workstation Footer: Scanner Beacons */}
      <footer className="border-t border-gold-500/15 bg-ivory-100/60 dark:bg-obsidian-900/60 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <Terminal className="w-3.5 h-3.5 text-gold-500" />
            <span className="font-semibold">OpenCode</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold">Claude Code</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">Cursor AI</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold">Antigravity</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span>Local SQLite Introspection</span>
          <span>•</span>
          <span className="text-gold-500">Sub-second Steering Engine</span>
        </div>
      </footer>
    </div>
  );
}
