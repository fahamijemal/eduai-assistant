import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      components={{
        // Ensure links open in a new tab
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary underline" />
        ),
        // Style code blocks
        pre: ({ node, ...props }) => (
          <pre {...props} className="bg-muted rounded-lg p-3 overflow-x-auto text-xs" />
        ),
        code: ({ node, inline, ...props }) =>
          inline ? (
            <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" />
          ) : (
            <code {...props} className="font-mono text-xs" />
          ),
        // Style tables
        table: ({ node, ...props }) => (
          <table {...props} className="border-collapse border border-border text-sm w-full" />
        ),
        th: ({ node, ...props }) => (
          <th {...props} className="border border-border bg-muted px-3 py-1.5 text-left font-medium" />
        ),
        td: ({ node, ...props }) => (
          <td {...props} className="border border-border px-3 py-1.5" />
        ),
        // Style lists
        ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 space-y-1" />,
        ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 space-y-1" />,
        // Paragraphs
        p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
        // Headings
        h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold mb-2 mt-3" />,
        h2: ({ node, ...props }) => <h2 {...props} className="text-base font-bold mb-2 mt-3" />,
        h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-bold mb-1 mt-2" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
