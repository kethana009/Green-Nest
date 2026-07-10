'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Sparkles, Loader2, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/app/context/CartContext'

const products = [
    { id: 1, name: 'Snake Plant', price: 899, img: 'https://agribotix.com/wp-content/uploads/2025/01/Types-of-Snake-Plants.jpg', place: 'Bedroom, Bathroom, Office', light: 'Low to Bright', desc: 'Low maintenance air purifying plant.' },
    { id: 2, name: 'Monstera Deliciosa', price: 1299, img: 'https://www.viveroelencanto.com/wp-content/uploads/2023/07/437-MONSTERA-DELICIOSA.jpg', place: 'Living Room, Bedroom', light: 'Bright Indirect', desc: 'Unique split leaves, tropical vibes.' },
    { id: 3, name: 'Fiddle Leaf Fig', price: 1599, img: 'https://www.gardening4joy.com/wp-content/uploads/2024/02/Fiddle-Leaf-Fig-Main2.jpg', place: 'Living Room Corner', light: 'Bright', desc: 'Large glossy leaves, elegant decor.' },
    { id: 4, name: 'Lucky Bamboo', price: 599, img: 'https://www.joyusgarden.com/wp-content/uploads/2017/01/Lucky-Bamboo-care-tips-you-should-know.jpg', place: 'Office Desk, Table', light: 'Low to Medium', desc: 'Brings good luck and positive energy.' },
    { id: 5, name: 'Peace Lily', price: 699, img: 'https://bibitbunga.com/wp-content/uploads/2015/08/spathiphyllum-peace-lily.jpg', place: 'Bathroom, Bedroom', light: 'Low to Medium', desc: 'White flowers, purifies air beautifully.' },
    { id: 6, name: 'ZZ Plant', price: 799, img: 'https://www.plantvine.com/plants/ZZ-plant-3.jpg', place: 'Office, Bedroom', light: 'Low Light', desc: 'Toughest plant, survives neglect.' },
    { id: 7, name: 'Rubber Plant', price: 999, img: 'https://i.ytimg.com/vi/GAn3CReUk-Y/maxresdefault.jpg', place: 'Living Room, Office', light: 'Bright Indirect', desc: 'Glossy leaves, excellent air purifier.' },
    { id: 8, name: 'Jade Plant', price: 549, img: 'https://i.ebayimg.com/images/g/jMYAAOSw6AljYpOu/s-l1200.jpg', place: 'Kitchen Window, Table', light: 'Bright', desc: 'Good luck succulent, easy care.' },
    { id: 9, name: 'Philodendron Xanadu', price: 849, img: 'https://paisleyplants.com/wp-content/uploads/2021/04/Philodendron-Xanadu.jpg', place: 'Living Room, Bedroom', light: 'Bright Indirect', desc: 'Fan-like split leaves, compact shape.' },
    { id: 10, name: 'Areca Palm', price: 1199, img: 'https://www.houseplant.co.uk/cdn/shop/files/Areca_Palm_Dypsis_Lutescens_Chrysalidocarpus_Tropical_Indoor_Air_Purifying_Pet_Safe_Beginner_Friendly_Colourful_Houseplant.jpg?v=1736949282', place: 'Living Room, Balcony', light: 'Bright', desc: 'Natural air humidifier, tropical vibes.' },
    { id: 21, name: 'Spider Plant', price: 449, img: 'https://cdn.mos.cms.futurecdn.net/TV5qJiYi73bmPocSrjMRck.jpg', place: 'Kitchen, Hanging', light: 'Bright Indirect', desc: 'Removes toxins, easy to propagate.' },
    { id: 22, name: 'Tulasi - Holy Basil', price: 299, img: 'https://img.freepik.com/premium-photo/ocimum-tenuiflorum-holy-basil-sacred-basil-shyama-tulsi-rama-tulsi-queen-herbs_483511-5340.jpg?w=2000', place: 'Balcony, Garden', light: 'Full Sun', desc: 'Sacred medicinal plant, purifies air.' },
    { id: 23, name: 'Money Plant', price: 399, img: 'https://thursd.com/storage/media/60267/Golden-Pothos--plant-hanging-frm-the-ceiling.jpg', place: 'Kitchen, Shelf, Hanging', light: 'Low to Bright', desc: 'Grows in water and soil both.' },
    { id: 24, name: 'Aralia Super White', price: 749, img: 'https://plantlaga.com/wp-content/uploads/2023/07/973-Aralia-Variegated-White-4-1024x961.jpg', place: 'Living Room, Office', light: 'Bright Indirect', desc: 'Variegated leaves, excellent purifier.' },
    { id: 25, name: 'English Ivy', price: 549, img: 'https://shop.greenwaylandscaping.ae/wp-content/uploads/2023/07/Hedera-Helix.jpg', place: 'Bathroom, Hanging', light: 'Low to Medium', desc: 'Reduces airborne mold in bathrooms.' },
    { id: 31, name: 'Anthurium', price: 799, img: 'https://img.crocdn.co.uk/images/products2/pl/20/00/04/14/pl2000041447_card4_lg.jpg', place: 'Living Room, Table', light: 'Bright Indirect', desc: 'Red heart-shaped flowers, year-round.' },
    { id: 34, name: 'Orchid', price: 1299, img: 'https://sc02.alicdn.com/kf/H2481011e3b3f440da38c683f991305c00.png', place: 'Living Room, Bathroom', light: 'Bright Indirect', desc: 'Elegant flowers that last months.' },
    { id: 41, name: 'Jasmine', price: 349, img: 'https://cdn.pixabay.com/photo/2020/06/06/15/48/scent-of-jasmine-5267074_1280.jpg', place: 'Balcony, Garden', light: 'Full Sun', desc: 'Fragrant night-blooming white flowers.' },
    { id: 42, name: 'Roses', price: 699, img: 'https://plantglossary.com/wp-content/uploads/2025/04/Fragrant-Roses.jpg', place: 'Balcony, Garden, Outdoor', light: 'Full Sun', desc: 'Queen of flowers with fragrance.' },
    { id: 56, name: 'Money Plant Hanging', price: 549, img: 'https://www.ugaoo.com/cdn/shop/products/money-plant-marble-with-hanging-pot-31820677775492.jpg?v=1675602013&width=750', place: 'Kitchen, Hanging, Balcony', light: 'Low to Bright', desc: 'Air purifying lucky hanging plant.' },
    { id: 57, name: 'Boston Fern', price: 699, img: 'https://kla.vn/wp-content/uploads/2024/01/Boston-Fern-KLA-1.jpg', place: 'Bathroom, Hanging, Balcony', light: 'Low to Medium', desc: 'Natural air humidifier, feathery fronds.' },
    { id: 66, name: 'Syngonium Pink', price: 599, img: 'https://backyardville.b-cdn.net/wp-content/uploads/2023/10/c2cf1e4c-4984-4c86-8a4f-dee86a45a91c.png', place: 'Bedroom, Office', light: 'Low Light', desc: 'Beautiful pink leaves, easy care.' },
    { id: 67, name: 'Dieffenbachia', price: 749, img: 'https://i.pinimg.com/originals/8a/30/39/8a3039372accc7d7ca69043e3c5a32d8.jpg', place: 'Living Room, Office', light: 'Low Light', desc: 'Big variegated leaves, tropical look.' },
    { id: 70, name: 'Calathea Rufibarba', price: 799, img: 'https://www.plantvine.com/plants/Calathea-Rufibarba-Main-1.jpg', place: 'Bedroom, Bathroom', light: 'Low Light', desc: 'Prayer plant with fuzzy patterned leaves.' },
    { id: 39, name: 'Hibiscus', price: 599, img: 'https://images.ctfassets.net/zma7thmmcinb/7LO7owjsHpjZzWCWtaj29z/f54f93f693a66490582b05950ade49a8/Holy-Grail-hardy-hibiscus-lead.jpg', place: 'Balcony, Garden, Outdoor', light: 'Full Sun', desc: 'Big colorful tropical flowers.' },
    { id: 58, name: 'Portulaca Hanging', price: 399, img: 'https://blozem.com/wp-content/uploads/2024/10/100-qr-13.jpeg', place: 'Balcony, Hanging, Outdoor', light: 'Full Sun', desc: 'Colorful daily blooming hanging plant.' },
]

const ROOM_PLANT_MAP: Record<string, number[]> = {
    'Living Room': [2, 3, 7, 9, 10, 31, 34, 24],
    'Bedroom': [1, 5, 6, 9, 66, 70, 67],
    'Kitchen': [21, 23, 56, 8],
    'Bathroom': [5, 25, 57, 70, 34],
    'Office': [1, 4, 6, 7, 21, 24, 66, 67],
    'Balcony': [10, 22, 41, 42, 39, 58, 56, 57],
}

const proxyUrl = (url: string) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

export default function AIPlantMatchPage() {
    const router = useRouter()
    const { addToCart } = useCart()
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [suggestedPlants, setSuggestedPlants] = useState<any[]>([])
    const [selectedRoom, setSelectedRoom] = useState('Living Room')
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
    const [toast, setToast] = useState('')

    const rooms = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Balcony']

    const getSuggestedPlants = (room: string) => {
        const ids = ROOM_PLANT_MAP[room] || []
        const matched = products.filter(p => ids.includes(p.id))
        if (matched.length < 4) {
            const extras = products.filter(p => !ids.includes(p.id)).slice(0, 4 - matched.length)
            return [...matched, ...extras]
        }
        return matched
    }

    useEffect(() => {
        setSuggestedPlants(getSuggestedPlants('Living Room'))
    }, [])

    const handleRoomChange = (room: string) => {
        setSelectedRoom(room)
        setSuggestedPlants(getSuggestedPlants(room))
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setUploadedImage(event.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(''), 2500)
    }

    const handleAddToCart = (plant: any) => {
        addToCart({ id: plant.id, name: plant.name, price: plant.price, img: plant.img, qty: 1 })
        setAddedIds(prev => new Set([...prev, plant.id]))
        showToast(`${plant.name} added to cart! 🛒`)
    }

    const handleAddAll = () => {
        suggestedPlants.forEach(p => addToCart({ id: p.id, name: p.name, price: p.price, img: p.img, qty: 1 }))
        setAddedIds(new Set(suggestedPlants.map(p => p.id)))
        showToast(`All ${suggestedPlants.length} plants added to cart! 🛒`)
    }

    const generateDecorImage = async () => {
        if (!uploadedImage) return
        setLoading(true)
        setGeneratedImage(null)
        const plantNames = suggestedPlants.slice(0, 3).map(p => p.name).join(', ')
        const prompt = `Interior design photo of a ${selectedRoom}. Add beautiful ${plantNames} plants in modern ceramic pots. Keep the room's existing furniture and walls exactly the same. Photorealistic, natural lighting, 4K quality.`
        try {
            const res = await fetch('/api/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: uploadedImage, prompt })
            })
            const data = await res.json()
            if (data.success) {
                setGeneratedImage(data.imageId)
                showToast('AI room decoration ready! ✨')
            } else {
                showToast('Generation failed: ' + (data.error || 'Unknown error'))
            }
        } catch (err: any) {
            showToast('AI service error — check your Gemini API key in .env.local')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black text-white pb-28" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-semibold text-sm whitespace-nowrap animate-bounce">
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="bg-black/30 backdrop-blur-xl p-4 flex items-center gap-3 border-b border-white/10 sticky top-0 z-10">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <Sparkles className="w-5 h-5 text-orange-400" />
                <div>
                    <h2 className="font-bold text-lg leading-tight">AI Plant Match</h2>
                    <p className="text-white/40 text-xs">Find perfect plants for your space</p>
                </div>
                {addedIds.size > 0 && (
                    <button
                        onClick={() => router.push('/cart')}
                        className="ml-auto flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Cart ({addedIds.size})
                    </button>
                )}
            </div>

            <div className="p-4 max-w-lg mx-auto">
                <p className="text-center text-green-200/80 mb-5 text-sm">
                    ✨ Select your room type to get personalized plant suggestions
                </p>

                {/* Room Selector */}
                <div className="mb-5">
                    <p className="text-white/50 text-xs font-semibold mb-2 uppercase tracking-wider">Select Your Room</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {rooms.map(room => (
                            <button
                                key={room}
                                onClick={() => handleRoomChange(room)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold flex-shrink-0 transition-all ${selectedRoom === room
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                            >
                                {room === 'Living Room' ? '🛋️' : room === 'Bedroom' ? '🛏️' : room === 'Kitchen' ? '🍳' : room === 'Bathroom' ? '🚿' : room === 'Office' ? '💼' : '🌿'} {room}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI Suggested Plants */}
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-orange-400" />
                                Best for {selectedRoom}
                            </h3>
                            <p className="text-white/40 text-xs">{suggestedPlants.length} plants recommended by AI</p>
                        </div>
                        <button
                            onClick={handleAddAll}
                            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                        >
                            <ShoppingCart className="w-3 h-3" /> Add All
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {suggestedPlants.map(p => (
                            <div key={p.id} className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:border-green-400/40 transition-all group">
                                <div className="relative">
                                    <img
                                        src={proxyUrl(p.img)}
                                        alt={p.name}
                                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                        referrerPolicy="no-referrer"
                                        onError={(e: any) => { e.target.src = 'https://via.placeholder.com/150x120/1e4d38/4ade80?text=🌱' }}
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white font-bold">
                                        ₹{p.price}
                                    </div>
                                    {addedIds.has(p.id) && (
                                        <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                            <div className="bg-green-500 rounded-full p-2">
                                                <Check className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="font-bold text-sm text-white leading-tight mb-1 line-clamp-1">{p.name}</p>
                                    <p className="text-orange-300 text-xs mb-1">💡 {p.light}</p>
                                    <p className="text-white/40 text-xs mb-3 line-clamp-1">{p.desc}</p>
                                    <button
                                        onClick={() => handleAddToCart(p)}
                                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${addedIds.has(p.id)
                                            ? 'bg-green-600 text-white'
                                            : 'bg-orange-500 hover:bg-orange-400 text-white'
                                            }`}
                                    >
                                        {addedIds.has(p.id) ? (
                                            <><Check className="w-3 h-3" /> Added!</>
                                        ) : (
                                            <><ShoppingCart className="w-3 h-3" /> Add to Cart</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upload Room Photo — Optional */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-4 border border-white/20">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-400" />
                        Upload Room Photo
                        <span className="text-white/40 text-xs font-normal">(optional)</span>
                    </h3>
                    <p className="text-white/40 text-xs mb-3">Upload to generate an AI-decorated preview of your room</p>
                    <label className="flex flex-col items-center justify-center gap-2 bg-white/5 rounded-xl p-5 cursor-pointer border-2 border-dashed border-white/20 hover:border-orange-400/50 hover:bg-white/10 transition-all">
                        <Upload className="w-7 h-7 text-white/30" />
                        <span className="text-white/50 text-sm">Click to upload photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {uploadedImage && (
                        <div className="mt-3">
                            <img src={uploadedImage} className="w-full h-44 object-cover rounded-xl" alt="Your room" />
                            <p className="text-green-400 text-xs text-center mt-2 font-semibold">✅ Room photo uploaded</p>
                        </div>
                    )}
                </div>

                {/* Generate AI Decor (only when image uploaded) */}
                {uploadedImage && (
                    <button
                        onClick={generateDecorImage}
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {loading ? 'AI is Decorating Your Room...' : 'Generate AI Decorated Room ✨'}
                    </button>
                )}

                {/* Generated Image */}
                {generatedImage && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 mb-4">
                        <h3 className="font-bold text-lg mb-3">Your AI Decorated {selectedRoom} ✨</h3>
                        <img src={generatedImage} className="w-full rounded-xl mb-3" alt="AI Decorated Room" />
                        <button
                            onClick={handleAddAll}
                            className="w-full bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Shop These {suggestedPlants.length} Plants
                        </button>
                    </div>
                )}
            </div>

            {/* Sticky bottom cart button */}
            {addedIds.size > 0 && (
                <div className="fixed bottom-20 left-4 right-4 z-40">
                    <button
                        onClick={() => router.push('/cart')}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl shadow-green-500/40 transition-all"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        View Cart — {addedIds.size} plant{addedIds.size > 1 ? 's' : ''} added →
                    </button>
                </div>
            )}
        </div>
    )
}