'use client';

import { useCallback, useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { Editor } from '../../components/Editor';
import { ShareBar } from '../../components/ShareBar';
import { ToastHost, toast } from '../../components/Toast';
import { api } from '../../lib/api';

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [files, setFiles] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const refreshFiles = useCallback(async () => {
    try {
      const { files } = await api.listFiles(id);
      setFiles(files);
      setNotFound(false);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'workspace not found') {
        setNotFound(true);
      } else {
        toast(msg, 'error');
      }
    }
  }, [id]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const openFile = useCallback(
    async (p: string) => {
      if (dirty && !confirm('Unsaved changes will be lost. Continue?')) return;
      try {
        const { content } = await api.readFile(id, p);
        setCurrent(p);
        setContent(content);
        setDirty(false);
      } catch (err) {
        toast((err as Error).message, 'error');
      }
    },
    [id, dirty],
  );

  const save = useCallback(async () => {
    if (!current || !dirty) return;
    try {
      await api.writeFile(id, current, content);
      setDirty(false);
      toast('Saved');
      refreshFiles();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, current, content, dirty, refreshFiles]);

  const newFile = useCallback(async () => {
    const name = prompt('New note filename (e.g. ideas/today.md):');
    if (!name) return;
    const clean = name.endsWith('.md') ? name : `${name}.md`;
    try {
      await api.writeFile(id, clean, '');
      await refreshFiles();
      await openFile(clean);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, refreshFiles, openFile]);

  const deleteCurrent = useCallback(async () => {
    if (!current) return;
    if (!confirm(`Delete ${current}? This cannot be undone.`)) return;
    try {
      await api.deleteFile(id, current);
      setCurrent(null);
      setContent('');
      setDirty(false);
      toast('Deleted');
      await refreshFiles();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }, [id, current, refreshFiles]);

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
          onDelete={deleteCurrent}
        />
      </div>
      <ToastHost />
    </div>
  );
}
