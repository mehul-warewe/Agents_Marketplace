export function renderTemplate(str: string, ctx: Record<string, any>): string {
  if (!str || typeof str !== 'string') return str ?? '';
  
  return str.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (_, fieldPath) => {
    try {
      let normalizedPath = fieldPath.trim();
      
      if (normalizedPath.startsWith('$json.')) {
        normalizedPath = normalizedPath.replace('$json.', 'incoming.');
      }
      if (normalizedPath.startsWith('input.')) {
        normalizedPath = normalizedPath.replace('input.', 'incoming.');
      }
      
      normalizedPath = normalizedPath.replace(/^\$node\["(.+?)"\]\.json\./, 'nodes["$1"].');
      normalizedPath = normalizedPath.replace(/^\$node\.(.+?)\.json\./, 'nodes.$1.');

      const parts = normalizedPath.split(/\.|\['|'\]|\["|"\]/).filter(Boolean);
      let val: any = ctx;
      
      for (const part of parts) {
        if (val === null || val === undefined) break;
        val = val[part];
      }

      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    } catch (e) {
      console.warn(`[Template] Error rendering path "${fieldPath}":`, e);
      return '';
    }
  });
}

export function tryParseJson(str: string): any {
  try { return JSON.parse(str); } catch { return str; }
}
