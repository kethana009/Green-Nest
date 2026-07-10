'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/app/context/CartContext'
import { supabase } from '@/lib/supabase/client'
import { Outfit } from 'next/font/google'
import { ArrowLeft, MapPin, Package, CheckCircle2, Loader2, ShoppingBag, Truck } from 'lucide-react'

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const proxyUrl = (url: string) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

export default function CheckoutPage() {
    const router = useRouter()
    const { cart, clearCart } = useCart()
    const [user, setUser] = useState<any>(null)
    const [address, setAddress] = useState<any>(null)
    const [placing, setPlacing] = useState(false)
    const [ordered, setOrdered] = useState(false)
    const [orderId, setOrderId] = useState('')
    const [paymentMethod] = useState('cod')

    const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)
    const deliveryFee = 0
    const total = subtotal + deliveryFee

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            // Load selected address
            const selected = localStorage.getItem('selectedAddress')
            if (selected) {
                setAddress(JSON.parse(selected))
            } else {
                const saved = localStorage.getItem('userAddresses')
                if (saved) {
                    const addrs = JSON.parse(saved)
                    const def = addrs.find((a: any) => a.isDefault) || addrs[0]
                    if (def) setAddress(def)
                }
            }
        }
        load()
    }, [router])

    const handlePlaceOrder = async () => {
        if (!user) {
            router.push('/login')
            return
        }
        if (!address) {
            alert('Please add a delivery address first.')
            router.push('/cart/address')
            return
        }
        if (!cart || cart.length === 0) {
            alert('Your cart is empty.')
            router.push('/home')
            return
        }

        setPlacing(true)

        try {
            const response = await fetch('/api/order/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    total: total,
                    address: address,
                    cart: cart
                })
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'API order placement failed')
            }

            setOrderId(result.orderId)

            // Clear cart
            clearCart()
            localStorage.removeItem('selectedAddress')
            setOrdered(true)
        } catch (err: any) {
            console.error('Failed to place order:', err)
            alert('Failed to place order: ' + (err.message || 'Please try again.'))
        } finally {
            setPlacing(false)
        }
    }

    // Order Success Screen
    if (ordered) {
        return (
            <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black flex items-center justify-center p-6 ${outfit.className}`}>
                <div className="text-center max-w-md w-full">
                    <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/40 animate-bounce">
                        <CheckCircle2 className="w-16 h-16 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Order Placed! 🎉</h1>
                    <p className="text-white/60 mb-6 text-lg">Your plants are on their way!</p>

                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 border border-white/20 text-left">
                        <p className="text-white/60 text-xs mb-1">Order ID</p>
                        <p className="text-white font-bold text-sm font-mono">{orderId.slice(0, 16)}...</p>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-white/60 text-xs mb-1">Payment</p>
                            <p className="text-green-400 font-bold">💵 Cash on Delivery</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-white/60 text-xs mb-1">Total Paid</p>
                            <p className="text-white font-extrabold text-2xl">₹{total.toFixed(0)}</p>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 border border-white/20 text-left">
                        <h3 className="text-white font-bold mb-4">📦 Order Status</h3>
                        {[
                            { label: 'Order Confirmed', icon: '✅', done: true },
                            { label: 'Processing', icon: '⚙️', done: false },
                            { label: 'Shipped Out', icon: '🚚', done: false },
                            { label: 'Out for Delivery', icon: '📍', done: false },
                            { label: 'Delivered', icon: '🏠', done: false },
                        ].map((step, i) => (
                            <div key={i} className={`flex items-center gap-3 py-2 ${i < 4 ? 'border-b border-white/10' : ''}`}>
                                <span className="text-lg">{step.icon}</span>
                                <span className={`text-sm font-medium ${step.done ? 'text-green-400' : 'text-white/40'}`}>
                                    {step.label}
                                </span>
                                {step.done && <span className="ml-auto text-green-400 text-xs font-bold">DONE</span>}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/orders')}
                            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-400 hover:to-emerald-500 transition-all"
                        >
                            📦 View Orders
                        </button>
                        <button
                            onClick={() => router.push('/home')}
                            className="flex-1 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all"
                        >
                            🏠 Home
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black pb-32 ${outfit.className}`}>
            {/* Header */}
            <nav className="bg-black/30 backdrop-blur-xl p-4 flex items-center gap-4 sticky top-0 border-b border-white/10 z-10">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-lg font-bold text-white">Checkout</h1>
            </nav>

            <div className="max-w-lg mx-auto p-4 space-y-4">
                {/* Delivery Address */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-400" />
                            <h2 className="font-bold text-white">Delivery Address</h2>
                        </div>
                        <button
                            onClick={() => router.push('/cart/address')}
                            className="text-green-400 text-sm font-semibold"
                        >
                            Change
                        </button>
                    </div>
                    {address ? (
                        <div>
                            <p className="text-white font-semibold">{address.name}</p>
                            <p className="text-white/60 text-sm mt-1">
                                {address.flat && `${address.flat}, `}{address.locality && `${address.locality}, `}{address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="text-white/60 text-sm">📞 {address.phone}</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push('/cart/address')}
                            className="text-green-400 font-semibold text-sm flex items-center gap-2"
                        >
                            + Add delivery address
                        </button>
                    )}
                </div>

                {/* Order Items */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-green-400" />
                        <h2 className="font-bold text-white">Order Items ({cart.length})</h2>
                    </div>
                    <div className="space-y-3">
                        {cart.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                <img src={proxyUrl(item.img)} alt={item.name} className="w-14 h-14 object-cover rounded-lg" referrerPolicy="no-referrer" />
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">{item.name}</p>
                                    <p className="text-white/50 text-xs">Qty: {item.qty}</p>
                                </div>
                                <p className="text-green-400 font-bold">₹{(item.price * item.qty).toFixed(0)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
                    <h2 className="font-bold text-white mb-3">💳 Payment Method</h2>
                    <div className="bg-green-500/20 border-2 border-green-400/50 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/30 rounded-xl flex items-center justify-center">
                            <span className="text-xl">💵</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-bold">Cash on Delivery</p>
                            <p className="text-white/50 text-xs">Pay when your order arrives</p>
                        </div>
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
                    <h2 className="font-bold text-white mb-3">🧾 Order Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-white/70">
                            <span>Subtotal ({cart.reduce((s: number, i: any) => s + i.qty, 0)} items)</span>
                            <span>₹{subtotal.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                            <span>Delivery Fee</span>
                            <span className="text-green-400 font-semibold">FREE</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-white font-extrabold text-lg">
                            <span>Total</span>
                            <span className="text-green-400">₹{total.toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-white/60 text-sm">
                        Estimated delivery: <span className="text-white font-semibold">3–5 business days</span>
                    </p>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="max-w-lg mx-auto">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <span className="text-white/60 text-sm">Amount Payable</span>
                        <span className="text-white font-extrabold text-xl">₹{total.toFixed(0)}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={placing || !address}
                        id="place-order-btn"
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold text-lg rounded-2xl hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-green-500/30"
                    >
                        {placing ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order...</>
                        ) : (
                            <><ShoppingBag className="w-5 h-5" /> Place Order — Cash on Delivery</>
                        )}
                    </button>
                    {!address && (
                        <p className="text-yellow-400 text-xs text-center mt-2">⚠️ Please add a delivery address to proceed</p>
                    )}
                </div>
            </div>
        </main>
    )
}
