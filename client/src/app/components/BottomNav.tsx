'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/app/context/CartContext'
import { Home, List, Heart, User, ShoppingCart } from 'lucide-react' // ShoppingCart = trolley

export default function BottomNav() {
    const { cart = [] } = useCart()
    const pathname = usePathname()

    const cartCount = cart.reduce((sum: number, item: any) => sum + item.qty, 0)

    const navItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Category', href: '/category', icon: List }, // CATEGORY SAME
        { name: 'Wishlist', href: '/wishlist', icon: Heart },
        { name: 'Cart', href: '/cart', icon: ShoppingCart }, // TROLLEY ICON
        { name: 'Profile', href: '/profile', icon: User },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-green-900/30 z-50">
            <div className="flex justify-around py-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link key={item.name} href={item.href} className="flex flex-col items-center relative">
                            <Icon size={24} className={`${isActive ? 'scale-110 text-green-400' : 'opacity-60 text-gray-400'}`} />

                            {/* CART COUNT BADGE */}
                            {item.name === 'Cart' && cartCount > 0 && (
                                <span className="absolute -top-1 right-0 bg-red-500 text-white text- w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            )}

                            <span className={`text-xs mt-1 ${isActive ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}