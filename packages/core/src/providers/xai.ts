import type { ImageOptions, ImageProvider, ImageResult } from "../types.js";

export const xai: ImageProvider = {
  name: "xai",
  envKeys: ["XAI_API_KEY"],

  async generate(options: ImageOptions & { aspectRatio?: string }): Promise<ImageResult[]> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("XAI_API_KEY not set");

    const body: Record<string, unknown> = {
      model: "grok-imagine-image",
      prompt: options.prompt,
      n: options.n ?? 1,
      response_format: "b64_json",
    };
    // xAI uses aspect_ratio instead of size
    if (options.aspectRatio) body.aspect_ratio = options.aspectRatio;

    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`xAI API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.data ?? []).map((d: { b64_json: string; revised_prompt?: string }) => ({
      base64: d.b64_json,
      mimeType: "image/jpeg",
      revisedPrompt: d.revised_prompt,
    }));
  },
};
