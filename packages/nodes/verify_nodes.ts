import { NODE_REGISTRY } from './src/index.js';
import * as handlers from './src/handlers.js';

const keys = NODE_REGISTRY.map(n => n.executionKey);
console.log('Unique Execution Keys:', Array.from(new Set(keys)));
console.log('Handlers defined:', Object.keys(handlers));
