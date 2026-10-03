import React from 'react';

/**
 * Film description from YAML. Blank line = paragraph.
 * *italics* and **bold**. Single newlines inside a paragraph fold into spaces.
 */
const INLINE = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_/g;

function inlineNodes(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(INLINE.source, 'g');
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1]) {
      nodes.push(<strong key={`${keyPrefix}-${match.index}`}>{match[1]}</strong>);
    } else {
      nodes.push(<em key={`${keyPrefix}-${match.index}`}>{match[2] || match[3]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function filmCopyParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/[ \t]*\n[ \t]*/g, ' ').trim())
    .filter(Boolean);
}

export default function FilmCopy({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const paragraphs = filmCopyParagraphs(text);
  if (!paragraphs.length) return null;

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>
          {inlineNodes(paragraph, String(index))}
        </p>
      ))}
    </div>
  );
}
