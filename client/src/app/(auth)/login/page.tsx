'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { GoogleButton } from '@/components/auth/GoogleButton';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error('Invalid email or password');
        return;
      }

      toast.success('Welcome back! 🌿');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-8 space-y-6 rounded-2xl w-full text-slate-800 dark:text-slate-100"
    >
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-emerald-400">
          🌿 Welcome Back
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input 
            {...register('email')} 
            type="email" 
            placeholder="you@example.com"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
          />
          {errors.email && (
            <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Password</label>
            <Link 
              href="/forgot-password" 
              className="text-xs text-brand-mint hover:underline font-medium"
            >
              Forgot Password?
            </Link>
          </div>
          <input 
            {...register('password')} 
            type="password" 
            placeholder="••••••••"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
          />
          {errors.password && (
            <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-brand-mint text-white font-semibold
            hover:bg-brand-forest transition-all duration-300 animate-pulse-glow
            disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
      </div>

      {/* Google OAuth */}
      <GoogleButton />

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-brand-mint hover:underline font-medium">
          Create Account
        </Link>
      </p>
    </motion.div>
  );
}
