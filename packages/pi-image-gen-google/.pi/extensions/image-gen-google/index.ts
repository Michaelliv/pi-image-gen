import { type ExtensionAPI, keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { createRenderers, formatResults, google } from "pi-image-gen-core";

const schema = Type.Object({
  prompt: Type.String({ description: "Detailed description of the image to generate." }),
  model: Type.Optional(
    Type.Union(
      [
        Type.Literal("gemini-2.5-flash-image"),
        Type.Literal("gemini-3-pro-image-preview"),
        Type.Literal("gemini-3.1-flash-image-preview"),
      ],
      { description: "Model: Nano Banana (default), Nano Banana Pro, or Nano Banana 2" },
    ),
  ),
});

const renderers = createRenderers(keyHint, Text);

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "image_gen",
    label: "Image Generation",
    description:
      "Generate images using Google (Nano Banana / Imagen). Great value, fast generation, supports conversational editing.",
    parameters: schema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await google.generate({
        prompt: params.prompt,
        model: params.model,
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
        details: { provider: "google", imageCount: results.length, items: results },
      };
    },

    ...renderers,
  });
}
