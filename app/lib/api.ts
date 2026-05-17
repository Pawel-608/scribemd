export type GitStatus = {
  branch: string | null;
  ahead: number;
  behind: number;
  changed: string[];
};

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error((data.error as string | undefined) ?? `HTTP ${res.status}`);
  return data as T;
}

const encode = (p: string) => p.split('/').map(encodeURIComponent).join('/');

export const api = {
  listFiles: () => request<{ files: string[] }>('GET', '/api/files'),
  readFile: (p: string) => request<{ path: string; content: string }>('GET', `/api/files/${encode(p)}`),
  writeFile: (p: string, content: string) =>
    request<{ ok: true }>('PUT', `/api/files/${encode(p)}`, { content }),
  deleteFile: (p: string) => request<{ ok: true }>('DELETE', `/api/files/${encode(p)}`),
  gitStatus: () => request<GitStatus>('GET', '/api/git/status'),
  gitCommit: (message: string) =>
    request<{ ok: true; commit: string }>('POST', '/api/git/commit', { message }),
  gitPull: () => request<{ ok: true }>('POST', '/api/git/pull'),
  gitPush: () => request<{ ok: true }>('POST', '/api/git/push'),
};
