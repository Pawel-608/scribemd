'use client';

type Props = {
  files: string[];
  current: string | null;
  onSelect: (path: string) => void;
  onNew: () => void;
};

export function Sidebar({ files, current, onSelect, onNew }: Props) {
  return (
    <aside className="w-64 border-r border-line bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted">Notes</span>
        <button
          onClick={onNew}
          className="text-xs px-2 py-1 rounded border border-line hover:bg-paper transition-colors"
        >
          + New
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto py-2">
        {files.length === 0 && (
          <li className="px-4 py-2 text-sm text-muted italic">No notes yet</li>
        )}
        {files.map((f) => (
          <li key={f}>
            <button
              onClick={() => onSelect(f)}
              className={`w-full text-left px-4 py-1.5 text-sm font-mono truncate hover:bg-paper transition-colors ${
                current === f ? 'bg-[#ebe5d4] text-ink' : 'text-[#444]'
              }`}
              title={f}
            >
              {f}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
