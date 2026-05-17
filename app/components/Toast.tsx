'use client';

import { useEffect, useState } from 'react';

let push: ((msg: string, tone?: 'info' | 'error') => void) | null = null;

export function toast(msg: string, tone: 'info' | 'error' = 'info') {
  push?.(msg, tone);
}

export function ToastHost() {
  const [items, setItems] = useState<{ id: number; msg: string; tone: 'info' | 'error' }[]>([]);

  useEffect(() => {
    push = (msg, tone = 'info') => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, msg, tone }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 2400);
    };
    return () => {
      push = null;
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {items.map((i) => (
        <div
          key={i.id}
          className={`px-3 py-2 rounded shadow text-sm text-white ${
            i.tone === 'error' ? 'bg-rose-700' : 'bg-ink'
          }`}
        >
          {i.msg}
        </div>
      ))}
    </div>
  );
}
