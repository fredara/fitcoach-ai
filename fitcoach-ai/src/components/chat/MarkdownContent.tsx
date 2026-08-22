import React from 'react';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Procesar párrafos y bloques markdown
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'ol') {
      elements.push(
        <ol key={elements.length} className="list-decimal list-outside pl-5 space-y-1.5 my-2">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {formatInlineText(item)}
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={elements.length} className="list-disc list-outside pl-5 space-y-1.5 my-2">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
    }
    currentList = null;
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Procesar **negrita**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white/95">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Línea divisoria
    if (trimmed === '---' || trimmed === '***') {
      flushList();
      elements.push(<hr key={index} className="border-white/10 my-3" />);
      return;
    }

    // Encabezados ###
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={index} className="text-base font-bold text-accent mt-3 mb-1">
          {formatInlineText(trimmed.replace('### ', ''))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-lg font-bold text-accent mt-4 mb-1.5">
          {formatInlineText(trimmed.replace('## ', ''))}
        </h3>
      );
      return;
    }

    // Lista numerada (1. 2. 3.)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch && olMatch[2]) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      return;
    }

    // Lista con viñetas (- o *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (ulMatch && ulMatch[1]) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      return;
    }

    // Línea vacía
    if (!trimmed) {
      flushList();
      elements.push(<div key={index} className="h-1.5" />);
      return;
    }

    // Párrafo regular
    flushList();
    elements.push(
      <p key={index} className="leading-relaxed">
        {formatInlineText(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1 text-sm leading-relaxed">{elements}</div>;
}
