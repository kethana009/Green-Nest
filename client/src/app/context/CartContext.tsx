'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext<any>(null)

function loadFromStorage(key: string, fallback: any) {
    if (typeof window === 'undefined') return fallback
    try {
        const saved = localStorage.getItem(key)
        return saved ? JSON.parse(saved) : fallback
    } catch { return fallback }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<any[]>(() => loadFromStorage('gn_cart', []))
    const [wishlist, setWishlist] = useState<any[]>(() => loadFromStorage('gn_wishlist', []))
    const [toast, setToast] = useState("")

    // Persist cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('gn_cart', JSON.stringify(cart))
    }, [cart])

    // Persist wishlist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('gn_wishlist', JSON.stringify(wishlist))
    }, [wishlist])

    const addToCart = (product: any) => {
        setCart(prev => {
            const exist = prev.find(p => p.id === product.id)
            if (exist) {
                return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p)
            }
            return [...prev, { ...product, qty: 1 }]
        })
        setToast(`${product.name} Added to Bag!`)
        setTimeout(() => setToast(""), 2000)
    }

    // IDHI KOTTHA - QTY TAGGIYADANIKI
    const decreaseQty = (id: number) => {
        setCart(prev => {
            const exist = prev.find(p => p.id === id)
            if (exist.qty === 1) {
                return prev.filter(p => p.id !== id) // 1 unte remove
            }
            return prev.map(p => p.id === id ? { ...p, qty: p.qty - 1 } : p)
        })
    }

    // IDHI KOTTHA - FULL REMOVE CHEYYADANIKI
    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(p => p.id !== id))
        setToast(`Item Removed from Bag!`)
        setTimeout(() => setToast(""), 2000)
    }

    const toggleWishlist = (product: any) => {
        setWishlist(prev =>
            prev.some((p: any) => p.id === product.id)
                ? prev.filter((p: any) => p.id !== product.id)
                : [...prev, product]
        )
    }

    const getCartCount = () => cart.reduce((sum, item) => sum + item.qty, 0)

    const clearCart = () => {
        setCart([])
        localStorage.removeItem('gn_cart')
    }

    return (
        <CartContext.Provider value={{ cart, addToCart, decreaseQty, removeFromCart, wishlist, toggleWishlist, toast, getCartCount, clearCart }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)