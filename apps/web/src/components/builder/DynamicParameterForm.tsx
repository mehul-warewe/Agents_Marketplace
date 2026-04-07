'use client';

/**
 * Dynamic Parameter Form Component
 * Renders form fields based on JSON Schema
 * Supports text, textarea, select, boolean, number, email, url, etc.
 */

import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface DynamicParameterFormProps {
  schema: Record<string, any>;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
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
}

/**
 * Renders form fields based on JSON schema
 * Supports common field types: text, textarea, select, checkbox, number, etc.
 */
export default function DynamicParameterForm({
  schema,
  values,
  onChange
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
    <div className="space-y-3">
      {sortedFields.map(([key, prop]) => (
        <FormField
          key={key}
          fieldKey={key}
          property={prop}
          value={values[key]}
          isRequired={required.has(key)}
          onChange={(v) => handleChange(key, v)}
        />
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
}

function FormField({
  fieldKey,
  property,
  value,
  isRequired,
  onChange
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
  else if (description.toLowerCase().includes('email')) fieldType = 'email';
  else if (description.toLowerCase().includes('url')) fieldType = 'url';
  else if (description.toLowerCase().includes('password')) fieldType = 'password';
  else if (type === 'string' && (property.minLength ?? 0) > 100) fieldType = 'textarea';

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2">
        <span className="text-xs font-semibold capitalize text-foreground">
          {label}
        </span>
        {isRequired && <span className="text-red-500">*</span>}
      </label>

      {description && (
        <p className="text-xs text-muted/60">{description}</p>
      )}

      {fieldType === 'select' && property.enum ? (
        <SelectField
          value={value}
          options={property.enum}
          onChange={onChange}
          placeholder={`Select ${label}...`}
        />
      ) : fieldType === 'checkbox' ? (
        <CheckboxField
          value={value}
          onChange={onChange}
          label={label}
        />
      ) : fieldType === 'number' ? (
        <NumberField
          value={value}
          onChange={onChange}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      ) : fieldType === 'textarea' ? (
        <TextareaField
          value={value}
          onChange={onChange}
          placeholder={`Enter ${label.toLowerCase()}...`}
          rows={3}
        />
      ) : (
        <InputField
          type={fieldType}
          value={value}
          onChange={onChange}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      )}
    </div>
  );
}

/**
 * Text input field
 */
function InputField({
  type,
  value,
  onChange,
  placeholder
}: {
  type: string;
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-sm outline-none focus:border-foreground/40 transition-colors"
    />
  );
}

/**
 * Textarea field
 */
function TextareaField({
  value,
  onChange,
  placeholder,
  rows = 3
}: {
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-sm outline-none focus:border-foreground/40 transition-colors resize-none"
    />
  );
}

/**
 * Number field
 */
function NumberField({
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
      className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-sm outline-none focus:border-foreground/40 transition-colors"
    />
  );
}

/**
 * Checkbox field
 */
function CheckboxField({
  value,
  onChange,
  label
}: {
  value: any;
  onChange: (v: any) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked ? true : false)}
        className="w-4 h-4 rounded border border-border/40 bg-foreground/[0.03]"
      />
      <span className="text-xs text-foreground/80">Enable {label}</span>
    </label>
  );
}

/**
 * Select dropdown field
 */
function SelectField({
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-sm hover:border-border/80 transition-colors"
      >
        <span className={value ? 'text-foreground' : 'text-muted/60'}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-foreground/5 transition-colors ${
                value === option ? 'bg-foreground text-background font-semibold' : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
