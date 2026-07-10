'use client'
import { useRouter } from 'next/navigation'
import { Outfit } from 'next/font/google'

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600', '700'] })

const proxyUrl = (url: string) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

const mainCategories = [
    {
        name: 'Plants',
        img: 'https://ecoonplants.com/images/thumbs/0000264_outdoor-plants_1150.jpeg'
    },
    {
        name: 'Seeds',
        img: 'https://en.bcdn.biz/images/emails_source/60754e30-7240-425b-b7a0-3df325607e1c.jpg'
    },
    {
        name: 'Soils',
        img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=400&fit=crop'
    },
    {
        name: 'Tools',
        img: 'https://pinchofseeds.com/wp-content/uploads/2019/03/Essential-Container-Gardeing-Tools.jpeg'
    },
    {
        name: 'AI Chatbot',
        img: 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=800&h=400&fit=crop'
    },
    {
        name: 'AI Plant Match',
        img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop'
    },
]

export default function CategoryPage() {
    const router = useRouter()

    const handleCategoryClick = (catName: string) => {
        if (catName === 'AI Chatbot') {
            router.push('/chatbot')
        } else if (catName === 'AI Plant Match') {
            router.push('/ai-plant-match')
        } else {
            router.push(`/browse?main=${catName}`)
        }
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className} pb-20`}>
            <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-5 sticky top-0 z-50">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-white">Shop By Category</h1>
                </div>
            </nav>

            <div className="grid grid-cols-2 gap-6 p-6 max-w-7xl mx-auto">
                {mainCategories.map((cat) => (
                    <button
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat.name)}
                        className="bg-white/10 border-white/20 rounded-2xl p-4 hover:bg-white/20 hover:border-green-400/50 transition-all"
                    >
                        <img
                            src={proxyUrl(cat.img)}
                            className="w-full h-48 object-cover rounded-xl mb-3 hover:scale-105 transition-transform duration-300"
                            alt={cat.name}
                            referrerPolicy="no-referrer"
                        />
                        <p className="font-bold text-white text-center text-lg">{cat.name}</p>
                    </button>
                ))}
            </div>
        </main>
    )
}
