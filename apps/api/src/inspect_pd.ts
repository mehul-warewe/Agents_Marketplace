import { PipedreamClient } from '@pipedream/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const { PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, PIPEDREAM_PROJECT_ID } = process.env;

if (!PIPEDREAM_CLIENT_ID || !PIPEDREAM_CLIENT_SECRET || !PIPEDREAM_PROJECT_ID) {
  console.log('Missing env vars');
  process.exit(1);
}

const pd = new PipedreamClient({
  clientId: PIPEDREAM_CLIENT_ID,
  clientSecret: PIPEDREAM_CLIENT_SECRET,
  projectId: PIPEDREAM_PROJECT_ID,
  projectEnvironment: 'development'
});

console.log('Methods in PipedreamClient instance:');
console.log(Object.getOwnPropertyNames(pd));
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(pd)));

// Check for nested namespaces
// @ts-ignore
if (pd.connect) console.log('pd.connect:', Object.getOwnPropertyNames(pd.connect));
// @ts-ignore
if (pd.projects) console.log('pd.projects:', Object.getOwnPropertyNames(pd.projects));
