'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Leaf, Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock, Loader2 } from 'lucide-react'
import { Outfit } from 'next/font/google'

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'] })

export default function LoginPage() {
    const [tab, setTab] = useState<'signin' | 'create'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState<'customer' | 'admin'>('customer')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const router = useRouter()

    const handleSignIn = async () => {
        if (!email || !password) {
            setError('Please enter email and password.')
            return
        }
        setLoading(true)
        setError('')

        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (data.user) {
            // Fetch profile to get role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (profile?.role === 'admin') {
                router.push('/admin')
            } else {
                router.push('/home')
            }
        }
        setLoading(false)
    }

    const handleCreateAccount = async () => {
        if (!fullName || !email || !password || !phone) {
            setError('Please fill in all fields.')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }
        setLoading(true)
        setError('')

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone_number: phone,
                    role: role,
                }
            }
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        if (data.user) {
            // Update profile with role and phone
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email: email,
                full_name: fullName,
                phone_number: phone,
                role: role,
            })

            setSuccess('Account created! Signing you in...')
            await new Promise(r => setTimeout(r, 1000))
            const { data: signInData } = await supabase.auth.signInWithPassword({ email, password })
            if (signInData.user) {
                if (role === 'admin') {
                    router.push('/admin')
                } else {
                    router.push('/home')
                }
            }
        }
        setLoading(false)
    }

    const roleButtons = (
        <div className="grid grid-cols-2 gap-3">
            <button
                onClick={() => setRole('customer')}
                className={`py-3 rounded-2xl border font-semibold text-sm transition-all ${role === 'customer' ? 'bg-green-500/20 border-green-400/50 text-green-300' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
            >
                🛍️ Customer
            </button>
            <button
                onClick={() => setRole('admin')}
                className={`py-3 rounded-2xl border font-semibold text-sm transition-all ${role === 'admin' ? 'bg-orange-500/20 border-orange-400/50 text-orange-300' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
            >
                ⚙️ Admin
            </button>
        </div>
    )

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black flex items-center justify-center p-4 ${outfit.className}`}>
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                            <Leaf className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-wide">🌱 GREEN NEST</h1>
                    <p className="text-white/50 text-sm mt-1">Breathe Better, Live Greener</p>
                </div>

                {/* Card */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    {/* Tabs */}
                    <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
                        <button
                            onClick={() => { setTab('signin'); setError(''); setSuccess('') }}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'signin' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'text-white/60 hover:text-white'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setTab('create'); setError(''); setSuccess('') }}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'create' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'text-white/60 hover:text-white'}`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Error/Success banners */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 mb-4 text-red-300 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-3 mb-4 text-green-300 text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> {success}
                        </div>
                    )}

                    {tab === 'signin' ? (
                        /* ─── SIGN IN FORM ─── */
                        <div className="space-y-4">
                            {/* Role selector (UX clarity) */}
                            <div>
                                <p className="text-white/60 text-sm mb-2 font-medium">Sign in as</p>
                                {roleButtons}
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:bg-white/10 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                                    className="w-full pl-11 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:bg-white/10 transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <button
                                onClick={handleSignIn}
                                disabled={loading}
                                id="signin-btn"
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-5 h-5" /></>}
                            </button>

                            <p className="text-center text-white/40 text-xs">
                                Don&apos;t have an account?{' '}
                                <button onClick={() => setTab('create')} className="text-green-400 font-semibold hover:text-green-300">Create one</button>
                            </p>
                        </div>
                    ) : (
                        /* ─── CREATE ACCOUNT FORM ─── */
                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:bg-white/10 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:bg-white/10 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:bg-white/10 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password (min 6 chars)"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:bg-white/10 transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <div>
                                <p className="text-white/60 text-sm mb-2 font-medium">Account Type</p>
                                {roleButtons}
                            </div>

                            <button
                                onClick={handleCreateAccount}
                                disabled={loading}
                                id="create-account-btn"
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-5 h-5" /></>}
                            </button>

                            <p className="text-center text-white/40 text-xs">
                                Already have an account?{' '}
                                <button onClick={() => setTab('signin')} className="text-green-400 font-semibold hover:text-green-300">Sign in</button>
                            </p>
                        </div>
                    )}
                </div>

                <p className="text-center text-white/20 text-xs mt-6">
                    🌿 Green Nest — Your Plant Paradise
                </p>
            </div>
        </main>
    )
}