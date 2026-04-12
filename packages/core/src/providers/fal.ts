import type { ImageOptions, ImageProvider, ImageResult } from "../types.js";

export const fal: ImageProvider = {
  name: "fal",
  envKeys: ["FAL_KEY"],

  async generate(options: ImageOptions & { model?: string }): Promise<ImageResult[]> {
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) throw new Error("FAL_KEY not set");

    const model = options.model ?? "fal-ai/flux/dev";

    // Parse size into width/height
    let width = 1024;
    let height = 1024;
    if (options.size) {
      const parts = options.size.split("x").map(Number);
      if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        width = parts[0];
        height = parts[1];
      }
    }

    const input: Record<string, unknown> = {
      prompt: options.prompt,
      image_size: { width, height },
      num_images: options.n ?? 1,
    };

    // fal.subscribe pattern: POST to queue endpoint, poll for result
    const submitRes = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` },
      body: JSON.stringify(input),
    });

    if (!submitRes.ok) throw new Error(`fal API error (${submitRes.status}): ${await submitRes.text()}`);

    const submitData = await submitRes.json();
    const requestId = submitData.request_id;

    if (!requestId) {
      // Synchronous response — images already in the response
      return await extractFalImages(submitData);
    }

    // Poll for result
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(`https://queue.fal.run/${model}/requests/${requestId}/status`, {
        headers: { Authorization: `Key ${apiKey}` },
      });
      if (!statusRes.ok) continue;
      const status = await statusRes.json();

      if (status.status === "COMPLETED") {
        const resultRes = await fetch(`https://queue.fal.run/${model}/requests/${requestId}`, {
          headers: { Authorization: `Key ${apiKey}` },
        });
        if (!resultRes.ok) throw new Error(`fal result error (${resultRes.status}): ${await resultRes.text()}`);
        return await extractFalImages(await resultRes.json());
      }
      if (status.status === "FAILED") {
        throw new Error(`fal generation failed: ${JSON.stringify(status)}`);
      }
    }
    throw new Error("fal generation timed out");
  },
};

async function extractFalImages(data: Record<string, unknown>): Promise<ImageResult[]> {
  const images = (data.images as Array<{ url?: string }>) ?? [];
  const results: ImageResult[] = [];
  for (const img of images) {
    if (img.url) {
      const imgRes = await fetch(img.url);
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
}
