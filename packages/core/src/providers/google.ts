import type { ImageOptions, ImageProvider, ImageResult } from "../types.js";

export const google: ImageProvider = {
  name: "google",
  envKeys: ["GOOGLE_API_KEY"],

  async generate(options: ImageOptions & { model?: string }): Promise<ImageResult[]> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

    const model = options.model ?? "gemini-2.5-flash-image";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: options.prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Google API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    const results: ImageResult[] = [];
    const candidates = data.candidates ?? [];
    for (const candidate of candidates) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData) {
          results.push({
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType ?? "image/png",
          });
        }
      }
    }
    return results;
  },
};
