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
 * - Fixed overlap and layout issues
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
    // We use a pattern that matches technical tokens without corrupting previously added HTML.
    // The key is to match EVERYTHING that needs highlighting in one pass.
    
    // Pattern parts:
    // A: Keys -> (&quot;.*&quot;)(\s*:)
    // B: Values (strings) -> (:\s*)(&quot;.*&quot;)
    // C: Literals -> \b(true|false|null)\b
    // D: Numbers -> \b(\d+(?:\.\d+)?)\b
    // E: Variables -> \{\{\s*[\s\S]+?\s*\}\}

    const tokenRegex = /(&quot;[^&]*&quot;(?:\s*:))|(:\s*&quot;[^&]*&quot;)|(\b(?:true|false|null)\b)|(\b\d+(?:\.\d+)?\b)|(\{\{\s*[\s\S]+?\s*\}\})/g;

    const processed = stringValue.replace(tokenRegex, (match, key, val, literal, num, variable) => {
      if (key) {
        return `<span style="color: #a5b4fc; font-weight: 600;">${key}</span>`;
      }
      if (val) {
        const colonPart = val.match(/^:\s*/);
        const prefix = colonPart ? colonPart[0] : ': ';
        const content = val.substring(prefix.length);
        return `${prefix}<span style="color: #fcd34d;">${content}</span>`;
      }
      if (literal) {
        return `<span style="color: #f472b6; font-weight: 600;">${literal}</span>`;
      }
      if (num) {
        return `<span style="color: #60a5fa;">${num}</span>`;
      }
      if (variable) {
        return (
          `<span style="
            background: rgba(16, 185, 129, 0.15); 
            border: 1px solid rgba(16, 185, 129, 0.35); 
            color: #10b981; 
            font-weight: 800; 
            border-radius: 6px; 
            padding: 0px 5px; 
            margin: 0 1px; 
            display: inline-block; 
            line-height: normal;
            text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
            font-family: inherit;
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

    // ─── TAB SUPPORT ──────────────────────────────────────────────────────────
    if (e.key === 'Tab') {
      e.preventDefault();
      const newVal = val.substring(0, pos) + '  ' + val.substring(endPos);
      onChange(newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = pos + 2;
      }, 0);
      return;
    }

    // ─── SMART ENTER (AUTO-INDENT) ─────────────────────────────────────────────
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

    // ─── AUTO-BRACKETS / QUOTES / STEP-OVER ───────────────────────────────────
    const pairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')',
      '"': '"',
      "'": "'",
    };

    const closingChars = new Set(['}', ']', ')', '"', "'"]);

    // STEP-OVER LOGIC
    if (closingChars.has(e.key) && val.charAt(pos) === e.key && pos === endPos) {
      e.preventDefault();
      target.selectionStart = target.selectionEnd = pos + 1;
      return;
    }

    if (pairs[e.key]) {
      // ─── SPECIAL CASE: VARIABLE PICKER TRIGGER {{ ───
      if (e.key === '{' && val.charAt(pos - 1) === '{') {
        e.preventDefault();
        const newVal = val.substring(0, pos) + '{}}' + val.substring(pos);
        onChange(newVal);
        
        if (onTriggerPicker) {
          const rect = target.getBoundingClientRect();
          // Provide coordinates for the popover
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

    // ─── BACKSPACE PROTECTION ──────────────────────────────────────────────────
    if (e.key === 'Backspace' && pos === endPos) {
      const textBefore = val.substring(0, pos);
      const textAfter = val.substring(pos);

      // Variable tags
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

      // Smart-Backspace
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
      
      const lastStart = textBefore.lastIndexOf('{{');
      const lastEnd = textBefore.lastIndexOf('}}');
      const nextEnd = textAfter.indexOf('}}');
      const nextStart = textAfter.indexOf('{{');

      if (lastStart > lastEnd && nextEnd !== -1 && (nextStart === -1 || nextEnd < nextStart)) {
        e.preventDefault();
        const newVal = val.substring(0, lastStart) + val.substring(pos + nextEnd + 2);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = lastStart;
        }, 0);
        return;
      }
    }
  };

  const commonStyles: React.CSSProperties = {
    lineHeight: '1.6',
    fontFamily: mono ? '"JetBrains Mono", "Roboto Mono", monospace' : '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontSize: '12px',
    letterSpacing: '0.01em',
    wordBreak: 'break-word',
    padding: '12px 16px',
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
    color: 'transparent', // Make text transparent to see highlights beneath
    caretColor: '#10b981', // Vivid emerald caret
    position: 'relative',
    zIndex: 1,
    resize: textarea ? 'vertical' : 'none',
  };

  const backdropStyles: React.CSSProperties = {
    ...commonStyles,
    position: 'absolute',
    top: 0,
    left: 0,
    color: 'var(--foreground)', // Standardize on theme-aware foreground
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
      bg-secondary
      group-hover:bg-muted
      focus-within:border-indigo-500/40 focus-within:bg-card 
      focus-within:shadow-xl
      transition-all duration-300
      ${className}
    `}>
      <div 
        ref={backdropRef}
        aria-hidden="true"
        className="custom-scrollbar antialiased opacity-80"
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
          className="custom-scrollbar antialiased"
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
