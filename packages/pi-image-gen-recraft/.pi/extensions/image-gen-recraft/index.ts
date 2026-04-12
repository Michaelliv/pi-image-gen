import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, recraft } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  size: Type.Optional(
    Type.String({ description: "Image dimensions as WxH (default: 1024x1024). E.g. 1280x1024, 1024x1280" }),
  ),
  style: Type.Optional(
    Type.Union(
      [
        Type.Literal("Photorealism"),
        Type.Literal("Illustration"),
        Type.Literal("Vector art"),
        Type.Literal("Hand-drawn"),
        Type.Literal("Icon"),
        Type.Literal("Recraft V3 Raw"),
      ],
      { description: "Image style (default: none, model decides)" },
    ),
  ),
  model: Type.Optional(
    Type.Union(
      [
        Type.Literal("recraftv4"),
        Type.Literal("recraftv4_pro"),
        Type.Literal("recraftv4_vector"),
        Type.Literal("recraftv4_pro_vector"),
        Type.Literal("recraftv3"),
        Type.Literal("recraftv3_vector"),
      ],
      { description: "Model version (default: recraftv3). V4 models do not support styles." },
    ),
  ),
  n: Type.Optional(Type.Number({ description: "Number of images to generate (default 1, max 6)" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "image_gen",
    label: "Image Generation",
    description:
      "Generate images using Recraft. Best for design work: vector graphics, brand-consistent assets, typography, and illustrations. Supports raster and SVG vector output.",
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
