'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Outfit } from 'next/font/google'
import { ArrowLeft, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600', '700'] })

export default function AddAddressPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">📍</div>
                    <p className="text-white/60">Loading address page...</p>
                </div>
            </div>
        }>
            <AddAddressForm />
        </Suspense>
    )
}

function AddAddressForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editIndex = searchParams.get('id')
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        name: "", phone: "", pincode: "", city: "", state: "",
        locality: "", flat: "", isDefault: false
    })
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)

            // If editing, load the existing address
            if (editIndex !== null) {
                const { data } = await supabase
                    .from('profiles')
                    .select('saved_addresses')
                    .eq('id', user.id)
                    .single()

                if (data?.saved_addresses && data.saved_addresses[parseInt(editIndex)]) {
                    setForm(data.saved_addresses[parseInt(editIndex)])
                }
            }
        }
        load()
    }, [editIndex, router])

    const handleSave = async () => {
        if (!form.name || !form.phone || !form.pincode || !form.city) {
            alert('Please fill Name, Phone, Pincode and City.')
            return
        }
        setSaving(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        // Fetch current addresses from Supabase first
        const { data: profileData } = await supabase
            .from('profiles')
            .select('saved_addresses')
            .eq('id', user.id)
            .single()

        let currentAddresses: any[] = profileData?.saved_addresses || []

        // If setting as default, remove default from others
        if (form.isDefault) {
            currentAddresses = currentAddresses.map((a: any) => ({ ...a, isDefault: false }))
        }

        let updatedAddresses
        if (editIndex !== null) {
            // Edit existing address
            updatedAddresses = [...currentAddresses]
            updatedAddresses[parseInt(editIndex)] = form
        } else {
            // Add new address
            updatedAddresses = [...currentAddresses, form]
        }

        const { error } = await supabase
            .from('profiles')
            .update({ saved_addresses: updatedAddresses })
            .eq('id', user.id)

        if (error) {
            alert('Failed to save address: ' + error.message)
            setSaving(false)
            return
        }

        // Also update localStorage for cart page usage
        localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses))

        setSaving(false)
        router.push('/cart/address')
    }

    const inputClass = "w-full border-b border-white/20 p-3 outline-none focus:border-green-500 bg-transparent text-white placeholder-white/30 transition-colors"
    const labelClass = "text-white/60 text-sm mt-5 block font-medium"

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className} text-white pb-28`}>
            <nav className="bg-black/30 backdrop-blur-xl p-4 flex items-center justify-between sticky top-0 border-b border-white/10 z-10">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-lg font-bold text-white">
                    {editIndex !== null ? 'Edit Address' : 'Add New Address'}
                </h1>
                <button
                    onClick={() => setForm({ name: "", phone: "", pincode: "", city: "", state: "", locality: "", flat: "", isDefault: false })}
                    className="text-green-400 font-semibold text-sm"
                >
                    Reset
                </button>
            </nav>

            <div className="p-5 max-w-lg mx-auto">
                <div className="bg-white/5 rounded-2xl p-5 mb-4 border border-white/10">
                    <h2 className="font-bold text-lg mb-1">📞 Contact Info</h2>
                    <p className="text-white/40 text-xs mb-4">We'll use this for delivery coordination</p>

                    <label className={labelClass}>Full Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g. Kethana Gayathri" />

                    <label className={labelClass}>Phone Number (+91) *</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="e.g. 9398354195" type="tel" />
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h2 className="font-bold text-lg mb-1">📍 Address Info</h2>
                    <p className="text-white/40 text-xs mb-4">Enter your complete delivery address</p>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className={labelClass}>Pincode *</label>
                            <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className={inputClass} placeholder="517325" />
                        </div>
                        <div className="flex-1">
                            <label className={labelClass}>City *</label>
                            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Chittoor" />
                        </div>
                    </div>

                    <label className={labelClass}>State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} placeholder="Andhra Pradesh" />

                    <label className={labelClass}>Locality / Area</label>
                    <input value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} className={inputClass} placeholder="e.g. Tirupati Road" />

                    <label className={labelClass}>Flat No / Building Name</label>
                    <input value={form.flat} onChange={(e) => setForm({ ...form, flat: e.target.value })} className={inputClass} placeholder="e.g. Flat 2B, Green Apartments" />

                    <label className="flex items-center gap-3 mt-6 cursor-pointer">
                        <div
                            onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${form.isDefault ? 'bg-green-500 border-green-500' : 'border-white/30'}`}
                        >
                            {form.isDefault && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-white/80 font-medium">Set as default address</span>
                    </label>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                >
                    {saving ? '⏳ Saving...' : '✅ Save Address'}
                </button>
            </div>
        </main>
    )
}