export interface IAIMatchResponse {
  detected_lighting: 'low_light' | 'indirect_light' | 'bright_light';
  detected_space: 'small' | 'medium' | 'spacious';
  detected_environment: 'indoor' | 'outdoor' | 'balcony';
  confidence_score: number;
  reasoning: string;
  recommended_criteria: {
    watering_level: 'low' | 'moderate' | 'high';
    sunlight: string;
    suggested_placement: string;
  };
}

export interface IAILog {
  id: string;
  user_id: string;
  uploaded_image_url: string;
  detected_lighting: IAIMatchResponse['detected_lighting'];
  detected_space: IAIMatchResponse['detected_space'];
  detected_environment: IAIMatchResponse['detected_environment'];
  confidence_score: number;
  recommended_product_ids: string[];
  raw_ai_response: IAIMatchResponse;
  processing_time_ms: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}
