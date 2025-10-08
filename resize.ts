import sharp from "sharp";
import type { ResizeParams } from "./types.ts";

export async function resizeImage(params: ResizeParams): Promise<Uint8Array> {
  const { url, width, height, quality = 80, format = 'jpeg' } = params;

  // Fetch original image
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const imageBuffer = new Uint8Array(await response.arrayBuffer());
  
  // Process with Sharp
  let image = sharp(imageBuffer);
  
  // Resize if dimensions provided
  if (width || height) {
    image = image.resize({
      width: width || undefined,
      height: height || undefined,
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  // Set output format and quality
  const outputOptions: any = {};
  if (format === 'jpeg') outputOptions.quality = quality;
  if (format === 'webp') outputOptions.quality = quality;
  if (format === 'avif') outputOptions.quality = quality;
  
  return await image[format](outputOptions).toBuffer();
                         }
