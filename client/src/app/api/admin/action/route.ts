import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
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

        const { action, payload } = await req.json()

        if (action === 'updateOrderStatus') {
            const { orderId, status } = payload
            const { error } = await supabaseAdmin
                .from('orders')
                .update({ order_status: status })
                .eq('id', orderId)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'addProduct') {
            const { name, price, stock_quantity, img, category, description } = payload
            const { data, error } = await supabaseAdmin
                .from('products')
                .insert({
                    name,
                    price: parseFloat(price),
                    stock_quantity: parseInt(stock_quantity) || 0,
                    images: [img || 'https://via.placeholder.com/150'],
                    category,
                    description
                })
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ success: true, product: data })
        }

        if (action === 'deleteProduct') {
            const { productId } = payload
            const { error } = await supabaseAdmin
                .from('products')
                .delete()
                .eq('id', productId)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

    } catch (error: any) {
        console.error('Admin action error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
