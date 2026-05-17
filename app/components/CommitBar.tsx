'use client';

type Props = {
  changed: number;
  message: string;
  onMessageChange: (v: string) => void;
  onCommit: () => void;
  onOpenHistory: () => void;
  busy: boolean;
};

export function CommitBar({ changed, message, onMessageChange, onCommit, onOpenHistory, busy }: Props) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-muted font-mono">
        {changed === 0 ? 'clean' : `${changed} changed`}
      </span>
      <input
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && message.trim() && changed > 0) onCommit();
        }}
        placeholder="Commit message"
        className="px-2 py-1 rounded border border-line text-xs w-48 bg-white focus:outline-none focus:border-muted"
      />
      <button
        onClick={onCommit}
        disabled={busy || changed === 0 || !message.trim()}
        className="text-xs px-2 py-1 rounded border border-line bg-white hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? '…' : 'Commit'}
      </button>
      <button
        onClick={onOpenHistory}
        className="text-xs px-2 py-1 rounded border border-line bg-white hover:bg-paper"
      >
        History
      </button>
    </div>
  );
}
