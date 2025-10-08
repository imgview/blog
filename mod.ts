// Simple Image Cache Service for Deno Deploy
console.log("🚀 Image Cache Service Starting...");

// Simple in-memory cache (akan reset pada cold start)
const imageCache = new Map<string, { data: Uint8Array; contentType: string; timestamp: number }>();

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000;

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      imageCache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
  }
}, 300000); // Clean every 5 minutes

// Start server
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Health check
  if (url.pathname === '/health') {
    return Response.json({
      status: 'ok',
      cacheSize: imageCache.size,
      timestamp: new Date().toISOString()
    }, { headers });
  }

  // Cache stats
  if (url.pathname === '/stats') {
    return Response.json({
      cacheEntries: imageCache.size,
      memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    }, { headers });
  }

  // Clear cache endpoint
  if (url.pathname === '/clear-cache' && req.method === 'POST') {
    const size = imageCache.size;
    imageCache.clear();
    return Response.json({
      message: `Cache cleared`,
      clearedEntries: size
    }, { headers });
  }

  // Main image cache endpoint
  if ((url.pathname === '/cache' || url.pathname === '/') && req.method === 'GET') {
    return await handleImageCache(url, headers);
  }

  // Default response
  return Response.json({
    service: 'Image Cache',
    endpoints: {
      health: '/health',
      stats: '/stats',
      cache: '/cache?url=IMAGE_URL',
      clear: 'POST /clear-cache'
    }
  }, { headers });
});

// Image cache handler
async function handleImageCache(url: URL, baseHeaders: any): Promise<Response> {
  const imageUrl = url.searchParams.get('url');
  
  if (!imageUrl) {
    return Response.json({
      error: 'Missing url parameter',
      example: '/cache?url=https://example.com/image.jpg'
    }, { status: 400, headers: baseHeaders });
  }

  try {
    // Validate URL
    new URL(imageUrl);
  } catch {
    return Response.json({
      error: 'Invalid URL format'
    }, { status: 400, headers: baseHeaders });
  }

  // Check cache first
  const cacheKey = imageUrl;
  const cached = imageCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`✅ Cache HIT: ${imageUrl}`);
    return new Response(cached.data, {
      headers: {
        ...baseHeaders,
        'Content-Type': cached.contentType,
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache-Age': Math.round((Date.now() - cached.timestamp) / 1000) + 's'
      }
    });
  }

  console.log(`❌ Cache MISS: ${imageUrl}`);
  
  try {
    // Fetch original image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Deno-Image-Cache/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get image data
    const imageData = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Cache the image
    imageCache.set(cacheKey, {
      data: imageData,
      contentType,
      timestamp: Date.now()
    });

    console.log(`✅ Cached: ${imageUrl} (${imageData.length} bytes)`);

    // Return response
    return new Response(imageData, {
      headers: {
        ...baseHeaders,
        'Content-Type': contentType,
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': imageData.length.toString()
      }
    });

  } catch (error) {
    console.error(`❌ Error fetching ${imageUrl}:`, error.message);
    
    return Response.json({
      error: 'Failed to fetch image',
      message: error.message
    }, { status: 500, headers: baseHeaders });
  }
}

console.log("✅ Image Cache Service Ready!");
console.log("📊 Endpoints:");
console.log("   GET /health - Health check");
console.log("   GET /stats - Cache statistics");
console.log("   GET /cache?url=IMAGE_URL - Cache image");
console.log("   POST /clear-cache - Clear cache");
