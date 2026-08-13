import { useState } from 'react';
import { authApi } from '../api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck, X } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const resetModalState = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) return setError('Please enter your email address.');

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess('Verification code sent! Please check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!otp || otp.length < 6) return setError('Please enter a valid 6-digit OTP code.');

    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      setSuccess('Code verified! Set your new password.');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email, otp, newPassword);
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        resetModalState();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={resetModalState}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl border border-slate-700 bg-gradient-to-tr from-slate-900 to-slate-800 text-slate-200 shadow-md">
            {step === 1 && <Mail className="size-6 text-sky-400" />}
            {step === 2 && <ShieldCheck className="size-6 text-emerald-400" />}
            {step === 3 && <KeyRound className="size-6 text-indigo-400" />}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Reset Your Password'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {step === 1 && 'Enter your registered email to receive an OTP verification code.'}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && 'Create a strong new password for your account.'}
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-400">
            {success}
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-xs font-semibold text-slate-300">
                Email Address
              </Label>
              <Input
                id="reset-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 border-slate-800 bg-slate-950/50 text-white placeholder:text-slate-500 focus-visible:ring-slate-400"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-slate-100 font-semibold text-slate-950 hover:bg-white hover:text-black transition-all"
            >
              {loading ? 'Sending Code...' : 'Send OTP'}
            </Button>
          </form>
        )}

        {/* STEP 2: Enter 6-digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp-input" className="text-xs font-semibold text-slate-300">
                6-Digit Verification Code
              </Label>
              <Input
                id="otp-input"
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="h-11 text-center text-lg tracking-[8px] font-mono border-slate-800 bg-slate-950/50 text-white placeholder:text-slate-600 focus-visible:ring-slate-400"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-slate-200 underline"
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="text-sky-400 hover:text-sky-300 underline"
              >
                Resend OTP
              </button>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-slate-100 font-semibold text-slate-950 hover:bg-white hover:text-black transition-all"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold text-slate-300">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-950/50 pr-10 text-white placeholder:text-slate-500 focus-visible:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-300">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 border-slate-800 bg-slate-950/50 text-white placeholder:text-slate-500 focus-visible:ring-slate-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-slate-100 font-semibold text-slate-950 hover:bg-white hover:text-black transition-all"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}