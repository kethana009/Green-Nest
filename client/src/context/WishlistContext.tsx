'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

type WishlistContextType = {
    wishlist: string[]
    addToWishlist: (id: string) => void
    removeFromWishlist: (id: string) => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<string[]>([])

    const addToWishlist = (id: string) => {
        setWishlist((prev) => [...prev, id])
    }

    const removeFromWishlist = (id: string) => {
        setWishlist((prev) => prev.filter(item => item !== id))
    }

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist }}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (!context) throw new Error('useWishlist must be used within WishlistProvider')
    return context
}