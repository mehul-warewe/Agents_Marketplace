'use client';

import React, { useRef, useMemo, useEffect } from 'react';

/**
 * SmartInput Component
 * Provides a rich text-like experience for plain text inputs/textareas.
 * Features:
 * - Syntax highlighting for {{ variable }} tags
 * - Auto-closing braces
 * - Smart deletion (backspace on variable tags)
 * - Variable picker trigger on '{{'
 */

interface SmartInputProps {
  value: string;
  onChange: (val: string) => void;
  onTriggerPicker?: (pos: { x: number; y: number }, cursorPos: number) => void;
  variables?: any[]; 
  placeholder?: string;
  rows?: number;
  className?: string;
  textarea?: boolean;
  mono?: boolean;
}

export default function SmartInput({
  value,
  onChange,
  onTriggerPicker,
  variables,
  placeholder,
  rows = 4,
  className = '',
  textarea = false,
  mono = false
}: SmartInputProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Sync scroll
  useEffect(() => {
    const syncScroll = () => {
      if (backdropRef.current && inputRef.current) {
        backdropRef.current.scrollTop = inputRef.current.scrollTop;
        backdropRef.current.scrollLeft = inputRef.current.scrollLeft;
      }
    };
    
    const input = inputRef.current;
    if (input) {
      input.addEventListener('scroll', syncScroll);
      return () => input.removeEventListener('scroll', syncScroll);
    }
  }, []);

  const highlighted = useMemo(() => {
    let stringValue = String(value ?? '');
    if (!stringValue) return '';
    
    // 1. ESCAPE HTML to prevent injection issues in backdrop
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    stringValue = escapeHtml(stringValue);

    // 2. TOKEN-SAFE HIGHLIGHTING (Single Pass)
    const tokenRegex = /(&quot;[^&]*&quot;(?:\s*:))|(:\s*&quot;[^&]*&quot;)|(\b(?:true|false|null)\b)|(\b\d+(?:\.\d+)?\b)|(\{\{\s*[\s\S]+?\s*\}\})/g;

    const processed = stringValue.replace(tokenRegex, (match, key, val, literal, num, variable) => {
      if (key) {
        return `<span style="color: #6366f1; font-weight: 700;">${key}</span>`;
      }
      if (val) {
        const colonPart = val.match(/^:\s*/);
        const prefix = colonPart ? colonPart[0] : ': ';
        const content = val.substring(prefix.length);
        return `${prefix}<span style="color: #059669; font-weight: 500;">${content}</span>`;
      }
      if (literal) {
        return `<span style="color: #db2777; font-weight: 700;">${literal}</span>`;
      }
      if (num) {
        return `<span style="color: #2563eb; font-weight: 600;">${num}</span>`;
      }
      if (variable) {
        return (
          `<span style="
            background: #6366f115; 
            border: 1px solid #6366f130; 
            color: #6366f1; 
            font-weight: 800; 
            border-radius: 6px; 
            padding: 1px 4px; 
            margin: 0 1px; 
            display: inline-block; 
            line-height: normal;
            font-family: inherit;
            font-size: 0.95em;
          ">${variable}</span>`
        );
      }
      return match;
    });

    return processed.replace(/\n/g, '<br/>');
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    
    onChange(val);

    if (onTriggerPicker && val && pos >= 2 && val.charAt(pos - 1) === '{' && val.charAt(pos - 2) === '{') {
      const rect = e.target.getBoundingClientRect();
      onTriggerPicker({ x: rect.left, y: rect.top }, pos);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const pos = e.currentTarget.selectionStart || 0;
    const endPos = e.currentTarget.selectionEnd || 0;
    const target = e.currentTarget;
    const val = value || '';

    // TAB SUPPORT
    if (e.key === 'Tab') {
      e.preventDefault();
      const newVal = val.substring(0, pos) + '  ' + val.substring(endPos);
      onChange(newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = pos + 2;
      }, 0);
      return;
    }

    // SMART ENTER (AUTO-INDENT)
    if (e.key === 'Enter' && textarea) {
      const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
      const currentLine = val.substring(lineStart, pos);
      const indentMatch = currentLine.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : '';
      
      const lastChar = val.charAt(pos - 1);
      const isBlockOpen = lastChar === '{' || lastChar === '[';
      
      if (isBlockOpen) {
        e.preventDefault();
        const newIndent = indent + '  ';
        const newVal = val.substring(0, pos) + '\n' + newIndent + '\n' + indent + val.substring(endPos);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = pos + 1 + newIndent.length;
        }, 0);
        return;
      } else if (indent.length > 0) {
        e.preventDefault();
        const newVal = val.substring(0, pos) + '\n' + indent + val.substring(endPos);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = pos + 1 + indent.length;
        }, 0);
        return;
      }
    }

    // AUTO-BRACKETS
    const pairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')',
      '"': '"',
      "'": "'",
    };

    const closingChars = new Set(['}', ']', ')', '"', "'"]);

    if (closingChars.has(e.key) && val.charAt(pos) === e.key && pos === endPos) {
      e.preventDefault();
      target.selectionStart = target.selectionEnd = pos + 1;
      return;
    }

    if (pairs[e.key]) {
      if (e.key === '{' && val.charAt(pos - 1) === '{') {
        e.preventDefault();
        const newVal = val.substring(0, pos) + '{}}' + val.substring(pos);
        onChange(newVal);
        
        if (onTriggerPicker) {
          const rect = target.getBoundingClientRect();
          onTriggerPicker({ x: rect.left, y: rect.top }, pos + 1);
        }
        
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = pos + 1;
        }, 0);
        return;
      }

      if (pos !== endPos) {
        e.preventDefault();
        const selected = val.substring(pos, endPos);
        const newVal = val.substring(0, pos) + e.key + selected + pairs[e.key] + val.substring(endPos);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = pos + 1;
          target.selectionEnd = endPos + 1;
        }, 0);
        return;
      } else {
        e.preventDefault();
        const newVal = val.substring(0, pos) + e.key + pairs[e.key] + val.substring(pos);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = pos + 1;
        }, 0);
        return;
      }
    }

    // BACKSPACE PROTECTION
    if (e.key === 'Backspace' && pos === endPos) {
      const textBefore = val.substring(0, pos);
      const textAfter = val.substring(pos);

      if (textBefore.endsWith('}}')) {
        const startIdx = textBefore.lastIndexOf('{{');
        if (startIdx !== -1) {
          e.preventDefault();
          const newVal = val.substring(0, startIdx) + textAfter;
          onChange(newVal);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = startIdx;
          }, 0);
          return;
        }
      }

      const lastChar = textBefore.charAt(textBefore.length - 1);
      const nextChar = textAfter.charAt(0);
      if (pairs[lastChar] === nextChar) {
        e.preventDefault();
        const newVal = val.substring(0, pos - 1) + val.substring(pos + 1);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = pos - 1;
        }, 0);
        return;
      }
    }
  };

  const commonStyles: React.CSSProperties = {
    lineHeight: '1.6',
    fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit',
    fontSize: '12px',
    letterSpacing: '0.01em',
    wordBreak: 'break-word',
    padding: '12px 14px',
    minHeight: textarea ? `${rows * 1.6}em` : '42px',
    margin: 0,
    border: 'none',
    boxSizing: 'border-box',
    width: '100%',
    textAlign: 'left',
  };

  const inputStyles: React.CSSProperties = {
    ...commonStyles,
    background: 'transparent',
    outline: 'none',
    color: 'transparent',
    caretColor: '#6366f1',
    position: 'relative',
    zIndex: 1,
    resize: textarea ? 'vertical' : 'none',
  };

  const backdropStyles: React.CSSProperties = {
    ...commonStyles,
    position: 'absolute',
    top: 0,
    left: 0,
    color: 'var(--foreground)',
    zIndex: 0,
    pointerEvents: 'none',
    overflowY: 'auto',
    overflowX: 'hidden',
    whiteSpace: 'pre-wrap',
    height: '100%',
  };

  return (
    <div className={`
      relative w-full overflow-hidden rounded-xl border border-border 
      bg-background
      focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/10
      transition-all duration-300
      ${className}
    `}>
      <div 
        ref={backdropRef}
        aria-hidden="true"
        className="no-scrollbar antialiased opacity-90"
        style={backdropStyles}
        dangerouslySetInnerHTML={{ __html: highlighted + (textarea ? '<br/>' : '') }}
      />
      
      {textarea ? (
        <textarea
          ref={inputRef as any}
          value={value ?? ''}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={rows}
          placeholder={placeholder}
          spellCheck={false}
          className="no-scrollbar antialiased"
          style={inputStyles}
        />
      ) : (
        <input
          ref={inputRef as any}
          type="text"
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          className="antialiased"
          style={inputStyles}
        />
      )}
    </div>
  );
}
