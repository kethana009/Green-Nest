import { createClient } from '@supabase/supabase-js'
import { products } from '../src/lib/products'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from client/.env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function seed() {
    console.log(`Starting seeding script with ${products.length} products...`)
    
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials in env')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch existing product names to avoid duplicates
    const { data: dbProducts, error: fetchError } = await supabase
        .from('products')
        .select('name')

    if (fetchError) {
        console.error('Error fetching existing products:', fetchError)
        return
    }

    const existingNames = new Set((dbProducts || []).map(p => p.name))
    console.log(`Found ${existingNames.size} products already in database.`)

    const toInsert = []

    for (const p of products) {
        if (!existingNames.has(p.name)) {
            // Map products.ts fields to DB columns
            let difficulty: 'beginner' | 'intermediate' | 'expert' = 'beginner'
            if (p.desc?.toLowerCase().includes('intermediate')) {
                difficulty = 'intermediate'
            } else if (p.desc?.toLowerCase().includes('expert')) {
                difficulty = 'expert'
            }

            toInsert.push({
                name: p.name,
                scientific_name: p.main === 'Plants' ? p.name : '',
                description: p.desc || p.name,
                price: p.price,
                stock_quantity: p.stock || 20,
                category: p.category || p.main || 'Plants',
                is_indoor: p.light?.toLowerCase().includes('shade') || p.light?.toLowerCase().includes('low') || false,
                difficulty_level: difficulty,
                watering_frequency: p.watering || 'Once a week',
                sunlight_requirement: p.light || 'Indirect Light',
                images: p.img ? [p.img] : [],
                benefits: p.howToUse || []
            })
        }
    }

    console.log(`Inserting ${toInsert.length} new products into database...`)

    if (toInsert.length === 0) {
        console.log('All products already seeded!')
        return
    }

    // Insert in batches of 50
    const batchSize = 50
    for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize)
        const { error: insertError } = await supabase
            .from('products')
            .insert(batch)

        if (insertError) {
            console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError)
        } else {
            console.log(`Batch ${i / batchSize + 1} inserted successfully.`)
        }
    }

    console.log('Seeding complete!')
}

seed().catch(err => {
    console.error('Unhandled seed error:', err)
})
