import { ToolContext } from './types.js';
import * as vm from 'vm';

export async function logicCode(context: ToolContext) {
  const { config, incomingData } = context;
  const jsCode = config.jsCode || config.code || 'return $input;';

  // Wrap the user's code inside an async function so they can use await, 
  // and so that 'return' works natively.
  const codeToRun = `
    module.exports = (async function() {
      ${jsCode}
    })();
  `;

  try {
    // Expose only safe globals to the sandbox
    const sandbox = {
      $input: incomingData || {},
      console: {
        log: (...args: any[]) => console.log(`[Code Node | Run: ${context.job?.data?.runId || 'direct'}]:`, ...args),
        error: (...args: any[]) => console.error(`[Code Node | Run: ${context.job?.data?.runId || 'direct'}]:`, ...args),
      },
      module: { exports: null as Promise<any> | null } // Capture the async IIFE
    };

    vm.createContext(sandbox);

    // Limit execution time to 5 seconds to prevent infinite loops
    vm.runInContext(codeToRun, sandbox, { timeout: 5000 });

    const result = await sandbox.module.exports;

    // Standardize the output format
    if (typeof result === 'object' && result !== null) {
      return result;
    }
    return { result };

  } catch (error: any) {
    throw new Error(`Code Node Error: ${error.message}`);
  }
}
