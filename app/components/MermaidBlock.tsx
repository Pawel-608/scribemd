'use client';

import { useEffect, useState } from 'react';

let initialized = false;

export function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        if (!initialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            securityLevel: 'strict',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          });
          initialized = true;
        }
        const id = 'mmd-' + Math.random().toString(36).slice(2, 10);
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setSvg('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="text-rose-700 text-xs whitespace-pre-wrap bg-rose-50 border border-rose-200 rounded p-2 my-2">
        Mermaid error: {error}
      </pre>
    );
  }
  return (
    <div
      className="my-3 [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
