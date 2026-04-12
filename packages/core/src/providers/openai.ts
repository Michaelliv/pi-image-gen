import type { ImageOptions, ImageProvider, ImageResult } from "../types.js";

export const openai: ImageProvider = {
  name: "openai",
  envKeys: ["OPENAI_API_KEY"],

  async generate(options: ImageOptions & { model?: string }): Promise<ImageResult[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const model = options.model ?? "gpt-image-1";
    const body: Record<string, unknown> = {
      model,
      prompt: options.prompt,
      n: options.n ?? 1,
      size: options.size ?? "1024x1024",
    };
    // gpt-image-1 uses output_format, dall-e uses response_format
    if (model.startsWith("dall-e")) {
      body.response_format = "b64_json";
    } else {
      body.output_format = "png";
    }
    if (options.quality) body.quality = options.quality;
    if (options.style) body.style = options.style;

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`OpenAI API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    return (data.data ?? []).map((d: { b64_json: string; revised_prompt?: string }) => ({
      base64: d.b64_json,
      mimeType: "image/png",
      revisedPrompt: d.revised_prompt,
    }));
  },
};
