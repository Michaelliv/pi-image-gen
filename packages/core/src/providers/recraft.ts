import type { ImageOptions, ImageProvider, ImageResult } from "../types.js";

export const recraft: ImageProvider = {
  name: "recraft",
  envKeys: ["RECRAFT_API_KEY"],

  async generate(options: ImageOptions & { model?: string; styleId?: string }): Promise<ImageResult[]> {
    const apiKey = process.env.RECRAFT_API_KEY;
    if (!apiKey) throw new Error("RECRAFT_API_KEY not set");

    const body: Record<string, unknown> = {
      prompt: options.prompt,
      model: options.model ?? "recraftv3",
      response_format: "b64_json",
      n: options.n ?? 1,
    };
    if (options.size) body.size = options.size;
    // Recraft uses style names like "Photorealism", "Illustration", "Vector art", "Hand-drawn"
    // Styles are only supported on V2/V3 models, not V4
    if (options.style) body.style = options.style;
    if (options.styleId) body.style_id = options.styleId;

    const res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Recraft API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.data ?? []).map((d: { b64_json: string }) => ({
      base64: d.b64_json,
      mimeType: "image/png",
    }));
  },
};
