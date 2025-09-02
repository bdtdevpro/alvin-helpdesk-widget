import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import React from 'react';
import alvinIconBlue from "@/app/images/alvin-icon-blue.png";
import alvinIconWhite from "@/app/images/alvin-icon-white.png";
const components = {
    p: ({ children }) => {
        const text = typeof children === 'string' ? children : '';
        const isExplainPrompt = text.includes('Would you like me to explain this in more detail');
        if (isExplainPrompt) {
            return (<div className="explain-prompt">
          <span style={{ fontSize: '1.1em' }}>💬</span>
          {children}
        </div>);
        }
        return (<p className="markdown-paragraph">
        {children}
      </p>);
    },
    strong: ({ children }) => (<strong className="markdown-strong text-blue-600 font-semibold">
      {children}
    </strong>),
    ul: ({ children }) => {
        return (<ul className="space-y-2 my-3 list-none pl-0">
        {children}
      </ul>);
    },
    li: ({ children }) => {
        return (<li className="markdown-list-item flex items-start gap-2">
        <span className="markdown-checkmark text-green-600 dark:text-green-400 font-bold mt-0.5 flex-shrink-0">✓</span>
        <span className="flex-1">{children}</span>
      </li>);
    },
    ol: ({ children }) => (<ol style={{
            margin: '0.6em 0 0.6em 1.2em',
            listStyle: 'decimal',
            paddingLeft: '0.3em'
        }}>
      {children}
    </ol>),
    h3: ({ children }) => (<h3 className="markdown-h3">
      <span className="markdown-icon">📋</span>
      {children}
    </h3>),
    h4: ({ children }) => (<h4 className="markdown-h4">
      <span className="markdown-icon">ℹ️</span>
      {children}
    </h4>),
    blockquote: ({ children }) => (<blockquote className="markdown-blockquote">
      <span className="markdown-blockquote-icon">💡</span>
      {children}
    </blockquote>),
    table: ({ children }) => (<div className="overflow-x-auto my-4">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>),
    thead: ({ children }) => (<thead className="bg-gray-100 dark:bg-gray-800">
      {children}
    </thead>),
    tbody: ({ children }) => (<tbody className="bg-white dark:bg-gray-900">
      {children}
    </tbody>),
    tr: ({ children }) => (<tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      {children}
    </tr>),
    th: ({ children }) => (<th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
      {children}
    </th>),
    td: ({ children }) => (<td className="px-4 py-3 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
      {children}
    </td>),
};
function cleanMarkdown(text) {
    // Replace 3+ newlines with just 2
    return text.replace(/\n{3,}/g, '\n\n');
}
export function ChatMessage({ message, onSuggestionClick, theme }) {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    return (<div className={cn("flex items-start gap-3 animate-in fade-in duration-300", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (<Avatar className="h-8 w-8 border">
          <AvatarFallback className="bg-card">
            {isSystem ? (<AlertTriangle className="h-5 w-5 text-amber-500"/>) : (<img src={theme === "dark" ? alvinIconWhite.src : alvinIconBlue.src} alt="Alvin Bot" className="h-5 w-5 object-contain"/>)}
          </AvatarFallback>
        </Avatar>)}
      <div className="flex flex-col gap-2">
        <div className={cn("max-w-2xl rounded-lg px-6 py-5 text-sm shadow-sm relative overflow-x-auto max-w-full break-words", isUser
            ? "chat-message-user"
            : isSystem
                ? "bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200"
                : "chat-message-ai", isSystem && "w-full text-left")}>
          <div className={cn("markdown-content formal-answer prose prose-sm max-w-none break-words overflow-x-auto", isUser && "prose-invert [&_*]:!text-white [&_p]:!text-white [&_strong]:!text-white [&_em]:!text-white [&_li]:!text-white [&_.markdown-paragraph]:!text-white [&_.markdown-strong]:!text-white [&_.markdown-list-item]:!text-white [&_*]:!text-white")} style={isUser ? { color: 'white !important' } : undefined}>
            <ReactMarkdown children={cleanMarkdown(message.content)} allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'h3', 'h4', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td']} components={components}/>
          </div>
        </div>
        {message.suggestions && message.suggestions.length > 0 && (<div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (<Button key={index} variant="outline" size="sm" onClick={() => onSuggestionClick === null || onSuggestionClick === void 0 ? void 0 : onSuggestionClick(suggestion)} className="text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:border-blue-600 dark:hover:text-blue-300">
                {suggestion}
              </Button>))}
          </div>)}
      </div>
      {isUser && (<div className="group relative">
          <Avatar className="h-8 w-8 border-2 border-white shadow-md transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg">
            <AvatarFallback className="bg-white text-blue-600 font-semibold">
              <User className="h-5 w-5"/>
            </AvatarFallback>
          </Avatar>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            You
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=chat-message.jsx.map