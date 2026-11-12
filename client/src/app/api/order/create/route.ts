import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Please sign in to place an order.' }, { status: 401 })
        }

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Order API is missing Supabase server environment variables.')
            return NextResponse.json({ success: false, error: 'Order service is temporarily unavailable.' }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        const accessToken = authHeader.slice('Bearer '.length).trim()
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken)

        if (authError || !authData.user) {
            return NextResponse.json({ success: false, error: 'Your session is invalid or expired. Please sign in again.' }, { status: 401 })
        }

        const { address, cart } = await req.json()

        if (!Array.isArray(cart) || cart.length === 0 || cart.length > 50) {
            return NextResponse.json({ success: false, error: 'Your cart is empty or contains too many items.' }, { status: 400 })
        }

        if (!address || typeof address !== 'object' || Array.isArray(address)) {
            return NextResponse.json({ success: false, error: 'Please select a valid delivery address.' }, { status: 400 })
        }

        for (const item of cart) {
            const quantity = Number(item?.qty)
            const price = Number(item?.price)
            if (
                item?.id === undefined ||
                typeof item?.name !== 'string' ||
                !item.name.trim() ||
                !Number.isSafeInteger(quantity) ||
                quantity < 1 ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                return NextResponse.json({ success: false, error: 'One or more cart items are invalid.' }, { status: 400 })
            }
        }

        const orderTotal = cart.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.qty), 0)
        if (!Number.isFinite(orderTotal)) {
            return NextResponse.json({ success: false, error: 'Unable to calculate the order total.' }, { status: 400 })
        }

        // The authenticated Supabase user is the only permitted order owner.
        const { data: orderData, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: authData.user.id,
                total_amount: orderTotal,
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
            return NextResponse.json({ success: false, error: 'Could not create your order. Please try again.' }, { status: 500 })
        }

        const newOrderId = orderData.id

        const orderItemsToInsert = cart.map((item: any) => {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id))
            return {
                order_id: newOrderId,
                product_id: isUuid ? item.id : null,
                product_snapshot: {
                    id: item.id,
                    name: item.name,
                    img: item.img,
                    price: Number(item.price)
                },
                quantity: Number(item.qty),
                unit_price: Number(item.price),
                total_price: Number(item.price) * Number(item.qty)
            }
        })

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItemsToInsert)

        if (itemsError) {
            console.error('API Order items insertion error:', itemsError)
            await supabaseAdmin.from('orders').delete().eq('id', newOrderId).eq('user_id', authData.user.id)
            return NextResponse.json({ success: false, error: 'Could not save your order items. Please try again.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, orderId: newOrderId })
    } catch (error: any) {
        console.error('Server order placement error:', error)
        return NextResponse.json({ success: false, error: 'An unexpected error occurred while placing your order.' }, { status: 500 })
    }
}
