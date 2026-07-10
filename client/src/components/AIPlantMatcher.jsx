'use client'
import { useState } from "react"

/**
 * @param {{ suggestedPlants?: any[], onAddToCart?: (plant: any) => void }} props
 */
const proxyUrl = (url) => {
    if (!url || url.length < 4) return '';
    if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

export default function AIPlantMatcher({ suggestedPlants = [], onAddToCart = null }) {
    const [roomImage, setRoomImage] = useState(null)
    const [roomLight, setRoomLight] = useState("bright")
    const [generatedText, setGeneratedText] = useState("")
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState("Upload your room photo to get personalized analysis")
    const [addedIds, setAddedIds] = useState(new Set())

    // Read Gemini key from env (set NEXT_PUBLIC_GEMINI_KEY in .env.local)
    const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_KEY || ""

    const fileToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = (err) => reject(err)
        })

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setRoomImage(file)
            setStep("Room uploaded! Click 'See in My Room' on any plant 🌱")
            setGeneratedText("")
        }
    }

    async function getPlantInRoomDescription(plantName) {
        if (!roomImage) {
            setStep("Please upload your room photo first 📷")
            return
        }
        if (!GEMINI_KEY) {
            setGeneratedText(
                `✨ AI Analysis for ${plantName}:\n\n` +
                `A ${plantName} in a beautiful ceramic pot would look stunning in your space. ` +
                `Its natural green tones will complement your room's existing décor and bring a calming, ` +
                `fresh energy to the environment.\n\n` +
                `To enable real AI analysis, add your NEXT_PUBLIC_GEMINI_KEY to .env.local`
            )
            setStep("Done! (Demo mode — add Gemini API key for real analysis)")
            return
        }

        setStep(`Analyzing your room for ${plantName}...`)
        setLoading(true)
        setGeneratedText("")

        try {
            const base64 = await fileToBase64(roomImage)
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    text: `Analyze this interior room photo. The lighting condition is ${roomLight}. 
                                    In 4-5 lines, describe how a ${plantName} in a ceramic pot would look and fit in this specific room. 
                                    Mention the ideal corner or spot, how it complements the existing décor, and any care tips for this light condition.`
                                },
                                { inlineData: { mimeType: "image/jpeg", data: base64.split(",")[1] } }
                            ]
                        }]
                    }),
                }
            )
            const data = await response.json()
            if (!data.candidates?.[0]) {
                throw new Error(data?.error?.message || "Gemini could not analyze this image")
            }
            setGeneratedText(data.candidates[0].content.parts[0].text)
            setStep("Analysis complete! ✅")
        } catch (err) {
            setStep("Analysis failed — check your Gemini API key")
            setGeneratedText("Could not analyze room: " + err.message)
        }
        setLoading(false)
    }

    const handleAddToCart = (plant) => {
        if (onAddToCart) {
            onAddToCart(plant)
            setAddedIds(prev => new Set([...prev, plant.id]))
        }
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            {/* Upload Section */}
            <label className="flex flex-col items-center justify-center gap-2 bg-white/5 border-2 border-dashed border-white/20 hover:border-green-400/50 rounded-2xl p-6 cursor-pointer transition-all mb-4 group">
                <div className="text-4xl group-hover:scale-110 transition-transform">📷</div>
                <p className="text-white font-semibold text-sm">
                    {roomImage ? "✅ Room photo uploaded — click to change" : "Click to Upload Room Photo"}
                </p>
                <p className="text-white/40 text-xs">JPG, PNG, WEBP accepted</p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            {/* Light Level Selector */}
            <div className="flex gap-2 mb-4">
                {["bright", "medium", "low"].map(light => (
                    <button
                        key={light}
                        onClick={() => setRoomLight(light)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                            roomLight === light
                                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                : "bg-white/10 text-white/60 hover:bg-white/20"
                        }`}
                    >
                        {light === "bright" ? "☀️" : light === "medium" ? "🌤️" : "🌙"} {light} light
                    </button>
                ))}
            </div>

            {/* Status */}
            <p className="text-center text-white/50 text-xs mb-4 italic">{step}</p>

            {/* Plant Cards */}
            {suggestedPlants.length === 0 ? (
                <div className="text-center text-white/40 py-8">
                    <div className="text-4xl mb-2">🌱</div>
                    <p>No plants to show — select a room to get suggestions</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {suggestedPlants.map((plant) => (
                        <div key={plant.id} className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:border-green-400/40 transition-all group">
                            <div className="relative">
                                <img
                                    src={proxyUrl(plant.image_url || plant.img)}
                                    alt={plant.name}
                                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.target.onerror = null
                                        e.target.src = `https://placehold.co/300x200/1a4731/4ade80?text=${encodeURIComponent(plant.name)}`
                                    }}
                                />
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white font-bold">
                                    ₹{plant.price}
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="font-bold text-sm text-white leading-tight mb-2 line-clamp-1">{plant.name}</p>
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => getPlantInRoomDescription(plant.name)}
                                        disabled={loading}
                                        className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                        {loading ? "Analyzing..." : "👁️ See in My Room"}
                                    </button>
                                    {onAddToCart && (
                                        <button
                                            onClick={() => handleAddToCart(plant)}
                                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                addedIds.has(plant.id)
                                                    ? "bg-green-600 text-white"
                                                    : "bg-orange-500 hover:bg-orange-400 text-white"
                                            }`}
                                        >
                                            {addedIds.has(plant.id) ? "✅ Added!" : "🛒 Add to Cart"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Room Analysis Result */}
            {generatedText && (
                <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-5 mb-4">
                    <h3 className="font-bold text-green-300 mb-3 flex items-center gap-2">
                        <span>🌿</span> AI Room Analysis
                    </h3>
                    <p className="text-white/80 text-sm whitespace-pre-line leading-relaxed">{generatedText}</p>
                </div>
            )}
        </div>
    )
}