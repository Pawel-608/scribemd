import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { simpleGit, type SimpleGit } from 'simple-git';

export const DATA_DIR =
  process.env.SCRIBEMD_DATA_DIR ?? path.join(process.cwd(), 'data');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA_RE = /^[0-9a-f]{4,40}$/i;

export function isValidWorkspaceId(id: string): boolean {
  return UUID_RE.test(id);
}

function workspaceDir(id: string): string {
  if (!isValidWorkspaceId(id)) throw new Error('Invalid workspace id');
  return path.join(DATA_DIR, id);
}

function workspaceGit(id: string): SimpleGit {
  return simpleGit(workspaceDir(id));
}

async function isGitRepo(id: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(workspaceDir(id), '.git'));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function ensureGitRepo(id: string): Promise<SimpleGit> {
  const git = workspaceGit(id);
  if (!(await isGitRepo(id))) {
    await git.init();
    await git.addConfig('user.name', 'scribemd');
    await git.addConfig('user.email', 'scribemd@local');
    await git.addConfig('commit.gpgsign', 'false');
  }
  return git;
}

export async function createWorkspace(): Promise<string> {
  const id = randomUUID();
  const dir = workspaceDir(id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'welcome.md'),
    `# Welcome\n\nThis is a permissionless workspace. Anyone with this URL can read and edit these notes.\n\nShare the URL with collaborators (or with Claude) to write together.\n\nClick **Commit** at the top to snapshot your changes — every commit is preserved in **History**.\n`,
    'utf8',
  );
  const git = await ensureGitRepo(id);
  await git.add('.');
  await git.commit('Create workspace');
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

function safeRelMarkdownPath(workspaceId: string, relativePath: string): string {
  resolveNote(workspaceId, relativePath);
  return decodeURIComponent(relativePath).replace(/\\/g, '/');
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

export async function renameNote(
  workspaceId: string,
  fromRel: string,
  toRel: string,
): Promise<void> {
  const from = resolveNote(workspaceId, fromRel);
  const to = resolveNote(workspaceId, toRel);
  if (from === to) return;
  try {
    await fs.stat(from);
  } catch {
    throw new Error('Source file does not exist');
  }
  try {
    await fs.stat(to);
    throw new Error('Destination already exists');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to);
}

export async function commitWorkspace(
  workspaceId: string,
  message: string,
): Promise<{ sha: string } | { sha: null; reason: 'nothing to commit' }> {
  const git = await ensureGitRepo(workspaceId);
  await git.add('.');
  const status = await git.status();
  if (status.files.length === 0) {
    return { sha: null, reason: 'nothing to commit' };
  }
  const result = await git.commit(message);
  return { sha: result.commit };
}

export async function workspaceStatus(workspaceId: string): Promise<{ changed: number }> {
  if (!(await isGitRepo(workspaceId))) return { changed: 0 };
  const git = workspaceGit(workspaceId);
  const status = await git.status();
  return { changed: status.files.length };
}

export type Commit = {
  sha: string;
  short: string;
  message: string;
  date: string;
};

export async function workspaceHistory(workspaceId: string): Promise<Commit[]> {
  if (!(await isGitRepo(workspaceId))) return [];
  const git = workspaceGit(workspaceId);
  try {
    const log = await git.log({ maxCount: 200 });
    return log.all.map((c) => ({
      sha: c.hash,
      short: c.hash.slice(0, 7),
      message: c.message,
      date: c.date,
    }));
  } catch {
    return [];
  }
}

export async function commitDetail(
  workspaceId: string,
  sha: string,
): Promise<{ sha: string; message: string; date: string; files: string[] }> {
  if (!SHA_RE.test(sha)) throw new Error('Invalid sha');
  const git = await ensureGitRepo(workspaceId);
  const meta = await git.raw(['show', '-s', '--format=%H%n%aI%n%s', sha]);
  const [hash, date, ...msgLines] = meta.trim().split('\n');
  if (!hash) throw new Error('Commit not found');
  const filesRaw = await git.raw(['show', '--name-only', '--format=', sha]);
  const files = filesRaw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.endsWith('.md'));
  return { sha: hash, message: msgLines.join('\n'), date, files };
}

export async function fileAtCommit(
  workspaceId: string,
  sha: string,
  relativePath: string,
): Promise<string> {
  if (!SHA_RE.test(sha)) throw new Error('Invalid sha');
  const rel = safeRelMarkdownPath(workspaceId, relativePath);
  const git = await ensureGitRepo(workspaceId);
  return await git.show([`${sha}:${rel}`]);
}
