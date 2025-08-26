import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from gas directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const scriptId = process.env.SCRIPT_ID;
if (!scriptId) {
  console.error('SCRIPT_ID is not set in gas/.env');
  process.exit(1);
}

const claspPath = path.resolve(__dirname, '..', '.clasp.json');
const json = JSON.parse(fs.readFileSync(claspPath, 'utf8'));
json.scriptId = scriptId;
fs.writeFileSync(claspPath, JSON.stringify(json, null, 2));
console.log('Updated .clasp.json with SCRIPT_ID');

