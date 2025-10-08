import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry
} from "imagemagick";
import type { ResizeParams } from "./types.ts";

// Initialize ImageMagick - ini penting!
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeImageMagick();
    initialized = true;
    console.log("ImageMagick initialized successfully");
  }
}

export async function resizeImage(params: ResizeParams): Promise<Uint8Array> {
  await ensureInitialized();

  const { url, width, height, quality = 80, format = 'jpeg' } = params;

  // Validate dimensions
  if (width && width <= 0) throw new Error('Width must be positive');
  if (height && height <= 0) throw new Error('Height must be positive');
  if (!width && !height) throw new Error('Either width or height is required');

  // Fetch original image
  console.log(`Fetching image from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const imageBuffer = new Uint8Array(await response.arrayBuffer());
  console.log(`Image fetched, size: ${imageBuffer.length} bytes`);

  // Process image with ImageMagick
  return await new Promise<Uint8Array>((resolve, reject) => {
    try {
      ImageMagick.read(imageBuffer, (img) => {
        try {
          console.log(`Original dimensions: ${img.width}x${img.height}`);
          
          // Calculate target dimensions maintaining aspect ratio
          let targetWidth = width || img.width;
          let targetHeight = height || img.height;

          if (width && !height) {
            // Calculate height based on aspect ratio
            targetHeight = Math.round((width / img.width) * img.height);
          } else if (height && !width) {
            // Calculate width based on aspect ratio  
            targetWidth = Math.round((height / img.height) * img.width);
          }

          console.log(`Resizing to: ${targetWidth}x${targetHeight}`);
          
          // Resize image
          img.resize(new MagickGeometry(targetWidth, targetHeight));

          // Set output format
          const outputFormat = getMagickFormat(format);
          
          console.log(`Encoding to format: ${format}`);
          
          // Convert to desired format
          img.write(outputFormat, (data) => {
            console.log(`Image processed successfully, output size: ${data.length} bytes`);
            resolve(data);
          });
        } catch (error) {
          reject(new Error(`Image processing failed: ${error.message}`));
        }
      });
    } catch (error) {
      reject(new Error(`Failed to read image: ${error.message}`));
    }
  });
}

function getMagickFormat(format: string): MagickFormat {
  switch (format) {
    case 'jpeg':
    case 'jpg':
      return MagickFormat.Jpeg;
    case 'png':
      return MagickFormat.Png;
    case 'webp':
      return MagickFormat.WebP;
    default:
      return MagickFormat.Jpeg;
  }
            }
