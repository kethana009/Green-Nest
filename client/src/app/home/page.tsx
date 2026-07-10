'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Outfit } from 'next/font/google'
import { useCart } from '@/app/context/CartContext'
import BottomNav from '@/app/components/BottomNav'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const outfit = Outfit({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800']
})

const OFFLINE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23133526'/><text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='%234ade80' dominant-baseline='middle' text-anchor='middle'>🌱 Plant</text></svg>";

const proxyUrl = (url: string) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

// Safely extract a valid image URL from Supabase images field
const parseImageUrl = (images: any): string => {
    if (!images) return '';
    if (typeof images === 'string') {
        const s = images.trim();
        if (s.startsWith('http://') || s.startsWith('https://')) return s;
        if (s.startsWith('{') && s.endsWith('}')) {
            const first = s.slice(1, -1).split(',')[0].replace(/^"|"$/g, '').trim();
            if (first.startsWith('http')) return first;
        }
        if (s.startsWith('[')) {
            try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]);
            } catch (_) {}
        }
        return '';
    }
    if (Array.isArray(images) && images[0]) return String(images[0]);
    return '';
};

const handleImageError = (e: any, originalUrl: string) => {
    if (!originalUrl) return;
    e.target.onerror = null;
    const currentSrc = e.target.src;
    if (currentSrc.includes('images.weserv.nl')) {
        e.target.src = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
    } else if (currentSrc.includes('/api/proxy-image')) {
        e.target.src = originalUrl;
    } else {
        e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23133526'/><text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='%234ade80' dominant-baseline='middle' text-anchor='middle'>🌱 Plant</text></svg>";
    }
};

type Plant = {
    id: number
    name: string
    price: number
    img: string
    importance: string
    uses: string
    category: string[]
}

const bannerImages = [
    { img: "https://www.thespruce.com/thmb/1iZLOVidiIgDMT1hjZtsYLSgHFQ=/960x0/filters:no_upscale():max_bytes(150000):strip_icc()/MonsteraGettyImages-543578398-67910f62f30a4f2b83fdaa561840d460.jpg", text: "Bring me home, and i'll bring the jungle vibes", productId: 2 },
    { img: "https://cactus-art.biz/schede/SEDUM/Sedum_pachyphyllum/Sedum_pachyphyllum_cristata/Sedum_pachyphyllum_cristata_03_810.jpg", text: "Your office desk has been waiting for me", productId: 50 },
    { img: "https://static1.backyardbossimages.com/wordpress/wp-content/uploads/2024/05/boxwood-plant-1.jpg", text: "It's time for boxwood comes to your home", productId: 12 },
    { img: "https://www.swallowtailgardenseeds.com/flowers/impatiens/impatiens-xtreme-mix.jpeg", text: "This aesthetic needs your home", productId: 36 },
    { img: "https://cdn.pixabay.com/photo/2017/08/28/16/18/aloe-vera-2690259_1280.jpg", text: "Bring this medicine to your home", productId: 5 },
    { img: "https://wallpaperaccess.com/full/1322288.jpg", text: "Nature's fragrance for your favorite", productId: 41 },
    { img: "https://www.gardeningknowhow.com/wp-content/uploads/2020/11/bamboo-tree.jpg", text: "Bring balance and harmony home", productId: 4 },
    { img: "https://lawn.com.au/wp-content/uploads/2022/12/red-roses-in-the-garden.jpg", text: "Where love blooms, life flourishes", productId: 42 },
];

const categories = [
    { name: 'Summer Plants', img: 'https://wallpaperaccess.com/full/1322288.jpg' },
    { name: 'Indoor Plants', img: 'https://www.thespruce.com/thmb/1iZLOVidiIgDMT1hjZtsYLSgHFQ=/960x0/filters:no_upscale():max_bytes(150000):strip_icc()/MonsteraGettyImages-543578398-67910f62f30a4f2b83fdaa561840d460.jpg' },
    { name: 'Air Purifying', img: 'https://cdn.pixabay.com/photo/2017/08/28/16/18/aloe-vera-2690259_1280.jpg' },
    { name: 'Flowering', img: 'https://lawn.com.au/wp-content/uploads/2022/12/red-roses-in-the-garden.jpg' },
    { name: 'Medicinal', img: 'https://cdn.pixabay.com/photo/2017/08/28/16/18/aloe-vera-2690259_1280.jpg' },
    { name: 'Hanging', img: 'https://cactus-art.biz/schede/SEDUM/Sedum_pachyphyllum/Sedum_pachyphyllum_cristata/Sedum_pachyphyllum_cristata_03_810.jpg' },
    { name: 'Office', img: 'https://www.gardeningknowhow.com/wp-content/uploads/2020/11/bamboo-tree.jpg' },
    { name: 'Low Light', img: 'https://static1.backyardbossimages.com/wordpress/wp-content/uploads/2024/05/boxwood-plant-1.jpg' },
];

export default function HomePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const { addToCart, getCartCount, toggleWishlist, wishlist = [] } = useCart()
    const [addedId, setAddedId] = useState<number | null>(null)
    const [currentSlide, setCurrentSlide] = useState(0);

    const [allDbProducts, setAllDbProducts] = useState<any[]>([])
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const { data } = await supabase.from('products').select('*')
                if (data && data.length > 0) {
                    const mapped = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        price: Number(p.price),
                        desc: p.description || p.name,
                        img: parseImageUrl(p.images) || p.img || p.image_url || 'https://placehold.co/100/1e4d38/4ade80?text=Plant',
                        category: p.category || 'Plants'
                    }))
                    setAllDbProducts(mapped)
                }
            } catch (e) {
                console.error(e)
            }
        }
        fetchAllProducts()
    }, [])

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (!query.trim()) {
            setSearchResults([])
            setHasSearched(false)
            return
        }

        const uniqueProducts = new Map()

        allDbProducts.forEach(p => {
            uniqueProducts.set(p.name.toLowerCase(), p)
        })

        allPlants.forEach(p => {
            const mappedP = {
                id: p.id,
                name: p.name,
                price: p.price,
                desc: p.uses || p.name,
                img: p.img
            }
            if (!uniqueProducts.has(mappedP.name.toLowerCase())) {
                uniqueProducts.set(mappedP.name.toLowerCase(), mappedP)
            }
        })

        const matched = Array.from(uniqueProducts.values()).filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            (p.desc && p.desc.toLowerCase().includes(query.toLowerCase()))
        )

        setSearchResults(matched)
        setHasSearched(true)
    }

    const allPlants: Plant[] = [
        { id: 1, name: "Snake Plant", price: 899, img: "https://agribotix.com/wp-content/uploads/2025/01/Types-of-Snake-Plants.jpg", importance: "Only houseplant doing CAM photosynthesis - releases oxygen at NIGHT. Removes 107+ toxins: toluene, benzene, formaldehyde, trichloroethylene, xylene. Filters CO2 24/7.", uses: "Best bedroom plant for better sleep & air quality. Survives in AC rooms, bathrooms, dark corners. Water once in 3-4 weeks. NASA approved. Vastu: absorbs negative energy. Pet-safe.", category: ['Indoor', 'Office', 'Bedroom', 'Low Light', 'Air Purifying'] },
        { id: 2, name: "Monstera Deliciosa", price: 1299, img: "https://www.viveroelencanto.com/wp-content/uploads/2023/07/437-MONSTERA-DELICIOSA.jpg", importance: "NASA Clean Air Study certified. Large fenestrated leaves absorb formaldehyde, benzene, xylene, ammonia from furniture & paints. Increases room humidity by 10-15%. High oxygen output during day.", uses: "Living room statement piece. Reduces stress & blood pressure by 15%. Boosts focus for WFH setups. Creates tropical jungle aesthetic. Water when top 2-inch soil is dry. Bright indirect light. Easy for beginners.", category: ['Indoor', 'Office', 'Air Purifying'] },
        { id: 3, name: "Fiddle Leaf Fig", price: 1599, img: "https://www.gardening4joy.com/wp-content/uploads/2024/02/Fiddle-Leaf-Fig-Main2.jpg", importance: "Violin-shaped leaves have 2x dust-trapping surface area. High transpiration rate improves air quality & humidity. Removes airborne chemicals from furniture, carpets & paints.", uses: "Luxury home decor focal point. Improves room acoustics by 20%. Instagram-worthy aesthetic. Needs bright indirect light near window. Water weekly. Wipe leaves monthly. Grows 6-10ft indoors.", category: ['Indoor', 'Office'] },
        { id: 4, name: "Lucky Bamboo", price: 599, img: "https://www.joyusgarden.com/wp-content/uploads/2017/01/Lucky-Bamboo-care-tips-you-should-know.jpg", importance: "Lucky Bamboo brings good luck and positive energy. Grows in water or soil with zero maintenance. Perfect for office desks and small spaces.", uses: "Grow in filtered water or soil. Keep away from direct sunlight. Add pebbles for support. Perfect for office desk and gifting.", category: ['Indoor', 'Office'] },
        { id: 5, name: "Peace Lily", price: 699, img: "https://bibitbunga.com/wp-content/uploads/2015/08/spathiphyllum-peace-lily.jpg", importance: "NASA study: Removes 60% of mold spores, ammonia, benzene & formaldehyde. Increases room humidity by 5% reducing dry skin issues. Natural air freshener with white blooms.", uses: "Bathroom/Kitchen mold prevention plant. Blooms white flowers in low light. Drooping leaves = needs water. Non-toxic to humans. Calming presence reduces anxiety. Shade lover.", category: ['Indoor', 'Flower', 'Bathroom', 'Low Light', 'Air Purifying'] },
        { id: 6, name: "ZZ Plant", price: 799, img: "https://www.plantvine.com/plants/ZZ-plant-3.jpg", importance: "Drought-tolerant rhizome plant. Removes toluene, xylene, ethylbenzene from air. Survives 4 months without water. Air purifier for dark spaces. Waxy leaves reflect light.", uses: "Windowless offices, bathrooms, basements. Water only when soil is bone dry - once a month. Glossy architectural leaves. Zero-maintenance plant. Toxic if ingested - keep from pets.", category: ['Indoor', 'Office', 'Low Light', 'Air Purifying'] },
        { id: 7, name: "Rubber Plant", price: 999, img: "https://i.ytimg.com/vi/GAn3CReUk-Y/maxresdefault.jpg", importance: "Thick glossy burgundy leaves trap maximum dust & pollutants. Removes formaldehyde from furniture, carpets. Tolerates low light & city pollution. High CO2 to O2 conversion rate.", uses: "Modern office decor with dark leaves. Grows tall as indoor tree up to 8ft. Wipe leaves monthly for shine & air cleaning. Low maintenance. Bright indirect light. Water weekly.", category: ['Indoor', 'Office', 'Air Purifying'] },
        { id: 8, name: "Jade Plant - Crassula Ovata", price: 549, img: "https://i.ebayimg.com/images/g/jMYAAOSw6AljYpOu/s-l1200.jpg", importance: "Jade Plant is a succulent that brings good luck. Stores water in thick leaves so needs less watering. Perfect for sunny windowsills.", uses: "Keep in sunny windowsill. Use well-draining soil. Water only when soil is dry. Perfect for desk and gifting.", category: ['Indoor', 'Succulents'] },
        { id: 9, name: "Philodendron Xanadu", price: 849, img: "https://paisleyplants.com/wp-content/uploads/2021/04/Philodendron-Xanadu.jpg", importance: "Philodendron Xanadu has beautiful fan like split leaves. Easy to care and grows in compact shape. Great air purifier for home.", uses: "Keep in bright indirect light. Water when soil is dry. Mist leaves for humidity. Fertilize monthly in growing season.", category: ['Indoor', 'Office'] },
        { id: 10, name: "Areca Palm", price: 1199, img: "https://www.houseplant.co.uk/cdn/shop/files/Areca_Palm_Dypsis_Lutescens_Chrysalidocarpus_Tropical_Indoor_Air_Purifying_Pet_Safe_Beginner_Friendly_Colourful_Houseplant.jpg?v=1736949282", importance: "Ranked #1 natural humidifier by NASA. Releases 1 liter water vapor/day into air. Removes toluene & xylene. 4th highest oxygen-producing plant. Filters EM radiation from devices.", uses: "Large living room corners. Reduces dry skin, sinus, respiratory issues in winter. Tropical resort vibe. Pet-safe palm. Bright indirect light. Water 2-3 times/week. Grows 6-7ft.", category: ['Indoor', 'Office', 'Air Purifying'] },
        { id: 11, name: "Artemisia Plant", price: 449, img: "https://monsteraholic.com/wp-content/uploads/2024/02/Artemisia-Annua-Plant-101-monsteraholic.com_.jpeg", importance: "Artemisia has silvery foliage and herbal fragrance. Drought tolerant and needs full sun. Perfect for borders and rock gardens.", uses: "Plant in well-drained soil. Needs 6+ hours of direct sun. Prune to maintain shape. Perfect for garden borders.", category: ['Outdoor'] },
        { id: 12, name: "Boxwood", price: 699, img: "https://www.epicgardening.com/wp-content/uploads/2023/11/boxwood.jpeg", importance: "Boxwood is best for hedges and garden borders. Evergreen leaves stay beautiful all year. Easy to shape and low maintenance.", uses: "Plant in garden border. Trim regularly for shape. Water deeply once a week. Fertilize in spring.", category: ['Outdoor'] },
        { id: 13, name: "Chinese Evergreen", price: 599, img: "https://as2.ftcdn.net/v2/jpg/07/92/20/85/1000_F_792208591_gmWfxIi0GC91jOUXtvyNrPj4Sj0is9a0.jpg", importance: "Filters toxins even in fluorescent office light. Removes benzene & formaldehyde. Colorful pink/green variegated leaves purify air. Low-light champion. Longest lasting indoor plant.", uses: "Tabletop decor for desks & shelves. AC room survivor. Symbol of good fortune in Feng Shui. Wipe leaves weekly to maintain air cleaning. Water when soil is 50% dry. Low maintenance.", category: ['Indoor', 'Office', 'Low Light', 'Air Purifying'] },
        { id: 14, name: "Dracaena Marginata", price: 749, img: "https://thursd.com/storage/media/81975/a-small-pot-of-dracaena-marginata-kept-outdoors-near-balcony.jpeg?1736689120273", importance: "Dragon tree absorbs lead particles, cigarette smoke, trichloroethylene. Removes 70% of airborne pollutants. Red-edged sword-like leaves filter air 24/7.", uses: "Tall slim floor plant for tight corners. Modern architectural look. Low water needs - drought tolerant. Tolerates neglect. Grows 6ft indoors. Bright indirect light. Easy to prune.", category: ['Indoor', 'Office', 'Outdoor', 'Air Purifying'] },
        { id: 15, name: "Weeping Fig", price: 949, img: "https://m.media-amazon.com/images/I/91833bbKSFL.jpg", importance: "Excellent formaldehyde, xylene, toluene remover. Dense canopy filters maximum air volume. Oxygen production powerhouse. Improves indoor AQI by 25%.", uses: "Office lobby tree. Provides natural shade indoors. Braided trunk varieties for decor. Symbol of peace & abundance. Needs bright indirect light. Water when top soil dry. Avoid moving.", category: ['Indoor', 'Office', 'Air Purifying'] }
    ]

    const handleBuyNow = (plant: Plant) => {
        if (!user) {
            router.push('/login')
            return
        }
        addToCart(plant)
        setAddedId(plant.id)
        setTimeout(() => {
            router.push('/cart')
        }, 500)
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-emerald-900 pb-24 ${outfit.className}`}>
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-4 sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white tracking-wide">🌱 GREEN NEST</h1>
                    <div className="flex items-center gap-5">
                        <button onClick={() => setShowSearch(true)} className="text-2xl cursor-pointer text-white bg-transparent border-0 p-0 focus:outline-none">🔍</button>
                        <button onClick={() => router.push('/wishlist')} className="text-2xl cursor-pointer text-white bg-transparent border-0 p-0 focus:outline-none">❤️</button>
                        {user ? (
                            <button onClick={() => router.push('/cart')} className="relative">
                                <span className="text-2xl text-white">🛒</span>
                                {getCartCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {getCartCount()}
                                    </span>
                                )}
                            </button>
                        ) : (
                            <button onClick={() => router.push('/login')} className="text-sm font-bold text-white px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400 transition-all">
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <div className="py-4">
                <div className="flex overflow-x-auto gap-5 px-4 pb-2">
                    {categories.map((cat, i) => (
                        <div key={i} className="flex flex-col items-center min-w-24">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-r from-green-400 to-emerald-500">
                                <img src={proxyUrl(cat.img)} className="w-full h-full rounded-full object-cover border-4 border-white" referrerPolicy="no-referrer" onError={(e) => handleImageError(e, cat.img)} />
                            </div>
                            <p className="text-sm mt-2 text-center font-semibold text-white">{cat.name}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative h-[500px] mx-4 mt-2 rounded-3xl overflow-hidden shadow-2xl">
                <img src={proxyUrl(bannerImages[currentSlide].img)} className="w-full h-full object-cover transition-all duration-1000" referrerPolicy="no-referrer" onError={(e) => handleImageError(e, bannerImages[currentSlide].img)} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8">
                    <p className="text-white text-2xl font-bold mb-4">{bannerImages[currentSlide].text}</p>
                    <button
                        onClick={() => router.push(`/product/${bannerImages[currentSlide].productId}`)}
                        className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/40"
                    >
                        SHOP NOW →
                    </button>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                    {bannerImages.map((_, i) => (
                        <button key={i} onClick={() => setCurrentSlide(i)} className={`w-3 h-3 rounded-full transition-all ${i === currentSlide ? 'bg-white scale-125' : 'bg-white/40'}`}></button>
                    ))}
                </div>
            </div>

            {/* FEATURED PLANTS - PHOTO LEFT, MATTER RIGHT */}
            <section className="px-4 py-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Featured Plants 🌱</h2>

                <div className="flex flex-col gap-6">
                    {allPlants.map((plant) => (
                        <div
                            key={plant.id}
                            className="bg-white/95 rounded-2xl overflow-hidden shadow-2xl flex md:flex-row cursor-pointer hover:shadow-green-500/20 transition-all"
                            onClick={() => router.push(`/product/${plant.id}`)}
                        >

                            {/* LEFT: IMAGE 40% */}
                            <div className="w-full md:w-[40%] relative">
                                <img
                                    src={proxyUrl(plant.img) || OFFLINE_PLACEHOLDER}
                                    alt={plant.name}
                                    className="w-full h-80 md:h-96 object-cover bg-white/5"
                                    referrerPolicy="no-referrer"
                                    onError={(e: any) => handleImageError(e, plant.img)}
                                />
                                {/* Wishlist button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleWishlist(plant) }}
                                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
                                >
                                    <span className={`text-xl ${wishlist.some((w: any) => w.id === plant.id) ? 'text-red-500' : 'text-gray-400'}`}>
                                        {wishlist.some((w: any) => w.id === plant.id) ? '❤️' : '🤍'}
                                    </span>
                                </button>
                            </div>

                            {/* RIGHT: MATTER 60% */}
                            <div className="p-6 w-full md:w-[60%] flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-2xl mb-3 text-gray-800">{plant.name}</h4>

                                    <div className="mb-3">
                                        <p className="text-green-700 font-bold text-base mb-1">🌿 Importance:</p>
                                        <p className="text-gray-700 text-sm leading-relaxed">{plant.importance}</p>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-green-700 font-bold text-base mb-1">✨ Uses & Care:</p>
                                        <p className="text-gray-700 text-sm leading-relaxed">{plant.uses}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-3xl font-bold text-green-700 mb-3">₹{plant.price}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleBuyNow(plant) }}
                                            className={`flex-1 py-3 rounded-xl text-base font-bold ${addedId === plant.id ? 'bg-green-600' : 'bg-green-700 hover:bg-green-800'} text-white transition-all`}
                                        >
                                            {addedId === plant.id ? '✓ Added to Cart' : 'Add to Cart'}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(`/product/${plant.id}`) }}
                                            className="px-4 py-3 rounded-xl border-2 border-green-700 text-green-700 font-bold hover:bg-green-50 transition-all text-sm"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <BottomNav />

            {/* Search Overlay */}
            {showSearch && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col p-4">
                    <div className="flex justify-between items-center max-w-2xl mx-auto w-full mb-6 mt-4">
                        <input
                            type="text"
                            placeholder="Search plants, seeds, tools..."
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-lg focus:outline-none focus:border-green-400 focus:bg-white/15"
                        />
                        <button
                            onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}
                            className="ml-4 text-white hover:text-green-400 font-bold text-lg focus:outline-none"
                        >
                            Close
                        </button>
                    </div>

                    <div className="max-w-2xl mx-auto w-full overflow-y-auto flex-1 pb-10">
                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {searchResults.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => {
                                            router.push(`/product/${product.id}`)
                                            setShowSearch(false)
                                        }}
                                        className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-green-400/50 transition-all p-3"
                                    >
                                        <img
                                            src={proxyUrl(product.img) || OFFLINE_PLACEHOLDER}
                                            className="w-full h-40 object-cover rounded-xl mb-3 bg-white/5"
                                            alt={product.name}
                                            referrerPolicy="no-referrer"
                                            onError={(e: any) => handleImageError(e, product.img)}
                                        />
                                        <p className="font-bold text-white text-sm line-clamp-1">{product.name}</p>
                                        <p className="text-green-400 font-bold text-base mt-1">₹{product.price}</p>
                                    </div>
                                ))}
                            </div>
                        ) : hasSearched ? (
                            <div className="text-center text-white/60 py-20">
                                <p className="text-lg font-semibold">We could not find the product</p>
                            </div>
                        ) : (
                            <div className="text-center text-white/40 py-20">
                                <p className="text-sm">Type above to search the store...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    )
}