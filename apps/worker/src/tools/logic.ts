import { ToolHandler } from './types.js';

export const logicIf: ToolHandler = async ({ config, incomingData, render }) => {
  const { conditions } = config;
  
  if (!conditions || !conditions.conditions || conditions.conditions.length === 0) {
    console.log('[LogicIf] No conditions defined, defaulting to false.');
    return { _activeHandle: 'false', result: 'No conditions defined' };
  }

  const mode = conditions.combine || 'and';
  const condList = conditions.conditions;
  
  console.log(`[LogicIf] Evaluating ${condList.length} conditions with mode: ${mode}`);

  const evaluateCondition = (cond: any) => {
    const leftValue = render(cond.leftValue || '');
    const rightValue = render(cond.rightValue || '');
    const operator = cond.operator || 'equal';

    // Try numeric if possible
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
  let pass = false;

  if (mode === 'and') {
    pass = results.every((r: boolean) => r === true);
  } else {
    pass = results.some((r: boolean) => r === true);
  }

  const resultHandle = pass ? 'true' : 'false';
  console.log(`[LogicIf] Final Decision: ${resultHandle}`);

  return {
    _activeHandle: resultHandle,
    results
  };
};
