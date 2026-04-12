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
      n: options.n ?? 1,
    };
    if (options.size) body.size = options.size;
    // Recraft uses style names like "Photorealism", "Illustration", "Vector art"
    if (options.style) body.style = options.style;
    if (options.styleId) body.style_id = options.styleId;

    const res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Recraft API error (${res.status}): ${await res.text()}`);

    const data = await res.json();
    const results: ImageResult[] = [];
    for (const d of data.data ?? []) {
      if (d.b64_json) {
        results.push({ base64: d.b64_json, mimeType: "image/png" });
      } else if (d.url) {
        // Recraft returns URLs by default — download and convert to base64
        const imgRes = await fetch(d.url);
        if (!imgRes.ok) continue;
        const buffer = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") ?? "image/png";
        results.push({
          base64: Buffer.from(buffer).toString("base64"),
          mimeType: contentType.split(";")[0],
        });
      }
    }
    return results;
  },
};
