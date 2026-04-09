import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root (3 levels up from src/loadenv.ts: src -> api -> apps -> root)
// Or use CWD if that's more reliable. 
// Given the current setup, ../../../.env should work if relative to the file.
// But dotenv.config usually takes a path relative to CWD unless it's absolute.
const envPath = path.resolve(__dirname, '../../../.env');
console.log(`[LoadEnv] Attempting to load .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`[LoadEnv] Error loading .env file: ${result.error.message}`);
} else {
  console.log(`[LoadEnv] .env loaded successfully. ENCRYPTION_KEY present: ${!!process.env.ENCRYPTION_KEY}`);
}
