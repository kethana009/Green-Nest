# 🌿 Green Nest - PRD Part 4: Plant Match AI Engine

## 1. Interactive Image Upload Wizard

The AI matching dashboard (`/match`) uses a step-by-step wizard to guide users through the plant matching process.

### 1.1 Image Upload Interface
*   **Drag-and-Drop Area:** A glass panel with a dashed border. Dragging a file over the area shifts the border color to forest emerald and triggers a floating leaf animation.
*   **Validation Rules:**
    *   *Supported Formats:* `.jpg`, `.jpeg`, `.png`, `.webp`.
    *   *File Size Limit:* Max 5MB.
    *   *Validation Checks:* If file is invalid, a red warning dialog shakes to alert the user.
*   **Image Preview:** Once uploaded, the image fits inside a glass frame with a "Clear Photo" trash icon positioned in the top right.

```
  +-----------------------------------------------------+
  |             [Drag & Drop Image Here]                |
  |                                                     |
  |                (🌿 Upload Icon)                     |
  |             Supports JPEG, PNG up to 5MB            |
  |                                                     |
  |             [ Choose Room Photo ]                   |
  +-----------------------------------------------------+
```

---

## 2. Processing & Analysis State

Clicking **"Analyze My Space"** locks the UI and starts the vision analysis flow.

### 2.1 Analysis Indicators
*   A loader screen with progress indicators walks the user through the analysis steps:
    1.  *Uploading image to secure storage...* (Completed when stored in Supabase's `ai-uploads` bucket)
    2.  *Scanning room brightness and light angles...* (Running when calling backend API)
    3.  *Measuring available spatial floor bounds...* (Running when calling backend API)
    4.  *Matching results against live nursery catalog...* (Database query execution)
*   **Visual Style:** Subtly glowing loading skeletons (`animate-shimmer`) mimic a laser scanning horizontally across the uploaded photo container.

---

## 3. Vision API Integration & Matching Logic

The Express backend processes uploads at `POST /api/ai/match`, calling the Vision API and matching the parsed results with products in the database.

### 3.1 Prompt Contract
The backend sends the image link to the Google Gemini Vision / OpenAI GPT-4o-mini API along with this system prompt to enforce structured JSON responses:

```
[SYSTEM PROMPT]
You are the Green Nest AI Bot. Analyze the uploaded photo of the user's living room or garden space.
Categorize the environment exactly as specified below:
- detected_lighting: Choose ONLY from [low_light, indirect_light, bright_light]
- detected_space: Choose ONLY from [small, medium, spacious]
- detected_environment: Choose ONLY from [indoor, outdoor, balcony]

Provide a numeric confidence score (0.0 to 100.0) based on image clarity and detection certainty.
Describe your findings in a friendly reasoning string, and outline plant care parameters.

Output MUST be returned strictly as a JSON object matching this schema:
{
  "detected_lighting": "indirect_light",
  "detected_space": "medium",
  "detected_environment": "indoor",
  "confidence_score": 94.0,
  "reasoning": "We detected a bright indoor room with a window to the side, providing plenty of indirect light, ideal for tropical plants.",
  "recommended_criteria": {
    "watering_level": "moderate",
    "sunlight": "Bright indirect light",
    "suggested_placement": "Place within 4 feet of the detected window."
  }
}
```

### 3.2 SQL Database Matching Strategy
After parsing the JSON response, the backend queries the `products` table using the detected environmental parameters:

```sql
SELECT id, name, price, images, rating, difficulty_level 
FROM public.products 
WHERE 
  -- Match indoor/outdoor environment settings
  is_indoor = (CASE WHEN :detected_environment = 'indoor' THEN true ELSE false END)
  -- Match watering frequency based on watering level
  AND (
    (:watering_level = 'low' AND watering_frequency ILIKE '%low%' OR watering_frequency ILIKE '%2 weeks%') OR
    (:watering_level = 'moderate' AND watering_frequency ILIKE '%week%') OR
    (:watering_level = 'high' AND watering_frequency ILIKE '%frequent%' OR watering_frequency ILIKE '%days%')
  )
  -- Verify the product is currently in stock
  AND stock_quantity > 0 
ORDER BY rating DESC 
LIMIT 4;
```

---

## 4. AI Recommendation Dashboard UI

Once matching is complete, the results are displayed in a split-pane dashboard using glassmorphic panels.

### 4.1 Visual Components
*   **Analyzed Image Panel:** Displays the uploaded room photo with highlighted bounding boxes showing detected features like windows or floor space.
*   **Metrics Summary:**
    *   *Confidence Gauge:* A circular ring tracking the detection confidence score.
    *   *Environment Tags:* Glass badges detailing detected light levels and location type.
*   **Recommended Products:** A list of matching plant cards from the catalog. Clicking a card opens a "Quick View" modal, and clicking **"Add All Matches to Cart"** adds all recommended items to the cart simultaneously.

---

## 5. Recommendation History & Reports

*   **PDF Report Download:** A button to export the AI match results as a PDF document. The report includes the space photo, detected metrics, care guides, and recommended plants with QR codes linking to the store.
*   **History Log:** Authenticated users can view their past match runs on `/profile`. The history lists past match dates, space preview thumbnails, and a "Run Again" button to re-trigger recommendations.
