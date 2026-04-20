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
      <div className="p-4 bg-card border border-border shadow-soft rounded-2xl mb-4 hover:border-indigo-500/20 transition-all group/field">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            {field.label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.description && (
            <div className="group/tip relative">
              <HelpCircle size={12} className="text-muted-foreground/30 cursor-help hover:text-indigo-500 transition-colors" />
              <div className="absolute bottom-full left-0 hidden group-hover/tip:block bg-card border border-border shadow-2xl text-foreground text-[9px] font-bold uppercase tracking-widest p-3 rounded-xl max-w-[200px] mb-2 z-50 whitespace-normal animate-in fade-in slide-in-from-bottom-1 duration-200">
                {field.description}
              </div>
            </div>
          )}
        </div>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.example || field.description || 'Enter logic...'}
          rows={4}
          className="w-full px-4 py-3 bg-secondary border border-border/40 rounded-xl text-[12px] font-medium text-foreground outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-muted-foreground/20 resize-none leading-relaxed"
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="p-4 bg-card border border-border shadow-soft rounded-2xl mb-4 hover:border-indigo-500/20 transition-all group/field">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            {field.label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.description && (
            <div className="group/tip relative">
              <HelpCircle size={12} className="text-muted-foreground/30 cursor-help hover:text-indigo-500 transition-colors" />
              <div className="absolute bottom-full left-0 hidden group-hover/tip:block bg-card border border-border shadow-2xl text-foreground text-[9px] font-bold uppercase tracking-widest p-3 rounded-xl max-w-[200px] mb-2 z-50 whitespace-normal animate-in fade-in slide-in-from-bottom-1 duration-200">
                {field.description}
              </div>
            </div>
          )}
        </div>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          placeholder={field.example || field.description || '0'}
          className="w-full px-4 py-3 bg-secondary border border-border/40 rounded-xl text-[12px] font-bold text-foreground outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-muted-foreground/20"
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
    <div className="p-4 bg-card border border-border shadow-soft rounded-2xl mb-4 hover:border-indigo-500/20 transition-all group/field">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <div className="group/tip relative">
            <HelpCircle size={12} className="text-muted-foreground/30 cursor-help hover:text-indigo-500 transition-colors" />
            <div className="absolute bottom-full left-0 hidden group-hover/tip:block bg-card border border-border shadow-2xl text-foreground text-[9px] font-bold uppercase tracking-widest p-3 rounded-xl max-w-[200px] mb-2 z-50 whitespace-normal animate-in fade-in slide-in-from-bottom-1 duration-200">
              {field.description}
            </div>
          </div>
        )}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.example || field.description || 'Enter signal...'}
        className="w-full px-4 py-3 bg-secondary border border-border/40 rounded-xl text-[12px] font-medium text-foreground outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-muted-foreground/20"
      />
      {field.example && (
        <p className="text-[9px] font-bold text-indigo-500/40 border-l border-indigo-500/20 pl-2 mt-3 uppercase tracking-widest">Example: {field.example}</p>
      )}
    </div>
  );
}
