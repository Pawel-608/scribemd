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

export type Commit = { sha: string; short: string; message: string; date: string };
export type CommitDetail = { sha: string; message: string; date: string; files: string[] };

export const api = {
  createWorkspace: () => request<{ id: string }>('POST', '/api/workspaces'),
  listFiles: (workspaceId: string) =>
    request<{ files: string[] }>('GET', `/api/workspaces/${workspaceId}/files`),
  readFile: (workspaceId: string, p: string, at?: string) => {
    const url = `/api/workspaces/${workspaceId}/files/${encode(p)}${at ? `?at=${at}` : ''}`;
    return request<{ path: string; content: string; at?: string }>('GET', url);
  },
  writeFile: (workspaceId: string, p: string, content: string) =>
    request<{ ok: true }>('PUT', `/api/workspaces/${workspaceId}/files/${encode(p)}`, { content }),
  deleteFile: (workspaceId: string, p: string) =>
    request<{ ok: true }>('DELETE', `/api/workspaces/${workspaceId}/files/${encode(p)}`),
  renameFile: (workspaceId: string, from: string, to: string) =>
    request<{ ok: true; from: string; to: string }>(
      'POST',
      `/api/workspaces/${workspaceId}/rename`,
      { from, to },
    ),
  commit: (workspaceId: string, message: string) =>
    request<{ sha: string | null; reason?: string }>('POST', `/api/workspaces/${workspaceId}/commit`, { message }),
  status: (workspaceId: string) =>
    request<{ changed: number }>('GET', `/api/workspaces/${workspaceId}/status`),
  history: (workspaceId: string) =>
    request<{ commits: Commit[] }>('GET', `/api/workspaces/${workspaceId}/history`),
  commitDetail: (workspaceId: string, sha: string) =>
    request<CommitDetail>('GET', `/api/workspaces/${workspaceId}/history/${sha}`),
};
