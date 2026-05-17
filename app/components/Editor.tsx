'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
      <div className="flex-1 grid grid-cols-2 min-h-0">
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
          className={`w-full h-full p-6 font-mono text-sm leading-relaxed outline-none resize-none border-r border-line ${
            readOnly ? 'bg-amber-50/40 text-[#444]' : 'bg-paper'
          }`}
          spellCheck={false}
          placeholder="# Start writing..."
        />
        <div className="overflow-y-auto p-6 prose-md bg-white">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
