import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, together } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  model: Type.Optional(
    Type.String({
      description:
        "Together AI model (default: black-forest-labs/FLUX.1-dev). Examples: ideogram/ideogram-3.0, Qwen/Qwen-Image",
    }),
  ),
  size: Type.Optional(Type.String({ description: "Image dimensions as WxH (default: 1024x1024)" })),
  steps: Type.Optional(Type.Number({ description: "Number of inference steps (default: 28)" })),
  n: Type.Optional(Type.Number({ description: "Number of images to generate (default 1, max 4)" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "image_gen",
    label: "Image Generation",
    description:
      "Generate images using Together AI. OpenAI-compatible API with access to Flux, Ideogram, Qwen Image, and more.",
    parameters: schema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await together.generate({
        prompt: params.prompt,
        model: params.model,
        size: params.size,
        steps: params.steps,
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
        details: { provider: "together", imageCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
