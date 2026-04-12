/** Generated image result across all providers. */
export interface ImageResult {
  /** Base64-encoded image data. */
  base64: string;
  /** MIME type (e.g. "image/png", "image/webp"). */
  mimeType: string;
  /** Revised/expanded prompt if the provider rewrote it. */
  revisedPrompt?: string;
}

/** Common image generation options. Providers may support a subset. */
export interface ImageOptions {
  prompt: string;
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
}

/** An image generation provider implementation. */
export interface ImageProvider {
  /** Provider identifier (e.g. "openai", "fal"). */
  name: string;
  /** Environment variable names required. All must be set to enable. */
  envKeys: string[];
  /** Generate image(s) and return results. */
  generate(options: ImageOptions & Record<string, unknown>): Promise<ImageResult[]>;
}

/** Format image results as markdown for the agent. */
export function formatResults(results: ImageResult[]): string {
  if (results.length === 0) return "No images generated.";

  return results
    .map((r, i) => {
      const parts: string[] = [`## Image ${i + 1}`];
      if (r.revisedPrompt) parts.push(`**Revised prompt:** ${r.revisedPrompt}`);
      parts.push(`\`${r.mimeType}\` · ${Math.round((r.base64.length * 0.75) / 1024)}KB`);
      return parts.join("\n");
    })
    .join("\n\n---\n\n");
}
