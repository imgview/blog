import type { ResizeParams } from "./types.ts";

export async function resizeImage(params: ResizeParams): Promise<Uint8Array> {
  const { url, width, height } = params;
  
  console.log(`Proxying image: ${url}`);
  
  // Simple fetch and return - no processing
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  
  const buffer = await response.arrayBuffer();
  console.log(`Image proxied successfully: ${buffer.length} bytes`);
  
  return new Uint8Array(buffer);
}
