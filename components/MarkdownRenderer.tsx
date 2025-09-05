'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom renderers for better styling
          h1: ({ node, ...props }) => <h1 className="text-lg font-semibold mb-2 text-gray-900" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-semibold mb-2 text-gray-900" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mb-1 text-gray-900" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-sm font-medium mb-1 text-gray-900" {...props} />,
          h5: ({ node, ...props }) => <h5 className="text-xs font-medium mb-1 text-gray-900" {...props} />,
          h6: ({ node, ...props }) => <h6 className="text-xs font-medium mb-1 text-gray-900" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 text-xs leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="text-xs" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-gray-300 pl-2 my-2 italic text-gray-600" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code 
                  className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono" 
                  {...props} 
                >
                  {children}
                </code>
              );
            }
            return (
              <code 
                className="block bg-gray-100 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto" 
                {...props} 
              >
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-gray-100 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border-collapse border border-gray-300 text-xs" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-medium" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-2 py-1" {...props} />
          ),
          strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          a: ({ node, ...props }) => (
            <a 
              className="text-blue-600 hover:text-blue-800 underline" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ),
          hr: ({ node, ...props }) => <hr className="border-gray-300 my-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
