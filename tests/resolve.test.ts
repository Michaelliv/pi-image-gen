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
    process.env.FAL_KEY = "fake";
    expect(resolveProvider()?.name).toBe("fal");
  });

  test("respects priority order", () => {
    process.env.FAL_KEY = "fake";
    process.env.OPENAI_API_KEY = "fake";
    expect(resolveProvider()?.name).toBe("openai");
  });

  test("openai is highest priority", () => {
    process.env.OPENAI_API_KEY = "fake";
    process.env.GOOGLE_API_KEY = "fake";
    process.env.FAL_KEY = "fake";
    expect(resolveProvider()?.name).toBe("openai");
  });

  test("custom provider list", () => {
    process.env.OPENAI_API_KEY = "fake";
    process.env.FAL_KEY = "fake";
    const falOnly = allProviders.filter((p) => p.name === "fal");
    expect(resolveProvider(falOnly)?.name).toBe("fal");
  });

  test("all 7 providers are registered", () => {
    expect(allProviders).toHaveLength(7);
    const names = allProviders.map((p) => p.name);
    for (const expected of ["openai", "google", "xai", "recraft", "fal", "replicate", "together"]) {
      expect(names).toContain(expected);
    }
  });
});
