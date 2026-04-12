import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, xai } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  aspectRatio: Type.Optional(
    Type.Union(
      [
        Type.Literal("1:1"),
        Type.Literal("16:9"),
        Type.Literal("9:16"),
        Type.Literal("4:3"),
        Type.Literal("3:4"),
        Type.Literal("3:2"),
        Type.Literal("2:3"),
        Type.Literal("auto"),
      ],
      { description: "Aspect ratio (default: auto). 1:1 square, 16:9 widescreen, 9:16 portrait, etc." },
    ),
  ),
  n: Type.Optional(Type.Number({ description: "Number of images to generate (default 1, max 10)" })),
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
        aspectRatio: params.aspectRatio,
        n: Math.min(params.n ?? 1, 10),
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
