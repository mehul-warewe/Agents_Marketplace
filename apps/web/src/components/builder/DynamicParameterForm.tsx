'use client';

/**
 * Dynamic Parameter Form Component
 * Renders form fields based on JSON Schema
 * Supports text, textarea, select, boolean, number, email, url, etc.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap } from 'lucide-react';

import SmartInput from '@/components/builder/SmartInput';

interface DynamicParameterFormProps {
  schema: Record<string, any>;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onTriggerPicker?: (fieldKey: string, pos: { x: number, y: number }, cursorPos: number) => void;
}

interface SchemaProperty {
  type?: string;
  title?: string;
  description?: string;
  enum?: any[];
  default?: any;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
  items?: any;
  properties?: Record<string, any>;
  options?: any[];
}

/**
 * Renders form fields based on JSON schema
 * Supports common field types: text, textarea, select, checkbox, number, etc.
 */
export default function DynamicParameterForm({
  schema,
  values,
  onChange,
  onTriggerPicker
}: DynamicParameterFormProps) {
  const properties = (schema.properties || {}) as Record<string, SchemaProperty>;
  const required = new Set(schema.required || []);

  const sortedFields = useMemo(() => {
    return Object.entries(properties)
      .sort(([, a], [, b]) => {
        // Required fields first
        const aRequired = required.has(a.title || '');
        const bRequired = required.has(b.title || '');
        if (aRequired !== bRequired) return aRequired ? -1 : 1;
        return 0;
      });
  }, [properties, required]);

  const handleChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  if (sortedFields.length === 0) {
    return (
      <div className="text-xs text-muted/60 py-2">
        No parameters available
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5 bg-secondary border border-border/60 rounded-3xl shadow-inner">
      {sortedFields.map(([key, prop]) => (
        <div key={key} className="p-5 bg-card border border-border shadow-md rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300 hover:border-indigo-500/20 transition-all group/field">
          <FormField
            fieldKey={key}
            property={prop}
            value={values[key]}
            isRequired={required.has(key)}
            onChange={(v) => handleChange(key, v)}
            onTriggerPicker={onTriggerPicker}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Individual form field component
 */
interface FormFieldProps {
  fieldKey: string;
  property: SchemaProperty;
  value: any;
  isRequired: boolean;
  onChange: (value: any) => void;
  onTriggerPicker?: (fieldKey: string, pos: { x: number, y: number }, cursorPos: number) => void;
}

function FormField({
  fieldKey,
  property,
  value,
  isRequired,
  onChange,
  onTriggerPicker
}: FormFieldProps) {
  const label = property.title || fieldKey.replace(/_/g, ' ');
  const description = property.description || '';
  const type = property.type || 'string';

  // Determine field type
  let fieldType = 'text';
  if (property.enum) fieldType = 'select';
  else if (type === 'boolean') fieldType = 'checkbox';
  else if (type === 'number' || type === 'integer') fieldType = 'number';
  else if (type === 'array') fieldType = 'textarea';
  else if (property.title?.toLowerCase().includes('date') || property.title?.toLowerCase().includes('time') || fieldKey.toLowerCase().includes('date')) fieldType = 'datetime-local';
  else if (description.toLowerCase().includes('email')) fieldType = 'email';
  else if (description.toLowerCase().includes('url')) fieldType = 'url';
  else if (description.toLowerCase().includes('password')) fieldType = 'password';
  else if (type === 'string' && (property.minLength ?? 0) > 100) fieldType = 'textarea';

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">
          {label}
        </span>
        {isRequired && (
          <span className="flex items-center gap-1">
             <span className="text-red-500 font-bold">*</span>
             <span className="text-[8px] font-bold uppercase text-red-500/60 tracking-widest bg-red-400/5 px-1 rounded">Required</span>
          </span>
        )}
      </label>

      {description && (
        <p className="text-[9px] text-muted-foreground/40 leading-relaxed italic mb-1">{description}</p>
      )}

      {fieldType === 'boolean' || fieldType === 'bool' ? (
        <CheckboxField
          value={value}
          onChange={onChange}
          label={label}
        />
      ) : fieldType === 'select' ? (
        <SelectField
          value={value}
          options={property.enum || property.options || []}
          onChange={onChange}
          placeholder={`Select ${label.toLowerCase()}...`}
        />
      ) : fieldType === 'number' ? (
        <NumberField
          value={value}
          onChange={onChange}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      ) : fieldType === 'textarea' ? (
        <SmartInput
          textarea
          rows={3}
          value={value}
          onChange={(val) => onChange(val)}
          placeholder={`Enter ${label.toLowerCase()}...`}
          onTriggerPicker={(pos, cursor) => onTriggerPicker?.(fieldKey, pos, cursor)}
        />
      ) : (
        <SmartInput
          value={value}
          onChange={(val) => onChange(val)}
          placeholder={`Enter ${label.toLowerCase()}...`}
          onTriggerPicker={(pos, cursor) => onTriggerPicker?.(fieldKey, pos, cursor)}
        />
      )}
    </div>
  );
}

/**
 * Number field
 */
export function NumberField({
  value,
  onChange,
  placeholder
}: {
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      placeholder={placeholder}
      className="w-full bg-card border border-border shadow-soft rounded-xl py-2.5 px-4 text-[12px] font-bold text-foreground outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-muted-foreground/20"
    />
  );
}

/**
 * Checkbox field (Toggle Switch UI)
 */
export function CheckboxField({
  value,
  onChange,
  label
}: {
  value: any;
  onChange: (v: any) => void;
  label: string;
}) {
  const active = value === true;
  return (
    <button 
      onClick={() => onChange(!active)}
      className="flex items-center gap-3 group text-left transition-colors"
    >
      <div className={`relative w-9 h-5 rounded-full transition-all duration-300 border ${
        active 
          ? 'bg-indigo-500/10 border-indigo-500/40' 
          : 'bg-secondary border-border/40'
      }`}>
        <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 size-3 rounded-full ${
          active 
            ? 'left-[22px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
            : 'left-[4px] bg-muted-foreground/30'
        }`} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 group-hover:text-foreground/80 transition-colors">
        Enable {label}
      </span>
    </button>
  );
}

/**
 * Select dropdown field (Custom UI)
 */
export function SelectField({
  value,
  options,
  onChange,
  placeholder
}: {
  value: any;
  options: any[];
  onChange: (v: any) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedOption = options.find(o => (typeof o === 'object' ? o.value : o) === value);
  const selectedLabel = typeof selectedOption === 'object' ? selectedOption.label : selectedOption;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-card border rounded-xl text-[12px] font-bold uppercase tracking-tight transition-all ${
          isOpen ? 'border-indigo-500/40 ring-4 ring-indigo-500/5 shadow-lg shadow-indigo-500/5' : 'border-border hover:border-border/80 shadow-soft'
        } ${value ? 'text-foreground' : 'text-muted-foreground/30'}`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : 'text-muted-foreground/30'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border shadow-2xl py-1 max-h-[200px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-[10px] italic text-muted-foreground/30 text-center uppercase tracking-widest">No options cataloged</div>
          ) : options.map((opt, i) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lab = typeof opt === 'object' ? opt.label : opt;
            const isSelected = val === value;

            return (
              <button
                key={i}
                onClick={() => {
                  onChange(val);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-[11px] font-bold uppercase tracking-tight transition-all flex items-center justify-between group ${
                  isSelected ? 'bg-indigo-500/10 text-indigo-500' : 'hover:bg-muted text-muted-foreground/60 hover:text-foreground'
                }`}
              >
                <span>{lab}</span>
                {isSelected && <Check size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
