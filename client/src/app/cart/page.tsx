'use client'
import { useCart } from '@/app/context/CartContext'
import { useRouter } from 'next/navigation'
import { Outfit } from 'next/font/google'
import { ShoppingBag, ArrowLeft, Plus, Minus, Trash, Heart, MapPin, Percent, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600', '700'] })

const COUPONS = [
    { code: "GREEN10", discount: 10, desc: "10% off on plants" },
    { code: "WELCOME50", discount: 50, desc: "Flat ₹50 off" },
    { code: "FREESHIP", discount: 0, desc: "Free Delivery" },
]

const proxyUrl = (url: string) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

const handleImageError = (e: any, originalUrl: string) => {
    if (!originalUrl) return;
    e.target.onerror = null;
    const currentSrc = e.target.src;
    if (currentSrc.includes('images.weserv.nl')) {
        e.target.src = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
    } else if (currentSrc.includes('/api/proxy-image')) {
        e.target.src = originalUrl;
    } else {
        e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23133526'/><text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='%234ade80' dominant-baseline='middle' text-anchor='middle'>🌱</text></svg>";
    }
};

export default function CartPage() {
    const { cart = [], addToCart, decreaseQty, removeFromCart, toggleWishlist, wishlist = [] } = useCart()
    const router = useRouter()
    const [showCoupon, setShowCoupon] = useState(false)
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
    const [address, setAddress] = useState("No Address Added")

    // Selected address ni localStorage nunchi theesukovadam
    useEffect(() => {
        const loadAddress = () => {
            const selected = localStorage.getItem('selectedAddress')
            if (selected) {
                const addr = JSON.parse(selected)
                setAddress(`${addr.name} - ${addr.city} ${addr.pincode}`)
            } else {
                const saved = localStorage.getItem('userAddresses')
                if (saved) {
                    const addresses = JSON.parse(saved)
                    const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0]
                    if (defaultAddr) setAddress(`${defaultAddr.name} - ${defaultAddr.city} ${defaultAddr.pincode}`)
                }
            }
        }
        loadAddress()
        // Page focus ayinappudu malli check cheyyadaniki
        window.addEventListener('focus', loadAddress)
        return () => window.removeEventListener('focus', loadAddress)
    }, [])

    const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)
    const discount = appliedCoupon ? (appliedCoupon.discount > 10 ? appliedCoupon.discount : subtotal * appliedCoupon.discount / 100) : 0
    const total = subtotal - discount

    const handleApplyCoupon = (coupon: any) => {
        setAppliedCoupon(coupon)
        setShowCoupon(false)
    }

    if (cart?.length === 0) {
        return (
            <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className} flex items-center justify-center p-4`}>
                <div className="text-center">
                    <ShoppingBag className="w-20 h-20 text-green-400 mb-4 mx-auto" />
                    <h1 className="text-2xl text-white font-bold mb-2">Your Bag is Empty</h1>
                    <button onClick={() => router.push('/category')} className="bg-green-600 px-6 py-3 rounded-lg text-white font-bold">
                        Shop Now
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className} pb-32`}>
            {/* HEADER */}
            <nav className="bg-white/10 backdrop-blur-xl p-4 sticky top-0 z-40 flex items-center justify-between border-b border-white/10">
                <button onClick={() => router.back()}><ArrowLeft className="w-6 h-6 text-white" /></button>
                <h1 className="text-lg font-bold text-white">Bag ({cart?.length} product)</h1>
                <Heart className="w-6 h-6 text-white" />
            </nav>

            {/* DELIVERY ADDRESS */}
            <div className="bg-white/10 backdrop-blur-xl p-4 flex items-center gap-2 text-sm mt-2 text-white border-b border-white/10">
                <MapPin className="w-4 h-4" />
                <span>Deliver to <b>{address}</b></span>
                <button onClick={() => router.push('/cart/address')} className="text-green-400 ml-auto text-sm font-semibold">Change</button>
            </div>

            {/* CART ITEMS */}
            <div className="p-3 space-y-3">
                {cart?.map((item: any) => (
                    <div key={item.id} className="bg-white/10 backdrop-blur-xl rounded-lg p-3 border border-white/10">
                        <div className="flex gap-3">
                             <img 
                                 src={proxyUrl(item.img) || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23133526'/><text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='%234ade80' dominant-baseline='middle' text-anchor='middle'>🌱</text></svg>"} 
                                 className="w-24 h-32 object-cover rounded bg-white/5"
                                 alt={item.name}
                                 referrerPolicy="no-referrer"
                                 onError={(e: any) => handleImageError(e, item.img)}
                             />
                            <div className="flex-1">
                                <h3 className="text-white font-medium">{item.name}</h3>
                                <div className="flex gap-2 my-2 items-center">
                                    <span className="text-white/60 text-sm">Qty:</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => decreaseQty(item.id)} className="bg-red-600 p-1.5 rounded"><Minus size={14} /></button>
                                        <span className="text-white font-bold">{item.qty}</span>
                                        <button onClick={() => addToCart(item)} className="bg-green-600 p-1.5 rounded"><Plus size={14} /></button>
                                    </div>
                                </div>
                                <p className="text-green-400 font-bold">₹{item.price}.00</p>
                                <p className="text-white/60 text-xs">10 day Return and Exchange</p>
                            </div>
                            <button onClick={() => removeFromCart(item.id)}>
                                <Trash className="w-5 h-5 text-white/60" />
                            </button>
                        </div>
                        <div className="border-t border-white/10 mt-3 pt-2 flex justify-between text-sm text-white/80">
                            <span>Delivery by 15th Jul</span>
                            <div className="flex gap-3 items-center">
                                <button
                                    onClick={() => {
                                        const isInWishlist = wishlist.some((w: any) => w.id === item.id)
                                        if (!isInWishlist) {
                                            toggleWishlist(item)
                                        }
                                        removeFromCart(item.id)
                                    }}
                                    className={`flex items-center gap-1 text-sm font-semibold transition-all ${
                                        wishlist.some((w: any) => w.id === item.id)
                                            ? 'text-red-400 hover:text-red-300'
                                            : 'text-pink-400 hover:text-pink-300'
                                    }`}
                                >
                                    <Heart size={14} className={wishlist.some((w: any) => w.id === item.id) ? 'fill-red-400 text-red-400' : ''} />
                                    {wishlist.some((w: any) => w.id === item.id) ? 'In Wishlist' : 'Move to Wishlist'}
                                </button>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300">Remove</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* APPLY COUPON */}
            <div className="bg-white/10 backdrop-blur-xl p-4 flex justify-between mt-2 text-white border-y border-white/10">
                <div className="flex items-center gap-2"><Percent size={18} /> Apply coupon</div>
                <button onClick={() => setShowCoupon(true)} className="text-green-400 font-semibold">
                    {appliedCoupon ? appliedCoupon.code : "Select"}
                </button>
            </div>

            {/* ORDER DETAILS */}
            <div className="bg-white/10 backdrop-blur-xl p-4 mt-2 text-white mb-4">
                <h2 className="font-bold mb-3">Order Details</h2>
                <div className="flex justify-between text-sm mb-2"><span>Bag Total</span><span>₹{subtotal}.00</span></div>
                {appliedCoupon && (
                    <div className="flex justify-between text-sm mb-2 text-green-400">
                        <span>Coupon ({appliedCoupon.code})</span><span>-₹{discount.toFixed(0)}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm mb-2"><span>Delivery Fee</span><span className="text-green-400">Free</span></div>
                <hr className="my-2 border-white/10" />
                <div className="flex justify-between font-bold text-lg"><span>Amount Payable</span><span>₹{total.toFixed(0)}.00</span></div>
            </div>

            {/* BOTTOM STICKY BAR */}
            <div className="fixed bottom-16 left-0 right-0 bg-black/90 backdrop-blur-xl p-4 flex justify-between items-center border-t border-white/10 z-50">
                <div>
                    <p className="font-bold text-lg text-white">₹{total.toFixed(0)}.00</p>
                </div>
                <button
                    onClick={() => router.push('/checkout')}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700">
                    Proceed to Payment
                </button>
            </div>

            {/* COUPON POPUP */}
            {showCoupon && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border-white/20">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-white font-bold text-xl">Apply Coupon</h2>
                            <button onClick={() => setShowCoupon(false)}><X className="text-white" /></button>
                        </div>
                        <div className="space-y-3">
                            {COUPONS.map(c => (
                                <div key={c.code} onClick={() => handleApplyCoupon(c)} className="bg-white/5 p-3 rounded-lg border-white/10 cursor-pointer hover:bg-white/10">
                                    <p className="text-green-400 font-bold">{c.code}</p>
                                    <p className="text-white/80 text-sm">{c.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}