'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Outfit } from 'next/font/google'
import BottomNav from '@/app/components/BottomNav'
import { ArrowLeft, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const outfit = Outfit({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800']
})

type Order = {
    id: string
    items: any[]
    total_amount: number
    status?: string
    order_status?: string
    payment_method?: string
    created_at: string
    shipping_address?: any
}

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']
const STATUS_LABELS: Record<string, string> = {
    pending: 'Order Confirmed',
    processing: 'Processing',
    shipped: 'Shipped Out',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
}
const STATUS_ICONS: Record<string, string> = {
    pending: '✅',
    processing: '⚙️',
    shipped: '🚚',
    out_for_delivery: '📍',
    delivered: '🏠',
    cancelled: '❌',
}
const proxyUrl = (url: string) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        const fetchOrders = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (!error && data) {
                const formattedOrders = data.map((order: any) => ({
                    ...order,
                    items: (order.order_items || []).map((item: any) => ({
                        id: item.product_snapshot?.id || item.product_id,
                        name: item.product_snapshot?.name || 'Plant',
                        img: item.product_snapshot?.img || 'https://via.placeholder.com/150',
                        price: item.unit_price,
                        qty: item.quantity,
                    }))
                }))
                setOrders(formattedOrders)
            }
            setLoading(false)
        }
        fetchOrders()
    }, [router])

    const getStatus = (order: Order) => order.order_status || order.status || 'pending'

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
            case 'processing': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
            case 'shipped': return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
            case 'out_for_delivery': return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
            case 'delivered': return 'bg-green-500/20 text-green-300 border-green-400/30'
            case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-400/30'
            default: return 'bg-white/10 text-white/70'
        }
    }

    const getStepsDone = (status: string) => {
        const idx = STATUS_STEPS.indexOf(status)
        return idx === -1 ? 0 : idx + 1
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black pb-24 ${outfit.className}`}>
            <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-white text-2xl">←</button>
                    <h1 className="text-xl font-bold text-white">My Orders 📦</h1>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4 animate-pulse">⏳</div>
                        <p className="text-white/60 text-lg">Loading your orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-8xl mb-6">📦</div>
                        <h2 className="text-3xl font-bold text-white mb-4">No Orders Yet</h2>
                        <p className="text-white/60 text-lg mb-8">Start shopping to see your orders here</p>
                        <button
                            onClick={() => router.push('/browse')}
                            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/30"
                        >
                            Browse Plants 🌱
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const status = getStatus(order)
                            const stepsDone = getStepsDone(status)
                            const isExpanded = expandedId === order.id

                            return (
                                <div key={order.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
                                    {/* Order Header */}
                                    <div
                                        className="p-5 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-white/50 text-xs mb-1">Order ID</p>
                                                <p className="text-white font-bold font-mono text-sm">#{order.id.slice(0, 12).toUpperCase()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
                                                    {STATUS_ICONS[status] || '📦'} {(status).replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                                            </div>
                                        </div>

                                        {/* Item thumbnails */}
                                        <div className="flex gap-2 mb-3">
                                            {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                                                <img key={idx} src={proxyUrl(item.img)} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-white/10" referrerPolicy="no-referrer" />
                                            ))}
                                            {(order.items || []).length > 3 && (
                                                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white/60 text-xs font-bold">
                                                    +{(order.items || []).length - 3}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className="text-white/50 text-xs">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-green-400 font-extrabold text-xl">₹{order.total_amount}</p>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-white/10 p-5 space-y-4">
                                            {/* Status Timeline */}
                                            <div>
                                                <p className="text-white font-bold mb-3">📍 Order Tracking</p>
                                                <div className="space-y-1">
                                                    {['pending', 'processing', 'shipped', 'delivered'].map((step, i) => {
                                                        const done = i < stepsDone
                                                        const current = i === stepsDone - 1
                                                        return (
                                                            <div key={step} className="flex items-center gap-3 py-2">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-white/10 text-white/30'}`}>
                                                                    {done ? '✓' : i + 1}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className={`text-sm font-semibold ${done ? 'text-white' : 'text-white/30'}`}>
                                                                        {STATUS_ICONS[step]} {STATUS_LABELS[step]}
                                                                    </p>
                                                                    {current && <p className="text-green-400 text-xs">Current status</p>}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Items detail */}
                                            <div>
                                                <p className="text-white font-bold mb-2">🛍️ Items Ordered</p>
                                                <div className="space-y-2">
                                                    {(order.items || []).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                                            <img src={proxyUrl(item.img)} alt={item.name} className="w-14 h-14 object-cover rounded-lg" referrerPolicy="no-referrer" />
                                                            <div className="flex-1">
                                                                <p className="text-white font-semibold text-sm">{item.name}</p>
                                                                <p className="text-white/50 text-xs">Qty: {item.quantity || item.qty || 1}</p>
                                                            </div>
                                                            <p className="text-green-400 font-bold">
                                                                ₹{(item.price * (item.quantity || item.qty || 1)).toFixed(0)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Shipping Address */}
                                            {order.shipping_address && (
                                                <div className="bg-white/5 rounded-xl p-3">
                                                    <p className="text-white font-bold text-sm mb-1">📦 Delivery Address</p>
                                                    <p className="text-white/70 text-xs">
                                                        {order.shipping_address.name && `${order.shipping_address.name}, `}
                                                        {order.shipping_address.flat && `${order.shipping_address.flat}, `}
                                                        {order.shipping_address.locality && `${order.shipping_address.locality}, `}
                                                        {order.shipping_address.city && `${order.shipping_address.city}`}
                                                        {order.shipping_address.pincode && ` - ${order.shipping_address.pincode}`}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Payment */}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-white/50">Payment</span>
                                                <span className="text-green-400 font-semibold">
                                                    {order.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Card'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <BottomNav />
        </main>
    )
}