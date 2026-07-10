const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from client/.env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function seed() {
    console.log('Reading products.ts...')
    const code = fs.readFileSync(path.resolve(__dirname, '../src/lib/products.ts'), 'utf8')
    
    // Convert typescript export to CommonJS module.exports
    const jsCode = code.replace('export const products =', 'module.exports =')
    
    // Write temporary file
    const tempPath = path.resolve(__dirname, './temp-products.js')
    fs.writeFileSync(tempPath, jsCode)
    
    const products = require(tempPath)
    fs.unlinkSync(tempPath) // Clean up temp file
    
    console.log(`Successfully parsed ${products.length} products.`)

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials in .env.local')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch existing product names to prevent duplicate entries
    const { data: dbProducts, error: fetchError } = await supabase
        .from('products')
        .select('name')

    if (fetchError) {
        console.error('Error fetching existing products:', fetchError)
        return
    }

    const existingNames = new Set((dbProducts || []).map(p => p.name))
    console.log(`Found ${existingNames.size} products already in the database.`)

    const toInsert = []

    for (const p of products) {
        if (!existingNames.has(p.name)) {
            let difficulty = 'beginner'
            if (p.desc && p.desc.toLowerCase().includes('intermediate')) {
                difficulty = 'intermediate'
            } else if (p.desc && p.desc.toLowerCase().includes('expert')) {
                difficulty = 'expert'
            }

            toInsert.push({
                name: p.name,
                scientific_name: p.main === 'Plants' ? p.name : '',
                description: p.desc || p.name,
                price: p.price,
                stock_quantity: p.stock || 20,
                category: p.category || p.main || 'Plants',
                is_indoor: p.light && (p.light.toLowerCase().includes('shade') || p.light.toLowerCase().includes('low')) ? true : false,
                difficulty_level: difficulty,
                watering_frequency: p.watering || 'Once a week',
                sunlight_requirement: p.light || 'Indirect Light',
                images: p.img ? [p.img] : [],
                benefits: p.howToUse || []
            })
        }
    }

    console.log(`Inserting ${toInsert.length} missing products into database...`)

    if (toInsert.length === 0) {
        console.log('Database is already up to date!')
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

    console.log('Seeding complete! Database is now synchronized with products.ts.')
}

seed().catch(err => {
    console.error('Unhandled seed error:', err)
})
