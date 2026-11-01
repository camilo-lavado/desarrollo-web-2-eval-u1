import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

export interface MermaidProps {
  chart?: string;
  code?: string;
  id?: string;
  idPrefix?: string;
}

export default function Mermaid({ chart, code, id, idPrefix }: MermaidProps) {
  const diagramCode = (code || chart || '').trim();
  const effectivePrefix = id || idPrefix || 'mmd';
  const reactId = useId().replace(/:/g, '');
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!diagramCode) {
      return;
    }

    const renderDiagram = async () => {
      try {
        const isDark = document.documentElement.dataset.theme === 'dark';
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'neutral',
          fontFamily: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
        });

        const uniqueId = `${effectivePrefix}-${reactId}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, diagramCode);
        if (mounted) {
          setSvgHtml(svg);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Error al renderizar diagrama Mermaid');
        }
      }
    };

    renderDiagram();

    const observer = new MutationObserver(() => {
      renderDiagram();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [diagramCode, effectivePrefix, reactId]);

  return (
    <div>
      {svgHtml ? (
        <div
          className="mermaid-svg-wrap"
          style={{ overflowX: 'auto', textAlign: 'center' }}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : error ? (
        <pre>{diagramCode}</pre>
      ) : (
        <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.85rem' }}>
          Cargando diagrama técnico…
        </div>
      )}

      <details style={{ marginTop: '10px', fontSize: '0.8rem' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>
          Ver código fuente Mermaid del diagrama (accesibilidad y respaldo)
        </summary>
        <pre style={{ marginTop: '6px' }}>{diagramCode}</pre>
      </details>
    </div>
  );
}
