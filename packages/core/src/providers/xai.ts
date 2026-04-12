import type { ImageOptions, ImageProvider, ImageResult } from "../types.js";

export const xai: ImageProvider = {
  name: "xai",
  envKeys: ["XAI_API_KEY"],

  async generate(options: ImageOptions & { model?: string }): Promise<ImageResult[]> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("XAI_API_KEY not set");

    const model = options.model ?? "grok-2-image";
    const body: Record<string, unknown> = {
      model,
      prompt: options.prompt,
      n: options.n ?? 1,
      size: options.size ?? "1024x1024",
      response_format: "b64_json",
    };

    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`xAI API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.data ?? []).map((d: { b64_json: string; revised_prompt?: string }) => ({
      base64: d.b64_json,
      mimeType: "image/png",
      revisedPrompt: d.revised_prompt,
    }));
  },
};
