// Image Service for resize.imgview.deno.net
console.log("🚀 Image Service for resize.imgview.deno.net Starting...");

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
  if (path === '/health') {
    return Response.json({
      status: 'ok',
      service: 'Image Service',
      domain: 'resize.imgview.deno.net',
      timestamp: new Date().toISOString()
    }, { headers });
  }

  if (path === '/stats') {
    return Response.json({
      domain: 'resize.imgview.deno.net',
      message: 'Service is running'
    }, { headers });
  }

  // Main image endpoint - /view
  if (path === '/view') {
    return await handleImageView(url, headers);
  }

  // Root endpoint - redirect to view or show info
  if (path === '/') {
    return Response.json({
      service: 'Image View Service',
      domain: 'resize.imgview.deno.net',
      endpoints: {
        view: '/view - Show the chicken image',
        view_custom: '/view?url=IMAGE_URL - Show custom image',
        health: '/health - Health check'
      },
      example: 'https://resize.imgview.deno.net/view'
    }, { headers });
  }

  // Not found
  return Response.json({
    error: 'Endpoint not found',
    try: '/view to see the chicken image'
  }, { status: 404, headers });
});

// Image viewer - default ke gambar ayam kiryuu02
async function handleImageView(url: URL, baseHeaders: any): Promise<Response> {
  const imageUrl = url.searchParams.get('url');
  
  // Jika tidak ada URL parameter, gunakan gambar ayam dari kiryuu02
  const targetUrl = imageUrl || 'https://kiryuu02.com/wp-content/uploads/2021/04/niwatori-fighter-459997-HAsjbASi.jpg';
  
  console.log(`🔄 Fetching image: ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Deno-Image-Viewer/1.0)',
        'Referer': 'https://kiryuu02.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`✅ Success: ${imageData.byteLength} bytes, ${contentType}`);

    return new Response(imageData, {
      headers: {
        ...baseHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Image-Source': targetUrl,
        'X-Service-Domain': 'resize.imgview.deno.net'
      }
    });

  } catch (error) {
    console.error(`❌ Error fetching image: ${error.message}`);
    
    // Fallback - return error as JSON
    return Response.json({
      error: 'Failed to fetch image',
      url: targetUrl,
      message: error.message,
      domain: 'resize.imgview.deno.net'
    }, { 
      status: 500, 
      headers: baseHeaders 
    });
  }
}

console.log("✅ Image Service Ready!");
console.log("🌐 Domain: resize.imgview.deno.net");
console.log("📸 Endpoint: GET /view - Shows the chicken image");
console.log("🔧 Health: GET /health");
