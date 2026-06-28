'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { z } from 'zod';

const resetPasswordSchema = z.object({
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password updated successfully!');
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
          🌿 Update Password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium">New Password</label>
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
          <label className="text-sm font-medium">Confirm New Password</label>
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
          {isSubmitting ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </motion.div>
  );
}
