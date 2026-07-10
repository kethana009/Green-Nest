'use client'
import './globals.css'
import { CartProvider } from '@/app/context/CartContext'
import { WishlistProvider } from '@/app/context/WishlistContext'
import BottomNav from './components/BottomNav'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const hideNav = pathname === '/' || pathname === '/login' || pathname.startsWith('/checkout') || pathname.startsWith('/order-confirmation')

  return (
    <html lang="en">
      <body className="bg-black">
        <CartProvider>
          <WishlistProvider>
            <div className={isAdmin ? "pb-32" : hideNav ? "" : "pb-20"}>
              {children}
            </div>
            {!isAdmin && !hideNav && <BottomNav />}
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}