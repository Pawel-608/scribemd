'use client';

import { useEffect, useState } from 'react';
import { api, type Commit, type CommitDetail } from '../lib/api';
import { toast } from './Toast';

type Props = {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onOpenFileAt: (path: string, sha: string) => void;
};

function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function HistoryPanel({ workspaceId, open, onClose, onOpenFileAt }: Props) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<CommitDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .history(workspaceId)
      .then(({ commits }) => setCommits(commits))
      .catch((err: Error) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [open, workspaceId]);

  async function toggle(sha: string) {
    if (expanded === sha) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(sha);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await api.commitDetail(workspaceId, sha));
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-line shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h2 className="font-semibold">History</h2>
          <button
            onClick={onClose}
            className="text-sm text-muted hover:text-ink px-2"
            aria-label="Close history"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <p className="px-4 py-3 text-sm text-muted">Loading…</p>}
          {!loading && commits.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted italic">
              No commits yet. Make changes and click Commit to start the history.
            </p>
          )}
          <ul>
            {commits.map((c) => (
              <li key={c.sha} className="border-b border-line">
                <button
                  onClick={() => toggle(c.sha)}
                  className="w-full text-left px-4 py-3 hover:bg-paper transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-ink truncate">{c.message}</span>
                    <span className="text-xs text-muted shrink-0">{relativeTime(c.date)}</span>
                  </div>
                  <div className="text-xs text-muted font-mono mt-0.5">{c.short}</div>
                </button>
                {expanded === c.sha && (
                  <div className="px-4 pb-3 bg-paper border-t border-line">
                    {detailLoading && <p className="text-xs text-muted py-2">Loading…</p>}
                    {detail && (
                      <>
                        <p className="text-xs text-muted py-2">
                          {detail.files.length === 0
                            ? 'No file changes recorded.'
                            : `${detail.files.length} file${detail.files.length === 1 ? '' : 's'} changed`}
                        </p>
                        <ul className="flex flex-col gap-1">
                          {detail.files.map((f) => (
                            <li key={f}>
                              <button
                                onClick={() => onOpenFileAt(f, c.sha)}
                                className="font-mono text-xs text-[#4a6fa5] hover:underline text-left"
                                title={`View ${f} at ${c.short}`}
                              >
                                {f}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
