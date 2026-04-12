import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { allProviders, resolveProvider } from "../packages/core/src/index.js";

describe("resolveProvider", () => {
  const savedEnv: Record<string, string | undefined> = {};
  const allKeys = allProviders.flatMap((p) => p.envKeys);

  beforeEach(() => {
    for (const k of allKeys) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  test("returns null when no keys set", () => {
    expect(resolveProvider()).toBeNull();
  });

  test("picks provider by env key", () => {
    process.env.REPLICATE_API_TOKEN = "fake";
    expect(resolveProvider()?.name).toBe("replicate");
  });

  test("respects priority order", () => {
    process.env.REPLICATE_API_TOKEN = "fake";
    process.env.OPENAI_API_KEY = "fake";
    expect(resolveProvider()?.name).toBe("openai");
  });

  test("openai is highest priority", () => {
    process.env.OPENAI_API_KEY = "fake";
    process.env.GOOGLE_API_KEY = "fake";
    process.env.REPLICATE_API_TOKEN = "fake";
    expect(resolveProvider()?.name).toBe("openai");
  });

  test("custom provider list", () => {
    process.env.OPENAI_API_KEY = "fake";
    process.env.TOGETHER_API_KEY = "fake";
    const togetherOnly = allProviders.filter((p) => p.name === "together");
    expect(resolveProvider(togetherOnly)?.name).toBe("together");
  });

  test("all 6 providers are registered", () => {
    expect(allProviders).toHaveLength(6);
    const names = allProviders.map((p) => p.name);
    for (const expected of ["openai", "google", "xai", "recraft", "replicate", "together"]) {
      expect(names).toContain(expected);
    }
  });
});
