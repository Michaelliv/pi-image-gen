import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, openai } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  size: Type.Optional(
    Type.Union([Type.Literal("1024x1024"), Type.Literal("1024x1536"), Type.Literal("1536x1024")], {
      description: "Image dimensions (default: 1024x1024)",
    }),
  ),
  quality: Type.Optional(
    Type.Union([Type.Literal("low"), Type.Literal("medium"), Type.Literal("high")], {
      description: "Image quality (default: medium). Higher quality costs more.",
    }),
  ),
  model: Type.Optional(
    Type.Union([Type.Literal("gpt-image-1"), Type.Literal("gpt-image-1-mini"), Type.Literal("dall-e-3")], {
      description: "Model to use (default: gpt-image-1)",
    }),
  ),
  style: Type.Optional(
    Type.Union([Type.Literal("vivid"), Type.Literal("natural")], {
      description: "Style preset (DALL-E 3 only)",
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
      "Generate images using OpenAI (GPT Image / DALL-E). Best for text rendering, prompt adherence, and overall quality.",
    parameters: schema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await openai.generate({
        prompt: params.prompt,
        size: params.size,
        quality: params.quality,
        model: params.model,
        style: params.style,
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
        details: { provider: "openai", imageCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
