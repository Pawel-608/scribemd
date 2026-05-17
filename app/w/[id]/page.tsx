'use client';

import { useCallback, useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { Editor } from '../../components/Editor';
import { ShareBar } from '../../components/ShareBar';
import { CommitBar } from '../../components/CommitBar';
import { HistoryPanel } from '../../components/HistoryPanel';
import { ToastHost, toast } from '../../components/Toast';
import { api } from '../../lib/api';

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [files, setFiles] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [viewingAt, setViewingAt] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [changed, setChanged] = useState(0);
  const [commitMsg, setCommitMsg] = useState('');
  const [committing, setCommitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState(0); // bump to force refresh

  const refreshFiles = useCallback(async () => {
    try {
      const { files } = await api.listFiles(id);
      setFiles(files);
      setNotFound(false);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'workspace not found') setNotFound(true);
      else toast(msg, 'error');
    }
  }, [id]);

  const refreshStatus = useCallback(async () => {
    try {
      const { changed } = await api.status(id);
      setChanged(changed);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    refreshFiles();
    refreshStatus();
  }, [refreshFiles, refreshStatus]);

  const openFile = useCallback(
    async (p: string) => {
      if (dirty && !confirm('Unsaved changes will be lost. Continue?')) return;
      try {
        const { content } = await api.readFile(id, p);
        setCurrent(p);
        setContent(content);
        setDirty(false);
        setViewingAt(null);
      } catch (err) {
        toast((err as Error).message, 'error');
      }
    },
    [id, dirty],
  );

  const openFileAt = useCallback(
    async (p: string, sha: string) => {
      if (dirty && !confirm('Unsaved changes will be lost. Continue?')) return;
      try {
        const { content } = await api.readFile(id, p, sha);
        setCurrent(p);
        setContent(content);
        setDirty(false);
        setViewingAt(sha);
        setHistoryOpen(false);
      } catch (err) {
        toast((err as Error).message, 'error');
      }
    },
    [id, dirty],
  );

  const exitHistorical = useCallback(async () => {
    if (!current) return;
    try {
      const { content } = await api.readFile(id, current);
      setContent(content);
      setDirty(false);
      setViewingAt(null);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, current]);

  const restoreHistorical = useCallback(async () => {
    if (!current || viewingAt === null) return;
    if (!confirm(`Restore ${current} to version ${viewingAt.slice(0, 7)}? You'll need to commit afterward.`)) return;
    try {
      await api.writeFile(id, current, content);
      toast('Restored — commit to lock it in');
      setViewingAt(null);
      setDirty(false);
      await refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, current, viewingAt, content, refreshStatus]);

  const save = useCallback(async () => {
    if (!current || !dirty || viewingAt !== null) return;
    try {
      await api.writeFile(id, current, content);
      setDirty(false);
      toast('Saved');
      refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, current, content, dirty, viewingAt, refreshStatus]);

  const newFile = useCallback(async () => {
    const name = prompt('New note filename (e.g. ideas/today.md):');
    if (!name) return;
    const clean = name.endsWith('.md') ? name : `${name}.md`;
    try {
      await api.writeFile(id, clean, '');
      await refreshFiles();
      await openFile(clean);
      refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, refreshFiles, openFile, refreshStatus]);

  const renameCurrent = useCallback(async () => {
    if (!current || viewingAt !== null) return;
    if (dirty && !confirm('Unsaved changes will be lost. Continue?')) return;
    const to = prompt('Rename to:', current);
    if (!to || to === current) return;
    const clean = to.endsWith('.md') ? to : `${to}.md`;
    try {
      await api.renameFile(id, current, clean);
      setCurrent(clean);
      toast('Renamed');
      await refreshFiles();
      refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, current, viewingAt, dirty, refreshFiles, refreshStatus]);

  const deleteCurrent = useCallback(async () => {
    if (!current || viewingAt !== null) return;
    if (!confirm(`Delete ${current}? This cannot be undone (until you commit and use history).`)) return;
    try {
      await api.deleteFile(id, current);
      setCurrent(null);
      setContent('');
      setDirty(false);
      toast('Deleted');
      await refreshFiles();
      refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, current, viewingAt, refreshFiles, refreshStatus]);

  const commit = useCallback(async () => {
    const msg = commitMsg.trim();
    if (!msg || changed === 0) return;
    setCommitting(true);
    try {
      const result = await api.commit(id, msg);
      if (result.sha) {
        toast(`Committed ${result.sha.slice(0, 7)}`);
        setCommitMsg('');
        setHistoryKey((k) => k + 1);
      } else {
        toast(result.reason ?? 'Nothing to commit');
      }
      await refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setCommitting(false);
    }
  }, [id, commitMsg, changed, refreshStatus]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-ink mb-2">Workspace not found</h1>
          <p className="text-muted mb-6">
            The workspace <span className="font-mono text-xs">{id}</span> doesn't
            exist (or the URL is wrong).
          </p>
          <Link href="/" className="text-sm underline">
            ← back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-white gap-4">
        <Link href="/" className="font-semibold text-ink shrink-0">
          scribemd
        </Link>
        <ShareBar workspaceId={id} />
        <CommitBar
          changed={changed}
          message={commitMsg}
          onMessageChange={setCommitMsg}
          onCommit={commit}
          onOpenHistory={() => setHistoryOpen(true)}
          busy={committing}
        />
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar files={files} current={current} onSelect={openFile} onNew={newFile} />
        <Editor
          path={current}
          content={content}
          dirty={dirty}
          viewingAt={viewingAt}
          onChange={(v) => {
            setContent(v);
            setDirty(true);
          }}
          onSave={save}
          onDelete={deleteCurrent}
          onRename={renameCurrent}
          onExitHistorical={exitHistorical}
          onRestoreHistorical={restoreHistorical}
        />
      </div>
      <HistoryPanel
        key={historyKey}
        workspaceId={id}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onOpenFileAt={openFileAt}
      />
      <ToastHost />
    </div>
  );
}
