export interface ResizeParams {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ErrorResponse {
  error: string;
  message: string;
}
