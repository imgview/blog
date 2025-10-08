export interface ResizeParams {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

export interface ErrorResponse {
  error: string;
  message: string;
}
