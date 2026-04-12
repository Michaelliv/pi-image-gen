import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { google, openai, recraft, together, xai } from "../packages/core/src/index.js";

// Mock fetch globally
const originalFetch = globalThis.fetch;
let mockResponse: { ok: boolean; status: number; body: unknown };

beforeAll(() => {
  globalThis.fetch = mock(async () => ({
    ok: mockResponse.ok,
    status: mockResponse.status,
    json: async () => mockResponse.body,
    text: async () => JSON.stringify(mockResponse.body),
  })) as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

function setMockResponse(body: unknown, ok = true, status = 200) {
  mockResponse = { ok, status, body };
}

// Set fake API keys for all providers
const fakeKeys: Record<string, string> = {
  OPENAI_API_KEY: "fake",
  GOOGLE_API_KEY: "fake",
  XAI_API_KEY: "fake",
  RECRAFT_API_KEY: "fake",
  FAL_KEY: "fake",
  REPLICATE_API_TOKEN: "fake",
  TOGETHER_API_KEY: "fake",
};
const savedKeys: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const [k, v] of Object.entries(fakeKeys)) {
    savedKeys[k] = process.env[k];
    process.env[k] = v;
  }
});

afterEach(() => {
  for (const [k, v] of Object.entries(savedKeys)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("openai", () => {
  test("parses results", async () => {
    setMockResponse({
      data: [{ b64_json: "iVBORw0KGgo=", revised_prompt: "A cute cat sitting" }, { b64_json: "iVBORw0KGgo=" }],
    });
    const results = await openai.generate({ prompt: "a cat" });
    expect(results).toHaveLength(2);
    expect(results[0].base64).toBe("iVBORw0KGgo=");
    expect(results[0].mimeType).toBe("image/png");
    expect(results[0].revisedPrompt).toBe("A cute cat sitting");
    expect(results[1].revisedPrompt).toBeUndefined();
  });

  test("throws on error", async () => {
    setMockResponse({ error: "bad request" }, false, 400);
    expect(openai.generate({ prompt: "a cat" })).rejects.toThrow("OpenAI API error");
  });
});

describe("google", () => {
  test("parses results", async () => {
    setMockResponse({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: "iVBORw0KGgo=", mimeType: "image/png" } }],
          },
        },
      ],
    });
    const results = await google.generate({ prompt: "a dog" });
    expect(results).toHaveLength(1);
    expect(results[0].base64).toBe("iVBORw0KGgo=");
    expect(results[0].mimeType).toBe("image/png");
  });
});

describe("xai", () => {
  test("parses results", async () => {
    setMockResponse({
      data: [{ b64_json: "iVBORw0KGgo=", revised_prompt: "A landscape" }],
    });
    const results = await xai.generate({ prompt: "landscape" });
    expect(results).toHaveLength(1);
    expect(results[0].revisedPrompt).toBe("A landscape");
  });
});

describe("recraft", () => {
  test("parses results", async () => {
    setMockResponse({
      data: [{ b64_json: "iVBORw0KGgo=" }],
    });
    const results = await recraft.generate({ prompt: "a logo" });
    expect(results).toHaveLength(1);
    expect(results[0].mimeType).toBe("image/png");
  });
});

describe("together", () => {
  test("parses results", async () => {
    setMockResponse({
      data: [{ b64_json: "iVBORw0KGgo=" }, { b64_json: "AAAA" }],
    });
    const results = await together.generate({ prompt: "a sunset", n: 2 });
    expect(results).toHaveLength(2);
  });
});
