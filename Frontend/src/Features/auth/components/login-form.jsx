import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { GalleryVerticalEnd } from 'lucide-react';

import { loginSchema } from '../schemas/authSchema';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { useTenant } from '@/context/TenantContext';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLES } from '@/constants/roles';

export default function LoginForm({ className, ...props }) {
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
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

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const response = await login(data);

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
    } catch (err) {
      setApiError(err.message || 'Login failed');
    }
  };

  return (
    <div className={cn('flex flex-col gap-6 w-full text-slate-100', className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
                <GalleryVerticalEnd className="size-5" />
              </div>
              <span className="sr-only">Acme Inc.</span>
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
              Email <span className="text-purple-400">*</span>
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
              className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-purple-500 focus-visible:border-purple-500 rounded-lg h-10 transition-all"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Password <span className="text-purple-400">*</span>
              </Label>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-400">
                ⚠ {errors.password.message}
              </p>
            )}
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-purple-500 focus-visible:border-purple-500 rounded-lg h-10 transition-all"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
          </div>

          {/* Main Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-10 rounded-lg bg-linear-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-600/25 transition-all duration-200 active:scale-[0.98]"
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

          {/* Social Buttons */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              type="button"
              className="h-10 border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 mr-2">
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              Apple
            </Button>
            <Button
              variant="outline"
              type="button"
              className="h-10 border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 mr-2">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Google
            </Button>
          </div>
        </div>
      </form>

      {/* Footer Legal Terms */}
      <p className="text-center text-xs text-slate-400">
        By clicking continue, you agree to our{' '}
        <a href="#" className="underline underline-offset-4 hover:text-purple-300 transition-colors">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline underline-offset-4 hover:text-purple-300 transition-colors">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}