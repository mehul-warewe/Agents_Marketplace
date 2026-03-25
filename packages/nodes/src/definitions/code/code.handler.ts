import type { ToolHandler, ToolContext } from '../../types.js';
import * as vm from 'vm';

export const codeHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, incomingData } = ctx;
  const jsCode = config.jsCode || config.code || 'return $input;';

  const codeToRun = `
    module.exports = (async function() {
      ${jsCode}
    })();
  `;

  try {
    const sandbox = {
      $input: incomingData || {},
      input: incomingData || {}, // Alias for resilience
      console: {
        log: (...args: any[]) => console.log(`[Code Node]:`, ...args),
        error: (...args: any[]) => console.error(`[Code Node]:`, ...args),
      },
      module: { exports: null as Promise<any> | null }
    };
    vm.createContext(sandbox);
    vm.runInContext(codeToRun, sandbox, { timeout: 5000 });
    const result = await sandbox.module.exports;
    return (typeof result === 'object' && result !== null) ? result : { result };
  } catch (error: any) {
    throw new Error(`Code Node Error: ${error.message}`);
  }
};
