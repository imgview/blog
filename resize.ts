import sharp from "sharp";
import type { ResizeParams } from "./types.ts";

export async function resizeImage(params: ResizeParams): Promise<Uint8Array> {
  const { url, width, height, quality = 80, format = 'jpeg' } = params;

  // Fetch original image
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  
  // Initialize sharp with the image
  let processor = sharp(imageBuffer);
  
  // Resize if dimensions provided
  if (width || height) {
    processor = processor.resize(width, height, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }
  
  // Convert to desired format with quality
  switch (format) {
    case 'jpeg':
      processor = processor.jpeg({ quality });
      break;
    case 'png':
      processor = processor.png({ compressionLevel: 9 });
      break;
    case 'webp':
      processor = processor.webp({ quality });
      break;
    case 'avif':
      processor = processor.avif({ quality });
      break;
  }
  
  return await processor.toBuffer();
  }
