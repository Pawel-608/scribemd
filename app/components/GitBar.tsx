'use client';

import type { GitStatus } from '@/app/lib/api';

type Props = {
  status: GitStatus | null;
  commitMsg: string;
  onCommitMsgChange: (v: string) => void;
  onCommit: () => void;
  onPull: () => void;
  onPush: () => void;
  busy: string | null;
};

export function GitBar({ status, commitMsg, onCommitMsgChange, onCommit, onPull, onPush, busy }: Props) {
  const branchLabel = status?.branch ?? '—';
  const changedCount = status?.changed.length ?? 0;
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className="font-mono">
        {branchLabel}
        {status && status.ahead > 0 && <span className="ml-1 text-emerald-700">↑{status.ahead}</span>}
        {status && status.behind > 0 && <span className="ml-1 text-rose-700">↓{status.behind}</span>}
        {changedCount > 0 && <span className="ml-1 text-amber-700">● {changedCount}</span>}
      </span>
      <input
        value={commitMsg}
        onChange={(e) => onCommitMsgChange(e.target.value)}
        placeholder="Commit message"
        className="px-2 py-1 rounded border border-line text-xs w-56 bg-white focus:outline-none focus:border-muted"
      />
      <button
        onClick={onCommit}
        disabled={busy !== null || !commitMsg.trim() || changedCount === 0}
        className="px-2 py-1 rounded border border-line hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy === 'commit' ? '…' : 'Commit'}
      </button>
      <button
        onClick={onPull}
        disabled={busy !== null}
        className="px-2 py-1 rounded border border-line hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy === 'pull' ? '…' : 'Pull'}
      </button>
      <button
        onClick={onPush}
        disabled={busy !== null || (status?.ahead ?? 0) === 0}
        className="px-2 py-1 rounded border border-line hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy === 'push' ? '…' : 'Push'}
      </button>
    </div>
  );
}
