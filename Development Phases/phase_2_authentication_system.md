# 🌿 Green Nest — Phase 2: Authentication System

## Overview

Phase 2 builds the complete authentication layer end-to-end — from the glassmorphic UI forms, through JWT handling in the Express middleware, to profile creation and management. When this phase is complete, users can register, log in with email or Google, recover passwords, and manage their personal profiles.

**Phase Duration Estimate:** 2–3 days  
**Depends On:** Phase 1 (database, Supabase clients, Express server scaffold)  
**Unlocks:** Phase 3 (wishlist requires auth), Phase 4 (cart syncing, orders)

---

## 1. Auth Route Group Setup

All auth pages live inside `app/(auth)/`. This route group renders without the main customer Navbar — it uses its own minimal full-screen layout.

### 1.1 Auth Layout (`app/(auth)/layout.tsx`)

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full
          bg-brand-mint/20 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full
          bg-brand-forest/15 blur-3xl animate-float [animation-delay:2s]" />
      </div>
      <div className="w-full max-w-md px-4">{children}</div>
    </main>
  );
}
```

---

## 2. Registration Page

**File:** `app/(auth)/register/page.tsx`

### 2.1 Form Fields & Validation Schema (`zod`)

```typescript
import { z } from 'zod';

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
```

### 2.2 Registration Form Component

```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Account created! Please check your email to verify.');
    router.push('/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-8 space-y-6"
    >
      <div className="text-center space-y-1">
        <h1 className="font-outfit text-2xl font-bold text-brand-forest dark:text-emerald-400">
          🌿 Create Account
        </h1>
        <p className="text-sm text-slate-500">Start your plant journey today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Full Name</label>
          <input {...register('full_name')} placeholder="Jane Doe"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
          {errors.full_name && (
            <p className="text-xs text-rose-500">{errors.full_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
          {errors.email && (
            <p className="text-xs text-rose-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input {...register('password')} type="password" placeholder="••••••••"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
          {errors.password && (
            <p className="text-xs text-rose-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Confirm Password</label>
          <input {...register('confirm_password')} type="password"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
          {errors.confirm_password && (
            <p className="text-xs text-rose-500">{errors.confirm_password.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-brand-mint text-white font-semibold
            hover:bg-brand-forest transition-all duration-300 animate-pulse-glow
            disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/20" />
        <span className="text-xs text-slate-400">or</span>
        <div className="flex-1 h-px bg-white/20" />
      </div>

      {/* Google OAuth */}
      <GoogleButton />

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <a href="/login" className="text-brand-mint hover:underline font-medium">Sign in</a>
      </p>
    </motion.div>
  );
}
```

---

## 3. Login Page

**File:** `app/(auth)/login/page.tsx`

### 3.1 Login Logic

```typescript
const onSubmit = async (data: LoginFormData) => {
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
  router.refresh(); // Refresh server components to pick up session
};
```

---

## 4. Google OAuth Button Component

**File:** `components/auth/GoogleButton.tsx`

```typescript
'use client';
import { createClient } from '@/lib/supabase/client';

export function GoogleButton() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full py-3 rounded-xl glass-card border border-white/20
        flex items-center justify-center gap-3 hover:border-brand-mint/40
        transition-all duration-300 text-sm font-medium"
    >
      {/* Google SVG Icon */}
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M17.64 9.2a10 10 0 0 0-.16-1.74H9v3.28h4.84a4.13 4.13 0 0 1-1.8 2.72v2.26h2.9A8.78 8.78 0 0 0 17.64 9.2z"/>
        <path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.9-2.26A5.4 5.4 0 0 1 9 14.5a5.4 5.4 0 0 1-5.09-3.74H.94v2.34A9 9 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.91 10.76A5.4 5.4 0 0 1 3.63 9c0-.61.1-1.2.28-1.76V4.9H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.1z"/>
        <path fill="#EA4335" d="M9 3.5A4.87 4.87 0 0 1 12.44 4.9l2.57-2.57A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .94 4.9l2.97 2.34A5.4 5.4 0 0 1 9 3.5z"/>
      </svg>
      Continue with Google
    </button>
  );
}
```

---

## 5. OAuth Callback Handler

**File:** `app/(auth)/callback/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  redirect('/');
}
```

---

## 6. Password Reset Flow

**File:** `app/(auth)/forgot-password/page.tsx`

```typescript
const handleReset = async (email: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (!error) {
    toast.success('Password reset link sent to your email');
  }
};
```

**File:** `app/(auth)/reset-password/page.tsx`

```typescript
const handlePasswordUpdate = async (newPassword: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (!error) {
    toast.success('Password updated successfully!');
    router.push('/login');
  }
};
```

---

## 7. Express Auth Middleware

**File:** `server/src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { createClient } from '../config/supabase';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Fetch role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  req.user = {
    id: user.id,
    email: user.email!,
    role: profile?.role || 'customer',
  };

  next();
}

export function adminGuard(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
```

**File:** `server/src/types/express.d.ts`

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'customer' | 'admin';
      };
    }
  }
}
export {};
```

---

## 8. Auth Controller (Express)

**File:** `server/src/controllers/auth.controller.ts`

```typescript
import { Request, Response } from 'express';
import { createClient } from '../config/supabase';

// GET /api/auth/me — Returns authenticated user profile
export async function getMe(req: Request, res: Response) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  if (error) return res.status(404).json({ message: 'Profile not found' });
  return res.json(data);
}

// PUT /api/auth/profile — Updates user profile fields
export async function updateProfile(req: Request, res: Response) {
  const { full_name, phone_number, saved_addresses } = req.body;
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, phone_number, saved_addresses, updated_at: new Date().toISOString() })
    .eq('id', req.user!.id)
    .select()
    .single();

  if (error) return res.status(400).json({ message: error.message });
  return res.json(data);
}
```

---

## 9. `useAuth` Hook

**File:** `hooks/useAuth.ts`

```typescript
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { IProfile } from '@/types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return { user, profile, loading, signOut, isAdmin: profile?.role === 'admin' };
}
```

---

## 10. Profile Management Page

**File:** `app/(customer)/profile/page.tsx`

### 10.1 Avatar Upload

```typescript
const handleAvatarUpload = async (file: File) => {
  const supabase = createClient();
  const fileName = `${user!.id}/avatar.${file.name.split('.').pop()}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatar-images')
    .upload(fileName, file, { upsert: true });

  if (uploadError) { toast.error('Upload failed'); return; }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatar-images')
    .getPublicUrl(fileName);

  // Update profile record
  await supabase.from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user!.id);

  toast.success('Profile photo updated!');
};
```

### 10.2 Profile Page Layout Sections

The profile page is divided into glassmorphic tab panels:

| Tab | Content |
|---|---|
| **Account Info** | Avatar upload, full name, phone number edit form |
| **Addresses** | List of saved addresses, add/edit/delete/set-default controls |
| **My Orders** | Abbreviated order history (links to full order view) |
| **AI History** | Thumbnail grid of past Plant Match runs |

---

## 11. Phase 2 Completion Checklist

- [ ] Auth layout with ambient orb background created
- [ ] Register page with `zod` validation and form error display
- [ ] `supabase.auth.signUp()` wired up with `full_name` metadata
- [ ] Email verification banner shown after registration
- [ ] Login page with `signInWithPassword()` and redirect
- [ ] `GoogleButton` component triggering `signInWithOAuth()`
- [ ] OAuth callback route at `/auth/callback` exchanging code for session
- [ ] Forgot-password page sending reset email
- [ ] Reset-password page updating credentials via `updateUser()`
- [ ] Express `auth.middleware.ts` validating JWT from `Authorization` header
- [ ] `adminGuard` middleware blocking non-admin requests
- [ ] `req.user` type augmented in `express.d.ts`
- [ ] `GET /api/auth/me` and `PUT /api/auth/profile` endpoints
- [ ] `useAuth()` hook providing user, profile, loading, signOut, isAdmin
- [ ] Profile page with avatar upload to Supabase Storage
- [ ] Saved addresses CRUD on profile page
- [ ] All auth-protected pages redirect unauthenticated users to `/login`
