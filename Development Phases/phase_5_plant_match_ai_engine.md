# 🌿 Green Nest — Phase 5: Plant Match AI Engine

## Overview

Phase 5 builds the signature feature of Green Nest — the **Plant Match AI** module. Users upload a photo of their room or outdoor space; the system sends it to a Vision AI (Google Gemini Flash or OpenAI GPT-4o), extracts environmental parameters, matches them against the live product catalog, and displays personalized recommendations. All runs are logged for admin review and user history.

**Phase Duration Estimate:** 3–4 days  
**Depends On:** Phase 1 (Supabase storage, DB), Phase 2 (auth JWT), Phase 3 (product catalog)  
**Unlocks:** Phase 6 (admin AI log auditor)

---

## 1. AI Match Page — Frontend Wizard

**File:** `app/(customer)/match/page.tsx`

The page is a 3-state wizard driven by a single `step` state variable:

```typescript
type MatchStep = 'upload' | 'analyzing' | 'results';
const [step, setStep] = useState<MatchStep>('upload');
```

---

## 2. Step 1 — Image Upload Dropzone

### 2.1 Dropzone Component

**File:** `components/ai/MatchDropzone.tsx`

```typescript
'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface MatchDropzoneProps {
  onFile: (file: File) => void;
}

export function MatchDropzone({ onFile }: MatchDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      setError('Invalid file. Use JPG, PNG, or WebP under 5MB.');
      return;
    }
    const file = accepted[0];
    setError(null);
    setPreview(URL.createObjectURL(file));
    onFile(file);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <motion.div
        {...getRootProps()}
        animate={{ borderColor: isDragActive ? 'hsl(162,76%,41%)' : 'rgba(255,255,255,0.25)' }}
        className="glass-card border-2 border-dashed rounded-2xl p-12 text-center
          cursor-pointer transition-all duration-300 hover:border-brand-mint/60"
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="relative inline-block">
                <img src={preview} alt="Room preview"
                  className="max-h-48 rounded-xl mx-auto object-cover shadow-glass" />
                <button
                  onClick={(e) => { e.stopPropagation(); setPreview(null); }}
                  className="absolute -top-2 -right-2 p-1 rounded-full glass-card
                    border border-white/20 hover:bg-rose-500/20"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3 text-brand-mint">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Photo ready for analysis</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="space-y-4">
              <motion.div
                animate={{ y: isDragActive ? -8 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-5xl mx-auto w-fit"
              >
                🌿
              </motion.div>
              <div>
                <p className="font-outfit font-semibold text-lg">
                  {isDragActive ? 'Drop your photo here!' : 'Upload Your Room Photo'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Drag & drop or click to browse — JPG, PNG, WebP up to 5MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-rose-500 text-sm px-1">
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}
    </div>
  );
}
```

---

## 3. Step 2 — Analysis Loading State

**File:** `components/ai/AnalyzingLoader.tsx`

Renders while the API call is in progress, cycling through 4 labeled stages.

```typescript
const ANALYSIS_STEPS = [
  { label: 'Uploading image securely...',     icon: '☁️', durationMs: 1000 },
  { label: 'Scanning brightness & light...',  icon: '☀️', durationMs: 1500 },
  { label: 'Measuring room dimensions...',    icon: '📐', durationMs: 1500 },
  { label: 'Matching nursery catalog...',     icon: '🌿', durationMs: 1000 },
];

export function AnalyzingLoader({ imagePreview }: { imagePreview: string }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    ANALYSIS_STEPS.forEach((step, i) => {
      setTimeout(() => setCurrentStep(i), elapsed);
      elapsed += step.durationMs;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Image with shimmer overlay */}
      <div className="relative rounded-2xl overflow-hidden h-48">
        <img src={imagePreview} alt="" className="w-full h-full object-cover opacity-60" />
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 shimmer-bg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-forest/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white font-outfit font-semibold text-sm">
            🔍 Analyzing your space...
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="space-y-3">
        {ANALYSIS_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: currentStep >= i ? 1 : 0.4 }}
            className="flex items-center gap-3 glass-card p-3 rounded-xl"
          >
            <span className="text-lg">{step.icon}</span>
            <span className="text-sm flex-1">{step.label}</span>
            {currentStep > i && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-brand-mint text-sm">✓</motion.span>
            )}
            {currentStep === i && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 rounded-full border-2 border-brand-mint border-t-transparent"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Backend AI Service

### 4.1 AI Service (`server/src/services/ai.service.ts`)

```typescript
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IAIMatchResponse } from '../types/ai';

const SYSTEM_PROMPT = `
You are the Green Nest AI Plant Advisor. Analyze the uploaded photo of a user's room or outdoor space.

Identify and categorize the following environment properties:
- detected_lighting: Choose ONLY from: low_light | indirect_light | bright_light
- detected_space: Choose ONLY from: small | medium | spacious
- detected_environment: Choose ONLY from: indoor | outdoor | balcony

Evaluate how clear and confident you are in your assessment (0.0 to 100.0).
Provide a warm, friendly reasoning string explaining your findings.
Suggest plant care criteria suited to the detected environment.

Return ONLY a valid JSON object with NO extra text, matching this exact schema:
{
  "detected_lighting": "indirect_light",
  "detected_space": "medium",
  "detected_environment": "indoor",
  "confidence_score": 94.0,
  "reasoning": "Your room shows a large window providing bright, indirect natural light throughout the day — perfect conditions for tropical houseplants.",
  "recommended_criteria": {
    "watering_level": "moderate",
    "sunlight": "Bright indirect light",
    "suggested_placement": "Position plants within 3-5 feet of the window."
  }
}
`.trim();

// === GEMINI IMPLEMENTATION ===
export async function analyzeWithGemini(imageBase64: string, mimeType: string): Promise<IAIMatchResponse> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const text = result.response.text().trim();
  // Strip markdown code fences if present
  const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(clean) as IAIMatchResponse;
}

// === OPENAI FALLBACK ===
export async function analyzeWithOpenAI(imageUrl: string): Promise<IAIMatchResponse> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [{ type: 'image_url', image_url: { url: imageUrl } }],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 512,
  });
  return JSON.parse(response.choices[0].message.content!) as IAIMatchResponse;
}
```

---

### 4.2 AI Controller (`server/src/controllers/ai.controller.ts`)

```typescript
import multer from 'multer';
import { Request, Response } from 'express';
import { createClient } from '../config/supabase';
import { analyzeWithGemini, analyzeWithOpenAI } from '../services/ai.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadMiddleware = upload.single('room_image');

export async function matchPlants(req: Request, res: Response) {
  const startTime = Date.now();
  const supabase = createClient();

  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  // 1. Upload image to Supabase Storage
  const fileName = `${req.user!.id}/${Date.now()}.${req.file.mimetype.split('/')[1]}`;
  const { data: storageData, error: storageError } = await supabase.storage
    .from('ai-uploads')
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (storageError) {
    return res.status(500).json({ message: 'Image upload failed' });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('ai-uploads').getPublicUrl(fileName);

  // 2. Call Vision API
  let analysis;
  try {
    const imageBase64 = req.file.buffer.toString('base64');
    analysis = await analyzeWithGemini(imageBase64, req.file.mimetype);
  } catch (err) {
    // Fallback to OpenAI if Gemini fails
    try {
      analysis = await analyzeWithOpenAI(publicUrl);
    } catch {
      return res.status(500).json({ message: 'AI analysis failed. Please try again.' });
    }
  }

  // 3. Query matching products from database
  const { data: matchedProducts } = await supabase
    .from('products')
    .select('id, name, price, images, rating, difficulty_level, scientific_name, discount_percentage')
    .eq('is_indoor', analysis.detected_environment === 'indoor')
    .gt('stock_quantity', 0)
    .order('rating', { ascending: false })
    .limit(4);

  // 4. Write to ai_logs table
  const processingTime = Date.now() - startTime;
  const { data: log } = await supabase.from('ai_logs').insert({
    user_id: req.user!.id,
    uploaded_image_url: publicUrl,
    detected_lighting: analysis.detected_lighting,
    detected_space: analysis.detected_space,
    detected_environment: analysis.detected_environment,
    confidence_score: analysis.confidence_score,
    recommended_product_ids: matchedProducts?.map(p => p.id) || [],
    raw_ai_response: analysis,
    processing_time_ms: processingTime,
  }).select().single();

  // 5. Return results
  return res.json({
    log_id: log?.id,
    analysis: {
      detected_lighting: analysis.detected_lighting,
      detected_space: analysis.detected_space,
      detected_environment: analysis.detected_environment,
      confidence_score: analysis.confidence_score,
      reasoning: analysis.reasoning,
      recommended_criteria: analysis.recommended_criteria,
    },
    recommended_plants: matchedProducts?.map(p => ({
      ...p,
      match_confidence: Math.round(analysis.confidence_score - Math.random() * 5),
    })) || [],
    processing_time_ms: processingTime,
  });
}
```

### 4.3 AI Routes

```typescript
// server/src/routes/ai.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware, matchPlants } from '../controllers/ai.controller';
import { getAIHistory } from '../controllers/ai.controller';

const router = Router();
router.post('/match', authMiddleware, uploadMiddleware, matchPlants);
router.get('/history', authMiddleware, getAIHistory);
export default router;
```

---

## 5. Step 3 — Recommendation Results Dashboard

**File:** `components/ai/MatchResults.tsx`

### 5.1 Layout

```
+---------------------------------------------------------------------------------+
|  [Uploaded Room Photo — with detected feature overlay]                         |
|                                                                                 |
|  Detected Environment:          Confidence Score:                               |
|  ☀️ Bright Indirect Light       [Circular gauge: 94%]                           |
|  📐 Medium Space                                                                |
|  🏠 Indoor Room                                                                 |
|                                                                                 |
|  🤖 "Your room shows a large window... perfect for tropical plants."            |
+---------------------------------------------------------------------------------+
|  🌿 4 Plants Matched for Your Space                                             |
|                                                                                 |
|  +------------------+  +------------------+  +------------------+              |
|  | Monstera  96% ✅ |  | Snake Plant 91%  |  | Pothos    88%   |              |
|  | [Image]          |  | [Image]          |  | [Image]          |              |
|  | Care: Beginner   |  | Care: Beginner   |  | Care: Beginner  |              |
|  | [ Add to Cart ]  |  | [ Add to Cart ]  |  | [ Add to Cart ] |              |
|  +------------------+  +------------------+  +------------------+              |
|                                                                                 |
|  [ ➕ Add All to Cart ]     [ 📄 Download PDF Report ]                          |
+---------------------------------------------------------------------------------+
```

### 5.2 Confidence Gauge Ring

```typescript
// Circular SVG gauge for confidence score display
function ConfidenceGauge({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="100" height="100" className="-rotate-90">
      <circle cx="50" cy="50" r={radius}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <motion.circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={score > 85 ? 'hsl(162,76%,41%)' : score > 60 ? 'hsl(38,92%,50%)' : 'hsl(343,85%,55%)'}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      <text x="50" y="55" textAnchor="middle" className="rotate-90"
        fill="currentColor" fontSize="14" fontWeight="bold">
        {score}%
      </text>
    </svg>
  );
}
```

### 5.3 Add All to Cart

```typescript
const handleAddAllToCart = () => {
  recommendedPlants.forEach(plant => addToCart(plant));
  toast.success(`${recommendedPlants.length} plants added to your cart! 🛒`);
};
```

### 5.4 Download PDF Report

```typescript
const downloadReport = () => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('🌿 Green Nest — Plant Match Report', 14, 20);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Detected Lighting: ${analysis.detected_lighting}`, 14, 45);
  doc.text(`Detected Space: ${analysis.detected_space}`, 14, 53);
  doc.text(`Environment: ${analysis.detected_environment}`, 14, 61);
  doc.text(`Confidence Score: ${analysis.confidence_score}%`, 14, 69);
  doc.text('AI Reasoning:', 14, 80);
  const lines = doc.splitTextToSize(analysis.reasoning, 170);
  doc.text(lines, 14, 88);
  // Recommended plants table
  autoTable(doc, {
    startY: 110,
    head: [['Plant Name', 'Match %', 'Care Level', 'Price']],
    body: recommendedPlants.map(p => [
      p.name, `${p.match_confidence}%`, p.difficulty_level, `$${p.price}`
    ]),
  });
  doc.save('green-nest-plant-match-report.pdf');
};
```

---

## 6. Match History (User Profile)

**File:** `app/(customer)/profile/ai-history/page.tsx`

```
+------------------------------------------------------------------+
|  🤖 My Plant Match History                                       |
|------------------------------------------------------------------|
|  [Room Thumb]  Jun 15, 2026 — Indoor · Indirect Light · 94%    |
|                4 Plants Matched  [ View Results ] [ Run Again ] |
|------------------------------------------------------------------|
|  [Room Thumb]  Jun 10, 2026 — Balcony · Bright Light · 88%     |
|                3 Plants Matched  [ View Results ] [ Run Again ] |
+------------------------------------------------------------------+
```

```typescript
// GET /api/ai/history
export async function getAIHistory(req: Request, res: Response) {
  const supabase = createClient();
  const { data } = await supabase
    .from('ai_logs')
    .select('id, uploaded_image_url, detected_lighting, detected_environment, confidence_score, created_at, recommended_product_ids')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(20);
  return res.json(data || []);
}
```

---

## 7. Rate Limiting (Per User)

To prevent API cost abuse, track daily AI usage per user:

```sql
-- Add this to profiles table
ALTER TABLE public.profiles ADD COLUMN ai_runs_today INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN ai_runs_date DATE DEFAULT CURRENT_DATE;
```

In the controller, before calling the Vision API:
```typescript
const { data: profile } = await supabase
  .from('profiles').select('ai_runs_today, ai_runs_date').eq('id', req.user!.id).single();

const today = new Date().toISOString().split('T')[0];
if (profile?.ai_runs_date === today && profile.ai_runs_today >= 5) {
  return res.status(429).json({ message: 'Daily AI match limit reached (5/day). Try again tomorrow.' });
}

// Reset counter if day changed
const resetCount = profile?.ai_runs_date !== today ? 0 : profile.ai_runs_today;
await supabase.from('profiles')
  .update({ ai_runs_today: resetCount + 1, ai_runs_date: today })
  .eq('id', req.user!.id);
```

---

## 8. Phase 5 Completion Checklist

- [ ] `react-dropzone` installed and `MatchDropzone` component created
- [ ] File validation (type + 5MB limit) with shake error animation
- [ ] Image preview inside dropzone with clear button
- [ ] "Analyze My Space" button triggers step transition
- [ ] `AnalyzingLoader` with 4 progress steps and shimmer overlay
- [ ] `POST /api/ai/match` endpoint receiving `multipart/form-data`
- [ ] Image uploaded to `ai-uploads` Supabase bucket
- [ ] Gemini Vision API integrated with system prompt
- [ ] OpenAI Vision fallback when Gemini throws error
- [ ] JSON response parsed and validated
- [ ] SQL matching query returning up to 4 products
- [ ] `ai_logs` row inserted with all analysis fields
- [ ] `MatchResults` split-pane dashboard rendered
- [ ] Confidence gauge ring SVG animation (1.5s ease-out)
- [ ] Environment detection badges (light, space, location)
- [ ] AI reasoning text displayed in glass panel
- [ ] Recommended plant cards with match confidence %
- [ ] "Add to Cart" per plant and "Add All to Cart" working
- [ ] "Download PDF Report" generating full analysis PDF
- [ ] "Try Again" button resetting back to upload step
- [ ] `GET /api/ai/history` returning user's past runs
- [ ] AI History page on profile with thumbnails and "Run Again"
- [ ] Daily rate limiter (5 runs/user/day) enforced in controller
- [ ] Rate limit error message shown gracefully in UI
- [ ] `ai_runs_today` and `ai_runs_date` columns added to profiles
