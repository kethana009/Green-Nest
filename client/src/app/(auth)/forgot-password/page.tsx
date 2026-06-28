'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { z } from 'zod';
import Link from 'next/link';
import { useState } from 'react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset link sent to your email');
      setSent(true);
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
          🌿 Reset Password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your email to receive a password reset link
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm border border-emerald-200 dark:border-emerald-900/30">
            Check your inbox for a link to reset your password.
          </div>
          <Link 
            href="/login" 
            className="inline-block text-sm text-brand-mint hover:underline font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email Address</label>
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

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand-mint text-white font-semibold
              hover:bg-brand-forest transition-all duration-300 animate-pulse-glow
              disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
            Remembered your password?{' '}
            <Link href="/login" className="text-brand-mint hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </form>
      )}
    </motion.div>
  );
}
