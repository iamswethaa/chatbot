import React, { useMemo } from 'react';
import { ChatMessage as ChatMessageType } from '../../../types/electron';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
  messageDarkMode?: 'none' | 'sent' | 'received';
}

// Enhanced markdown renderer (supports code blocks, inline code, lists, tables, and paragraphs)
function renderMessageHtml(content: string): string {
  if (!content) return '';

  // Escape HTML
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let html = escapeHtml(content);

  // Code block (```...```) -> <pre><code>
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="code-bw p-3 rounded text-sm overflow-auto"><code>${escapeHtml(code)}</code></pre>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, (_, code) => `<code class="bg-gray-100 px-1 rounded text-xs">${escapeHtml(code)}</code>`);

  // Bold **text** and italic *text*
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Tables: detect markdown table format
  html = html.replace(/(?:^|\n)((?:\|[^\n]*\|\n?)+)/gm, (_, tableBlock: string) => {
    const lines = tableBlock.trim().split('\n').filter((line: string) => line.trim());
    if (lines.length < 2) return tableBlock; // Not a valid table
    
    // Check if second line is a separator (contains only |, -, :, and spaces)
    const separatorLine = lines[1];
    if (!/^[\|\-\:\s]+$/.test(separatorLine)) return tableBlock; // Not a table separator
    
    // Parse header row
    const headerCells = lines[0].split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell);
    
    // Parse data rows (skip the separator line)
    const dataRows = lines.slice(2).map((line: string) => 
      line.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
    );
    
    // Generate HTML table with responsive wrapper
    let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-gray-300 text-sm">';
    
    // Header
    tableHtml += '<thead class="bg-gray-50">';
    tableHtml += '<tr>';
    headerCells.forEach((cell: string) => {
      tableHtml += `<th class="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">${cell}</th>`;
    });
    tableHtml += '</tr>';
    tableHtml += '</thead>';
    
    // Body
    tableHtml += '<tbody>';
    dataRows.forEach((row: string[]) => {
      tableHtml += '<tr>';
      row.forEach((cell: string) => {
        tableHtml += `<td class="border border-gray-300 px-2 py-1 text-xs">${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody>';
    tableHtml += '</table></div>';
    
    return tableHtml;
  });

  // Lists: lines starting with - or *
  html = html.replace(/^(?:\s*[-*]\s.+\r?\n?)+/gm, (block) => {
    const items = block.trim().split(/\r?\n/).map(line => line.replace(/^\s*[-*]\s/, ''));
    return `<ul class="list-disc list-inside">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  });

  // Paragraphs: double newlines -> <p>
  html = html.split(/\n\n+/g).map(p => `<p class="mb-2">${p.replace(/\n/g, '<br/>')}</p>`).join('');

  return html;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false }) => {
  const isUser = message.role === 'user';

  const htmlContent = useMemo(() => renderMessageHtml(message.content), [message.content]);

  // Handler to copy the last code block if any
  const copyLastCodeBlock = () => {
    const codeMatches = message.content.match(/```([\s\S]*?)```/g);
    if (codeMatches && codeMatches.length > 0) {
      const last = codeMatches[codeMatches.length - 1].replace(/```/g, '');
      navigator.clipboard.writeText(last.trim());
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-lg px-4 py-3 ${isUser ? 'bubble-sent' : 'bubble-received'} relative`}>
        {/* Message content rendered as HTML */}
        <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlContent }} />

        {/* Copy button for code blocks (only show for assistant messages containing triple-backtick code) */}
        {!isUser && /```([\s\S]*?)```/.test(message.content) && (
          <button onClick={copyLastCodeBlock} className="absolute top-2 right-2 text-xs bg-muted px-2 py-1 rounded hover:bg-app">Copy</button>
        )}

        {/* Typing indicator */}
        {isTyping && !isUser && (
          <div className="flex space-x-1 mt-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}

        {/* Timestamp removed (per UX request) */}
      </div>
    </div>
  );
};

export default ChatMessage;