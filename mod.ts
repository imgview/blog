// Image Cache & Resize Service for resize.imgview.deno.dev
console.log("🚀 Image View Service Starting...");

// Simple cache
const imageCache = new Map<string, { 
  data: Uint8Array; 
  contentType: string; 
  timestamp: number;
  width: number;
  height: number;
}>();

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Clean cache every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      imageCache.delete(key);
    }
  }
}, 300000);

// Start server
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Route handlers
  const routes: Record<string, (url: URL) => Promise<Response>> = {
    '/': handleRoot,
    '/health': handleHealth,
    '/stats': handleStats,
    '/view': handleImageView,
    '/cache': handleImageCache,
    '/clear': handleClearCache,
  };

  const handler = routes[path] || handleNotFound;
  return await handler(url, headers);
});

// Main image viewing endpoint - untuk gambar dari kiryuu02.com
async function handleImageView(url: URL, baseHeaders: any): Promise<Response> {
  const imageUrl = url.searchParams.get('url');
  
  // Jika tidak ada URL parameter, gunakan gambar default dari kiryuu02
  const targetUrl = imageUrl || 'https://kiryuu02.com/wp-content/uploads/2021/04/niwatori-fighter-459997-HAsjbASi.jpg';
  
  try {
    new URL(targetUrl);
  } catch {
    return Response.json({
      error: 'Invalid URL format',
      usage: '/view?url=IMAGE_URL'
    }, { status: 400, headers: baseHeaders });
  }

  // Check cache
  const cacheKey = targetUrl;
  const cached = imageCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`✅ Cache HIT: ${targetUrl}`);
    return new Response(cached.data, {
      headers: {
        ...baseHeaders,
        'Content-Type': cached.contentType,
        'X-Cache': 'HIT',
        'X-Image-Dimensions': `${cached.width}x${cached.height}`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  console.log(`🔄 Fetching: ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageView-Bot/1.0)',
        'Referer': 'https://kiryuu02.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const imageData = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Simulate getting image dimensions (dalam real implementation bisa pakai library)
    const dimensions = await getImageDimensions(imageData, contentType);
    
    // Cache the image
    imageCache.set(cacheKey, {
      data: imageData,
      contentType,
      timestamp: Date.now(),
      width: dimensions.width,
      height: dimensions.height
    });

    console.log(`✅ Cached: ${targetUrl} (${dimensions.width}x${dimensions.height})`);

    return new Response(imageData, {
      headers: {
        ...baseHeaders,
        'Content-Type': contentType,
        'X-Cache': 'MISS',
        'X-Image-Dimensions': `${dimensions.width}x${dimensions.height}`,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return Response.json({
      error: 'Failed to fetch image',
      url: targetUrl,
      message: error.message
    }, { status: 500, headers: baseHeaders });
  }
}

// Simple image cache endpoint
async function handleImageCache(url: URL, baseHeaders: any): Promise<Response> {
  const imageUrl = url.searchParams.get('url');
  
  if (!imageUrl) {
    return Response.json({
      error: 'Missing url parameter',
      example: '/cache?url=https://example.com/image.jpg'
    }, { status: 400, headers: baseHeaders });
  }

  return await handleImageView(url, baseHeaders);
}

// Health check
async function handleHealth(url: URL, headers: any): Promise<Response> {
  return Response.json({
    status: 'ok',
    service: 'ImageView Service',
    domain: 'resize.imgview.deno.dev',
    cacheSize: imageCache.size,
    timestamp: new Date().toISOString()
  }, { headers });
}

// Cache statistics
async function handleStats(url: URL, headers: any): Promise<Response> {
  let totalSize = 0;
  imageCache.forEach(item => totalSize += item.data.length);
  
  return Response.json({
    cacheEntries: imageCache.size,
    totalCacheSize: Math.round(totalSize / 1024 / 1024) + ' MB',
    domain: 'resize.imgview.deno.dev'
  }, { headers });
}

// Clear cache
async function handleClearCache(url: URL, headers: any): Promise<Response> {
  const size = imageCache.size;
  imageCache.clear();
  
  return Response.json({
    message: 'Cache cleared successfully',
    clearedEntries: size,
    domain: 'resize.imgview.deno.dev'
  }, { headers });
}

// Root endpoint - show service info
async function handleRoot(url: URL, headers: any): Promise<Response> {
  return Response.json({
    service: 'ImageView Service',
    domain: 'resize.imgview.deno.dev',
    description: 'Image caching and viewing service',
    endpoints: {
      view: '/view?url=IMAGE_URL',
      cache: '/cache?url=IMAGE_URL', 
      health: '/health',
      stats: '/stats',
      clear: '/clear (POST)'
    },
    example: '/view?url=https://kiryuu02.com/wp-content/uploads/2021/04/niwatori-fighter-459997-HAsjbASi.jpg'
  }, { headers });
}

// Not found
async function handleNotFound(url: URL, headers: any): Promise<Response> {
  return Response.json({
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/view', '/cache', '/health', '/stats', '/clear']
  }, { status: 404, headers });
}

// Simple image dimension detection (basic implementation)
async function getImageDimensions(data: Uint8Array, contentType: string): Promise<{width: number, height: number}> {
  // Default dimensions
  const defaultDims = { width: 800, height: 600 };
  
  try {
    // Untuk JPEG/PNG sederhana, kita bisa detect dari header
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      // Basic JPEG dimension detection dari SOF marker
      for (let i = 0; i < Math.min(data.length - 9, 1000); i++) {
        if (data[i] === 0xFF && data[i + 1] === 0xC0) {
          return {
            height: (data[i + 5] << 8) | data[i + 6],
            width: (data[i + 7] << 8) | data[i + 8]
          };
        }
      }
    }
  } catch (error) {
    console.log('Could not detect image dimensions, using defaults');
  }
  
  return defaultDims;
}

console.log("✅ Image View Service Ready!");
console.log("🌐 Domain: resize.imgview.deno.dev");
console.log("📊 Endpoints:");
console.log("   GET /view?url=... - View image (default: kiryuu02 chicken image)");
console.log("   GET /cache?url=... - Cache image");
console.log("   GET /health - Health check");
console.log("   GET /stats - Cache statistics");
console.log("   POST /clear - Clear cache");
