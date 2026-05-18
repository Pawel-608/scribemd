'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidBlock } from './MermaidBlock';

const SPLIT_STORAGE_KEY = 'scribemd:editor-split-pct';
const MIN_PCT = 15;
const MAX_PCT = 85;

type ReactNodeWithProps = { props?: { className?: string; children?: unknown } };

const markdownComponents = {
  pre: (props: { children?: unknown }) => {
    const child = props.children as ReactNodeWithProps | undefined;
    const className = child?.props?.className ?? '';
    if (/\blanguage-mermaid\b/.test(className)) {
      const code = String(child?.props?.children ?? '').replace(/\n$/, '');
      return <MermaidBlock code={code} />;
    }
    return <pre {...(props as object)} />;
  },
};

type Props = {
  path: string | null;
  content: string;
  dirty: boolean;
  viewingAt: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onRename: () => void;
  onExitHistorical: () => void;
  onRestoreHistorical: () => void;
};

export function Editor({
  path,
  content,
  dirty,
  viewingAt,
  onChange,
  onSave,
  onDelete,
  onRename,
  onExitHistorical,
  onRestoreHistorical,
}: Props) {
  const splitRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(50);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const stored = Number(localStorage.getItem(SPLIT_STORAGE_KEY));
    if (Number.isFinite(stored) && stored >= MIN_PCT && stored <= MAX_PCT) {
      setLeftPct(stored);
    }
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const el = splitRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(MAX_PCT, Math.max(MIN_PCT, pct));
      setLeftPct(clamped);
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging]);

  useEffect(() => {
    if (dragging) return;
    localStorage.setItem(SPLIT_STORAGE_KEY, String(leftPct));
  }, [dragging, leftPct]);

  const onDividerDoubleClick = useCallback(() => setLeftPct(50), []);

  if (!path) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        Select or create a note to start writing.
      </div>
    );
  }

  const readOnly = viewingAt !== null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {readOnly && (
        <div className="flex items-center justify-between gap-3 px-5 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900">
          <span>
            Viewing <span className="font-mono">{path}</span> at{' '}
            <span className="font-mono">{viewingAt!.slice(0, 7)}</span> (read-only)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onRestoreHistorical}
              className="px-2 py-0.5 rounded border border-amber-300 bg-white hover:bg-amber-100"
            >
              Restore this version
            </button>
            <button
              onClick={onExitHistorical}
              className="px-2 py-0.5 rounded border border-amber-300 bg-white hover:bg-amber-100"
            >
              Back to current
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-line bg-white">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-[#555]">{path}</span>
          {dirty && !readOnly && <span className="text-xs text-amber-700">● unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRename}
            disabled={readOnly}
            className="text-xs px-3 py-1 rounded border border-line bg-white hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Rename
          </button>
          <button
            onClick={onDelete}
            disabled={readOnly}
            className="text-xs px-3 py-1 rounded border border-line bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onSave}
            disabled={!dirty || readOnly}
            className="text-xs px-3 py-1 rounded border border-line bg-white hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save (⌘S)
          </button>
        </div>
      </div>
      <div ref={splitRef} className="flex-1 flex min-h-0">
        <textarea
          value={content}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (!readOnly && (e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault();
              onSave();
            }
          }}
          style={{ width: `${leftPct}%` }}
          className={`h-full p-6 font-mono text-sm leading-relaxed outline-none resize-none ${
            readOnly ? 'bg-amber-50/40 text-[#444]' : 'bg-paper'
          }`}
          spellCheck={false}
          placeholder="# Start writing..."
        />
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(leftPct)}
          aria-valuemin={MIN_PCT}
          aria-valuemax={MAX_PCT}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDoubleClick={onDividerDoubleClick}
          title="Drag to resize · double-click to reset"
          className={`relative w-1 shrink-0 cursor-col-resize bg-line hover:bg-muted transition-colors ${
            dragging ? 'bg-muted' : ''
          }`}
        >
          <span className="absolute inset-y-0 -left-1 -right-1" />
        </div>
        <div style={{ width: `${100 - leftPct}%` }} className="overflow-y-auto p-6 prose-md bg-white">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
