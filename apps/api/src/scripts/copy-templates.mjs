import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, '..', '..');
const source = resolve(apiRoot, 'src', 'templates');
const target = resolve(apiRoot, 'dist', 'templates');

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
