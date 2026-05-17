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
  createWorkspace: () => request<{ id: string }>('POST', '/api/workspaces'),
  listFiles: (workspaceId: string) =>
    request<{ files: string[] }>('GET', `/api/workspaces/${workspaceId}/files`),
  readFile: (workspaceId: string, p: string) =>
    request<{ path: string; content: string }>('GET', `/api/workspaces/${workspaceId}/files/${encode(p)}`),
  writeFile: (workspaceId: string, p: string, content: string) =>
    request<{ ok: true }>('PUT', `/api/workspaces/${workspaceId}/files/${encode(p)}`, { content }),
  deleteFile: (workspaceId: string, p: string) =>
    request<{ ok: true }>('DELETE', `/api/workspaces/${workspaceId}/files/${encode(p)}`),
};
