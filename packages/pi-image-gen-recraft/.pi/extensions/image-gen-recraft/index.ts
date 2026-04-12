import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, recraft } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  size: Type.Optional(
    Type.Union([Type.Literal("1024x1024"), Type.Literal("1024x1536"), Type.Literal("1536x1024")], {
      description: "Image dimensions (default: 1024x1024)",
    }),
  ),
  style: Type.Optional(
    Type.Union(
      [
        Type.Literal("realistic_image"),
        Type.Literal("digital_illustration"),
        Type.Literal("vector_illustration"),
        Type.Literal("icon"),
      ],
      { description: "Image style (default: realistic_image)" },
    ),
  ),
  model: Type.Optional(
    Type.Union([Type.Literal("recraftv3"), Type.Literal("recraft20b")], {
      description: "Model version (default: recraftv3)",
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
      "Generate images using Recraft. Best for design work: vector graphics, brand-consistent assets, typography, and illustrations.",
    parameters: schema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await recraft.generate({
        prompt: params.prompt,
        size: params.size,
        style: params.style,
        model: params.model,
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
        details: { provider: "recraft", imageCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
