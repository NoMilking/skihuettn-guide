export interface SkiArea {
  id: string;
  name: string;
  flag_emoji: string;
  map_image?: string;
  created_at: string;
}

export interface Restaurant {
  id: string;
  ski_area_id: string;
  name: string;
  x: number; // 0-1 (relative position on map)
  y: number; // 0-1 (relative position on map)
  created_at: string;
}

export interface Rating {
  id: string;
  restaurant_id: string;
  device_id: string;

  // Mandatory field
  self_service: -20 | -10 | 0;

  // Optional sliders (0-5, step 0.5)
  service: number;
  ski_haserl: number;
  food: number;
  sun_terrace: number;
  interior: number;
  apres_ski: number;

  // Bonus
  eggnog: boolean;

  // Additional
  comment?: string;

  created_at: string;
  updated_at: string;
}

export interface RestaurantStats {
  restaurant_id: string;
  name: string;
  ski_area_id: string;
  x: number;
  y: number;
  rating_count: number;
  avg_service: number;
  avg_ski_haserl: number;
  avg_food: number;
  avg_sun_terrace: number;
  avg_interior: number;
  avg_apres_ski: number;
  eggnog_percentage: number;
  avg_total_score: number;
  most_common_self_service: -20 | -10 | 0 | null;
}

export interface Photo {
  id: string;
  rating_id: string;
  storage_path: string;
  created_at: string;
  like_count?: number;
}

export interface CommentVote {
  rating_id: string;
  device_id: string;
  created_at: string;
}

export interface Favorite {
  device_id: string;
  ski_area_id: string;
  created_at: string;
}

// Helper type for creating new ratings (without id and timestamps)
export type CreateRatingInput = Omit<Rating, 'id' | 'created_at' | 'updated_at'>;

// Helper type for partial rating updates
export type UpdateRatingInput = Partial<Omit<Rating, 'id' | 'restaurant_id' | 'device_id' | 'created_at' | 'updated_at'>>;
