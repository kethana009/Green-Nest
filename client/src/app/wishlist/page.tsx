'use client'
import { useCart } from '@/app/context/CartContext'
import { useRouter } from 'next/navigation'
import { Outfit } from 'next/font/google'
import { Heart, ArrowLeft, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

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
        e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23133526'/><text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='%234ade80' dominant-baseline='middle' text-anchor='middle'>🌱 Plant</text></svg>";
    }
};

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600', '700', '800'] })

export default function WishlistPage() {
    const { wishlist = [], toggleWishlist, addToCart } = useCart()
    const router = useRouter()
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set())

    const handleAddToCart = (product: any, e: React.MouseEvent) => {
        e.stopPropagation()
        addToCart(product)
        setAddedIds(prev => new Set([...prev, product.id]))
        setTimeout(() => {
            setAddedIds(prev => {
                const next = new Set(prev)
                next.delete(product.id)
                return next
            })
        }, 2000)
    }

    const handleRemoveFromWishlist = (product: any, e: React.MouseEvent) => {
        e.stopPropagation()
        toggleWishlist(product)
    }

    const handleOpenProduct = (product: any) => {
        router.push(`/product/${product.id}`)
    }

    if (wishlist?.length === 0) {
        return (
            <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className} flex items-center justify-center p-4`}>
                <div className="text-center">
                    <Heart className="w-20 h-20 text-red-400 mb-4 mx-auto" />
                    <h1 className="text-2xl text-white font-bold mb-2">Wishlist Empty</h1>
                    <p className="text-white/60 mb-6">Save products you love and come back to them later</p>
                    <button onClick={() => router.push('/browse')} className="bg-green-600 px-8 py-3 rounded-2xl text-white font-bold hover:bg-green-500 transition-all">
                        Browse Plants
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className} pb-24`}>
            {/* Header */}
            <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 p-4 sticky top-0 z-40 flex items-center gap-4">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    My Wishlist <Heart className="w-5 h-5 fill-red-500 text-red-500" /> ({wishlist?.length})
                </h1>
                <button
                    onClick={() => router.push('/cart')}
                    className="ml-auto bg-green-600 px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-1 hover:bg-green-500 transition-all"
                >
                    <ShoppingCart className="w-4 h-4" /> Cart
                </button>
            </nav>

            {/* Product Grid - same layout as category/browse */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                    {wishlist?.map((product: any) => (
                        <div
                            key={product.id}
                            onClick={() => handleOpenProduct(product)}
                            className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:border-green-400/40 transition-all cursor-pointer group active:scale-95"
                        >
                            {/* Product Image */}
                            <div className="relative">
                                <img
                                    src={proxyUrl(product.img) || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23133526'/><text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='%234ade80' dominant-baseline='middle' text-anchor='middle'>🌱 Plant</text></svg>"}
                                    alt={product.name}
                                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300 bg-white/5"
                                    referrerPolicy="no-referrer"
                                    onError={(e: any) => handleImageError(e, product.img)}
                                />
                                {/* Remove from Wishlist */}
                                <button
                                    onClick={(e) => handleRemoveFromWishlist(product, e)}
                                    className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-all"
                                >
                                    <Heart className="w-4 h-4 fill-white text-white" />
                                </button>
                                {/* Price badge */}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white font-bold">
                                    ₹{product.price}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-3">
                                <p className="font-bold text-sm text-white leading-tight mb-1 line-clamp-1">
                                    {product.name}
                                </p>
                                {product.desc && (
                                    <p className="text-white/50 text-xs mb-2 line-clamp-2">{product.desc}</p>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-green-400 font-bold text-base">₹{product.price}</span>
                                    {product.mrp && (
                                        <span className="text-white/40 text-xs line-through">₹{product.mrp}</span>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => handleAddToCart(product, e)}
                                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                        addedIds.has(product.id)
                                            ? 'bg-green-600 text-white'
                                            : 'bg-orange-500 hover:bg-orange-400 text-white'
                                    }`}
                                >
                                    <ShoppingCart className="w-3 h-3" />
                                    {addedIds.has(product.id) ? '✅ Added to Cart!' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-16 left-4 right-4 z-40">
                <button
                    onClick={() => router.push('/cart')}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl shadow-green-500/40 transition-all"
                >
                    <ShoppingCart className="w-5 h-5" />
                    Go to Cart →
                </button>
            </div>
        </main>
    )
}