import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { resizeImage } from "./resize_simple.ts";
import type { ResizeParams, ErrorResponse } from "./types.ts";

console.log("🚀 Image Proxy Service Started");

serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Health check - sangat sederhana
  if (url.pathname === '/health') {
    return new Response('OK', {
      headers: { 
        'Content-Type': 'text/plain',
        ...corsHeaders 
      }
    });
  }
  
  // Only GET for resize
  if (req.method !== 'GET') {
    return jsonError('Method not allowed', 405, corsHeaders);
  }
  
  // Resize endpoint
  if (url.pathname === '/resize' || url.pathname === '/') {
    return await handleResize(url, corsHeaders);
  }
  
  return jsonError('Not found. Use /resize?url=IMAGE_URL', 404, corsHeaders);
});

async function handleResize(url: URL, corsHeaders: any): Promise<Response> {
  try {
    // Get parameters
    const imageUrl = url.searchParams.get('url');
    const width = parseInt(url.searchParams.get('width') || '0');
    const height = parseInt(url.searchParams.get('height') || '0');

    // Validation sederhana
    if (!imageUrl) {
      return jsonError('Missing url parameter', 400, corsHeaders);
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return jsonError('Invalid URL', 400, corsHeaders);
    }

    console.log(`Processing request for: ${imageUrl}`);

    // Process image (simple proxy)
    const params: ResizeParams = {
      url: imageUrl,
      width: width || undefined,
      height: height || undefined,
    };

    const result = await resizeImage(params);
    
    // Return as image (detect content type from original)
    return new Response(result, {
      headers: {
        'Content-Type': 'image/jpeg', // Default, bisa detect nanti
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    return jsonError(`Proxy failed: ${error.message}`, 500, corsHeaders);
  }
}

function jsonError(message: string, status: number, corsHeaders: any): Response {
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
