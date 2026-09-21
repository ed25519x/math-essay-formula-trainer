import { InlineMath } from 'react-katex'

/** Renders a string, treating $...$ segments as inline KaTeX and the rest as plain text. */
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g).filter((p) => p !== '')
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={i} math={part.slice(1, -1)} />
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
