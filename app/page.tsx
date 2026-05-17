'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from './lib/api';

export default function Home() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const { id } = await api.createWorkspace();
      router.push(`/w/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setCreating(false);
    }
  }

  function open(e: React.FormEvent) {
    e.preventDefault();
    const id = openId.trim();
    if (!id) return;
    router.push(`/w/${id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-semibold text-ink mb-2">scribemd</h1>
        <p className="text-muted mb-8 leading-relaxed">
          A permissionless markdown workspace. Create one in a click — anyone with
          the URL can read and edit. Share it with Claude (or anyone else) to
          collaborate.
        </p>

        <button
          onClick={create}
          disabled={creating}
          className="w-full px-4 py-3 rounded bg-ink text-white font-medium hover:bg-black disabled:opacity-50 transition-colors mb-8"
        >
          {creating ? 'Creating…' : 'Create new workspace'}
        </button>

        <form onSubmit={open} className="flex gap-2">
          <input
            value={openId}
            onChange={(e) => setOpenId(e.target.value)}
            placeholder="Or paste a workspace ID…"
            className="flex-1 px-3 py-2 rounded border border-line bg-white font-mono text-sm focus:outline-none focus:border-muted"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded border border-line bg-white hover:bg-paper text-sm"
          >
            Open
          </button>
        </form>

        {error && <p className="text-rose-700 text-sm mt-4">{error}</p>}

        <p className="text-xs text-muted mt-8 leading-relaxed">
          Workspace URLs are unguessable UUIDs and act as the only access
          credential. Treat them like passwords.
        </p>

        <p className="text-xs text-muted mt-4">
          For AI agents:{' '}
          <a href="/llms.txt" className="underline hover:text-ink">
            /llms.txt
          </a>{' '}
          · Source:{' '}
          <a
            href="https://github.com/Pawel-608/scribemd"
            className="underline hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
