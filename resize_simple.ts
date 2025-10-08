import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import type { ResizeParams } from "./types.ts";

export async function resizeImage(params: ResizeParams): Promise<Uint8Array> {
  const { url, width, height, format = 'jpeg' } = params;

  // Fetch image
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const image = await Image.decode(arrayBuffer);

  // Calculate dimensions
  let targetWidth = width || image.width;
  let targetHeight = height || image.height;

  if (width && !height) {
    targetHeight = Math.round((width / image.width) * image.height);
  } else if (height && !width) {
    targetWidth = Math.round((height / image.height) * image.width);
  }

  // Resize
  const resized = image.resize(targetWidth, targetHeight);

  // Encode
  switch (format) {
    case 'jpeg':
      return resized.encodeJPEG(80);
    case 'png':
      return resized.encodePNG();
    case 'webp':
      return resized.encodeWEBP(80);
    default:
      return resized.encodeJPEG(80);
  }
}
