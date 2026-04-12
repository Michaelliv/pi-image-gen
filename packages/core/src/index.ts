export { fal } from "./providers/fal.js";
export { google } from "./providers/google.js";
export { openai } from "./providers/openai.js";
export { recraft } from "./providers/recraft.js";
export { replicate } from "./providers/replicate.js";
export { together } from "./providers/together.js";
export { xai } from "./providers/xai.js";
export { createRenderers } from "./renderers.js";
export type { ImageOptions, ImageProvider, ImageResult } from "./types.js";
export { formatResults } from "./types.js";

import { fal } from "./providers/fal.js";
import { google } from "./providers/google.js";
import { openai } from "./providers/openai.js";
import { recraft } from "./providers/recraft.js";
import { replicate } from "./providers/replicate.js";
import { together } from "./providers/together.js";
import { xai } from "./providers/xai.js";
import type { ImageProvider } from "./types.js";

/** All available providers, ordered by preference. */
export const allProviders: ImageProvider[] = [openai, google, xai, recraft, fal, replicate, together];

/** Find the first provider that has its env keys set. */
export function resolveProvider(providers: ImageProvider[] = allProviders): ImageProvider | null {
  for (const p of providers) {
    const hasKeys = p.envKeys.every((key) => process.env[key]);
    if (hasKeys) return p;
  }
  return null;
}
