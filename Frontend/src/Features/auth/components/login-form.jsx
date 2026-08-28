import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { GalleryVerticalEnd, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { loginSchema } from '../schemas/authSchema';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLES } from '@/constants/roles';

// Import ForgotPasswordModal
import ForgotPasswordModal from './ForgotPasswordModal';

export default function LoginForm({ className, ...props }) {
  const [apiError, setApiError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const { setActiveTenant } = useTenant();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const redirectByRole = (response) => {
    const tenant = response.activeTenant || response.tenant || response.user?.tenant || null;
    if (tenant) setActiveTenant(tenant);

    const role = response.user?.role || response.role;

    if (role === ROLES.SUPER_ADMIN) {
      navigate('/dashboard', { replace: true });
    } else if (role === ROLES.ADMIN) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/user/dashboard', { replace: true });
    }
  };

  const onSubmit = async (data) => {
    console.log(data);
    setApiError('');
    setGoogleError('');
    try {
      const response = await login(data);
      
      redirectByRole(response);
    } catch (err) {
      setApiError(err.message || 'Login failed');
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setApiError('');
      setGoogleError('');
      try {
        const response = await googleLogin(codeResponse.code);
        redirectByRole(response);
      } catch (err) {
        setGoogleError(err.message || 'Google login failed');
      }
    },
    onError: (error) => {
      const errorCode = error?.error || error?.message || '';

      if (
        typeof errorCode === 'string' &&
        errorCode.toLowerCase().includes('disabled_client')
      ) {
        setGoogleError(
          'Google sign-in is temporarily unavailable. Please contact your administrator to re-enable the Google OAuth client.'
        );
        return;
      }

      setGoogleError('Google authentication failed. Please try again.');
    },
  });

  return (
    <>
      <div className={cn('flex flex-col gap-6 w-full text-slate-100', className)} {...props}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Header & Logo */}
            <div className="flex flex-col items-center gap-2 text-center">
              <a href="#" className="flex flex-col items-center gap-2 font-medium">
                <div className="flex size-10 items-center justify-center rounded-xl border border-slate-700 bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-md shadow-black/40">
                  <GalleryVerticalEnd className="size-5 text-slate-200" />
                </div>
                <span className="sr-only">Hello world</span>
              </a>
              <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
              <p className="text-sm text-slate-400">Access your tenant workspace</p>
            </div>

            {/* Top-level API Error Alert */}
            {apiError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 font-medium">
                {apiError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-300">
                Email <span className="text-slate-400">*</span>
              </Label>
              {errors.email && (
                <p className="text-xs font-medium text-red-400">
                  ⚠ {errors.email.message}
                </p>
              )}
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-slate-400 focus-visible:border-slate-400 rounded-lg h-10 transition-all"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Password <span className="text-slate-400">*</span>
              </Label>

              {errors.password && (
                <p className="text-xs font-medium text-red-400">
                  ⚠ {errors.password.message}
                </p>
              )}

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-slate-400 focus-visible:border-slate-400 rounded-lg h-10 pr-10 transition-all"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>

              {/* Forgot Password Link placed below input */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Main Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-10 rounded-lg bg-slate-100 hover:bg-black text-slate-950 hover:text-white font-semibold shadow-md shadow-black/20 transition-all duration-300 ease-in-out active:scale-[0.98] cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            {/* Separator */}
            <div className="relative my-4 text-center text-xs">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <span className="relative bg-slate-900/60 px-2 text-slate-500">
                Or continue with
              </span>
            </div>

            {/* Google Error Alert */}
            {googleError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 font-medium">
                {googleError}
              </div>
            )}

            {/* Google Trigger Button */}
            <Button
              variant="outline"
              type="button"
              onClick={() => triggerGoogleLogin()}
              className="h-10 w-full border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <svg
                className="size-4 mr-2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </form>

        {/* Footer Legal Terms */}
        <p className="text-center text-xs text-slate-400">
          By clicking continue, you agree to our{' '}
          <a href="#" className="underline underline-offset-4 hover:text-white transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline underline-offset-4 hover:text-white transition-colors">
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </>
  );
}