'use client'
import { useRouter } from 'next/navigation'
import { Outfit } from 'next/font/google'
import { ArrowLeft, Plus, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600', '700'] })

export default function AddressListPage() {
    const router = useRouter()
    const [addresses, setAddresses] = useState<any[]>([])

    useEffect(() => {
        loadAddresses()
    }, [])

    const loadAddresses = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase.from('profiles').select('saved_addresses').eq('id', user.id).single()
        if (data?.saved_addresses) {
            setAddresses(data.saved_addresses)
            localStorage.setItem('userAddresses', JSON.stringify(data.saved_addresses))
        }
    }

    const handleSelect = (addr: any) => {
        localStorage.setItem('selectedAddress', JSON.stringify(addr))
        router.back()
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className}`}>
            <nav className="bg-black/30 backdrop-blur-xl p-4 flex items-center justify-between sticky top-0 border-b border-white/10">
                <button onClick={() => router.back()}><ArrowLeft className="w-6 h-6 text-white" /></button>
                <h1 className="text-lg font-bold text-white">Delivery Address</h1>
                <button onClick={() => router.push('/cart/address/add')} className="text-green-400 font-semibold flex items-center gap-1">
                    <Plus size={18} /> Add address
                </button>
            </nav>

            <h1 className="text-2xl font-bold p-4 text-white">Delivery Address</h1>

            <div className="p-4 space-y-4">
                {addresses.length === 0 && <p className="text-white/60 text-center">No addresses yet</p>}
                {addresses.map((addr, index) => (
                    <div key={index} onClick={() => handleSelect(addr)} className="bg-white/10 backdrop-blur-xl rounded-lg border-white/10 p-4 cursor-pointer hover:bg-white/20">
                        <div className="flex justify-between items-start text-white">
                            <div className="flex-1">
                                {addr.isDefault && <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">DEFAULT</span>}
                                <h3 className="font-bold text-lg mt-2">{addr.name}</h3>
                                <p className="text-white/70 text-sm mt-1">
                                    {addr.flat}, {addr.locality}, {addr.city}, {addr.state}-{addr.pincode}
                                </p>
                                <p className="text-white/70 text-sm mt-2">Phone : {addr.phone}</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/cart/address/add?id=${index}`) }}
                                    className="text-green-400 font-semibold mt-3">Edit</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}