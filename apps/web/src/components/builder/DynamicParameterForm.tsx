'use client';

/**
 * Dynamic Parameter Form Component
 * Renders form fields based on JSON Schema
 * Supports text, textarea, select, boolean, number, email, url, etc.
 */

import React, { useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
      <div className="text-[10px] font-medium text-muted-foreground/40 py-4 text-center border border-dashed border-border rounded-xl">
        No configurable parameters
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedFields.map(([key, prop]) => (
        <div key={key} className="space-y-1.5 p-0.5 group/field">
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
      <div className="flex items-center justify-between gap-2 px-0.5">
        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
          {label}
        </label>
        {isRequired && (
          <span className="text-[8px] font-black uppercase text-red-500/80 tracking-widest bg-red-500/5 px-1.5 py-0.5 rounded-md border border-red-500/10">
            Required
          </span>
        )}
      </div>

      {description && (
        <p className="text-[9px] text-muted-foreground/40 leading-relaxed font-medium mb-1.5 line-clamp-2 italic">
          {description}
        </p>
      )}

      <div className="relative">
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
    </div>
  );
}

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
      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-[12px] font-medium text-foreground outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-muted-foreground/30"
    />
  );
}

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
      className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-xl hover:border-indigo-500/40 transition-all text-left w-full group"
    >
      <div className={`relative w-8 h-4 rounded-full transition-all duration-300 border shrink-0 ${
        active 
          ? 'bg-indigo-500 border-indigo-600' 
          : 'bg-background border-border'
      }`}>
        <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 size-2.5 rounded-full ${
          active 
            ? 'left-[18px] bg-white' 
            : 'left-[2.5px] bg-muted-foreground/30'
        }`} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
        Enable {label}
      </span>
    </button>
  );
}

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
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-background border rounded-xl text-[12px] font-medium transition-all ${
          isOpen ? 'border-indigo-500/60 ring-2 ring-indigo-500/10 shadow-sm' : 'border-border hover:border-border/80'
        } ${value ? 'text-foreground' : 'text-muted-foreground/30'}`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-foreground' : 'text-muted-foreground/30'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl py-1 max-h-[200px] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-[10px] font-bold text-muted-foreground/30 text-center uppercase tracking-widest uppercase">No choices detected</div>
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
                className={`w-full px-4 py-2 text-left text-[11px] font-bold transition-all flex items-center justify-between group ${
                  isSelected ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-muted text-muted-foreground/60 hover:text-foreground'
                }`}
              >
                <span>{lab}</span>
                {isSelected && <Check size={12} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
