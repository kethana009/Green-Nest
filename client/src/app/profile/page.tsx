'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Outfit } from 'next/font/google'
import BottomNav from '@/app/components/BottomNav'
import { User, Package, Heart, ShoppingCart, Leaf, LogOut, MapPin, Phone, Mail, Edit2 } from 'lucide-react'

const outfit = Outfit({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800']
})

export default function ProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [orderCount, setOrderCount] = useState(0)
    const [addressCount, setAddressCount] = useState(0)

    useEffect(() => {
        const load = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (!authUser) {
                setLoading(false)
                return
            }

            setUser(authUser)

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (profileData) {
                setProfile(profileData)
                setAddressCount((profileData.saved_addresses || []).length)
            }

            // Fetch order count
            const { count } = await supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', authUser.id)

            setOrderCount(count || 0)
            setLoading(false)
        }
        load()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/login')
    }

    const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Plant Lover'
    const initial = displayName.charAt(0).toUpperCase()

    if (loading) {
        return (
            <div className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black flex items-center justify-center ${outfit.className}`}>
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🌿</div>
                    <p className="text-white/60 text-lg">Loading...</p>
                </div>
            </div>
        )
    }

    // Not logged in
    if (!user) {
        return (
            <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black pb-24 ${outfit.className}`}>
                <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-5 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto flex justify-center">
                        <h1 className="text-2xl font-bold text-white">My Profile 👤</h1>
                    </div>
                </nav>

                <div className="max-w-md mx-auto px-6 py-20 text-center">
                    <div className="text-8xl mb-6">🌿</div>
                    <h2 className="text-3xl font-bold text-white mb-4">Sign in to view your profile</h2>
                    <p className="text-white/60 mb-8">Access your orders, wishlist and account settings after signing in.</p>
                    <button
                        onClick={() => router.push('/login')}
                        id="signin-profile-btn"
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 border border-green-400/50 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/30"
                    >
                        Sign In
                    </button>
                </div>

                <BottomNav />
            </main>
        )
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black pb-24 ${outfit.className}`}>
            <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">My Profile 👤</h1>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-semibold">Sign Out</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-md mx-auto px-4 py-6 space-y-4">
                {/* Profile Card */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 text-center">
                    {/* Avatar */}
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4 shadow-lg shadow-green-500/30">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="Profile" />
                        ) : (
                            initial
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile?.role === 'admin' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' : 'bg-green-500/20 text-green-300 border border-green-400/30'}`}>
                        {profile?.role === 'admin' ? '⚙️ Admin' : '🌱 Customer'}
                    </span>
                </div>

                {/* Contact Info */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-green-400" /> Account Details
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <div>
                                <p className="text-white/40 text-xs">Email</p>
                                <p className="text-white text-sm font-medium break-all">{user.email}</p>
                            </div>
                        </div>
                        {profile?.phone_number && (
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-white/40 text-xs">Phone</p>
                                    <p className="text-white text-sm font-medium">{profile.phone_number}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <div>
                                <p className="text-white/40 text-xs">Saved Addresses</p>
                                <p className="text-white text-sm font-medium">{addressCount} address{addressCount !== 1 ? 'es' : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-extrabold text-green-400 mb-1">{orderCount}</p>
                        <p className="text-white/60 text-xs">Total Orders</p>
                    </div>
                    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-extrabold text-green-400 mb-1">{addressCount}</p>
                        <p className="text-white/60 text-xs">Saved Addresses</p>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
                    {[
                        { label: '📦 Order History', href: '/orders', icon: Package },
                        { label: '❤️ My Wishlist', href: '/wishlist', icon: Heart },
                        { label: '🛒 Shopping Cart', href: '/cart', icon: ShoppingCart },
                        { label: '📍 My Addresses', href: '/cart/address', icon: MapPin },
                        { label: '🌿 Browse Plants', href: '/browse', icon: Leaf },
                    ].map((item, i, arr) => (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={`w-full px-5 py-4 text-white font-semibold flex justify-between items-center hover:bg-white/10 transition-all text-left ${i < arr.length - 1 ? 'border-b border-white/10' : ''}`}
                        >
                            <span>{item.label}</span>
                            <span className="text-white/30">→</span>
                        </button>
                    ))}
                </div>

                {/* Admin Dashboard Link */}
                {profile?.role === 'admin' && (
                    <button
                        onClick={() => router.push('/admin')}
                        className="w-full py-4 bg-orange-500/20 border border-orange-400/30 rounded-2xl text-orange-300 font-bold transition-all hover:bg-orange-500/30 flex items-center justify-center gap-2"
                    >
                        ⚙️ Go to Admin Dashboard
                    </button>
                )}

                {/* Sign Out */}
                <button
                    onClick={handleSignOut}
                    id="signout-btn"
                    className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-2xl text-red-300 font-bold transition-all flex items-center justify-center gap-2"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>

            <BottomNav />
        </main>
    )
}