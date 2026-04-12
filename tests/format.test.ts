import { describe, expect, test } from "bun:test";
import { formatResults, type ImageResult } from "../packages/core/src/index.js";

describe("formatResults", () => {
  test("empty results", () => {
    expect(formatResults([])).toBe("No images generated.");
  });

  test("single result", () => {
    const results: ImageResult[] = [{ base64: "AAAA", mimeType: "image/png" }];
    const out = formatResults(results);
    expect(out).toContain("## Image 1");
    expect(out).toContain("image/png");
    expect(out).not.toContain("---");
  });

  test("multiple results have separators", () => {
    const results: ImageResult[] = [
      { base64: "AAAA", mimeType: "image/png" },
      { base64: "BBBB", mimeType: "image/webp" },
    ];
    const out = formatResults(results);
    expect(out).toContain("## Image 1");
    expect(out).toContain("## Image 2");
    expect(out).toContain("---");
  });

  test("includes revised prompt", () => {
    const results: ImageResult[] = [{ base64: "AAAA", mimeType: "image/png", revisedPrompt: "A cute cat" }];
    const out = formatResults(results);
    expect(out).toContain("A cute cat");
    expect(out).toContain("Revised prompt");
  });

  test("shows size in KB", () => {
    // 4000 base64 chars ≈ 3000 bytes ≈ 2.9KB
    const results: ImageResult[] = [{ base64: "A".repeat(4000), mimeType: "image/png" }];
    const out = formatResults(results);
    expect(out).toMatch(/\d+KB/);
  });
});
