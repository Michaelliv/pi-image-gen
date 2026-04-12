import type { ImageOptions, ImageProvider, ImageResult } from "../types.js";

export const together: ImageProvider = {
  name: "together",
  envKeys: ["TOGETHER_API_KEY"],

  async generate(options: ImageOptions & { model?: string; steps?: number }): Promise<ImageResult[]> {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) throw new Error("TOGETHER_API_KEY not set");

    const model = options.model ?? "black-forest-labs/FLUX.1-schnell";

    // Parse size
    let width = 1024;
    let height = 1024;
    if (options.size) {
      const parts = options.size.split("x").map(Number);
      if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        width = parts[0];
        height = parts[1];
      }
    }

    const body: Record<string, unknown> = {
      model,
      prompt: options.prompt,
      width,
      height,
      steps: options.steps ?? 4,
      n: options.n ?? 1,
      response_format: "base64",
    };

    const res = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Together API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.data ?? []).map((d: { b64_json: string }) => ({
      base64: d.b64_json,
      mimeType: "image/png",
    }));
  },
};
