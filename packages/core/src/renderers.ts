import type { ImageResult } from "./types.js";

/**
 * Create renderCall and renderResult functions for the image_gen tool.
 * Pass in the pi-coding-agent and pi-tui imports so core stays dependency-free.
 */
export function createRenderers(keyHint: (id: string, desc: string) => string, Text: any) {
  return {
    renderCall(args: Record<string, unknown>, theme: any) {
      const prompt = typeof args.prompt === "string" ? args.prompt : "...";
      const truncated = prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt;
      return new Text(`${theme.fg("toolTitle", theme.bold("image_gen"))} ${theme.fg("accent", truncated)}`, 0, 0);
    },

    renderResult(
      result: { content: any[]; details: any },
      { expanded }: { expanded: boolean; isPartial: boolean },
      theme: any,
    ) {
      const details = result.details ?? {};
      const items: ImageResult[] = details.items ?? [];
      const count = details.imageCount ?? items.length;
      const prov = details.provider ?? "unknown";

      if (items.length === 0) {
        return new Text(theme.fg("muted", "No images generated."), 0, 0);
      }

      if (!expanded) {
        let text = theme.fg("success", `${count} image${count !== 1 ? "s" : ""}`) + theme.fg("muted", ` via ${prov}`);
        for (const item of items) {
          const sizeKB = Math.round((item.base64.length * 0.75) / 1024);
          text += `\n  ${theme.fg("toolOutput", `${item.mimeType} · ${sizeKB}KB`)}`;
          if (item.revisedPrompt) {
            const short = item.revisedPrompt.length > 60 ? `${item.revisedPrompt.slice(0, 57)}...` : item.revisedPrompt;
            text += `  ${theme.fg("muted", short)}`;
          }
        }
        text += `\n\n${theme.fg("muted", `(${keyHint("app.tools.expand", "to expand")})`)}`;
        return new Text(text, 0, 0);
      }

      let text = theme.fg("success", `${count} image${count !== 1 ? "s" : ""}`) + theme.fg("muted", ` via ${prov}`);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const sizeKB = Math.round((item.base64.length * 0.75) / 1024);
        text += `\n\n${theme.fg("toolTitle", theme.bold(`Image ${i + 1}`))}`;
        text += `\n${theme.fg("accent", `${item.mimeType} · ${sizeKB}KB`)}`;
        if (item.revisedPrompt) {
          text += `\n${theme.fg("toolOutput", item.revisedPrompt)}`;
        }
      }
      return new Text(text, 0, 0);
    },
  };
}
