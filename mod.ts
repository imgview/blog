import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { resizeImage } from "./resize.ts";
import type { ResizeParams, ErrorResponse } from "./types.ts";

console.log("Image Resize Service started with ImageMagick WASM");

serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Health check endpoint
  if (url.pathname === '/health') {
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        service: 'Image Resize',
        timestamp: new Date().toISOString() 
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
  
  // Only allow GET requests for image resize
  if (req.method !== 'GET') {
    return jsonError('Method not allowed. Use GET requests only.', 405, corsHeaders);
  }
  
  // Main image resize endpoint
  if (url.pathname === '/resize' || url.pathname === '/') {
    return await handleImageResize(url, corsHeaders);
  }
  
  return jsonError('Endpoint not found. Use /resize or / with parameters.', 404, corsHeaders);
});

async function handleImageResize(url: URL, corsHeaders: any): Promise<Response> {
  try {
    // Extract parameters from URL
    const imageUrl = url.searchParams.get('url');
    const width = parseInt(url.searchParams.get('width') || '0');
    const height = parseInt(url.searchParams.get('height') || '0');
    const quality = parseInt(url.searchParams.get('quality') || '80');
    const format = (url.searchParams.get('format') as 'jpeg' | 'png' | 'webp') || 'jpeg';
    
    // Validate required parameters
    if (!imageUrl) {
      return jsonError('Missing required parameter: url', 400, corsHeaders);
    }
    
    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return jsonError('Invalid URL parameter. Provide a valid image URL.', 400, corsHeaders);
    }
    
    // Validate dimensions
    if (!width && !height) {
      return jsonError('Either width or height parameter is required', 400, corsHeaders);
    }
    
    if ((width && width <= 0) || (height && height <= 0)) {
      return jsonError('Width and height must be positive numbers', 400, corsHeaders);
    }
    
    if (width > 4000 || height > 4000) {
      return jsonError('Maximum dimension size is 4000px', 400, corsHeaders);
    }
    
    // Validate quality
    if (quality < 1 || quality > 100) {
      return jsonError('Quality must be between 1 and 100', 400, corsHeaders);
    }
    
    // Validate format
    const allowedFormats = ['jpeg', 'png', 'webp'];
    if (!allowedFormats.includes(format)) {
      return jsonError(`Format must be one of: ${allowedFormats.join(', ')}`, 400, corsHeaders);
    }
    
    console.log(`Processing image: ${imageUrl}, ${width}x${height}, ${format}`);
    
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
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Error processing image:', error);
    return jsonError(`Failed to process image: ${error.message}`, 500, corsHeaders);
  }
}

function getContentType(format: string): string {
  const types: { [key: string]: string } = {
    jpeg: 'image/jpeg',
    png: 'image/png', 
    webp: 'image/webp'
  };
  return types[format] || 'image/jpeg';
}

function jsonError(message: string, status: number = 500, corsHeaders: any = {}): Response {
  const error: ErrorResponse = {
    error: `${status}`,
    message
  };
  
  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
