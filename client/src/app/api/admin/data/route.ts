import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Verify user from token
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        // Verify user role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        // Query all data with service role (bypassing client-side RLS policy limits)
        const [
            { data: products },
            { data: ordersData },
            { data: customers }
        ] = await Promise.all([
            supabaseAdmin.from('products').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('orders').select('*, profiles(full_name, email), order_items(*)').order('created_at', { ascending: false }),
            supabaseAdmin.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
        ])

        return NextResponse.json({
            success: true,
            products: products || [],
            orders: ordersData || [],
            customers: customers || []
        })

    } catch (error: any) {
        console.error('Admin data fetch error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
