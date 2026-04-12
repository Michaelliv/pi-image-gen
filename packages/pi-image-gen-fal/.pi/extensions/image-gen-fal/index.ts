import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, fal, formatResults } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  model: Type.Optional(
    Type.String({
      description:
        "fal.ai model endpoint (default: fal-ai/flux/dev). Examples: fal-ai/flux/schnell, fal-ai/flux-pro/v1.1, fal-ai/stable-diffusion-v35-large",
    }),
  ),
  size: Type.Optional(Type.String({ description: "Image dimensions as WxH (default: 1024x1024)" })),
  n: Type.Optional(Type.Number({ description: "Number of images to generate (default 1, max 4)" })),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "image_gen",
    label: "Image Generation",
    description:
      "Generate images using fal.ai. Access to 400+ models including Flux, Stable Diffusion, Ideogram, Recraft, and more. Cheapest and fastest option.",
    parameters: schema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await fal.generate({
        prompt: params.prompt,
        model: params.model,
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
        details: { provider: "fal", imageCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
