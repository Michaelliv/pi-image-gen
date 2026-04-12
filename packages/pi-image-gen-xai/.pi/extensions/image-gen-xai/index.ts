import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, xai } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  size: Type.Optional(
    Type.Union([Type.Literal("1024x1024"), Type.Literal("1024x1536"), Type.Literal("1536x1024")], {
      description: "Image dimensions (default: 1024x1024)",
    }),
  ),
  n: Type.Optional(Type.Number({ description: "Number of images to generate (default 1, max 4)" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "image_gen",
    label: "Image Generation",
    description:
      "Generate images using xAI (Grok Imagine / Aurora). Strong photorealism, text rendering, and entity generation.",
    parameters: schema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await xai.generate({
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
        details: { provider: "xai", imageCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
