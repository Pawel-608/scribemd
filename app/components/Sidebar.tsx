'use client';

import { useMemo, useState } from 'react';

type Props = {
  files: string[];
  current: string | null;
  onSelect: (path: string) => void;
  onNew: () => void;
};

type Node = {
  name: string;
  path: string;
  isFile: boolean;
  children: Node[];
};

function buildTree(files: string[]): Node {
  const root: Node = { name: '', path: '', isFile: false, children: [] };
  for (const file of files) {
    const parts = file.split('/');
    let cursor = root;
    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const childPath = parts.slice(0, idx + 1).join('/');
      let child = cursor.children.find((c) => c.name === part && c.isFile === isLast);
      if (!child) {
        child = { name: part, path: childPath, isFile: isLast, children: [] };
        cursor.children.push(child);
      }
      cursor = child;
    });
  }
  sortNode(root);
  return root;
}

function sortNode(node: Node) {
  node.children.sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1; // folders first
    return a.name.localeCompare(b.name);
  });
  for (const c of node.children) if (!c.isFile) sortNode(c);
}

function defaultExpanded(node: Node): Set<string> {
  const set = new Set<string>();
  function walk(n: Node) {
    if (!n.isFile && n.path) set.add(n.path);
    for (const c of n.children) walk(c);
  }
  walk(node);
  return set;
}

function TreeNode({
  node,
  depth,
  current,
  expanded,
  toggle,
  onSelect,
}: {
  node: Node;
  depth: number;
  current: string | null;
  expanded: Set<string>;
  toggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  const padding = { paddingLeft: `${0.75 + depth * 0.85}rem` };

  if (node.isFile) {
    const isActive = node.path === current;
    return (
      <li>
        <button
          onClick={() => onSelect(node.path)}
          style={padding}
          title={node.path}
          className={`w-full text-left pr-3 py-1.5 text-sm font-mono truncate hover:bg-paper transition-colors ${
            isActive ? 'bg-[#ebe5d4] text-ink' : 'text-[#444]'
          }`}
        >
          {node.name}
        </button>
      </li>
    );
  }

  const isOpen = expanded.has(node.path);
  return (
    <li>
      <button
        onClick={() => toggle(node.path)}
        style={padding}
        className="w-full text-left pr-3 py-1.5 text-sm font-mono text-muted hover:bg-paper transition-colors flex items-center gap-1"
      >
        <span className="inline-block w-3 text-[10px] text-muted/70">
          {isOpen ? '▾' : '▸'}
        </span>
        <span className="truncate">{node.name}/</span>
      </button>
      {isOpen && (
        <ul>
          {node.children.map((c) => (
            <TreeNode
              key={(c.isFile ? 'f:' : 'd:') + c.path}
              node={c}
              depth={depth + 1}
              current={current}
              expanded={expanded}
              toggle={toggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Sidebar({ files, current, onSelect, onNew }: Props) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [expanded, setExpanded] = useState<Set<string>>(() => defaultExpanded(tree));

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

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
      <ul className="flex-1 overflow-y-auto py-1">
        {tree.children.length === 0 && (
          <li className="px-4 py-2 text-sm text-muted italic">No notes yet</li>
        )}
        {tree.children.map((n) => (
          <TreeNode
            key={(n.isFile ? 'f:' : 'd:') + n.path}
            node={n}
            depth={0}
            current={current}
            expanded={expanded}
            toggle={toggle}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </aside>
  );
}
