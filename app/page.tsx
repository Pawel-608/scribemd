'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { GitBar } from './components/GitBar';
import { ToastHost, toast } from './components/Toast';
import { api, type GitStatus } from './lib/api';

export default function Home() {
  const [files, setFiles] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commitMsg, setCommitMsg] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const { files } = await api.listFiles();
      setFiles(files);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await api.gitStatus());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    refreshFiles();
    refreshStatus();
  }, [refreshFiles, refreshStatus]);

  const openFile = useCallback(
    async (p: string) => {
      if (dirty && !confirm('Unsaved changes will be lost. Continue?')) return;
      try {
        const { content } = await api.readFile(p);
        setCurrent(p);
        setContent(content);
        setDirty(false);
      } catch (err) {
        toast((err as Error).message, 'error');
      }
    },
    [dirty],
  );

  const save = useCallback(async () => {
    if (!current || !dirty) return;
    try {
      await api.writeFile(current, content);
      setDirty(false);
      toast('Saved');
      refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [current, content, dirty, refreshStatus]);

  const newFile = useCallback(async () => {
    const name = prompt('New note filename (e.g. ideas/today.md):');
    if (!name) return;
    const clean = name.endsWith('.md') ? name : `${name}.md`;
    try {
      await api.writeFile(clean, '');
      await refreshFiles();
      await openFile(clean);
      refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [refreshFiles, openFile, refreshStatus]);

  const commit = useCallback(async () => {
    if (!commitMsg.trim()) return;
    setBusy('commit');
    try {
      await api.gitCommit(commitMsg.trim());
      setCommitMsg('');
      toast('Committed');
      await refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  }, [commitMsg, refreshStatus]);

  const pull = useCallback(async () => {
    setBusy('pull');
    try {
      await api.gitPull();
      toast('Pulled');
      await refreshFiles();
      if (current) {
        try {
          const { content } = await api.readFile(current);
          setContent(content);
          setDirty(false);
        } catch {
          setCurrent(null);
          setContent('');
        }
      }
      await refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  }, [current, refreshFiles, refreshStatus]);

  const push = useCallback(async () => {
    setBusy('push');
    try {
      await api.gitPush();
      toast('Pushed');
      await refreshStatus();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  }, [refreshStatus]);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-white">
        <h1 className="font-semibold text-ink">scribemd</h1>
        <GitBar
          status={status}
          commitMsg={commitMsg}
          onCommitMsgChange={setCommitMsg}
          onCommit={commit}
          onPull={pull}
          onPush={push}
          busy={busy}
        />
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar files={files} current={current} onSelect={openFile} onNew={newFile} />
        <Editor
          path={current}
          content={content}
          dirty={dirty}
          onChange={(v) => {
            setContent(v);
            setDirty(true);
          }}
          onSave={save}
        />
      </div>
      <ToastHost />
    </div>
  );
}
