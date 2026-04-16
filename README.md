# pi-image-gen

Image generation tools for [pi](https://github.com/badlogic/pi-mono). 6 providers, pick what you need.

## Quick start - Router (recommended)

Install the router - it auto-detects which API key you have and uses that provider:

```bash
pi install pi-image-gen-router
export OPENAI_API_KEY=...  # or any other provider's key
```

The `image_gen` tool is now available. The router checks for keys in this order: OpenAI, Google, xAI, Recraft, Replicate, Together AI.

## Pick a specific provider

If you want provider-specific parameters (e.g. OpenAI's quality settings, Recraft's style presets, fal's model selection), install that provider directly:

```bash
pi install pi-image-gen-openai
export OPENAI_API_KEY=...
```

## Packages

| Package | Provider | Env var | Best for |
|---------|----------|---------|----------|
| **[`pi-image-gen-router`](packages/pi-image-gen-router)** | **Auto-detect** | **Any below** | **General use** |
| [`pi-image-gen-openai`](packages/pi-image-gen-openai) | [OpenAI](https://openai.com) (GPT Image, DALL-E) | `OPENAI_API_KEY` | Quality leader, text rendering |
| [`pi-image-gen-google`](packages/pi-image-gen-google) | [Google](https://ai.google.dev) (Nano Banana, Imagen) | `GOOGLE_API_KEY` | Great value, fast, conversational editing |
| [`pi-image-gen-xai`](packages/pi-image-gen-xai) | [xAI](https://x.ai) (Grok Imagine / Aurora) | `XAI_API_KEY` | Photorealism, entity generation |
| [`pi-image-gen-recraft`](packages/pi-image-gen-recraft) | [Recraft](https://recraft.ai) (V3, V4) | `RECRAFT_API_KEY` | Design, vectors, brand assets |
| [`pi-image-gen-replicate`](packages/pi-image-gen-replicate) | [Replicate](https://replicate.com) (200+ models) | `REPLICATE_API_TOKEN` | Open-source models, community fine-tunes |
| [`pi-image-gen-together`](packages/pi-image-gen-together) | [Together AI](https://together.ai) | `TOGETHER_API_KEY` | OpenAI-compatible, Flux/Ideogram |

## Architecture

```
packages/
├── core/                    # Shared types, provider implementations, formatResults()
├── pi-image-gen-router/     # Auto-detect provider, common schema
├── pi-image-gen-openai/     # Provider-specific schema + delegates to core
├── pi-image-gen-google/
├── ...
```

- **`core`** exports `ImageProvider` interface, `ImageResult` type, `formatResults()`, all 6 provider implementations, and `resolveProvider()` for auto-detection.
- **Individual packages** are thin pi extension wrappers with provider-specific tool schemas.
- **Router** uses `resolveProvider()` to find the first available provider and registers a generic `image_gen` tool.

Only install one package at a time - they all register the same `image_gen` tool name.

## License

MIT
