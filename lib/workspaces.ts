import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const DATA_DIR =
  process.env.SCRIBEMD_DATA_DIR ?? path.join(process.cwd(), 'data');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidWorkspaceId(id: string): boolean {
  return UUID_RE.test(id);
}

function workspaceDir(id: string): string {
  if (!isValidWorkspaceId(id)) throw new Error('Invalid workspace id');
  return path.join(DATA_DIR, id);
}

export async function createWorkspace(): Promise<string> {
  const id = randomUUID();
  await fs.mkdir(workspaceDir(id), { recursive: true });
  await fs.writeFile(
    path.join(workspaceDir(id), 'welcome.md'),
    `# Welcome\n\nThis is a permissionless workspace. Anyone with this URL can read and edit these notes.\n\nShare the URL with collaborators (or with Claude) to write together.\n`,
    'utf8',
  );
  return id;
}

export async function workspaceExists(id: string): Promise<boolean> {
  if (!isValidWorkspaceId(id)) return false;
  try {
    const stat = await fs.stat(workspaceDir(id));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export function resolveNote(workspaceId: string, relativePath: string): string {
  const root = workspaceDir(workspaceId);
  const decoded = decodeURIComponent(relativePath);
  const resolved = path.resolve(root, decoded);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error('Path escapes workspace');
  }
  if (!resolved.endsWith('.md')) {
    throw new Error('Only .md files are allowed');
  }
  return resolved;
}

export async function listMarkdown(workspaceId: string): Promise<string[]> {
  const root = workspaceDir(workspaceId);
  async function walk(dir: string, base: string): Promise<string[]> {
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
        out.push(...(await walk(full, base)));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        out.push(path.relative(base, full));
      }
    }
    return out;
  }
  return (await walk(root, root)).sort();
}
