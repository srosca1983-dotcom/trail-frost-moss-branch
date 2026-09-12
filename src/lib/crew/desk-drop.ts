import { createServerFn } from "@tanstack/react-start";

const OK_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".tif", ".tiff", ".bmp", ".heic", ".heif"]);

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".bmp": "image/bmp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export type DeskDrop = { name: string; bytes: number; mtime: string };

function fileExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function assertSafeDeskName(raw: string) {
  const name = String(raw ?? "");
  if (!name || /[/\\]/.test(name) || name.includes("..") || name !== raw) {
    throw new Error("Bad filename");
  }
  const ext = fileExt(name);
  if (!OK_EXT.has(ext)) throw new Error("Not a PDF or photo");
  return name;
}

export const listDeskDrops = createServerFn({ method: "GET" }).handler(async (): Promise<DeskDrop[]> => {
  const { readdir, stat } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dir = join(process.cwd(), "attachments");
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const out: DeskDrop[] = [];
  for (const name of names) {
    const ext = fileExt(name);
    if (!OK_EXT.has(ext)) continue;
    try {
      const s = await stat(join(dir, name));
      if (!s.isFile() || s.size < 32) continue;
      out.push({ name, bytes: s.size, mtime: s.mtime.toISOString() });
    } catch {
      /* skip */
    }
  }
  return out.sort((a, b) => b.mtime.localeCompare(a.mtime)).slice(0, 60);
});

export const loadDeskDrop = createServerFn({ method: "POST" })
  .validator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<{ name: string; type: string; base64: string }> => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const name = assertSafeDeskName(data.name);
    const buf = await readFile(join(process.cwd(), "attachments", name));
    if (buf.byteLength > 32 * 1024 * 1024) throw new Error(`${name} is over 32 MB`);
    return { name, type: MIME[fileExt(name)] ?? "application/octet-stream", base64: buf.toString("base64") };
  });
