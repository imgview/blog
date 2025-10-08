// Gunakan URL langsung tanpa import map
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry
} from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

import type { ResizeParams } from "./types.ts";

// Initialize ImageMagick
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeImageMagick();
    initialized = true;
    console.log("ImageMagick initialized");
  }
}

export async function resizeImage(params: ResizeParams): Promise<Uint8Array> {
  await ensureInitialized();

  const { url, width, height, format = 'jpeg' } = params;

  // Validate
  if (!width && !height) {
    throw new Error('Either width or height is required');
  }

  // Fetch image
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const imageBuffer = new Uint8Array(await response.arrayBuffer());

  return await new Promise<Uint8Array>((resolve, reject) => {
    try {
      ImageMagick.read(imageBuffer, (img) => {
        try {
          // Calculate dimensions
          let targetWidth = width || img.width;
          let targetHeight = height || img.height;

          if (width && !height) {
            targetHeight = Math.round((width / img.width) * img.height);
          } else if (height && !width) {
            targetWidth = Math.round((height / img.height) * img.width);
          }

          // Resize
          img.resize(new MagickGeometry(targetWidth, targetHeight));

          // Set format
          const outputFormat = getMagickFormat(format);
          
          img.write(outputFormat, (data) => {
            resolve(data);
          });
        } catch (error) {
          reject(new Error(`Processing failed: ${error.message}`));
        }
      });
    } catch (error) {
      reject(new Error(`Read failed: ${error.message}`));
    }
  });
}

function getMagickFormat(format: string): MagickFormat {
  switch (format) {
    case 'jpeg':
      return MagickFormat.Jpeg;
    case 'png':
      return MagickFormat.Png;
    case 'webp':
      return MagickFormat.WebP;
    default:
      return MagickFormat.Jpeg;
  }
                       }
