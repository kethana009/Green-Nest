import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
    try {
        const { userId, total, address, cart } = await req.json()

        if (!userId || !cart || cart.length === 0) {
            return NextResponse.json({ success: false, error: 'Invalid order request data.' }, { status: 400 })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Insert order using admin client to bypass RLS restrictions
        const { data: orderData, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId,
                total_amount: total,
                discount_amount: 0,
                shipping_fee: 0,
                payment_method: 'cod',
                payment_status: 'pending',
                order_status: 'pending',
                shipping_address: address,
            })
            .select()
            .single()

        if (orderError) {
            console.error('API Order insertion error:', orderError)
            return NextResponse.json({ success: false, error: orderError.message }, { status: 500 })
        }

        const newOrderId = orderData.id

        // 2. Prepare and insert order items
        const orderItemsToInsert = cart.map((item: any) => {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id))
            return {
                order_id: newOrderId,
                product_id: isUuid ? item.id : null,
                product_snapshot: {
                    id: item.id,
                    name: item.name,
                    img: item.img,
                    price: item.price
                },
                quantity: item.qty,
                unit_price: item.price,
                total_price: item.price * item.qty
            }
        })

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItemsToInsert)

        if (itemsError) {
            console.error('API Order items insertion error:', itemsError)
            // Roll back order if items insertion fails
            await supabaseAdmin.from('orders').delete().eq('id', newOrderId)
            return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, orderId: newOrderId })

    } catch (error: any) {
        console.error('Server order placement error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
