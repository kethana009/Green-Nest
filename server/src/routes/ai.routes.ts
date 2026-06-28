import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';
import { createClient } from '../config/supabase';

const router = Router();

// Multer: store uploaded images in memory buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// POST /api/ai/match — Vision AI plant matching
router.post(
  '/match',
  authMiddleware,
  upload.single('room_image'),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const supabase = createClient();

    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    // Check rate limit (5 runs per user per day)
    const today = new Date().toISOString().split('T')[0];
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_runs_today, ai_runs_date, ai_daily_limit')
      .eq('id', req.user!.id)
      .single();

    const dailyLimit = profile?.ai_daily_limit ?? 5;
    const isNewDay = profile?.ai_runs_date !== today;
    const runsToday = isNewDay ? 0 : (profile?.ai_runs_today ?? 0);

    if (!isNewDay && runsToday >= dailyLimit) {
      res.status(429).json({
        message: `Daily AI match limit reached (${dailyLimit}/day). Try again tomorrow.`,
      });
      return;
    }

    // Upload image to Supabase Storage
    const extension = req.file.mimetype.split('/')[1];
    const fileName = `${req.user!.id}/${Date.now()}.${extension}`;

    const { error: storageError } = await supabase.storage
      .from('ai-uploads')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (storageError) {
      res.status(500).json({ message: 'Image upload failed' });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ai-uploads')
      .getPublicUrl(fileName);

    // Call Vision AI (import dynamically to avoid crash if key not set)
    let analysis;
    try {
      const { analyzeWithGemini } = await import('../services/ai.service');
      const imageBase64 = req.file.buffer.toString('base64');
      analysis = await analyzeWithGemini(imageBase64, req.file.mimetype);
    } catch (geminiError) {
      console.error('Gemini failed, trying OpenAI fallback:', geminiError);
      try {
        const { analyzeWithOpenAI } = await import('../services/ai.service');
        analysis = await analyzeWithOpenAI(publicUrl);
      } catch {
        res.status(500).json({ message: 'AI analysis failed. Please try again.' });
        return;
      }
    }

    // Match products from catalog
    const { data: matchedProducts } = await supabase
      .from('products')
      .select('id, name, price, images, rating, difficulty_level, scientific_name, discount_percentage')
      .eq('is_indoor', analysis.detected_environment === 'indoor')
      .gt('stock_quantity', 0)
      .order('rating', { ascending: false })
      .limit(4);

    // Log to ai_logs table
    const processingTime = Date.now() - startTime;
    const { data: log } = await supabase
      .from('ai_logs')
      .insert({
        user_id: req.user!.id,
        uploaded_image_url: publicUrl,
        detected_lighting: analysis.detected_lighting,
        detected_space: analysis.detected_space,
        detected_environment: analysis.detected_environment,
        confidence_score: analysis.confidence_score,
        recommended_product_ids: matchedProducts?.map((p) => p.id) || [],
        raw_ai_response: analysis,
        processing_time_ms: processingTime,
      })
      .select()
      .single();

    // Update rate limit counter
    await supabase
      .from('profiles')
      .update({ ai_runs_today: runsToday + 1, ai_runs_date: today })
      .eq('id', req.user!.id);

    res.json({
      log_id: log?.id,
      analysis,
      recommended_plants: matchedProducts?.map((p) => ({
        ...p,
        match_confidence: Math.round(analysis.confidence_score - Math.random() * 8),
      })) || [],
      processing_time_ms: processingTime,
    });
  }
);

// GET /api/ai/history — User's past AI match runs
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_logs')
    .select(
      'id, uploaded_image_url, detected_lighting, detected_space, detected_environment, confidence_score, recommended_product_ids, created_at'
    )
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json(data || []);
});

// GET /api/ai/logs — Admin: all AI logs
router.get('/logs', authMiddleware, adminGuard, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { page = '1', limit = '20' } = req.query;
  const from = (+page - 1) * +limit;
  const to = from + +limit - 1;

  const { data, error, count } = await supabase
    .from('ai_logs')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json({ logs: data, total: count });
});

export default router;
