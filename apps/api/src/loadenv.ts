import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root (3 levels up from src/loadenv.ts: src -> api -> apps -> root)
// Or use CWD if that's more reliable. 
// Given the current setup, ../../../.env should work if relative to the file.
// But dotenv.config usually takes a path relative to CWD unless it's absolute.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
