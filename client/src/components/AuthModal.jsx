import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { 
  X, 
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
  Settings
} from 'lucide-react';

// Official Google SVG Logo
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

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'signin' }) {
  const [tab, setTab] = useState(initialTab); // 'signin' | 'signup' | 'forgot'
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

  if (!isOpen) return null;

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
      onClose();
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
      setError('Please provide your email and password');
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
      if (!res.ok) throw new Error(data.error || 'Failed to sign up');

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Real Direct Google OAuth 2.0 Handler
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const isDesktop = typeof window !== 'undefined' && Boolean(window.agentBoardDesktop?.isDesktop);

      // 1. Fetch official Google OAuth URL from backend
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();

      if (!res.ok || !data.configured || !data.url) {
        setError('Google Sign-In is temporarily unavailable. Please sign in with email & password or configure GOOGLE_CLIENT_ID on the server.');
        setLoading(false);
        return;
      }

      // 2. Open Google OAuth consent screen
      if (isDesktop && window.agentBoardDesktop?.openExternal) {
        window.agentBoardDesktop.openExternal(data.url);
        setSuccessMsg('Google sign-in opened in your system browser. Complete login there to unlock your cockpit.');
      } else {
        // Standard Web: Open centered popup and listen for postMessage completion
        const width = 500;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open(
          data.url,
          'agent_board_google_auth',
          `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup blocked by browser -> fallback to direct redirect
          window.location.href = data.url;
          return;
        }

        const handlePopupMessage = (event) => {
          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.token) {
            window.removeEventListener('message', handlePopupMessage);
            onAuthSuccess(event.data.user, event.data.token);
            onClose();
          }
        };
        window.addEventListener('message', handlePopupMessage);
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
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

      setSuccessMsg(`Recovery OTP dispatched! If in dev mode, code is: ${data.otpPreview}`);
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
        body: JSON.stringify({ email, otpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code');

      setSuccessMsg('OTP verified successfully! Now choose your new password.');
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
      setError('New password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMsg('Password updated! Please sign in with your new credentials.');
      setTimeout(() => {
        handleSwitchTab('signin');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/35 rounded-3xl shadow-gold-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-ivory-200 dark:bg-obsidian-950 border-b border-gold-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {tab === 'signin' && 'Sign In to Agent Board'}
                {tab === 'signup' && 'Create Your Account'}
                {tab === 'forgot' && 'Reset Password via OTP'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Universal Fleet Mission Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error / Success Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-ivory-200 dark:bg-obsidian-850 hover:bg-ivory-300 dark:hover:bg-obsidian-800 text-slate-800 dark:text-white border border-black/10 dark:border-white/10 font-bold flex items-center justify-center space-x-2 transition shadow-sm"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono uppercase">
                <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                <span>or sign in with email</span>
                <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="commander@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Password</label>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('forgot')}
                    className="text-[10px] font-mono text-gold-500 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-xs flex items-center justify-center space-x-2 shadow-gold-sm transition hover:scale-[1.01]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In to Mission Control</span>}
              </button>

              <div className="text-center pt-2 text-slate-400 text-xs">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchTab('signup')}
                  className="font-bold text-gold-500 hover:underline"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4 text-xs">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-ivory-200 dark:bg-obsidian-850 hover:bg-ivory-300 dark:hover:bg-obsidian-800 text-slate-800 dark:text-white border border-black/10 dark:border-white/10 font-bold flex items-center justify-center space-x-2 transition shadow-sm"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Sign up with Google</span>
              </button>

              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono uppercase">
                <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                <span>or sign up with email</span>
                <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Display Name (Optional)</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Fleet Commander"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="commander@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Password (min 6 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-xs flex items-center justify-center space-x-2 shadow-gold-sm transition hover:scale-[1.01]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Account & Enter Fleet</span>}
              </button>

              <div className="text-center pt-2 text-slate-400 text-xs">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchTab('signin')}
                  className="font-bold text-gold-500 hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD (OTP RECOVERY) */}
          {tab === 'forgot' && (
            <div className="space-y-4 text-xs">
              {/* Step indicator */}
              <div className="flex items-center justify-between px-2 text-[10px] font-mono text-gold-500">
                <span className={forgotStep === 1 ? 'font-bold underline' : 'opacity-60'}>1. Enter Email</span>
                <span>→</span>
                <span className={forgotStep === 2 ? 'font-bold underline' : 'opacity-60'}>2. 6-Digit OTP</span>
                <span>→</span>
                <span className={forgotStep === 3 ? 'font-bold underline' : 'opacity-60'}>3. New Password</span>
              </div>

              {/* Step 1: Email Form */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <p className="text-slate-400 text-xs">
                    Enter your registered email address and we will dispatch a secure 6-digit one-time passcode.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="commander@example.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gold-500 text-obsidian-950 font-bold hover:bg-gold-400 transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Send 6-Digit Code'}
                  </button>
                </form>
              )}

              {/* Step 2: OTP Entry Form */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-slate-400 text-xs">
                    Please enter the 6-digit OTP code sent to <strong className="text-white">{email}</strong>.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">6-Digit OTP Code</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gold-500" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/40 text-slate-900 dark:text-white font-mono text-base tracking-[0.3em] font-black text-center focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-gold-500 hover:underline"
                    >
                      Resend Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-slate-400 hover:text-white"
                    >
                      Change Email
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gold-500 text-obsidian-950 font-bold hover:bg-gold-400 transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Verify Code'}
                  </button>
                </form>
              )}

              {/* Step 3: New Password Form */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-slate-400 text-xs">
                    Enter your new password to complete the account recovery.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 font-black hover:scale-[1.01] transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Set New Password & Sign In'}
                  </button>
                </form>
              )}

              <div className="text-center pt-2 text-slate-400 text-xs">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchTab('signin')}
                  className="font-bold text-gold-500 hover:underline"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
