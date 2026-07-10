'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function DashboardPage() {
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session?.user) {
                router.push('/login')
                return
            }
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (profile?.role === 'admin') {
                router.push('/admin')
            } else {
                router.push('/home')
            }
        })
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🌱</div>
                <p className="text-white/60 text-lg">Loading...</p>
            </div>
        </div>
    )
}