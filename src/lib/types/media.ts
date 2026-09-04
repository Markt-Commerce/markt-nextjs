export interface MediaVariant {
  id: number;
  variant_type: string;
  url?: string;
  width?: number;
  height?: number;
  file_size?: number;
}

export interface Media {
  id: number;
  media_type: 'image' | 'video' | 'document' | 'audio';
  original_url?: string;
  thumbnail_url?: string;
  variants?: MediaVariant[];
  alt_text?: string;
  original_filename?: string;
  file_size?: number;
  processing_status?: string;
  user_id?: string;
}

export interface MediaList {
  media: Media[];
  page: number;
  per_page: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface MediaStats {
  total_media: number;
  total_images: number;
  total_videos: number;
  total_size: number;
  variants_generated: number;
  average_file_size: number;
  processing_time_avg: number;
}

export interface MediaUploadResponse {
  success?: boolean;
  message?: string;
  media: Media;
}
