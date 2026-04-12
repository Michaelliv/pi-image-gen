import { describe, expect, test } from "bun:test";
import { allProviders, formatResults, type ImageProvider, resolveProvider } from "../packages/core/src/index.js";

// Integration tests — only run for providers that have API keys set.
// Run with: OPENAI_API_KEY=... bun test tests/integration.test.ts

function integrationTest(provider: ImageProvider) {
  const hasKeys = provider.envKeys.every((k) => process.env[k]);

  describe(provider.name, () => {
    test.skipIf(!hasKeys)(
      "generate returns results",
      async () => {
        const results = await provider.generate({ prompt: "a simple red circle on white background", n: 1 });
        expect(results.length).toBeGreaterThan(0);

        for (const r of results) {
          expect(r.base64).toBeDefined();
          expect(typeof r.base64).toBe("string");
          expect(r.base64.length).toBeGreaterThan(100);
          expect(r.mimeType).toBeDefined();
          expect(r.mimeType).toMatch(/^image\//);
        }

        // Verify formatResults doesn't throw
        const formatted = formatResults(results);
        expect(formatted).toContain("## Image 1");
        expect(formatted.length).toBeGreaterThan(10);
      },
      60_000,
    );
  });
}

describe("integration", () => {
  for (const provider of allProviders) {
    integrationTest(provider);
  }

  test("resolveProvider returns a working provider", async () => {
    const provider = resolveProvider();
    if (!provider) {
      console.log("No API keys set, skipping resolveProvider integration test");
      return;
    }

    const results = await provider.generate({ prompt: "a blue square", n: 1 });
    expect(results.length).toBeGreaterThan(0);
  }, 60_000);
});
