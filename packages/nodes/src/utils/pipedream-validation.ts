/**
 * Pipedream Action Parameter Validation
 * Validates and sanitizes parameters before sending to Pipedream
 */

import { ToolContext } from '../types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: Record<string, any>;
}

/**
 * Validate action configuration
 */
export function validateActionConfig(config: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sanitized = { ...config };

  // Required fields
  if (!config.appSlug) {
    errors.push('appSlug is required');
  }

  if (!config.actionName) {
    errors.push('actionName is required');
  }

  // Type validation for common field types
  Object.entries(config).forEach(([key, value]) => {
    // Skip internal fields
    if (['appSlug', 'actionName', 'credentialId', 'label', 'executionKey'].includes(key)) {
      return;
    }

    // Warn about empty required fields
    if (value === '' || value === null || value === undefined) {
      const isLikelyRequired =
        key.toLowerCase().includes('required') ||
        key.toLowerCase().includes('message') ||
        key.toLowerCase().includes('text') ||
        key.toLowerCase().includes('title');

      if (isLikelyRequired) {
        warnings.push(`Field "${key}" is empty but might be required`);
      }
    }

    // Validate URLs
    if (key.toLowerCase().includes('url')) {
      try {
        if (value && typeof value === 'string') {
          new URL(value);
        }
      } catch {
        warnings.push(`Field "${key}" is not a valid URL`);
      }
    }

    // Validate emails
    if (key.toLowerCase().includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && typeof value === 'string' && !emailRegex.test(value)) {
        warnings.push(`Field "${key}" does not look like a valid email`);
      }
    }

    // Validate JSON fields
    if (key.toLowerCase().includes('json') && typeof value === 'string') {
      try {
        JSON.parse(value);
      } catch {
        warnings.push(`Field "${key}" is not valid JSON`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized
  };
}

/**
 * Clean parameters for Pipedream
 * Remove internal fields, render templates
 */
export function cleanParametersForPipedream(
  config: Record<string, any>,
  render: (str: string) => string
): Record<string, any> {
  const cleaned: Record<string, any> = {};

  // Internal fields to skip
  const internalFields = new Set([
    'appSlug',
    'actionName',
    'credentialId',
    'label',
    'executionKey',
    'isTrigger',
    'toolId',
    'config'
  ]);

  Object.entries(config).forEach(([key, value]) => {
    if (internalFields.has(key)) {
      return;
    }

    // Render templates in string values
    if (typeof value === 'string') {
      cleaned[key] = render(value);
    } else if (typeof value === 'object' && value !== null) {
      // For objects/arrays, deep render template strings
      cleaned[key] = deepRenderTemplate(value, render);
    } else {
      cleaned[key] = value;
    }
  });

  return cleaned;
}

/**
 * Deep template rendering for nested objects
 */
function deepRenderTemplate(obj: any, render: (str: string) => string): any {
  if (typeof obj === 'string') {
    return render(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepRenderTemplate(item, render));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, any> = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = deepRenderTemplate(value, render);
    });
    return result;
  }

  return obj;
}

/**
 * Validate parameter types against expected schema
 */
export function validateParameterTypes(
  parameters: Record<string, any>,
  schema: Record<string, any> | null
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schema) {
    // No schema provided, just validate basic types
    Object.entries(parameters).forEach(([key, value]) => {
      if (value === undefined) {
        warnings.push(`Parameter "${key}" is undefined`);
      }
    });

    return {
      valid: true,
      errors,
      warnings,
      sanitized: parameters
    };
  }

  // Validate against schema
  const schemaProps = (schema as any).properties || {};
  const requiredFields = (schema as any).required || [];

  requiredFields.forEach((field: string) => {
    if (!(field in parameters) || parameters[field] === undefined || parameters[field] === '') {
      errors.push(`Required field "${field}" is missing`);
    }
  });

  Object.entries(schemaProps).forEach(([field, fieldSchema]: [string, any]) => {
    const value = parameters[field];
    if (value === undefined) return;

    const expectedType = fieldSchema.type;
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (expectedType && expectedType !== actualType && expectedType !== 'any') {
      warnings.push(
        `Parameter "${field}" expected type "${expectedType}" but got "${actualType}"`
      );
    }

    // Validate enums
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push(
        `Parameter "${field}" value "${value}" is not in allowed values: ${fieldSchema.enum.join(', ')}`
      );
    }

    // Validate string length
    if (expectedType === 'string') {
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors.push(`Parameter "${field}" is too short (min: ${fieldSchema.minLength})`);
      }
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors.push(`Parameter "${field}" is too long (max: ${fieldSchema.maxLength})`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: parameters
  };
}

/**
 * Get human-readable validation message
 */
export function formatValidationErrors(result: ValidationResult): string {
  let message = '';

  if (result.errors.length > 0) {
    message += 'Errors:\n' + result.errors.map(e => `  • ${e}`).join('\n');
  }

  if (result.warnings.length > 0) {
    if (message) message += '\n\n';
    message += 'Warnings:\n' + result.warnings.map(w => `  • ${w}`).join('\n');
  }

  return message;
}
