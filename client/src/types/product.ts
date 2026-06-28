export interface IProduct {
  id: string;
  name: string;
  scientific_name?: string;
  description: string;
  price: number;
  discount_percentage: number;
  stock_quantity: number;
  category: string;
  is_indoor: boolean;
  difficulty_level: 'beginner' | 'intermediate' | 'expert';
  watering_frequency: string;
  sunlight_requirement: string;
  benefits: string[];
  images: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  created_at: string;
}

export interface IReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}
