// Fixed Image Proxy Service
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
      timestamp: new Date().toISOString()
    }, { headers });
  }

  // Main image proxy endpoint
  if (path === '/' || path === '/view') {
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      // Show HTML page dengan form untuk test
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Image Proxy Service</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                input { width: 70%; padding: 10px; margin: 10px 0; }
                button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
                .example { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                img { max-width: 100%; margin-top: 20px; border: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <h1>🖼️ Image Proxy Service</h1>
            <p>Masukkan URL gambar:</p>
            <form onsubmit="event.preventDefault(); viewImage()">
                <input type="url" id="imageUrl" placeholder="https://example.com/image.jpg" value="https://picsum.photos/400/300">
                <button type="submit">Lihat Gambar</button>
            </form>
            
            <div class="example">
                <strong>Contoh URL:</strong><br>
                • <a href="#" onclick="setUrl('https://picsum.photos/400/300')">Random Image</a><br>
                • <a href="#" onclick="setUrl('https://via.placeholder.com/400x300/0088ff/ffffff')">Placeholder Blue</a><br>
                • <a href="#" onclick="setUrl('https://images.unsplash.com/photo-1615751072497-5f5169febe17')">Unsplash</a>
            </div>
            
            <div id="result"></div>
            
            <script>
                function setUrl(url) {
                    document.getElementById('imageUrl').value = url;
                }
                
                function viewImage() {
                    const url = document.getElementById('imageUrl').value;
                    const resultDiv = document.getElementById('result');
                    
                    if (!url) {
                        resultDiv.innerHTML = '<p style="color: red;">Masukkan URL gambar</p>';
                        return;
                    }
                    
                    // Direct image display
                    resultDiv.innerHTML = '<p>Loading...</p>';
                    const img = new Image();
                    img.onload = function() {
                        resultDiv.innerHTML = '<p>✅ Gambar berhasil dimuat:</p>';
                        resultDiv.appendChild(img);
                    };
                    img.onerror = function() {
                        resultDiv.innerHTML = '<p style="color: red;">❌ Gagal memuat gambar. Coba URL lain.</p>';
                    };
                    img.src = '/?url=' + encodeURIComponent(url);
                }
            </script>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          ...headers 
        }
      });
    }

    return await fetchAndProxyImage(imageUrl, headers);
  }

  // Not found
  return Response.json({
    error: 'Endpoint tidak ditemukan',
    available: ['/', '/view', '/health']
  }, { status: 404, headers });
});

// Fungsi untuk fetch dan proxy gambar
async function fetchAndProxyImage(imageUrl: string, baseHeaders: any): Promise<Response> {
  console.log(`📸 Fetching: ${imageUrl}`);
  
  try {
    // Validasi URL
    const parsedUrl = new URL(imageUrl);
    
    // Block potentially dangerous URLs
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('Hanya HTTPS yang didukung');
    }

    // Fetch gambar dengan timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 detik timeout
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    
    // Check if it's an image
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Content-type bukan gambar: ${contentType}`);
    }

    const imageData = await response.arrayBuffer();
    
    console.log(`✅ Success: ${imageData.byteLength} bytes, ${contentType}`);

    // Return sebagai image
    return new Response(imageData, {
      status: 200, // Pastikan status 200
      headers: {
        ...baseHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': imageData.byteLength.toString()
      }
    });

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    // Return error image sebagai fallback
    const errorSvg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="16" fill="#6c757d">❌ Gagal memuat gambar</text>
        <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">${error.message}</text>
        <text x="50%" y="75%" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">${imageUrl}</text>
      </svg>
    `;
    
    return new Response(errorSvg, {
      status: 200, // Tetap return 200 untuk SVG error
      headers: {
        ...baseHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

console.log("✅ Service Ready!");
console.log("🌐 Domain: resize.imgview.deno.net");
console.log("📖 Usage: /?url=GAMBAR_URL");
