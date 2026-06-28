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

// Zod validation schema exactly matching the spec
export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { 
          data: { 
            full_name: data.full_name 
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created! Please check your email to verify.');
      router.push('/login');
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
          🌿 Create Account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Start your plant journey today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Full Name</label>
          <input 
            {...register('full_name')} 
            placeholder="Jane Doe"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
          />
          {errors.full_name && (
            <p className="text-xs text-rose-500 mt-1">{errors.full_name.message}</p>
          )}
        </div>

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
          <label className="text-sm font-medium">Password</label>
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

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Confirm Password</label>
          <input 
            {...register('confirm_password')} 
            type="password"
            placeholder="••••••••"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
          />
          {errors.confirm_password && (
            <p className="text-xs text-rose-500 mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-brand-mint text-white font-semibold
            hover:bg-brand-forest transition-all duration-300 animate-pulse-glow
            disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
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
        Already have an account?{' '}
        <Link href="/login" className="text-brand-mint hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
