import type { ToolHandler, ToolContext } from '../../types.js';

export const ifHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render } = ctx;
  const { conditions } = config;
  
  if (!conditions || !conditions.conditions || conditions.conditions.length === 0) {
    return { _activeHandle: 'false', result: 'No conditions defined' };
  }

  const mode = conditions.combine || 'and';
  const condList = conditions.conditions;

  const evaluateCondition = (cond: any) => {
    const leftValue = render(cond.leftValue || '');
    const rightValue = render(cond.rightValue || '');
    const operator = cond.operator || 'equal';

    const lNum = parseFloat(leftValue);
    const rNum = parseFloat(rightValue);
    const isNumeric = !isNaN(lNum) && !isNaN(rNum);

    const l = isNumeric ? lNum : String(leftValue).toLowerCase();
    const r = isNumeric ? rNum : String(rightValue).toLowerCase();

    switch (operator) {
      case 'equal':      return l == r;
      case 'notEqual':   return l != r;
      case 'contains':   return String(l).includes(String(r));
      case 'notContains': return !String(l).includes(String(r));
      case 'startsWith': return String(l).startsWith(String(r));
      case 'gt':         return Number(l) > Number(r);
      case 'lt':         return Number(l) < Number(r);
      case 'isEmpty':    return !leftValue || leftValue === '';
      case 'isNotEmpty': return leftValue && leftValue !== '';
      default:           return false;
    }
  };

  const results = condList.map(evaluateCondition);
  let pass = mode === 'and' ? results.every((r: boolean) => r === true) : results.some((r: boolean) => r === true);

  return { _activeHandle: pass ? 'true' : 'false', results };
};
