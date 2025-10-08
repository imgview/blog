import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { resizeImage } from "./resize.ts";
import type { ResizeParams, ErrorResponse } from "./types.ts";

serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  
  // Health check endpoint
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Only allow GET requests for image resize
  if (req.method !== 'GET') {
    return jsonError('Method not allowed', 405);
  }
  
  // Main image resize endpoint
  if (url.pathname === '/resize' || url.pathname === '/') {
    return await handleImageResize(url);
  }
  
  return jsonError('Not found', 404);
});

async function handleImageResize(url: URL): Promise<Response> {
  try {
    // Extract parameters from URL
    const imageUrl = url.searchParams.get('url');
    const width = parseInt(url.searchParams.get('width') || '0');
    const height = parseInt(url.searchParams.get('height') || '0');
    const quality = parseInt(url.searchParams.get('quality') || '80');
    const format = url.searchParams.get('format') as 'jpeg' | 'png' | 'webp' | 'avif' || 'jpeg';
    
    // Validate required parameters
    if (!imageUrl) {
      return jsonError('Missing required parameter: url', 400);
    }
    
    // Validate URL
    try {
      new URL(imageUrl);
    } catch {
      return jsonError('Invalid URL parameter', 400);
    }
    
    // Validate dimensions
    if (width < 0 || height < 0) {
      return jsonError('Width and height must be positive numbers', 400);
    }
    
    if (quality < 1 || quality > 100) {
      return jsonError('Quality must be between 1 and 100', 400);
    }
    
    // Validate format
    const allowedFormats = ['jpeg', 'png', 'webp', 'avif'];
    if (!allowedFormats.includes(format)) {
      return jsonError(`Format must be one of: ${allowedFormats.join(', ')}`, 400);
    }
    
    // Process image
    const params: ResizeParams = {
      url: imageUrl,
      width: width || undefined,
      height: height || undefined,
      quality,
      format
    };
    
    const resizedImage = await resizeImage(params);
    
    // Set appropriate content type
    const contentType = getContentType(format);
    
    return new Response(resizedImage, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error processing image:', error);
    return jsonError('Failed to process image', 500);
  }
}

function getContentType(format: string): string {
  const types: { [key: string]: string } = {
    jpeg: 'image/jpeg',
    png: 'image/png', 
    webp: 'image/webp',
    avif: 'image/avif'
  };
  return types[format] || 'image/jpeg';
}

function jsonError(message: string, status: number = 500): Response {
  const error: ErrorResponse = {
    error: `${status} ${message}`,
    message
  };
  
  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
    }
