import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export { 
  eq, ne, and, or, gt, gte, lt, lte, isNull, isNotNull, inArray, notInArray, 
  like, ilike, sql, desc, asc, relations, getTableColumns 
} from 'drizzle-orm';
export * from './schema.js';

export const createClient = (connectionString: string) => {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
};
