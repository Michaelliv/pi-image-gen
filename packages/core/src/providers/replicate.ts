import type { ImageOptions, ImageProvider, ImageResult } from "../types.js";

export const replicate: ImageProvider = {
  name: "replicate",
  envKeys: ["REPLICATE_API_TOKEN"],

  async generate(options: ImageOptions & { model?: string }): Promise<ImageResult[]> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) throw new Error("REPLICATE_API_TOKEN not set");

    const model = options.model ?? "black-forest-labs/flux-dev";

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

    const input: Record<string, unknown> = {
      prompt: options.prompt,
      width,
      height,
      num_outputs: options.n ?? 1,
    };

    // Use the official models endpoint: POST /v1/models/{owner}/{name}/predictions
    const createRes = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Prefer: "wait",
      },
      body: JSON.stringify({ input }),
    });

    if (!createRes.ok) throw new Error(`Replicate API error (${createRes.status}): ${await createRes.text()}`);

    let prediction = await createRes.json();

    // Poll for completion if not already done (Prefer: wait may have handled it)
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(prediction.urls.get, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!pollRes.ok) throw new Error(`Replicate poll error (${pollRes.status}): ${await pollRes.text()}`);
      prediction = await pollRes.json();
    }

    if (prediction.status === "failed") {
      throw new Error(`Replicate generation failed: ${prediction.error}`);
    }

    // Download output images
    const outputs: string[] = Array.isArray(prediction.output) ? prediction.output : [prediction.output];
    const results: ImageResult[] = [];
    for (const url of outputs) {
      if (typeof url !== "string") continue;
      const imgRes = await fetch(url);
      if (!imgRes.ok) continue;
      const buffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get("content-type") ?? "image/webp";
      results.push({
        base64: Buffer.from(buffer).toString("base64"),
        mimeType: contentType.split(";")[0],
      });
    }
    return results;
  },
};
