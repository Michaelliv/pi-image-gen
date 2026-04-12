import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, resolveProvider } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  size: Type.Optional(Type.String({ description: "Image dimensions as WxH (default: 1024x1024)" })),
  n: Type.Optional(Type.Number({ description: "Number of images to generate (default 1, max 4)" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  const provider = resolveProvider();

  if (!provider) {
    return;
  }

  pi.registerTool({
    name: "image_gen",
    label: "Image Generation",
    description: `Generate images (using ${provider.name}). Creates images from text descriptions.`,
    parameters: schema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await provider.generate({
        prompt: params.prompt,
        size: params.size,
        n: Math.min(params.n ?? 1, 4),
      });

      return {
        content: [
          { type: "text", text: formatResults(results) },
          ...results.map((r) => ({
            type: "image" as const,
            data: r.base64,
            mimeType: r.mimeType,
          })),
        ],
        details: { provider: provider.name, imageCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
