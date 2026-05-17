'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  path: string | null;
  content: string;
  dirty: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

export function Editor({ path, content, dirty, onChange, onSave, onDelete }: Props) {
  if (!path) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        Select or create a note to start writing.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-line bg-white">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-[#555]">{path}</span>
          {dirty && <span className="text-xs text-amber-700">● unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1 rounded border border-line bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onSave}
            disabled={!dirty}
            className="text-xs px-3 py-1 rounded border border-line bg-white hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save (⌘S)
          </button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-2 min-h-0">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault();
              onSave();
            }
          }}
          className="w-full h-full p-6 font-mono text-sm leading-relaxed bg-paper outline-none resize-none border-r border-line"
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
