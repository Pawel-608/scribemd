'use client';

import { useEffect, useState } from 'react';
import { toast } from './Toast';

export function ShareBar({ workspaceId }: { workspaceId: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
  }, [workspaceId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast('URL copied');
    } catch {
      toast('Copy failed', 'error');
    }
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="text-xs text-muted shrink-0">share:</span>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 min-w-0 px-2 py-1 rounded border border-line bg-paper font-mono text-xs text-[#444] focus:outline-none focus:border-muted"
      />
      <button
        onClick={copy}
        className="px-2 py-1 rounded border border-line bg-white hover:bg-paper text-xs shrink-0"
      >
        Copy
      </button>
    </div>
  );
}
