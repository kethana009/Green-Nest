'use client'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/app/context/CartContext'
import { Outfit } from 'next/font/google'
import { Heart } from 'lucide-react' // Wishlist icon kosam
import AIPlantMatcher from '@/components/AIPlantMatcher'
const AIPlantMatcherAny = AIPlantMatcher as any
import { supabase } from '@/lib/supabase/client'

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600', '700'] })

const OFFLINE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23133526'/><text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='%234ade80' dominant-baseline='middle' text-anchor='middle'>🌱 Plant</text></svg>";

// Reliably serve any remote image via wsrv.nl CDN (handles hotlink protection globally)
const proxyUrl = (url: string) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

// Safely extract a valid image URL from Supabase images field (handles all storage formats)
const parseImageUrl = (images: any): string => {
    if (!images) return '';
    // Already a plain URL string
    if (typeof images === 'string') {
        const s = images.trim();
        if (s.startsWith('http://') || s.startsWith('https://')) return s;
        // PostgreSQL array format: {url1,url2}
        if (s.startsWith('{') && s.endsWith('}')) {
            const first = s.slice(1, -1).split(',')[0].replace(/^"|"$/g, '').trim();
            if (first.startsWith('http')) return first;
        }
        // JSON array format: ["url1"]
        if (s.startsWith('[')) {
            try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]);
            } catch (_) { }
        }
        return '';
    }
    // Already a proper array
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

const subCategories = {
    Plants: ["All", "Indoor Plants", "Outdoor Plants", "Flowering Plants", "Succulents", "Air Purifying", "Hanging Plants", "Low Light Plants", "Pet-Friendly"],
    Seeds: ["All", "Vegetable Seeds", "Flower Seeds", "Herb Seeds", "Fruit Seeds", "Microgreen Seeds", "Organic Seeds", "Exotic Seeds", "Monsoon Seeds", "Winter Seeds", "Summer Seeds"],
    Soils: ["All", "Potting Mix", "Garden Soil", "Cocopeat", "Vermicompost", "Fertilizers", "Pebbles", "Mulch", "Grow Bags"],
    Tools: ["All", "Watering Can", "Pruners", "Trowel", "Gloves", "Spray Bottle", "Plant Stands", "Grow Lights", "Pots"],
    'AI Chatbot': ["Plant Doctor", "Care Tips", "Water Schedule", "Pest Control", "Growth Guide", "Season Tips", "Soil Help", "Fertilizer"],
    'AI Plant Match': ["Living Room", "Bedroom", "Bathroom", "Kitchen", "Office", "Balcony", "Low Light", "Pet Friendly"]
}

const products = [
    // INDOOR PLANTS - 10
    { id: 1, name: 'Snake Plant', price: 899, main: 'Plants', sub: 'Indoor Plants', img: 'https://agribotix.com/wp-content/uploads/2025/01/Types-of-Snake-Plants.jpg', desc: 'Snake Plant is a low maintenance air purifying plant. It releases oxygen at night and improves sleep quality. Perfect for beginners and grows well in low light.' },
    { id: 2, name: 'Monstera Deliciosa', price: 1299, main: 'Plants', sub: 'Indoor Plants', img: 'https://www.viveroelencanto.com/wp-content/uploads/2023/07/437-MONSTERA-DELICIOSA.jpg', desc: 'Monstera has unique split leaves that give tropical vibes. Needs bright indirect light and weekly watering. Popular for home decor and Instagram worthy.' },
    { id: 3, name: 'Fiddle Leaf Fig', price: 1599, main: 'Plants', sub: 'Indoor Plants', img: 'https://www.gardening4joy.com/wp-content/uploads/2024/02/Fiddle-Leaf-Fig-Main2.jpg', desc: 'Fiddle Leaf Fig has large glossy violin shaped leaves. Needs bright light near window and regular watering. Adds elegance and height to any room corner.' },
    { id: 4, name: 'Lucky Bamboo', price: 599, main: 'Plants', sub: 'Indoor Plants', img: 'https://www.joyusgarden.com/wp-content/uploads/2017/01/Lucky-Bamboo-care-tips-you-should-know.jpg', desc: 'Lucky Bamboo brings good luck and positive energy. Grows in water or soil with zero maintenance. Perfect for office desks and small spaces.' },
    { id: 5, name: 'Peace Lily', price: 699, main: 'Plants', sub: 'Indoor Plants', img: 'https://bibitbunga.com/wp-content/uploads/2015/08/spathiphyllum-peace-lily.jpg', desc: 'Peace Lily produces white flowers and purifies air. It droops when thirsty so watering is easy. Thrives in low light and high humidity.' },
    { id: 6, name: 'ZZ Plant', price: 799, main: 'Plants', sub: 'Indoor Plants', img: 'https://www.plantvine.com/plants/ZZ-plant-3.jpg', desc: 'ZZ Plant is the toughest plant for busy people. Needs water once in 3 weeks and survives low light. Shiny leaves add beauty to any space.' },
    { id: 7, name: 'Rubber Plant', price: 999, main: 'Plants', sub: 'Indoor Plants', img: 'https://i.ytimg.com/vi/GAn3CReUk-Y/maxresdefault.jpg', desc: 'Rubber Plant has thick glossy leaves in green and burgundy. Grows tall and purifies indoor air. Needs bright indirect light and weekly watering.' },
    { id: 8, name: 'Jade Plant - Crassula Ovata', price: 549, main: 'Plants', sub: 'Indoor Plants', img: 'https://i.ebayimg.com/images/g/jMYAAOSw6AljYpOu/s-l1200.jpg', desc: 'Jade Plant is a succulent that brings good luck. Stores water in thick leaves so needs less watering. Perfect for sunny windowsills.' },
    { id: 9, name: 'Philodendron Xanadu', price: 849, main: 'Plants', sub: 'Indoor Plants', img: 'https://paisleyplants.com/wp-content/uploads/2021/04/Philodendron-Xanadu.jpg', desc: 'Philodendron Xanadu has beautiful fan like split leaves. Easy to care and grows in compact shape. Great air purifier for home.' },
    { id: 10, name: 'Areca Palm', price: 1199, main: 'Plants', sub: 'Indoor Plants', img: 'https://www.houseplant.co.uk/cdn/shop/files/Areca_Palm_Dypsis_Lutescens_Chrysalidocarpus_Tropical_Indoor_Air_Purifying_Pet_Safe_Beginner_Friendly_Colourful_Houseplant.jpg?v=1736949282', desc: 'Areca Palm is a natural air humidifier and purifier. Has feathery leaves that create tropical vibes. Needs bright light and regular misting.' },

    // OUTDOOR PLANTS - 10
    { id: 11, name: 'Artemisia Plant', price: 449, main: 'Plants', sub: 'Outdoor Plants', img: 'https://monsteraholic.com/wp-content/uploads/2024/02/Artemisia-Annua-Plant-101-monsteraholic.com_.jpeg', desc: 'Artemisia has silvery foliage and herbal fragrance. Drought tolerant and needs full sun. Perfect for borders and rock gardens.' },
    { id: 12, name: 'Boxwood', price: 699, main: 'Plants', sub: 'Outdoor Plants', img: 'https://www.epicgardening.com/wp-content/uploads/2023/11/boxwood.jpeg', desc: 'Boxwood is best for hedges and garden borders. Evergreen leaves stay beautiful all year. Easy to shape and low maintenance.' },
    { id: 13, name: 'Caladium', price: 549, main: 'Plants', sub: 'Outdoor Plants', img: 'https://cdn.mos.cms.futurecdn.net/jyUcJPo5ydS4u2Teh6F2NH.jpg', desc: 'Caladium has colorful heart shaped leaves. Grows best in shade and humid weather. Adds vibrant colors to garden beds.' },
    { id: 14, name: 'Coleus', price: 399, main: 'Plants', sub: 'Outdoor Plants', img: 'https://www.planetnatural.com/wp-content/uploads/2024/03/Coleus-1536x864.jpg', desc: 'Coleus comes in many leaf colors and patterns. Loves partial shade and regular watering. Perfect for pots and garden beds.' },
    { id: 15, name: 'Coral Bells', price: 649, main: 'Plants', sub: 'Outdoor Plants', img: 'https://cdn.mos.cms.futurecdn.net/NZAcBiZfqPi9axv7GtnLBQ.jpg', desc: 'Coral Bells have colorful foliage and tiny flowers. Grows well in shade and well drained soil. Attracts butterflies to garden.' },
    { id: 16, name: 'Elephant Ear', price: 899, main: 'Plants', sub: 'Outdoor Plants', img: 'https://mobileimages.lowes.com/productimages/cd7c1440-9d5a-4a29-b0a4-3f473191e60d/62476477.jpg', desc: 'Elephant Ear has huge dramatic leaves. Loves moisture and partial shade. Creates tropical look in garden instantly.' },
    { id: 17, name: 'Hosta', price: 749, main: 'Plants', sub: 'Outdoor Plants', img: 'https://ngb.org/wp-content/uploads/2023/09/Hosta-Hope-Springs-Eternal_Walters-Gardens-2-scaled.jpg', desc: 'Hosta is perfect shade plant with big leaves. Comes in green and variegated varieties. Low maintenance perennial plant.' },
    { id: 18, name: "Lamb's Ear", price: 499, main: 'Plants', sub: 'Outdoor Plants', img: 'https://www.gardeningknowhow.com/wp-content/uploads/2012/02/lambs-ear-1.jpg', desc: "Lamb's Ear has soft fuzzy silver leaves. Drought tolerant and loves full sun. Great ground cover for gardens." },
    { id: 19, name: 'New Zealand Flax', price: 999, main: 'Plants', sub: 'Outdoor Plants', img: 'https://plantsexpress.com/cdn/shop/files/Maori-Queen-New-Zealand-Flax_766133db-3ab2-499f-b9c1-a4c451e29e62.jpg?v=1684511883', desc: 'New Zealand Flax has sword like colorful leaves. Drought tolerant and wind resistant. Adds structure to landscape.' },
    { id: 20, name: 'Ninebark', price: 849, main: 'Plants', sub: 'Outdoor Plants', img: 'https://www.thespruce.com/thmb/tlREIvM034v5kl6r1z-alRzEfuw=/4288x0/filters:no_upscale():max_bytes(150000):strip_icc()/ninebark-shrub-growing-profile-3269220_02-5e7f86c849fb4b709e5d6d561f6fd97b.jpg', desc: 'Ninebark shrub has colorful bark and flowers. Very hardy and low maintenance. Perfect for privacy hedges.' },

    // AIR PURIFYING - 10
    { id: 21, name: 'Spider Plant', price: 449, main: 'Plants', sub: 'Air Purifying', img: 'https://cdn.mos.cms.futurecdn.net/TV5qJiYi73bmPocSrjMRck.jpg', desc: 'Spider Plant removes toxins from air. Produces baby plants that are easy to propagate. Grows well in indirect light.' },
    { id: 22, name: 'Tulasi - Holy Basil', price: 299, main: 'Plants', sub: 'Air Purifying', img: 'https://img.freepik.com/premium-photo/ocimum-tenuiflorum-holy-basil-sacred-basil-shyama-tulsi-rama-tulsi-queen-herbs_483511-5340.jpg?w=2000', desc: 'Tulasi is sacred and medicinal plant. Purifies air and keeps insects away. Needs 4 hours sunlight daily.' },
    { id: 23, name: 'Money Plant - Golden Pothos', price: 399, main: 'Plants', sub: 'Air Purifying', img: 'https://thursd.com/storage/media/60267/Golden-Pothos--plant-hanging-frm-the-ceiling.jpg', desc: 'Money Plant is best for beginners. Grows in water and soil both. Removes indoor air pollutants easily.' },
    { id: 24, name: 'Aralia Super White', price: 749, main: 'Plants', sub: 'Air Purifying', img: 'https://plantlaga.com/wp-content/uploads/2023/07/973-Aralia-Variegated-White-4-1024x961.jpg', desc: 'Aralia Super White has variegated leaves. Excellent air purifier for home. Prefers bright indirect light.' },
    { id: 25, name: 'Hedera Helix - English Ivy', price: 549, main: 'Plants', sub: 'Air Purifying', img: 'https://shop.greenwaylandscaping.ae/wp-content/uploads/2023/07/Hedera-Helix.jpg', desc: 'English Ivy reduces airborne mold. Great for hanging baskets. Loves cool and humid places.' },
    { id: 26, name: "Devil's Ivy", price: 499, main: 'Plants', sub: 'Air Purifying', img: 'https://positivebloom.com/wp-content/uploads/2022/10/Devils-Ivy.jpg.webp', desc: "Devil's Ivy is super hardy air purifier. Grows in low light and needs less water. Perfect for offices." },
    { id: 27, name: 'Selloum Philodendron', price: 999, main: 'Plants', sub: 'Air Purifying', img: 'https://happyforest.store/wp-content/uploads/2020/03/382592301.jpg', desc: 'Selloum has big split leaves. Removes toxins and adds tropical look. Needs bright indirect light.' },
    { id: 28, name: 'Dracaena Variegated', price: 699, main: 'Plants', sub: 'Air Purifying', img: 'https://gardenerspath.com/wp-content/uploads/2024/11/Variegated-Dracaena-Plant.jpg', desc: 'Variegated Dracaena cleans indoor air. Striped leaves look beautiful. Very easy to care plant.' },
    { id: 29, name: 'Dracaena Massangeana', price: 899, main: 'Plants', sub: 'Air Purifying', img: 'https://gippslandindoorplants.com.au/wp-content/uploads/2022/12/Dracaena-Fragrans-Massangeana-2.jpg', desc: 'Corn Plant removes benzene from air. Tall plant for corners. Needs medium light and less water.' },
    { id: 30, name: 'Dracaena Janet Craig', price: 799, main: 'Plants', sub: 'Air Purifying', img: 'https://www.gabriellaplants.com/cdn/shop/products/gabriella-plants-4-dracaena-fragrans-janet-craig-compacta-38562363605237.jpg?v=1670455354&width=1080', desc: 'Janet Craig is dark leaf air purifier. Grows well in low light. Perfect for offices and homes.' },

    // FLOWERING PLANTS - 15
    { id: 31, name: 'Anthurium', price: 799, main: 'Plants', sub: 'Flowering Plants', img: 'https://img.crocdn.co.uk/images/products2/pl/20/00/04/14/pl2000041447_card4_lg.jpg', desc: 'Anthurium has shiny red heart shaped flowers. Blooms year round with proper care. Needs bright indirect light.' },
    { id: 32, name: 'Gloxinia', price: 649, main: 'Plants', sub: 'Flowering Plants', img: 'https://www.senior-gardening.com/images/gloxinia_photos/120324-01-11402-lg.jpg', desc: 'Gloxinia produces big velvety flowers. Great for indoor decoration. Needs bright light and humid air.' },
    { id: 33, name: 'African Violet', price: 549, main: 'Plants', sub: 'Flowering Plants', img: 'https://hgic.clemson.edu/wp-content/uploads/2018/08/Alabama-and-Manitoba-2-scaled.jpg', desc: 'African Violet blooms in many colors. Perfect for small pots and windowsills. Easy to care flowering plant.' },
    { id: 34, name: 'Orchid', price: 1299, main: 'Plants', sub: 'Flowering Plants', img: 'https://www.thespruce.com/thmb/tlREIvM034v5kl6r1z-alRzEfuw=/4288x0/filters:no_upscale():max_bytes(150000):strip_icc()/ninebark-shrub-growing-profile-3269220_02-5e7f86c849fb4b709e5d6d561f6fd97b.jpg', desc: 'Orchid flowers last for months. Elegant and exotic looking plant. Needs bright light and proper watering.' },
    { id: 35, name: 'Hoya Carnosa - Wax Plant', price: 699, main: 'Plants', sub: 'Flowering Plants', img: 'https://worldofsucculents.com/wp-content/uploads/2016/04/Hoya-carnosa-Wax-Plant3.jpg', desc: 'Wax Plant has thick leaves and fragrant flowers. Low maintenance and long living. Perfect hanging plant.' },
    { id: 36, name: 'Impatiens Mix', price: 399, main: 'Plants', sub: 'Flowering Plants', img: 'https://cdn11.bigcommerce.com/s-i7i23daso6/images/stencil/1280x1280/products/15388/32582/Impatiens_Walleriana_Mix_world_beater_3000010__34016.1664271187.jpg?c=1', desc: 'Impatiens bloom in shade with bright colors. Continuous flowering plant. Great for garden borders.' },
    { id: 37, name: 'Kalanchoe', price: 499, main: 'Plants', sub: 'Flowering Plants', img: 'https://www.plantsucculents.com/assets/blog/low-light-succulents/kalanchoe.jpg', desc: 'Kalanchoe is flowering succulent. Blooms for weeks with colorful flowers. Needs bright light and less water.' },
    { id: 38, name: 'Black Eyed Susan', price: 449, main: 'Plants', sub: 'Flowering Plants', img: 'https://assets.americanmeadows.com/media/catalog/product/b/l/black-eyed-susan.jpg', desc: 'Black Eyed Susan has yellow petals. Drought tolerant and attracts butterflies. Perfect for outdoor garden.' },
    { id: 39, name: 'Hibiscus', price: 599, main: 'Plants', sub: 'Flowering Plants', img: 'https://images.ctfassets.net/zma7thmmcinb/7LO7owjsHpjZzWCWtaj29z/f54f93f693a66490582b05950ade49a8/Holy-Grail-hardy-hibiscus-lead.jpg', desc: 'Hibiscus has big colorful flowers. Grows well in Indian climate. Needs full sun and regular watering.' },
    { id: 40, name: 'Hydrangeas', price: 999, main: 'Plants', sub: 'Flowering Plants', img: 'https://www.planetnatural.com/wp-content/uploads/2023/09/Hydrangea-Tree.jpg', desc: 'Hydrangeas produce big flower clusters. Color changes with soil pH. Perfect for garden and pots.' },
    { id: 41, name: 'Jasmine', price: 349, main: 'Plants', sub: 'Flowering Plants', img: 'https://cdn.pixabay.com/photo/2020/06/06/15/48/scent-of-jasmine-5267074_1280.jpg', desc: 'Jasmine has fragrant white flowers. Blooms in evening and night. Great for garden and balcony.' },
    { id: 42, name: 'Roses', price: 699, main: 'Plants', sub: 'Flowering Plants', img: 'https://plantglossary.com/wp-content/uploads/2025/04/Fragrant-Roses.jpg', desc: 'Roses are queen of flowers with fragrance. Comes in many colors and varieties. Needs full sun and care.' },
    { id: 43, name: 'Geraniums', price: 549, main: 'Plants', sub: 'Flowering Plants', img: 'https://resize.elle.fr/original/var/plain_site/storage/images/deco/exterieur/jardin/les-geraniums-les-sortir-au-printemps-et-les-entretenir-4115855/98584384-1-fre-FR/Les-geraniums-les-sortir-au-printemps-et-les-entretenir.jpg', desc: 'Geraniums bloom continuously in pots. Low maintenance and colorful flowers. Perfect for balcony garden.' },
    { id: 44, name: 'Gardenia', price: 849, main: 'Plants', sub: 'Flowering Plants', img: 'https://springmeadownursery.com/files/plant_images/Gardenia_Pillow_Talk_DSC07401-800x800-8595d8a.png', desc: 'Gardenia has fragrant white flowers. Glossy leaves look beautiful. Needs acidic soil and bright light.' },
    { id: 45, name: 'Adenium - Desert Rose', price: 1199, main: 'Plants', sub: 'Flowering Plants', img: 'https://cdn.shopify.com/s/files/1/0059/8835/2052/products/Adenium-obesum_3.jpg?v=1668007289', desc: 'Desert Rose has beautiful flowers and caudex. Drought tolerant succulent plant. Perfect for hot climate.' },

    // SUCCULENTS - 10
    { id: 46, name: 'String of Pearls', price: 649, main: 'Plants', sub: 'Succulents', img: 'https://i.pinimg.com/originals/bd/74/ac/bd74acace90076dee24389d4014872d1.jpg', desc: 'String of Pearls has round bead like leaves. Perfect hanging succulent plant. Needs bright light and less water.' },
    { id: 47, name: 'Kalanchoe Marnieriana', price: 549, main: 'Plants', sub: 'Succulents', img: 'https://www.succulentplant.in/wp-content/uploads/2019/10/80S27-780x1024.jpeg', desc: 'Kalanchoe Marnieriana has paddle leaves. Easy care succulent for beginners. Grows well in bright light.' },
    { id: 48, name: 'Echeveria Colorata', price: 699, main: 'Plants', sub: 'Succulents', img: 'https://www.nainileaf.com/cdn/shop/files/DSC_1345_7d4881b3-4978-4917-8bf7-cb8443d0c676_1024x.jpg?v=1750702567', desc: 'Echeveria forms beautiful rosette shape. Comes in many colors. Needs bright sun and well drained soil.' },
    { id: 49, name: 'Elephant Bush - Portulacaria', price: 499, main: 'Plants', sub: 'Succulents', img: 'https://i.ebayimg.com/images/g/jMYAAOSw6AljYpOu/s-l1200.jpg', desc: 'Elephant Bush is easy care succulent. Small leaves store water well. Perfect for bonsai and pots.' },
    { id: 50, name: 'Sedum Pachyphyllum', price: 449, main: 'Plants', sub: 'Succulents', img: 'https://www.gardening4joy.com/wp-content/uploads/2024/02/Fiddle-Leaf-Fig-Main2.jpg', desc: 'Sedum has jelly bean like leaves. Drought tolerant and colorful. Great for rock gardens.' },
    { id: 51, name: 'Sempervivum Calcareum', price: 599, main: 'Plants', sub: 'Succulents', img: 'https://jnsucculents.com.au/cdn/shop/files/Sempervivum-calcareum-Guillaumes_10_1024x1024@2x.jpg?v=1696600034', desc: 'Sempervivum is hens and chicks plant. Hardy and spreads easily. Perfect for outdoor containers.' },
    { id: 52, name: 'Hanging Crassula', price: 749, main: 'Plants', sub: 'Succulents', img: 'https://plantsden.com/cdn/shop/files/CrassulaHanging15cmHangingpot1.jpg?v=1747931582', desc: 'Hanging Crassula trails beautifully. Low water succulent plant. Great for hanging baskets.' },
    { id: 53, name: 'Othonna Capensis', price: 649, main: 'Plants', sub: 'Succulents', img: 'https://www.insucculentlove.com/cdn/shop/products/image_769b019b-73ff-405c-9a80-a41a0e3da5b5_1024x1024@2x.jpg?v=1644509945', desc: 'Othonna has bean like trailing leaves. Colorful in bright sun. Easy care trailing succulent.' },
    { id: 54, name: 'Aloe White Fox', price: 899, main: 'Plants', sub: 'Succulents', img: 'https://i.etsystatic.com/30908979/r/il/9b7bdf/6981652816/il_1080xN.6981652816_n21w.jpg', desc: 'Aloe White Fox has spotted leaves. Medicinal plant with healing properties. Needs bright light.' },
    { id: 55, name: 'Chinese Sedum', price: 399, main: 'Plants', sub: 'Succulents', img: 'https://worldofsucculents.com/wp-content/uploads/2016/12/Sedum-tetractinum-Chinese-Sedum3.jpg', desc: 'Chinese Sedum is low growing succulent. Spreads fast and covers ground. Drought tolerant plant.' },

    // HANGING PLANTS - 10
    { id: 56, name: 'Money Plant Hanging', price: 549, main: 'Plants', sub: 'Hanging Plants', img: 'https://thursd.com/storage/media/60267/Golden-Pothos--plant-hanging-frm-the-ceiling.jpg', desc: 'Money Plant grows well in hanging pots. Purifies air and brings luck. Very easy to grow plant.' },
    { id: 57, name: 'Boston Fern', price: 699, main: 'Plants', sub: 'Hanging Plants', img: 'https://www.ugaoo.com/cdn/shop/products/money-plant-marble-with-hanging-pot-31820677775492.jpg?v=1675602013&width=750', desc: 'Boston Fern has feathery fronds. Great air humidifier for home. Needs shade and regular misting.' },
    { id: 58, name: 'Portulaca Hanging', price: 399, main: 'Plants', sub: 'Hanging Plants', img: 'https://blozem.com/wp-content/uploads/2024/10/100-qr-13.jpeg', desc: 'Portulaca has colorful flowers. Drought tolerant and blooms daily. Perfect for hanging baskets.' },
    { id: 59, name: 'Lipstick Plant - Aeschynanthus', price: 799, main: 'Plants', sub: 'Hanging Plants', img: 'https://garden.org/pics/2014-05-10/plantladylin/4218bb.jpg', desc: 'Lipstick Plant has red tubular flowers. Trailing plant for hanging pots. Needs bright indirect light.' },
    { id: 60, name: 'Philodendron Broken Heart', price: 849, main: 'Plants', sub: 'Hanging Plants', img: 'https://paisleyplants.com/wp-content/uploads/2021/04/Philodendron-Xanadu.jpg', desc: 'Broken Heart Philodendron has split leaves. Fast growing trailing plant. Great for indoor decoration.' },
    { id: 61, name: 'Spider Plant Hanging', price: 499, main: 'Plants', sub: 'Hanging Plants', img: 'https://cdn.mos.cms.futurecdn.net/TV5qJiYi73bmPocSrjMRck.jpg', desc: 'Spider Plant produces baby plantlets. Excellent air purifier. Grows well in hanging baskets.' },
    { id: 62, name: 'Aptenia Plant', price: 449, main: 'Plants', sub: 'Hanging Plants', img: 'https://ii1.pepperfry.com/media/catalog/product/f/o/1600x1760/foliage-philodendron-broken-heart-natural-plant-with-hanging-ivory-pot-foliage-philodendron-broken-h-4yb5fj.jpg', desc: 'Aptenia has fleshy trailing leaves. Drought tolerant ground cover. Produces pink flowers.' },
    { id: 63, name: 'Portulaca Oleracea', price: 399, main: 'Plants', sub: 'Hanging Plants', img: 'https://m.media-amazon.com/images/I/61e06y1qz8L._SL1500_.jpg', desc: 'Portulaca blooms in morning. Colorful flowers and trailing habit. Perfect for sunny locations.' },
    { id: 64, name: 'Rhoeo Spathacea - Moses in Cradle', price: 549, main: 'Plants', sub: 'Hanging Plants', img: 'https://cdn.mos.cms.futurecdn.net/jyUcJPo5ydS4u2Teh6F2NH.jpg', desc: 'Moses in Cradle has colorful leaves. Low maintenance trailing plant. Grows well in shade.' },
    { id: 65, name: 'Grape Ivy Plant', price: 699, main: 'Plants', sub: 'Hanging Plants', img: 'https://nurserylive.com/cdn/shop/products/nurserylive-g-portulaca-oleracea-10-O-clock-any-color-plant-hanging-basket-plant-642000.jpg?v=1679750948', desc: 'Grape Ivy has oak leaf shape. Fast growing trailing plant. Perfect for indoor hanging.' },

    // LOW LIGHT PLANTS - 10
    { id: 66, name: 'Syngonium Pink', price: 599, main: 'Plants', sub: 'Low Light Plants', img: 'https://media.floresfrescasonline.com/product/tradescantia-spathacea-rhoeo-800x800.jpg', desc: 'Syngonium Pink has beautiful pink leaves. Grows well in low light. Easy care air purifying plant.' },
    { id: 67, name: 'Dieffenbachia', price: 749, main: 'Plants', sub: 'Low Light Plants', img: 'https://i5.walmartimages.com/seo/Oak-Leaf-Grape-Ivy-Plant-Cissus-rhombifolia-6-Hanging-Pot_591ee74a-c99a-4d8d-a359-40a72124aa1a_1.67cd3d43f2668523fb73640ccfe61f60.jpeg', desc: 'Dieffenbachia has big variegated leaves. Tolerates low light well. Adds tropical look to room.' },
    { id: 68, name: 'Peperomia Obtusifolia', price: 549, main: 'Plants', sub: 'Low Light Plants', img: 'https://agribotix.com/wp-content/uploads/2025/01/Types-of-Snake-Plants.jpg', desc: 'Peperomia has thick glossy leaves. Compact plant for small spaces. Needs low to medium light.' },
    { id: 69, name: 'Philodendron Micans', price: 899, main: 'Plants', sub: 'Low Light Plants', img: 'https://hgic.clemson.edu/wp-content/uploads/2018/08/Alabama-and-Manitoba-2-scaled.jpg', desc: 'Philodendron Micans has velvet leaves. Trailing plant for shelves. Grows in low light easily.' },
    { id: 70, name: 'Calathea Rufibarba', price: 799, main: 'Plants', sub: 'Low Light Plants', img: 'https://www.siteone.com/medias/sys_master/PimProductImages/tmp/image-thumbnails/ProductAssets/US/NoBrand/itemImage/image-thumb__268507__zoom/aa-848404-1-698281/aa-848404-1-698281.jpg', desc: 'Calathea has fuzzy leaves with patterns. Moves leaves at night. Needs humidity and shade.' },
    { id: 71, name: 'Aralia Green Plant', price: 649, main: 'Plants', sub: 'Low Light Plants', img: 'https://plantlaga.com/wp-content/uploads/2023/07/973-Aralia-Variegated-White-4-1024x961.jpg', desc: 'Aralia Green purifies indoor air. Bushy plant with small leaves. Grows well in low light.' },
    { id: 72, name: 'Golden Hahnii - Snake Plant', price: 499, main: 'Plants', sub: 'Low Light Plants', img: 'https://agribotix.com/wp-content/uploads/2025/01/Types-of-Snake-Plants.jpg', desc: 'Golden Hahnii is dwarf snake plant. Compact and low maintenance. Perfect for tabletops.' },
    { id: 73, name: 'Rhoeo Tricolor', price: 449, main: 'Plants', sub: 'Low Light Plants', img: 'https://mobileimages.lowes.com/productimages/cd7c1440-9d5a-4a29-b0a4-3f473191e60d/62476477.jpg', desc: 'Rhoeo Tricolor has colorful foliage. Grows well in shade. Low water requirement plant.' },
    { id: 74, name: 'Zamia Green', price: 999, main: 'Plants', sub: 'Low Light Plants', img: 'https://www.houseplant.co.uk/cdn/shop/files/Areca_Palm_Dypsis_Lutescens_Chrysalidocarpus_Tropical_Indoor_Air_Purifying_Pet_Safe_Beginner_Friendly_Colourful_Houseplant.jpg?v=1736949282', desc: 'Zamia is palm like low light plant. Slow growing and long living. Adds green to dark corners.' },
    { id: 75, name: "Money N'Joy Pothos", price: 599, main: 'Plants', sub: 'Low Light Plants', img: 'https://positivebloom.com/wp-content/uploads/2022/10/Devils-Ivy.jpg.webp', desc: "N'Joy Pothos has white and green leaves. Trailing plant for low light. Very easy to care." },

    // PET-FRIENDLY - 10
    { id: 76, name: 'Madhumalati Dwarf', price: 399, main: 'Plants', sub: 'Pet-Friendly', img: 'https://cdn.pixabay.com/photo/2020/06/06/15/48/scent-of-jasmine-5267074_1280.jpg', desc: 'Madhumalati has fragrant flowers. Safe for pets and kids. Grows well in Indian climate.' },
    { id: 77, name: 'Kunda Downy Jasmine', price: 449, main: 'Plants', sub: 'Pet-Friendly', img: 'https://plantglossary.com/wp-content/uploads/2025/04/Fragrant-Roses.jpg', desc: 'Kunda Jasmine has white fragrant flowers. Non toxic to pets. Perfect for garden and pots.' },
    { id: 78, name: 'Hibiscus Gudhal Red', price: 349, main: 'Plants', sub: 'Pet-Friendly', img: 'https://images.ctfassets.net/zma7thmmcinb/7LO7owjsHpjZzWCWtaj29z/f54f93f693a66490582b05950ade49a8/Holy-Grail-hardy-hibiscus-lead.jpg', desc: 'Red Hibiscus is pet safe plant. Blooms daily with big flowers. Needs full sun and water.' },
    { id: 79, name: 'Ixora Plant', price: 499, main: 'Plants', sub: 'Pet-Friendly', img: 'https://resize.elle.fr/original/var/plain_site/storage/images/deco/exterieur/jardin/les-geraniums-les-sortir-au-printemps-et-les-entretenir-4115855/98584384-1-fre-FR/Les-geraniums-les-sortir-au-printemps-et-les-entretenir.jpg', desc: 'Ixora has clusters of small flowers. Pet friendly and colorful. Grows well in full sun.' },
    { id: 80, name: 'Syngonium Podophyllum', price: 549, main: 'Plants', sub: 'Pet-Friendly', img: 'https://media.floresfrescasonline.com/product/tradescantia-spathacea-rhoeo-800x800.jpg', desc: 'Syngonium is safe indoor plant. Arrow shaped leaves look beautiful. Grows in low light.' },
    { id: 81, name: 'Parijat Plant', price: 599, main: 'Plants', sub: 'Pet-Friendly', img: 'https://www.senior-gardening.com/images/gloxinia_photos/120324-01-11402-lg.jpg', desc: 'Parijat has fragrant night blooming flowers. Pet safe and sacred plant. Grows well in Indian gardens.' },
    { id: 82, name: 'Jasminum Sambac', price: 449, main: 'Plants', sub: 'Pet-Friendly', img: 'https://cdn.pixabay.com/photo/2020/06/06/15/48/scent-of-jasmine-5267074_1280.jpg', desc: 'Jasmine Sambac has sweet smelling flowers. Non toxic to pets. Perfect for pots and garden.' },
    { id: 83, name: 'Night Blooming Jasmine', price: 499, main: 'Plants', sub: 'Pet-Friendly', img: 'https://springmeadownursery.com/files/plant_images/Gardenia_Pillow_Talk_DSC07401-800x800-8595d8a.png', desc: 'Night Jasmine spreads fragrance at night. Pet friendly flowering shrub. Easy to grow in warm climate.' },
    { id: 84, name: 'Miniature Rose', price: 399, main: 'Plants', sub: 'Pet-Friendly', img: 'https://plantglossary.com/wp-content/uploads/2025/04/Fragrant-Roses.jpg', desc: 'Miniature Rose is dwarf and safe for pets. Blooms repeatedly with small flowers. Great for balcony pots.' },
    { id: 85, name: 'Hibiscus Gudhal Pink', price: 349, main: 'Plants', sub: 'Pet-Friendly', img: 'https://www.senior-gardening.com/images/gloxinia_photos/120324-01-11402-lg.jpg', desc: 'Pink Hibiscus is pet safe and beautiful. Blooms daily in full sun. Used in tea and medicines.' },

    // SEEDS - VEGETABLE SEEDS - 10
    { id: 86, name: 'Lettuce Seeds', price: 99, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://i.pinimg.com/originals/8c/d7/d0/8cd7d028b323de24bec258ecd27de319.jpg', desc: 'Lettuce grows fast in 30 days. Perfect for home salads and containers. Needs cool weather and partial shade.' },
    { id: 87, name: 'Radish Seeds', price: 89, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://3.bp.blogspot.com/-vDRLv4KfGbA/VfKl2BB1Z2I/AAAAAAAAAlY/rZhTbXJpps0/s1600/seed.jpg', desc: 'Radish ready in 25 days. Easy to grow in pots and ground. Rich in vitamins and fiber.' },
    { id: 88, name: 'Green Beans Seeds', price: 119, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://as2.ftcdn.net/v2/jpg/02/77/52/89/1000_F_277528976_DMqYnp2nxSHigHGcKJVVPgblDbwg8NxB.jpg', desc: 'Green Beans produce pods quickly. Needs support to climb. Great source of protein and fiber.' },
    { id: 89, name: 'Peas Seeds', price: 109, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://empressofdirt.net/wp-content/uploads/SQ-pea-seeds-v1.jpg', desc: 'Peas grow well in cool weather. Sweet and healthy vegetable. Needs trellis for support.' },
    { id: 90, name: 'Carrot Seeds', price: 99, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://c8.alamy.com/comp/2G3CJKA/carrot-seeds-isolated-on-white-background-2G3CJKA.jpg', desc: 'Carrots need loose soil to grow. Rich in vitamin A and beta carotene. Harvest in 60 days.' },
    { id: 91, name: 'Cucumber Seeds', price: 129, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://welldales.co.uk/wp-content/uploads/2022/08/cucumber-large-long-giant-xl-seeds-garden-uk-grow-british-beth-alpha-marketmore-feature-e1661611206144.jpg', desc: 'Cucumber vines grow fast in summer. Needs trellis and regular watering. Cool and refreshing vegetable.' },
    { id: 92, name: 'Kale Seeds', price: 149, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://www.garden.eco/wp-content/uploads/2017/11/planting-kale-seeds-yes-theres-right-way-2.jpg-2.jpg', desc: 'Kale is super healthy leafy green. Grows in cool weather. Harvest leaves continuously.' },
    { id: 93, name: 'Swiss Chard Seeds', price: 139, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://papawsgarden.com/cdn/shop/products/GiantFordhookSwissChardSeedsSquared_86455b2b-a3fa-419e-9b92-108e2b597b6b_2048x2048.jpg?v=1670030606', desc: 'Swiss Chard has colorful stems. Nutritious leafy vegetable. Grows in sun and partial shade.' },
    { id: 94, name: 'Beetroot Seeds', price: 119, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://i0.wp.com/savvygardening.com/wp-content/uploads/2023/03/planting_beets_from_seed_garden.jpg?resize=600%2C600&ssl=1', desc: 'Beetroot gives both roots and leaves. Rich in iron and antioxidants. Grows in 50 days.' },
    { id: 95, name: 'Zucchini Seeds', price: 159, main: 'Seeds', sub: 'Vegetable Seeds', img: 'https://storables.com/wp-content/uploads/2023/12/how-to-plant-zucchini-seeds-1701532200.jpg', desc: 'Zucchini produces many fruits. Bushy plant needs space. Harvest when young and tender.' },

    // FLOWER SEEDS - 10
    { id: 96, name: 'Rose Seeds', price: 199, main: 'Seeds', sub: 'Flower Seeds', img: 'https://jardinierparesseux.com/wp-content/uploads/2022/09/image-37.png', desc: 'Grow roses from seeds at home. Takes time but rewarding. Needs full sun and care.' },
    { id: 97, name: 'Sunflower Seeds', price: 89, main: 'Seeds', sub: 'Flower Seeds', img: 'https://5.imimg.com/data5/SELLER/Default/2022/5/ZB/HR/HI/105040311/indian-sunflower-seeds-1000x1000.jpeg', desc: 'Sunflower grows tall with big blooms. Attracts birds and bees. Needs full sun and space.' },
    { id: 98, name: 'Tulip Bulbs', price: 249, main: 'Seeds', sub: 'Flower Seeds', img: 'https://growhappierplants.com/wp-content/uploads/2022/10/rows-of-tulip-bulbs-before-covering-with-soil-960x640.jpeg', desc: 'Tulip bulbs bloom in cool weather. Colorful spring flowers. Plant in well drained soil.' },
    { id: 99, name: 'Orchid Seeds', price: 299, main: 'Seeds', sub: 'Flower Seeds', img: 'https://www.ruralsprout.com/wp-content/uploads/2023/10/orchid-seeds-960x720.jpg', desc: 'Orchid seeds need special care. Slow growing but beautiful. Perfect for plant lovers.' },
    { id: 100, name: 'Hibiscus Seeds', price: 129, main: 'Seeds', sub: 'Flower Seeds', img: 'https://www.planetnatural.com/wp-content/uploads/2024/02/Hibiscus-seeds.jpg', desc: 'Hibiscus seeds grow into big plants. Flowers in many colors. Easy to grow in India.' },
    { id: 101, name: 'Lavender Seeds', price: 179, main: 'Seeds', sub: 'Flower Seeds', img: 'https://hgtvhome.sndimg.com/content/dam/images/hgtv/stock/2018/2/14/shutterstock_enchanted_fairy_670746427_lavender-seeds.jpg.rend.hgtvcom.1280.853.suffix/1518642090258.jpeg', desc: 'Lavender has fragrant purple flowers. Repels insects naturally. Needs sunny and dry spot.' },
    { id: 102, name: 'Marigold Seeds', price: 79, main: 'Seeds', sub: 'Flower Seeds', img: 'https://www.thespruce.com/thmb/RI3fTaaKHhHUpSz9yVxLzHnYJqM=/4200x0/filters:no_upscale():max_bytes(150000):strip_icc()/how-to-plant-marigold-seeds-7371595_Hero1-d814c4e770a542f89d28e49ee3498956.jpg', desc: 'Marigold keeps pests away. Bright orange and yellow flowers. Blooms all season long.' },
    { id: 103, name: 'Peace Lily Seeds', price: 159, main: 'Seeds', sub: 'Flower Seeds', img: 'https://preview.redd.it/d9i8zbgcca851.jpg?auto=webp&s=15750a078f7fa364056019ae88ebb6518b12e2b9', desc: 'Grow Peace Lily from seeds indoors. Air purifying flowering plant. Needs shade and humidity.' },
    { id: 104, name: 'Jasmine Seeds', price: 139, main: 'Seeds', sub: 'Flower Seeds', img: 'https://img.huabaike.com/uploads/allimg/artimg/201606/20160627123155_86003.jpg?x-oss-process=image/resize,w_600,limit_0/quality,q_80', desc: 'Jasmine seeds grow into fragrant plant. White flowers bloom at night. Perfect for garden.' },
    { id: 105, name: 'Zinnia Seeds', price: 99, main: 'Seeds', sub: 'Flower Seeds', img: 'https://thumbs.dreamstime.com/z/heap-quality-seeds-zinnia-flower-your-adorable-garden-can-be-used-create-new-elegant-packaging-background-high-140265920.jpg', desc: 'Zinnia blooms in many colors. Attracts butterflies. Very easy to grow from seeds.' },

    // HERB SEEDS - 10
    { id: 106, name: 'Basil Seeds', price: 69, main: 'Seeds', sub: 'Herb Seeds', img: 'https://storables.com/wp-content/uploads/2023/12/how-to-eat-basil-seeds-1701631309.jpg', desc: 'Basil is culinary and medicinal herb. Grows fast in warm weather. Use leaves for cooking.' },
    { id: 107, name: 'Mint Seeds', price: 79, main: 'Seeds', sub: 'Herb Seeds', img: 'https://rukminim2.flixcart.com/image/850/1000/xif0q/plant-seed/v/y/l/20-mint-seeds-pack-of-5-gardenify-india-original-imagecphxbrvmrn8.jpeg?q=20&crop=false', desc: 'Mint spreads fast and fragrant. Perfect for tea and cooking. Grows well in pots.' },
    { id: 108, name: 'Rosemary Seeds', price: 99, main: 'Seeds', sub: 'Herb Seeds', img: 'https://thumbs.dreamstime.com/b/rosemary-seed-ceramic-spoon-wood-table-45119504.jpg', desc: 'Rosemary is aromatic herb. Used in cooking and medicine. Needs sunny and dry location.' },
    { id: 109, name: 'Thyme Seeds', price: 89, main: 'Seeds', sub: 'Herb Seeds', img: 'https://rukminim2.flixcart.com/image/850/1000/xif0q/plant-seed/x/3/k/200-lxi-30-thyme-seed-for-planting-200-seeds-vibex-original-imagghmhgefhh7d9.jpeg?q=90&crop=false', desc: 'Thyme is small fragrant herb. Great for cooking and tea. Drought tolerant plant.' },
    { id: 110, name: 'Cilantro Seeds', price: 69, main: 'Seeds', sub: 'Herb Seeds', img: 'https://www.thespruceeats.com/thmb/vOw9jboAGJMde--JKYS6RbGS-cc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/coriander-seeds--close-up-614973136-54f0261f732e413fa4493bbfa93f0511.jpg', desc: 'Cilantro gives leaves and seeds. Used in Indian cooking. Grows fast in cool weather.' },
    { id: 111, name: 'Parsley Seeds', price: 79, main: 'Seeds', sub: 'Herb Seeds', img: 'https://www.ruralsprout.com/wp-content/uploads/2021/08/parsley-seed.jpg', desc: 'Parsley is nutritious garnish herb. Grows in pots and ground. Needs regular watering.' },
    { id: 112, name: 'Oregano Seeds', price: 89, main: 'Seeds', sub: 'Herb Seeds', img: 'https://plantozia.com/wp-content/uploads/2024/10/Oregano-Seeds-2.png', desc: 'Oregano is pizza herb. Strong flavor and aroma. Grows well in sunny spot.' },
    { id: 113, name: 'Dill Seeds', price: 79, main: 'Seeds', sub: 'Herb Seeds', img: 'https://www.foodchamps.org/wp-content/uploads/2022/02/Dill-Seed.jpg', desc: 'Dill has feathery leaves. Used in pickles and cooking. Grows fast in cool season.' },
    { id: 114, name: 'Sage Seeds', price: 99, main: 'Seeds', sub: 'Herb Seeds', img: 'https://5.imimg.com/data5/SE/RE/MY-3229367/sage-seeds-500x500.jpg', desc: 'Sage has soft fuzzy leaves. Medicinal and culinary herb. Needs well drained soil.' },
    { id: 115, name: 'Lavender Herb Seeds', price: 179, main: 'Seeds', sub: 'Herb Seeds', img: 'https://hgtvhome.sndimg.com/content/dam/images/hgtv/stock/2018/2/14/shutterstock_enchanted_fairy_670746427_lavender-seeds.jpg.rend.hgtvcom.1280.853.suffix/1518642090258.jpeg', desc: 'Lavender herb is calming and fragrant. Repels mosquitoes. Perfect for garden border.' },

    // FRUIT SEEDS - 10
    { id: 116, name: 'Tomato Seeds', price: 99, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://ndgbotanicals.com/wp-content/uploads/2016/08/Tomato-Mortgage-Lifter-1-7035.jpg', desc: 'Tomato is kitchen garden favorite. Produces fruits in 60 days. Needs support and sun.' },
    { id: 117, name: 'Banana Seeds', price: 149, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://pbs.twimg.com/media/DTAb449W4AES1s8.jpg', desc: 'Banana grows in tropical climate. Needs lots of water and sun. Takes 1 year to fruit.' },
    { id: 118, name: 'Watermelon Seeds', price: 129, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://safa71.com/wp-content/uploads/2024/11/7c7096d3f6374083a6066b1dbdf4bedf.png', desc: 'Watermelon needs hot summer. Sweet and juicy fruit. Spreads on ground.' },
    { id: 119, name: 'Apple Seeds', price: 179, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://5.imimg.com/data5/SELLER/Default/2024/10/462498292/FF/YJ/WY/29475546/apple-seeds-fresh-apple-fruit-seeds-1000x1000.jpg', desc: 'Apple needs cold climate. Takes years to fruit. Grows into big tree.' },
    { id: 120, name: 'Orange Seeds', price: 139, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://urbaki.com/gardening/wp-content/uploads/2023/04/Orange-Trees-from-Seed.jpg', desc: 'Orange tree gives vitamin C fruits. Needs sunny and warm weather. Easy to grow.' },
    { id: 121, name: 'Grape Seeds', price: 159, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://www.marketresearchintellect.com/images/blogs/a-closer-look-at-grape-seed-extract-emerging-trends-in-a-growing-market.webp', desc: 'Grape vine needs support to climb. Produces sweet fruits. Grows in warm climate.' },
    { id: 122, name: 'Coconut Seeds', price: 199, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://static.vecteezy.com/system/resources/previews/007/773/397/large_2x/pile-of-young-coconut-plant-sprout-of-coconut-tree-with-green-leaves-emerging-from-old-brown-coconut-planting-coconut-trees-in-farm-seed-propagation-of-tropical-palm-tree-exotic-tropical-tree-photo.jpg', desc: 'Coconut tree grows near coast. Gives water and fruit. Needs sandy soil and sun.' },
    { id: 123, name: 'Mango Seeds', price: 149, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://www.jardineiro.net/wp-content/uploads/2025/02/mango_seed_germinated.jpg', desc: 'Mango is king of fruits. Grows into big tree. Needs hot and dry climate.' },
    { id: 124, name: 'Peach Seeds', price: 169, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://i.ytimg.com/vi/ul-RJbQi2cM/maxresdefault.jpg', desc: 'Peach tree gives sweet fruits. Needs cold winter. Grows well in hills.' },
    { id: 125, name: 'Pineapple Seeds', price: 189, main: 'Seeds', sub: 'Fruit Seeds', img: 'https://img.freepik.com/premium-photo/pineapple-seeds_1264082-40610.jpg?w=996', desc: 'Pineapple grows from crown. Takes 18 months to fruit. Needs tropical weather.' },

    // ORGANIC SEEDS - 10
    { id: 126, name: 'Organic Tomato Seeds', price: 149, main: 'Seeds', sub: 'Organic Seeds', img: 'https://gardening-abc.com/wp-content/uploads/2019/01/96456e5411b1c54d3cf0839c107232e1.jpg', desc: 'Organic tomato without chemicals. Healthy and tasty fruits. Grows well in pots.' },
    { id: 127, name: 'Organic Okra Seeds', price: 129, main: 'Seeds', sub: 'Organic Seeds', img: 'https://thumbs.dreamstime.com/z/okra-seeds-okra-produce-seed-okra-seed-sowing-okra-seeds-okra-produce-seed-okra-seed-sowing-99996146.jpg', desc: 'Organic okra grows in summer. Pesticide free vegetable. Easy to grow plant.' },
    { id: 128, name: 'Organic Chili Seeds', price: 119, main: 'Seeds', sub: 'Organic Seeds', img: 'https://tiimg.tistatic.com/fp/1/008/252/a-grade-spicy-and-natural-ybrid-yellow-chili-seeds-211.jpg', desc: 'Organic chili is spicy and healthy. Grows in warm weather. Needs full sun.' },
    { id: 129, name: 'Organic Brinjal Seeds', price: 139, main: 'Seeds', sub: 'Organic Seeds', img: 'https://pakplants.pk/wp-content/uploads/2023/08/FB_IMG_1695914109652-1024x768.jpg', desc: 'Organic brinjal is chemical free. Produces purple fruits. Grows in all seasons.' },
    { id: 130, name: 'Organic Coriander Seeds', price: 89, main: 'Seeds', sub: 'Organic Seeds', img: 'https://epicureanearth.com/wp-content/uploads/2024/10/Coriander-Seeds-scaled.jpg', desc: 'Organic coriander for cooking. Fast growing herb. Both leaves and seeds used.' },
    { id: 131, name: 'Organic Bottle Gourd Seeds', price: 149, main: 'Seeds', sub: 'Organic Seeds', img: 'https://www.naatigrains.com/image/cache/catalog/naatigrains-products/NG160/bottle-gourd-seeds-buy-online-vegetable-food-naatigrains-1000x1000.jpg', desc: 'Bottle gourd is healthy vegetable. Climber plant needs support. Grows in summer.' },
    { id: 132, name: 'Organic Bitter Gourd Seeds', price: 139, main: 'Seeds', sub: 'Organic Seeds', img: 'https://thumbs.dreamstime.com/z/bitter-gourd-seeds-isolated-white-background-34317325.jpg', desc: 'Bitter gourd is medicinal vegetable. Grows on trellis. Good for health.' },
    { id: 133, name: 'Organic Fenugreek Seeds', price: 99, main: 'Seeds', sub: 'Organic Seeds', img: 'https://imgeng.jagran.com/images/2023/may/fenugreek1684321853195.jpg', desc: 'Fenugreek leaves and seeds used. Grows in 20 days. Healthy green vegetable.' },
    { id: 134, name: 'Organic Spinach Seeds', price: 109, main: 'Seeds', sub: 'Organic Seeds', img: 'https://i.etsystatic.com/27114340/r/il/af8c77/3699611881/il_fullxfull.3699611881_skj9.jpg', desc: 'Organic spinach is iron rich. Grows in cool weather. Harvest leaves multiple times.' },
    { id: 135, name: 'Organic Carrot Seeds', price: 119, main: 'Seeds', sub: 'Organic Seeds', img: 'https://www.epicgardening.com/wp-content/uploads/2023/07/close-up-of-carrot-seeds.jpeg', desc: 'Organic carrots without pesticides. Sweet and healthy root. Needs loose soil.' },

    // MICROGREEN SEEDS - 10
    { id: 136, name: 'Radish Microgreen Seeds', price: 199, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://m.media-amazon.com/images/I/71IMqfzqWeL.jpg', desc: 'Radish microgreens ready in 7 days. Spicy and nutritious. Grow on kitchen counter.' },
    { id: 137, name: 'Sunflower Microgreen Seeds', price: 179, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://cdn.pixabay.com/photo/2020/09/22/16/01/sunflower-seeds-5593518_1280.jpg', desc: 'Sunflower microgreens are crunchy. Rich in vitamins. Harvest in 10 days.' },
    { id: 138, name: 'Peas Microgreen Seeds', price: 169, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://empressofdirt.net/wp-content/uploads/SQ-pea-seeds-v1.jpg', desc: 'Pea shoots are sweet and tender. Grow in trays easily. Ready in 10 days.' },
    { id: 139, name: 'Broccoli Microgreen Seeds', price: 249, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://foodtolive.com/wp-content/uploads/2013/02/Broccoli-Seeds-min.jpg', desc: 'Broccoli microgreens are superfood. High in nutrients. Grows in one week.' },
    { id: 140, name: 'Mustard Microgreen Seeds', price: 149, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://www.healthbenefitstimes.com/9/gallery/mustard-seeds/Black-mustard-seeds.jpg', desc: 'Mustard microgreens have spicy taste. Grows very fast. Perfect for salads.' },
    { id: 141, name: 'Beetroot Microgreen Seeds', price: 189, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://unwins.co.uk/cdn/shop/products/unwins-beetroot-seeds-1_c50ee846-443d-452f-82d9-c418b3de1d43.jpg?v=1673343709', desc: 'Beet microgreens are red and sweet. Nutrient dense greens. Harvest in 10 days.' },
    { id: 142, name: 'Basil Microgreen Seeds', price: 159, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://guthealth.org/wp-content/uploads/2024/06/Basil-Seeds.png', desc: 'Basil microgreens are aromatic. Use in garnish and cooking. Grows quickly.' },
    { id: 143, name: 'Wheatgrass Seeds', price: 129, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://healthyhabs.com/wp-content/uploads/2019/12/wheatgrass-seeds.jpg', desc: 'Wheatgrass juice is healthy. Grows in 7 days. Rich in chlorophyll.' },
    { id: 144, name: 'Amaranth Seeds', price: 139, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://www.lifeberrys.com/img/article/amarnath-seeds-benefits-1498889801-lb.jpg', desc: 'Amaranth microgreens are nutritious. Red and green leaves. Grows in trays.' },
    { id: 145, name: 'Arugula Microgreen Seeds', price: 199, main: 'Seeds', sub: 'Microgreen Seeds', img: 'https://foodtolive.com/wp-content/uploads/2020/01/Organic-Arugula-Sprouting-Seeds-min.jpg', desc: 'Arugula has peppery taste. Grows fast in 10 days. Perfect for sandwiches.' },

    // EXOTIC SEEDS - 10
    { id: 146, name: 'Zucchini Exotic Seeds', price: 229, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://storables.com/wp-content/uploads/2023/12/how-to-plant-zucchini-seeds-1701532200.jpg', desc: 'Exotic zucchini variety. Produces long fruits. Grows in warm season.' },
    { id: 147, name: 'Cherry Tomato Seeds', price: 199, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://5.imimg.com/data5/SELLER/Default/2022/11/LL/KH/WA/115249268/cherry-tomato-seeds-1000x1000.jpg', desc: 'Cherry tomatoes are sweet. Grows in clusters. Perfect for pots.' },
    { id: 148, name: 'Curly Kale Seeds', price: 249, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://www.fontanaseeds.com/cdn/shop/files/KaleWestlandWinterSeeds1.jpg?v=1706262715', desc: 'Curly kale is superfood. Cold tolerant vegetable. Grows in winter.' },
    { id: 149, name: 'Broccoli Romanesco Seeds', price: 279, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://littleveggiepatchco.com.au/cdn/shop/files/IMG_9958_1.jpg?v=1706046440', desc: 'Romanesco has spiral shape. Unique and healthy vegetable. Grows in cool weather.' },
    { id: 150, name: 'Colored Bell Pepper Seeds', price: 189, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://c8.alamy.com/comp/2NYYDBW/bright-and-colorful-bell-pepper-seeds-on-a-white-background-a-top-view-shot-2NYYDBW.jpg', desc: 'Colored peppers look beautiful. Sweet and crunchy. Needs warm weather.' },
    { id: 151, name: 'Pak Choi Seeds', price: 169, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://welldales.co.uk/wp-content/uploads/2020/12/50-Giant-Pak-Choi-Seeds-Chinese-Cabbage-White-Stem-Canton-Vegetables-Close-up-of-seeds.png', desc: 'Pak Choi is Asian green. Fast growing vegetable. Harvest in 30 days.' },
    { id: 152, name: 'Scarlet Red Okra Seeds', price: 209, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://5.imimg.com/data5/SELLER/Default/2025/3/493313419/VZ/VV/TC/233432111/okra-bhindi-scarlet-red-exotic-vegetable-seeds2-1000x1000.webp', desc: 'Red okra is exotic variety. Colorful and healthy. Grows in summer.' },
    { id: 153, name: 'Purple Cauliflower Seeds', price: 259, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://i0.wp.com/theseedvine.com.au/wp-content/uploads/2020/09/brassica-oleracea-cauliflower-purple-main.jpg?w=1080&ssl=1', desc: 'Purple cauliflower is unique. Rich in antioxidants. Grows in cool season.' },
    { id: 154, name: 'Arugula Exotic Seeds', price: 199, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://foodtolive.com/wp-content/uploads/2020/01/Organic-Arugula-Sprouting-Seeds-min.jpg', desc: 'Exotic arugula has spicy leaves. Grows quickly. Perfect for salads.' },
    { id: 155, name: 'Passion Fruit Seeds', price: 299, main: 'Seeds', sub: 'Exotic Seeds', img: 'https://tastyplate.co/wp-content/uploads/2014/06/Spoonful-of-granadilla-fruit-seeds-Ecuador.jpg', desc: 'Passion fruit is tropical vine. Sweet and tangy fruit. Needs support to climb.' },

    // SEASONAL SEEDS - 10
    { id: 156, name: 'Okra Seeds', price: 129, main: 'Seeds', sub: 'Monsoon Seeds', img: 'https://thumbs.dreamstime.com/b/okra-seeds-okra-produce-seed-okra-seed-sowing-okra-seeds-okra-produce-seed-okra-seed-sowing-99995868.jpg', desc: 'Okra grows well in monsoon. Heat and rain tolerant. Produces many pods.' },
    { id: 157, name: 'Bottle Gourd Seeds', price: 149, main: 'Seeds', sub: 'Monsoon Seeds', img: 'https://www.naatigrains.com/image/cache/catalog/naatigrains-products/NG160/bottle-gourd-seeds-buy-online-vegetable-food-naatigrains-1000x1000.jpg', desc: 'Bottle gourd in rainy season. Climber vegetable. Needs trellis support.' },
    { id: 158, name: 'Bitter Gourd Seeds', price: 139, main: 'Seeds', sub: 'Monsoon Seeds', img: 'https://thumbs.dreamstime.com/z/bitter-gourd-seeds-isolated-white-background-34317325.jpg', desc: 'Bitter gourd in monsoon. Medicinal vegetable. Grows on vine.' },
    { id: 159, name: 'Cowpeas Seeds', price: 119, main: 'Seeds', sub: 'Monsoon Seeds', img: 'https://i5.walmartimages.com/seo/100-Seeds-BLACKEYE-PEA-Cow-Pea-Cowpea-Southern-Pea-Blackeyed-Pea-Black-Eye-Pea-Vigna-Unguiculata-Vegetable-Seeds_d64bda34-5040-4ce3-b564-56f52e69db31.d82d0d369fbfbe665f69b4ea2efa21d1.jpeg', desc: 'Cowpeas grow in rainy season. Protein rich beans. Drought tolerant crop.' },
    { id: 160, name: 'Spinach Seeds', price: 109, main: 'Seeds', sub: 'Winter Seeds', img: 'https://plantura.garden/uk/wp-content/uploads/sites/2/2022/06/spinach-seeds.jpg', desc: 'Spinach grows best in winter. Leafy green vegetable. Harvest multiple times.' },
    { id: 161, name: 'Carrot Seeds', price: 119, main: 'Seeds', sub: 'Winter Seeds', img: 'https://www.epicgardening.com/wp-content/uploads/2023/07/close-up-of-carrot-seeds.jpeg', desc: 'Winter carrots are sweet. Grows in cold weather. Needs 60 days.' },
    { id: 162, name: 'Radish Seeds', price: 99, main: 'Seeds', sub: 'Winter Seeds', img: 'https://www.healthbenefitstimes.com/9/gallery/radish/Radish-seeds.jpg', desc: 'Winter radish grows fast. Root vegetable for winter. Ready in 25 days.' },
    { id: 163, name: 'Cauliflower Seeds', price: 149, main: 'Seeds', sub: 'Winter Seeds', img: 'https://i.ebayimg.com/00/s/MTIwMFgxMjAw/z/cjcAAOSw3yJfGiUy/$_57.PNG?set_id=8800005007', desc: 'Cauliflower needs cool weather. Forms big white head. Grows in winter.' },
    { id: 164, name: 'Cucumber Seeds', price: 129, main: 'Seeds', sub: 'Summer Seeds', img: 'https://welldales.co.uk/wp-content/uploads/2022/08/cucumber-large-long-giant-xl-seeds-garden-uk-grow-british-beth-alpha-marketmore-feature-e1661611206144.jpg', desc: 'Cucumber in hot summer. Cooling vegetable. Needs regular watering.' },
    { id: 165, name: 'Watermelon Seeds', price: 159, main: 'Seeds', sub: 'Summer Seeds', img: 'https://safa71.com/wp-content/uploads/2024/11/7c7096d3f6374083a6066b1dbdf4bedf.png', desc: 'Watermelon grows best in summer heat. Sweet juicy fruit for summer. Needs lot of space to spread.' },
]

export default function BrowsePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🌿</div>
                    <p className="text-white/60">Loading store...</p>
                </div>
            </div>
        }>
            <BrowsePageContent />
        </Suspense>
    )
}

function BrowsePageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialMain = searchParams.get('main') || 'Plants'

    const [activeMain, setActiveMain] = useState(initialMain)
    const [activeSub, setActiveSub] = useState("All")
    const [showFilters, setShowFilters] = useState(false)
    const [allProducts, setAllProducts] = useState<any[]>(products)

    const { addToCart, toast, wishlist, toggleWishlist } = useCart()

    useEffect(() => {
        const fetchDbProducts = async () => {
            try {
                const { data, error } = await supabase.from('products').select('*')
                if (error) {
                    console.error('Failed to fetch DB products:', error)
                    return
                }
                if (data && data.length > 0) {
                    const mapped = data.map((p: any) => {
                        let main = 'Plants';
                        let sub = p.category || 'Indoor Plants';
                        const catLower = (p.category || '').toLowerCase();
                        if (catLower.includes('seed')) {
                            main = 'Seeds';
                        } else if (catLower.includes('soil') || catLower.includes('compost') || catLower.includes('peat') || catLower.includes('mix')) {
                            main = 'Soils';
                        } else if (catLower.includes('tool') || catLower.includes('pot') || catLower.includes('pruner') || catLower.includes('gloves')) {
                            main = 'Tools';
                        }

                        return {
                            id: p.id,
                            name: p.name,
                            price: Number(p.price),
                            desc: p.description || p.name,
                            img: parseImageUrl(p.images) || p.img || p.image_url || 'https://placehold.co/100/1e4d38/4ade80?text=Plant',
                            main: main,
                            sub: sub,
                            stock: p.stock_quantity || 20
                        }
                    })

                    const merged = [...products]
                    mapped.forEach(dbItem => {
                        const existingIdx = merged.findIndex(item => item.name.toLowerCase() === dbItem.name.toLowerCase())
                        if (existingIdx > -1) {
                            merged[existingIdx] = { ...merged[existingIdx], ...dbItem }
                        } else {
                            merged.push(dbItem)
                        }
                    })
                    setAllProducts(merged)
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchDbProducts()
    }, [])

    if (activeMain === "AI Plant Match") {
        return (
            <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className} pb-24`}>
                <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 p-4 sticky top-0 z-40">
                    <h1 className="text-2xl font-bold text-white">AI Plant Match 🌿</h1>
                </nav>

                <AIPlantMatcherAny
                    suggestedPlants={(allProducts
                        .filter(p => p.main === 'Plants')
                        .map(p => ({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image_url: p.img
                        })) as any[])}
                />

            </main>
        )
    }

    const filteredProducts = allProducts.filter(p => {
        if (p.main !== activeMain) return false
        if (activeSub === "All") return true
        return p.sub === activeSub
    })
    const currentSubs = subCategories[activeMain as keyof typeof subCategories]

    const handleAddToBag = (product: any) => {
        addToCart(product)
    }

    return (
        <main className={`min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-black ${outfit.className} pb-24`}>
            <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 p-4 sticky top-0 z-40">
                <h1 className="text-2xl font-bold text-white">{activeMain} {activeSub !== "All" && `- ${activeSub}`}</h1>
                {/* CATEGORY FILTER BUTTONS - DIRECT GA KANIPINCHADANIKI */}
                <div className="flex gap-2 overflow-x-auto mt-3 pb-2">
                    {currentSubs.map((sub) => (
                        <button
                            key={sub}
                            onClick={() => setActiveSub(sub)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition text-sm ${activeSub === sub ? 'bg-green-500 text-black' : 'bg-white/10 text-white border-white/20'}`}>
                            {sub}
                        </button>
                    ))}
                </div>
            </nav>

            {/* TOAST POPUP */}
            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold z-50 shadow-lg">
                    {toast}
                </div>
            )}

            {/* 2 COL GRID - PHOTO SIZE PENCHAM */}
            <div className="grid grid-cols-2 gap-5 p-4">
                {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        onClick={() => router.push(`/product/${product.id}`)}
                        className="bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl cursor-pointer">
                        <img
                            src={proxyUrl(product.img) || OFFLINE_PLACEHOLDER}
                            className="w-full h-64 object-cover rounded-t-2xl bg-white/5"
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            onError={(e: any) => handleImageError(e, product.img)}
                        />

                        {/* KINDHA DETAILS + MATTER */}
                        < div className="p-3" >
                            <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-white text-base">{product.name}</p>
                                {/* WISHLIST BUTTON */}
                                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}>
                                    <Heart className={`w-5 h-5 ${wishlist.some((w: any) => w.id === product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                </button>
                            </div>
                            <p className="text-green-400 font-bold text-lg mb-1">₹{product.price}</p>
                            <p className="text-gray-300 text-xs mb-3 leading-tight">{product.desc}</p> {/* IKKADA MATTER */}

                            {/* ADD TO BAG BUTTON */}
                            < button
                                onClick={() => handleAddToBag(product)}
                                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 text-sm"
                            >
                                Add to Bag
                            </button>
                        </div>
                    </div >
                )) : (
                    <p className="text-white col-span-2 text-center py-10">No products in {activeSub}</p>
                )
                }
            </div >

            {/* BOTTOM BUTTONS */}
            < div className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 flex z-50" >
                <button onClick={() => router.push('/category')} className="flex-1 py-4 font-bold text-white border-r border-white/10">
                    CATEGORY
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className="flex-1 py-4 font-bold text-green-400">
                    FILTERS
                </button>
            </div >

            {/* FILTERS POPUP */}
            {
                showFilters && (
                    <div className="fixed bottom-20 left-4 right-4 bg-gray-900/90 backdrop-blur-xl rounded-2xl border-white/20 p-4 z-50 max-h-96 overflow-y-auto">
                        <p className="font-bold text-lg mb-3 text-white">Filter by {activeMain}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {currentSubs.map((sub) => (
                                <button
                                    key={sub}
                                    onClick={() => { setActiveSub(sub); setShowFilters(false) }}
                                    className={`p-3 rounded-xl border text-sm font-semibold ${activeSub === sub ? 'bg-green-600 text-white border-green-400' : 'bg-white/10 text-white border-white/20'}`}>
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }
        </main >
    )
}