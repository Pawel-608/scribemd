import { promises as fs } from 'node:fs';
import path from 'node:path';

export const NOTES_DIR = path.join(process.cwd(), 'notes');

export function resolveNote(relativePath: string): string {
  const decoded = decodeURIComponent(relativePath);
  const resolved = path.resolve(NOTES_DIR, decoded);
  if (resolved !== NOTES_DIR && !resolved.startsWith(NOTES_DIR + path.sep)) {
    throw new Error('Path escapes notes directory');
  }
  if (!resolved.endsWith('.md')) {
    throw new Error('Only .md files are allowed');
  }
  return resolved;
}

export async function listMarkdown(dir = NOTES_DIR, base = dir): Promise<string[]> {
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listMarkdown(full, base)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(path.relative(base, full));
    }
  }
  return out.sort();
}

export async function ensureNotesDir(): Promise<void> {
  await fs.mkdir(NOTES_DIR, { recursive: true });
}
