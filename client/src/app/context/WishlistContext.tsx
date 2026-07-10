'use client'
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type WishlistItem = {
    id: number
    name: string
    price: number
    img: string
}

type WishlistContextType = {
    wishlist: WishlistItem[]
    addToWishlist: (item: WishlistItem) => void
    removeFromWishlist: (id: number) => void
    isInWishlist: (id: number) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([])

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('wishlist')
        if (saved) setWishlist(JSON.parse(saved))
    }, [])

    // Persist to localStorage on change
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlist))
    }, [wishlist])

    const addToWishlist = (item: WishlistItem) => {
        setWishlist(prev => {
            if (prev.find(i => i.id === item.id)) return prev
            return [...prev, item]
        })
    }

    const removeFromWishlist = (id: number) => {
        setWishlist(prev => prev.filter(i => i.id !== id))
    }

    const isInWishlist = (id: number) => wishlist.some(i => i.id === id)

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (!context) throw new Error('useWishlist must be used within WishlistProvider')
    return context
}
