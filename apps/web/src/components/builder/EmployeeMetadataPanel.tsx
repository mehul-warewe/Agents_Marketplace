'use client';

import React from 'react';
import { Activity, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EmployeeMetadataPanelProps {
  description: string;
  onDescriptionChange: (v: string) => void;
  inputSchema: string;
  onInputSchemaChange: (v: string) => void;
}

export default function EmployeeMetadataPanel({
  description,
  onDescriptionChange,
  inputSchema,
  onInputSchemaChange,
}: EmployeeMetadataPanelProps) {
  // Validate JSON schema
  const schemaError = (() => {
    if (!inputSchema.trim()) return null;
    try {
      JSON.parse(inputSchema);
      return null;
    } catch (e) {
      return 'Invalid JSON';
    }
  })();

  return (
    <div className="w-[420px] bg-card border-l border-border/60 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={16} className="text-accent" />
          <h2 className="text-sm font-black uppercase tracking-widest text-accent">Employee Identity</h2>
        </div>
        <p className="text-[11px] text-muted font-bold italic">Configure how Managers will discover and call this employee.</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {/* Capability Description */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest opacity-60 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Capability Description
          </label>
          <p className="text-[10px] text-muted/60 italic font-bold mb-3">
            Describe what this employee can do. The Manager AI uses this to decide when to delegate tasks.
          </p>
          <textarea
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            className="w-full bg-foreground/5 border border-border/40 rounded-2xl px-4 py-3 outline-none focus:bg-background focus:border-foreground/40 transition-all font-bold text-sm tracking-tight italic shadow-inner resize-none"
            placeholder="e.g., Searches the web for current information and summarizes findings..."
            rows={4}
          />
          {description.length > 0 && (
            <p className="text-[9px] text-muted/60 italic">{description.length} characters</p>
          )}
        </div>

        {/* Input Schema */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest opacity-60 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Input Schema (JSON)
          </label>
          <p className="text-[10px] text-muted/60 italic font-bold mb-3">
            Define the expected input structure as JSON Schema. Leave empty if no inputs needed.
          </p>
          <textarea
            value={inputSchema}
            onChange={e => onInputSchemaChange(e.target.value)}
            className={`w-full bg-foreground/5 border rounded-2xl px-4 py-3 outline-none focus:bg-background transition-all font-mono text-xs shadow-inner resize-none ${
              schemaError
                ? 'border-red-500/40 focus:border-red-500/60'
                : 'border-border/40 focus:border-foreground/40'
            }`}
            placeholder='{"topic": "string", "depth": "number"}'
            rows={5}
          />

          {/* Validation Indicator */}
          <div className="flex items-center gap-2">
            {schemaError ? (
              <>
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-[9px] text-red-500 font-bold">{schemaError}</span>
              </>
            ) : inputSchema.trim() ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[9px] text-emerald-500 font-bold">Valid JSON</span>
              </>
            ) : (
              <span className="text-[9px] text-muted/60 italic">(Optional)</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 border-t border-border/40 bg-foreground/[0.01] shrink-0">
        <p className="text-[9px] text-muted/50 italic font-bold">
          💡 Tip: Clear, concise descriptions help managers understand when to use this employee. Include the purpose and expected outputs.
        </p>
      </div>
    </div>
  );
}
