import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
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

Return ONLY a valid JSON object with NO extra text or markdown, matching this exact schema:
{
  "detected_lighting": "indirect_light",
  "detected_space": "medium",
  "detected_environment": "indoor",
  "confidence_score": 94.0,
  "reasoning": "Your room shows a large window providing bright, indirect natural light — perfect for tropical houseplants.",
  "recommended_criteria": {
    "watering_level": "moderate",
    "sunlight": "Bright indirect light",
    "suggested_placement": "Position plants within 3-5 feet of the window."
  }
}
`.trim();

// === GEMINI 1.5 FLASH (Primary) ===
export async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string
): Promise<IAIMatchResponse> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
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

// === OPENAI GPT-4o-mini (Fallback) ===
export async function analyzeWithOpenAI(imageUrl: string): Promise<IAIMatchResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

  const content = response.choices[0].message.content;
  if (!content) throw new Error('OpenAI returned empty response');
  return JSON.parse(content) as IAIMatchResponse;
}
