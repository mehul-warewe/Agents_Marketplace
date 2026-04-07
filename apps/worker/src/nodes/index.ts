import { NODE_REGISTRY, type ToolHandler } from '@repo/nodes';
import { WORKER_NODES as SHARED_WORKER_NODES } from '@repo/nodes/handlers';

/**
 * WORKER_NODES: Maps executionKey → handler function
 * We now consume the shared WORKER_NODES registry from @repo/nodes/handlers
 * to ensure consistency across the entire monorepo.
 */
export const WORKER_NODES: Record<string, ToolHandler> = SHARED_WORKER_NODES;

// Log warning if any registry keys are missing handlers (skip decorative nodes)
const registryKeys = Array.from(new Set(NODE_REGISTRY.filter(n => !n.isDecorative).map(n => n.executionKey)));
const missing = registryKeys.filter(k => !(k in WORKER_NODES));
if (missing.length > 0) {
  console.warn(`[Worker Registry] Missing handlers for: ${missing.join(', ')}`);
}
