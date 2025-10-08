// Simple Image Proxy Service - Bebas pilih gambar
console.log("🚀 Image Proxy Service Started");

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

  // Health check
  if (path === '/health') {
    return Response.json({
      status: 'ok',
      service: 'Image Proxy',
      message: 'Service is running'
    }, { headers });
  }

  // Main image proxy endpoint - bebas pilih gambar
  if (path === '/') {
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      // Show usage info jika tidak ada parameter
      return Response.json({
        service: 'Image Proxy Service',
        usage: 'Tambahkan parameter ?url=GAMBAR_URL',
        examples: {
          contoh1: '/?url=https://example.com/image.jpg',
          contoh2: '/?url=https://picsum.photos/400/300',
          contoh3: '/?url=https://kiryuu02.com/wp-content/uploads/2021/04/niwatori-fighter-459997-HAsjbASi.jpg'
        },
        tips: 'Gunakan URL gambar langsung yang diawali dengan https://'
      }, { headers });
    }

    return await fetchAndProxyImage(imageUrl, headers);
  }

  // Not found
  return Response.json({
    error: 'Gunakan endpoint root dengan parameter url',
    example: '/?url=https://example.com/image.jpg'
  }, { status: 404, headers });
});

// Fungsi untuk fetch dan proxy gambar
async function fetchAndProxyImage(imageUrl: string, baseHeaders: any): Promise<Response> {
  console.log(`📸 Fetching: ${imageUrl}`);
  
  try {
    // Validasi URL
    new URL(imageUrl);
    
    // Fetch gambar
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Image-Proxy/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Get content type
    const contentType = response.headers.get('content-type');
    
    // Check if it's an image
    if (!contentType?.startsWith('image/')) {
      throw new Error('URL bukan gambar yang valid');
    }

    const imageData = await response.arrayBuffer();
    
    console.log(`✅ Success: ${imageData.byteLength} bytes, ${contentType}`);

    // Return sebagai image
    return new Response(imageData, {
      headers: {
        ...baseHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Proxy-Service': 'resize.imgview.deno.net'
      }
    });

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    return Response.json({
      error: 'Gagal memuat gambar',
      message: error.message,
      usage: 'Gunakan URL gambar yang valid seperti: https://example.com/image.jpg'
    }, { 
      status: 400, 
      headers: baseHeaders 
    });
  }
}

console.log("✅ Service Ready!");
console.log("🌐 Domain: resize.imgview.deno.net");
console.log("📖 Usage: /?url=GAMBAR_URL");
