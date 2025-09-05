'use client';

import MarkdownRenderer from './MarkdownRenderer';

const demoMarkdown = `# Markdown Support in AI Chat

The AI chat now supports **full Markdown formatting**! Here are some examples:

## Text Formatting
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
- ~~Strikethrough~~ text

## Lists
### Unordered List:
- First item
- Second item
  - Nested item
  - Another nested item

### Ordered List:
1. First step
2. Second step
3. Third step

## Code Blocks
Here's a JavaScript example:
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

## Tables
| Feature | Status | Notes |
|---------|--------|-------|
| Headers | ✅ | Fully supported |
| Lists | ✅ | Nested lists work |
| Code | ✅ | Syntax highlighting |
| Tables | ✅ | Responsive design |

## Blockquotes
> This is a blockquote. It's great for highlighting important information or quotes from users.

## Links
Check out [React Markdown](https://github.com/remarkjs/react-markdown) for more features!

---

*All markdown is rendered with a clean, minimalistic design that matches the app's blue and white theme.*
`;

interface MarkdownDemoProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function MarkdownDemo({ isVisible, onClose }: MarkdownDemoProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Markdown Support Demo</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <MarkdownRenderer content={demoMarkdown} />
        </div>
      </div>
    </div>
  );
}
