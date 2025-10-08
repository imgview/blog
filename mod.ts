// Enhanced Image Proxy Service with Complete Headers
console.log("🚀 Enhanced Image Proxy Service Started");

// Reliable image sources
const IMAGE_SOURCES = {
  picsum: (width = 400, height = 300) => `https://picsum.photos/${width}/${height}`,
  picsumId: (id = 1, width = 400, height = 300) => `https://picsum.photos/id/${id}/${width}/${height}`,
  placeholder: (width = 400, height = 300, bg = '0088ff', text = 'ffffff') => 
    `https://via.placeholder.com/${width}x${height}/${bg}/${text}.png`,
  dummyimage: (width = 400, height = 300, bg = '007acc', text = 'ffffff') =>
    `https://dummyimage.com/${width}x${height}/${bg}/${text}.png`,
  placekitten: (width = 400, height = 300) => `https://placekitten.com/${width}/${height}`,
  placedog: (width = 400, height = 300) => `https://place.dog/${width}/${height}`,
  placebear: (width = 400, height = 300) => `https://placebear.com/${width}/${height}`,
  unsplash: (width = 400, height = 300) => `https://source.unsplash.com/random/${width}x${height}`,
  unsplashCategory: (category = 'nature', width = 400, height = 300) => 
    `https://source.unsplash.com/featured/${width}x${height}/?${category}`
};

// Complete headers untuk bypass hotlink protection
const getFetchHeaders = (sourceUrl: string) => {
  const url = new URL(sourceUrl);
  const domain = url.hostname;
  
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'image',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site',
    'Pragma': 'no-cache',
    'Referer': 'https://www.google.com/',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Upgrade-Insecure-Requests': '1',
    
    // Domain-specific headers
    ...(domain.includes('kiryuu02.com') && {
      'Referer': 'https://kiryuu02.com/',
      'Origin': 'https://kiryuu02.com'
    }),
    ...(domain.includes('unsplash.com') && {
      'Referer': 'https://unsplash.com/',
      'Origin': 'https://unsplash.com'
    }),
    ...(domain.includes('picsum.photos') && {
      'Referer': 'https://picsum.photos/',
      'Origin': 'https://picsum.photos'
    })
  };
};

// Response headers untuk client
const getResponseHeaders = (contentType: string, contentLength: number) => ({
  'Content-Type': contentType,
  'Content-Length': contentLength.toString(),
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Accept-Encoding',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'",
  'X-Powered-By': 'Deno Deploy',
  'X-Image-Proxy': 'resize.imgview.deno.net'
});

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin, Referer, User-Agent',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Health check
  if (path === '/health') {
    return Response.json({
      status: 'ok',
      service: 'Enhanced Image Proxy',
      features: ['Complete headers', 'Hotlink bypass', 'Multiple sources'],
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }

  // Image sources list
  if (path === '/sources') {
    const sources = Object.keys(IMAGE_SOURCES).map(key => ({
      name: key,
      example: IMAGE_SOURCES[key](400, 300),
      usage: `/${key}/${width}/${height}`
    }));
    
    return Response.json({
      available_sources: sources,
      custom_url: 'GET /?url=YOUR_IMAGE_URL'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }

  // Predefined image sources
  if (path.startsWith('/picsum/') || path.startsWith('/placeholder/') || 
      path.startsWith('/unsplash/') || path.startsWith('/placekitten/') ||
      path.startsWith('/placedog/') || path.startsWith('/placebear/') ||
      path.startsWith('/dummyimage/')) {
    
    const parts = path.split('/');
    const source = parts[1];
    const width = parseInt(parts[2]) || 400;
    const height = parseInt(parts[3]) || 300;
    
    let imageUrl: string;
    
    switch (source) {
      case 'picsum':
        imageUrl = IMAGE_SOURCES.picsum(width, height);
        break;
      case 'placeholder':
        imageUrl = IMAGE_SOURCES.placeholder(width, height);
        break;
      case 'unsplash':
        imageUrl = IMAGE_SOURCES.unsplash(width, height);
        break;
      case 'placekitten':
        imageUrl = IMAGE_SOURCES.placekitten(width, height);
        break;
      case 'placedog':
        imageUrl = IMAGE_SOURCES.placedog(width, height);
        break;
      case 'placebear':
        imageUrl = IMAGE_SOURCES.placebear(width, height);
        break;
      case 'dummyimage':
        imageUrl = IMAGE_SOURCES.dummyimage(width, height);
        break;
      default:
        return Response.json({ error: 'Unknown source' }, { status: 400 });
    }
    
    return await fetchAndProxyImage(imageUrl);
  }

  // Main image proxy endpoint
  if (path === '/' || path === '/view') {
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      // Show HTML interface
      return new Response(generateHTML(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return await fetchAndProxyImage(imageUrl);
  }

  // Not found
  return Response.json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET / - Image proxy interface',
      'GET /?url=IMAGE_URL - Custom image',
      'GET /picsum/400/300 - Picsum random',
      'GET /placeholder/400/300 - Placeholder',
      'GET /unsplash/400/300 - Unsplash random',
      'GET /placekitten/400/300 - Kittens',
      'GET /health - Health check',
      'GET /sources - Available sources'
    ]
  }, {
    status: 404,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
});

// Fungsi utama untuk fetch dan proxy image
async function fetchAndProxyImage(imageUrl: string): Promise<Response> {
  console.log(`📸 Fetching: ${imageUrl}`);
  
  try {
    // Validasi URL
    const parsedUrl = new URL(imageUrl);
    
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('Only HTTPS URLs are supported');
    }

    // Fetch dengan complete headers dan timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: getFetchHeaders(imageUrl)
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageData = await response.arrayBuffer();
    
    console.log(`✅ Success: ${imageData.byteLength} bytes, ${contentType}`);

    // Return image dengan complete headers
    return new Response(imageData, {
      status: 200,
      headers: getResponseHeaders(contentType, imageData.byteLength)
    });

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    // Return error sebagai JSON
    return Response.json({
      error: 'Failed to fetch image',
      message: error.message,
      url: imageUrl,
      timestamp: new Date().toISOString()
    }, {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// HTML interface
function generateHTML(): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>🖼️ Enhanced Image Proxy</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f8f9fa;
            color: #333;
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .container { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
        }
        @media (max-width: 768px) {
            .container { grid-template-columns: 1fr; }
        }
        .panel { 
            background: white; 
            padding: 20px; 
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        input, button, select { 
            width: 100%; 
            padding: 12px; 
            margin: 8px 0; 
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
        }
        button { 
            background: #007acc; 
            color: white; 
            border: none; 
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s;
        }
        button:hover { background: #005a9e; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .source-btn { 
            background: #28a745; 
            margin: 5px 0;
            padding: 10px;
        }
        .source-btn:hover { background: #218838; }
        .example { 
            background: #e9ecef; 
            padding: 12px; 
            margin: 10px 0; 
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
        }
        .example:hover { background: #dee2e6; }
        #result { margin-top: 20px; text-align: center; }
        #imageResult { 
            max-width: 100%; 
            max-height: 400px; 
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            margin: 10px 0;
        }
        .loading { color: #007acc; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 6px; }
        .success { color: #155724; background: #d4edda; padding: 10px; border-radius: 6px; }
        h1 { color: #007acc; margin-bottom: 10px; }
        h2 { margin: 20px 0 10px 0; color: #495057; }
        .url-display { 
            background: #f1f3f4; 
            padding: 10px; 
            border-radius: 6px; 
            font-family: monospace; 
            font-size: 14px;
            word-break: break-all;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🖼️ Enhanced Image Proxy</h1>
        <p>Proxy service dengan complete headers untuk bypass hotlink protection</p>
    </div>

    <div class="container">
        <div class="panel">
            <h2>📤 Custom Image URL</h2>
            <input type="url" id="customUrl" placeholder="https://example.com/image.jpg" 
                   value="https://picsum.photos/800/600">
            <button onclick="loadCustomImage()">Load Custom Image</button>
            
            <h2>⚡ Quick Sources</h2>
            <button class="source-btn" onclick="loadSource('picsum', 800, 600)">Picsum Random</button>
            <button class="source-btn" onclick="loadSource('unsplash', 800, 600)">Unsplash Random</button>
            <button class="source-btn" onclick="loadSource('placekitten', 800, 600)">PlaceKitten</button>
            <button class="source-btn" onclick="loadSource('placeholder', 800, 600)">Placeholder</button>
            
            <h2>🔧 Advanced Options</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <input type="number" id="width" placeholder="Width" value="800">
                <input type="number" id="height" placeholder="Height" value="600">
            </div>
            <select id="sourceType">
                <option value="picsum">Picsum Photos</option>
                <option value="unsplash">Unsplash Random</option>
                <option value="placekitten">PlaceKitten</option>
                <option value="placedog">PlaceDog</option>
                <option value="placebear">PlaceBear</option>
                <option value="placeholder">Placeholder</option>
                <option value="dummyimage">DummyImage</option>
            </select>
            <button onclick="loadAdvanced()">Load with Options</button>
        </div>

        <div class="panel">
            <h2>👁️ Preview</h2>
            <div id="result">
                <p class="loading">Pilih image source atau masukkan URL custom</p>
            </div>
            
            <h2>📋 Generated URL</h2>
            <div class="url-display" id="generatedUrl">-</div>
            
            <button onclick="copyUrl()" style="background: #6c757d;">📋 Copy URL</button>
            
            <h2>💡 Examples</h2>
            <div class="example" onclick="setCustomUrl('https://picsum.photos/1200/800')">
                <strong>Picsum Large:</strong> https://picsum.photos/1200/800
            </div>
            <div class="example" onclick="setCustomUrl('https://source.unsplash.com/random/1000x600')">
                <strong>Unsplash Random:</strong> https://source.unsplash.com/random/1000x600
            </div>
            <div class="example" onclick="setCustomUrl('https://placekitten.com/1000/800')">
                <strong>Kittens:</strong> https://placekitten.com/1000/800
            </div>
        </div>
    </div>

    <script>
        function setCustomUrl(url) {
            document.getElementById('customUrl').value = url;
            loadCustomImage();
        }

        function loadCustomImage() {
            const url = document.getElementById('customUrl').value.trim();
            if (!url) return;
            
            displayImage('/?url=' + encodeURIComponent(url), 'Custom Image');
        }

        function loadSource(source, width, height) {
            displayImage('/' + source + '/' + width + '/' + height, source.charAt(0).toUpperCase() + source.slice(1));
        }

        function loadAdvanced() {
            const source = document.getElementById('sourceType').value;
            const width = document.getElementById('width').value || 800;
            const height = document.getElementById('height').value || 600;
            loadSource(source, width, height);
        }

        function displayImage(src, title) {
            const resultDiv = document.getElementById('result');
            const urlDisplay = document.getElementById('generatedUrl');
            
            // Update URL display
            const fullUrl = window.location.origin + src;
            urlDisplay.textContent = fullUrl;
            
            // Show loading
            resultDiv.innerHTML = '<p class="loading">🔄 Loading image...</p>';
            
            const img = new Image();
            img.onload = function() {
                resultDiv.innerHTML = \`
                    <p class="success">✅ \${title} loaded successfully</p>
                    <img id="imageResult" src="\${src}" alt="\${title}" onerror="imageError()">
                    <p>Dimensions: \${img.naturalWidth} × \${img.naturalHeight}px</p>
                \`;
            };
            
            img.onerror = function() {
                resultDiv.innerHTML = '<p class="error">❌ Failed to load image. Try another source.</p>';
            };
            
            img.src = src;
        }

        function imageError() {
            document.getElementById('imageResult').style.display = 'none';
        }

        function copyUrl() {
            const url = document.getElementById('generatedUrl').textContent;
            if (url && url !== '-') {
                navigator.clipboard.writeText(url).then(() => {
                    alert('URL copied to clipboard!');
                });
            }
        }

        // Load default image on page load
        window.addEventListener('load', () => {
            loadSource('picsum', 800, 600);
        });
    </script>
</body>
</html>`;
}

console.log("✅ Enhanced Image Proxy Ready!");
console.log("🌐 Domain: resize.imgview.deno.net");
console.log("📖 Endpoints:");
console.log("   GET /                     - HTML Interface");
console.log("   GET /?url=IMAGE_URL       - Custom image");
console.log("   GET /picsum/400/300       - Picsum random");
console.log("   GET /unsplash/400/300     - Unsplash random");
console.log("   GET /placekitten/400/300  - Kittens");
console.log("   GET /health               - Health check");
console.log("   GET /sources              - Available sources");
