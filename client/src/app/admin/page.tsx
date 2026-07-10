'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
    LayoutDashboard, Package, ShoppingCart, Users, LogOut,
    Box, TrendingUp, Plus, Trash2, Eye,
    Loader2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const proxyUrl = (url: string) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

const getProductImage = (p: any) => {
    let url = 'https://placehold.co/100/1e4d38/4ade80?text=Plant';
    if (p) {
        if (p.img) url = p.img;
        else if (p.image_url) url = p.image_url;
        else if (p.images) {
            if (Array.isArray(p.images)) {
                if (p.images.length > 0 && p.images[0]) {
                    url = p.images[0];
                }
            } else if (typeof p.images === 'string') {
                let str = p.images.trim();
                if (str.startsWith('{') && str.endsWith('}')) {
                    const urls = str.slice(1, -1).split(',');
                    if (urls.length > 0 && urls[0]) {
                        url = urls[0].replace(/^["']|["']$/g, '');
                    }
                } else {
                    try {
                        const parsed = JSON.parse(str);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            url = parsed[0];
                        }
                    } catch (e) {}
                }
                if (str && url === 'https://placehold.co/100/1e4d38/4ade80?text=Plant') url = str;
            }
        }
    }
    return proxyUrl(url);
};

export default function AdminPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('dashboard')
    const [loading, setLoading] = useState(true)

    // Dashboard stats
    const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, customers: 0 })
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [revenueData, setRevenueData] = useState<any[]>([])

    // Products
    const [products, setProducts] = useState<any[]>([])
    const [newProduct, setNewProduct] = useState({ name: '', price: '', stock_quantity: '', img: '', category: '', description: '' })
    const [addingProduct, setAddingProduct] = useState(false)

    // Orders
    const [orders, setOrders] = useState<any[]>([])
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

    // Customers
    const [customers, setCustomers] = useState<any[]>([])
    const [viewCustomer, setViewCustomer] = useState<any>(null)

    useEffect(() => {
        const init = async () => {
            // Auth check
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }

            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (profile?.role !== 'admin') { router.push('/home'); return }

            await loadAllData()
            setLoading(false)
        }
        init()
    }, [router])

    const loadAllData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch(`/api/admin/data?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                cache: 'no-store'
            })

            const result = await response.json()
            if (result.success) {
                // Set Products
                setProducts(result.products)

                // Format Orders (with order items)
                const formattedOrders = result.orders.map((order: any) => ({
                    ...order,
                    items: (order.order_items || []).map((item: any) => ({
                        id: item.product_snapshot?.id || item.product_id,
                        name: item.product_snapshot?.name || 'Plant',
                        img: getProductImage(item.product_snapshot),
                        price: item.unit_price,
                        qty: item.quantity,
                    }))
                }))
                setOrders(formattedOrders)
                setRecentOrders(formattedOrders.slice(0, 5))

                // Set Customers
                setCustomers(result.customers)

                // Stats calculation
                const totalRevenue = result.orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0)
                setStats({
                    products: result.products.length,
                    orders: result.orders.length,
                    revenue: totalRevenue,
                    customers: result.customers.length
                })

                // Chart Data — group real orders by day of week (last 7 days)
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const revenueByDay: Record<string, number> = {}
                dayNames.forEach(d => { revenueByDay[d] = 0 })

                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

                result.orders.forEach((o: any) => {
                    const orderDate = new Date(o.created_at)
                    if (orderDate >= sevenDaysAgo) {
                        const dayName = dayNames[orderDate.getDay()]
                        revenueByDay[dayName] = (revenueByDay[dayName] || 0) + (o.total_amount || 0)
                    }
                })

                // Display Mon→Sun order
                const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                const chartData = orderedDays.map(d => ({ name: d, revenue: revenueByDay[d] || 0 }))
                setRevenueData(chartData)
            } else {
                console.error('Admin API error:', result.error)
                if (response.status === 401 || response.status === 403) {
                    router.push('/login')
                }
            }
        } catch (err) {
            console.error('Failed to load admin data:', err)
        }
    }

    const addProduct = async () => {
        if (!newProduct.name || !newProduct.price) {
            alert('Name and Price are required.')
            return
        }
        setAddingProduct(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch('/api/admin/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: 'addProduct',
                    payload: newProduct
                })
            })

            const result = await response.json()
            if (result.success) {
                setNewProduct({ name: '', price: '', stock_quantity: '', img: '', category: '', description: '' })
                await loadAllData()
            } else {
                alert('Failed to add product: ' + result.error)
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setAddingProduct(false)
        }
    }

    const deleteProduct = async (id: string) => {
        if (!confirm('Delete this product?')) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch('/api/admin/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: 'deleteProduct',
                    payload: { productId: id }
                })
            })

            const result = await response.json()
            if (result.success) {
                await loadAllData()
            } else {
                alert('Failed to delete product: ' + result.error)
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    const updateOrderStatus = async (orderId: string, status: string) => {
        setUpdatingOrderId(orderId)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch('/api/admin/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: 'updateOrderStatus',
                    payload: { orderId, status }
                })
            })

            const result = await response.json()
            if (result.success) {
                await loadAllData()
            } else {
                alert('Failed to update status: ' + result.error)
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const logout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
            processing: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
            shipped: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
            delivered: 'bg-green-500/20 text-green-300 border border-green-500/30',
            cancelled: 'bg-red-500/20 text-red-300 border border-red-500/30',
        }
        return map[status] || 'bg-white/10 text-white/70'
    }

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'customers', label: 'Customers', icon: Users },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-spin">⏳</div>
                    <p className="text-white/60">Loading admin panel...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black text-white pb-24" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

            {/* Top Bar */}
            <div className="backdrop-blur-xl bg-black/40 border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-orange-400">🌱 GreenNest</span>
                    <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-semibold">Admin Portal</span>
                </div>
                <button onClick={logout} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-semibold transition-all">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>

            <div className="p-4 max-w-4xl mx-auto">

                {/* ─── DASHBOARD TAB ─── */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                            <p className="text-white/50 text-sm">Welcome back! Here&apos;s your live business overview.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Total Products', value: stats.products, icon: Box, color: 'purple', trend: 'Active inventory' },
                                { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'pink', trend: 'All time orders' },
                                { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'cyan', trend: 'Total earnings' },
                                { label: 'Customers', value: stats.customers, icon: Users, color: 'orange', trend: 'Registered users' },
                            ].map(({ label, value, icon: Icon, color, trend }) => (
                                <div key={label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-white/50 text-sm">{label}</p>
                                        <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                                            <Icon className="w-5 h-5 text-green-400" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{value}</p>
                                    <p className="text-green-400 text-xs mt-2">↑ {trend}</p>
                                </div>
                            ))}
                        </div>

                        {/* Revenue Chart */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                            <h2 className="font-bold mb-4 text-white text-lg">Revenue Trend — Last 7 Days</h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                                    <YAxis stroke="rgba(255,255,255,0.4)" />
                                    <Tooltip contentStyle={{ backgroundColor: '#133526', borderColor: 'rgba(255,255,255,0.1)' }} labelStyle={{ color: '#fff' }} formatter={(v: any) => `₹${v}`} />
                                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                            <h2 className="font-bold mb-4 text-white text-lg">🕒 Recent Orders</h2>
                            <div className="space-y-4">
                                {recentOrders.length === 0 ? (
                                    <p className="text-white/40 text-center py-6">No recent orders yet</p>
                                ) : (
                                    recentOrders.map(order => (
                                        <div key={order.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                                            <div>
                                                <p className="font-bold font-mono text-sm text-white">#{order.id.slice(0, 10).toUpperCase()}</p>
                                                <p className="text-white/40 text-xs">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-white">₹{order.total_amount}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusBadge(order.order_status || order.status || 'pending')}`}>
                                                    {order.order_status || order.status || 'pending'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── PRODUCTS TAB ─── */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-bold text-white">Products ({products.length})</h1>

                        {/* Add Product Form */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                            <h2 className="font-bold mb-4 text-green-400 text-lg">+ Add New Product</h2>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <input placeholder="Product Name *" value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-3 text-sm text-white col-span-2 focus:outline-none focus:border-green-400/50 focus:bg-white/10" />
                                <input placeholder="Price (₹) *" type="number" value={newProduct.price}
                                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-green-400/50 focus:bg-white/10" />
                                <input placeholder="Stock Qty" type="number" value={newProduct.stock_quantity}
                                    onChange={e => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-green-400/50 focus:bg-white/10" />
                                <input placeholder="Category (e.g. Indoor Plants)" value={newProduct.category}
                                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-green-400/50 focus:bg-white/10" />
                                <input placeholder="Image URL" value={newProduct.img}
                                    onChange={e => setNewProduct({ ...newProduct, img: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-green-400/50 focus:bg-white/10" />
                                <textarea placeholder="Description" value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-3 text-sm text-white col-span-2 h-20 resize-none focus:outline-none focus:border-green-400/50 focus:bg-white/10" />
                            </div>
                            <button
                                onClick={addProduct}
                                disabled={addingProduct}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 disabled:opacity-60"
                            >
                                <Plus className="w-5 h-5" />
                                {addingProduct ? 'Adding Product...' : 'Add Product'}
                            </button>
                        </div>

                        {/* Products List */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-4">
                            {products.length === 0 ? (
                                <p className="text-white/40 text-center py-8">No products in database. Add your first product above!</p>
                            ) : (
                                products.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                                        <img
                                            src={getProductImage(p)}
                                            className="w-14 h-14 rounded-xl object-cover bg-white/5 border border-white/10 flex-shrink-0"
                                            alt={p.name}
                                            referrerPolicy="no-referrer"
                                            onError={(e: any) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/100/1e4d38/4ade80?text=Plant';
                                            }}
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm text-white">{p.name}</p>
                                            <p className="text-xs text-white/50">₹{p.price} • Stock: {p.stock_quantity ?? 'N/A'} • {p.category}</p>
                                        </div>
                                        <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-300 p-2 rounded-xl bg-white/5 border border-white/10 transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ─── ORDERS TAB ─── */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-bold text-white">All Orders ({orders.length})</h1>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-6">
                            {orders.length === 0 ? (
                                <p className="text-white/40 text-center py-8">No orders yet</p>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="py-4 border-b border-white/5 last:border-0 space-y-4">
                                        <div className="flex justify-between items-start flex-wrap gap-2">
                                            <div>
                                                <p className="font-bold font-mono text-sm text-white">#{order.id.slice(0, 10).toUpperCase()}</p>
                                                <p className="text-xs text-green-400 font-medium">
                                                    👤 {order.profiles?.full_name || order.profiles?.email || 'Customer'}
                                                </p>
                                                <p className="text-xs text-white/40 mt-1">
                                                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-extrabold text-xl text-white">₹{order.total_amount}</p>
                                                <p className="text-xs text-white/40 capitalize">{order.payment_method || 'cod'}</p>
                                            </div>
                                        </div>

                                        {/* Items preview */}
                                        {order.items && order.items.length > 0 && (
                                            <div className="flex gap-2 flex-wrap items-center bg-white/5 rounded-2xl p-3 border border-white/5">
                                                {order.items.slice(0, 4).map((item: any, idx: number) => (
                                                    <div key={idx} className="relative">
                                                         <img src={item.img} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt={item.name}
                                                             referrerPolicy="no-referrer"
                                                             onError={(e: any) => {
                                                                 e.target.onerror = null;
                                                                 e.target.src = 'https://placehold.co/100/1e4d38/4ade80?text=Plant';
                                                             }} />
                                                        <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-[10px] text-white font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                                            {item.qty}
                                                        </span>
                                                    </div>
                                                ))}
                                                {order.items.length > 4 && (
                                                    <span className="text-xs text-white/40 font-semibold pl-1">+{order.items.length - 4} more</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Status + Update */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase ${getStatusBadge(order.order_status || order.status || 'pending')}`}>
                                                {order.order_status || order.status || 'pending'}
                                            </span>
                                            <select
                                                className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white/80 focus:outline-none focus:border-green-400"
                                                disabled={updatingOrderId === order.id}
                                                value={order.order_status || order.status || 'pending'}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            >
                                                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                    <option key={s} value={s} className="bg-green-950 text-white">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
                                            {updatingOrderId === order.id && <Loader2 className="w-4 h-4 text-green-400 animate-spin" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ─── CUSTOMERS TAB ─── */}
                {activeTab === 'customers' && (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-bold text-white">Customers ({customers.length})</h1>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-4">
                            {customers.length === 0 ? (
                                <p className="text-white/40 text-center py-8">No customers registered yet</p>
                            ) : (
                                customers.map(customer => (
                                    <div key={customer.id} className="py-4 border-b border-white/5 last:border-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg">
                                                    {(customer.full_name || customer.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base">{customer.full_name || 'Unknown'}</p>
                                                    <p className="text-xs text-white/40">{customer.email}</p>
                                                    {customer.phone_number && (
                                                        <p className="text-xs text-white/60 mt-1">📞 {customer.phone_number}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setViewCustomer(viewCustomer?.id === customer.id ? null : customer)}
                                                className="text-white/40 hover:text-green-400 p-2 rounded-xl bg-white/5 border border-white/10 transition-all"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Expanded customer details */}
                                        {viewCustomer?.id === customer.id && (
                                            <div className="mt-4 bg-white/5 border border-white/5 rounded-2xl p-4 text-xs space-y-2 animate-fadeIn">
                                                <p><span className="text-white/40">Registration Date:</span> <span className="text-white/80">{new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
                                                <p><span className="text-white/40">Saved Addresses count:</span> <span className="text-white/80">{(customer.saved_addresses || []).length}</span></p>
                                                <p><span className="text-white/40">User Role:</span> <span className="font-bold text-green-400 uppercase">{customer.role}</span></p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Nav Bar */}
            <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-black/60 border-t border-white/10 flex justify-around py-3.5 z-50">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id)
                            setViewCustomer(null)
                            loadAllData()
                        }}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-green-400 scale-105 font-bold' : 'text-white/40 hover:text-white/60'}`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}