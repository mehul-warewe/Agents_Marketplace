'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';

interface ParameterFieldProps {
  field: any;
  value: any;
  onChange: (val: any) => void;
  isRequired?: boolean;
}

export function ParameterField({ field, value, onChange, isRequired }: ParameterFieldProps) {
  const required = isRequired || field.required;

  if (field.type === 'textarea') {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs font-semibold text-foreground/70">
            {field.label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.description && (
            <div className="group relative">
              <HelpCircle size={12} className="text-foreground/40 cursor-help" />
              <div className="absolute bottom-full left-0 hidden group-hover:block bg-foreground text-background text-[10px] p-2 rounded max-w-[200px] mb-1 z-50 whitespace-normal">
                {field.description}
              </div>
            </div>
          )}
        </div>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.example || field.description || 'Enter value...'}
          rows={4}
          className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-sm outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5 font-mono text-xs resize-vertical"
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs font-semibold text-foreground/70">
            {field.label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.description && (
            <div className="group relative">
              <HelpCircle size={12} className="text-foreground/40 cursor-help" />
              <div className="absolute bottom-full left-0 hidden group-hover:block bg-foreground text-background text-[10px] p-2 rounded max-w-[200px] mb-1 z-50 whitespace-normal">
                {field.description}
              </div>
            </div>
          )}
        </div>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          placeholder={field.example || field.description || 'Enter number...'}
          className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-sm outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5"
        />
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="mb-4 flex items-center gap-3">
        <label className="text-xs font-semibold text-foreground/70">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="checkbox"
          checked={value === true || value === 'true'}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 cursor-pointer accent-foreground"
        />
        {field.description && (
          <p className="text-[10px] text-foreground/40">{field.description}</p>
        )}
      </div>
    );
  }

  // Default: text input
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-semibold text-foreground/70">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <div className="group relative">
            <HelpCircle size={12} className="text-foreground/40 cursor-help" />
            <div className="absolute bottom-full left-0 hidden group-hover:block bg-foreground text-background text-[10px] p-2 rounded max-w-[200px] mb-1 z-50 whitespace-normal">
              {field.description}
            </div>
          </div>
        )}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.example || field.description || 'Enter value...'}
        className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-sm outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5"
      />
      {field.example && (
        <p className="text-[10px] text-foreground/40 mt-1">Example: {field.example}</p>
      )}
    </div>
  );
}
