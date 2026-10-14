// Zero-dependency static server for the OTA console: `pnpm ota:console` → http://localhost:4100
// In production, host index.html on any static host (or behind your VPN) and add its origin
// to the API's CORS_ORIGINS.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT ?? 4100);
const file = join(dirname(fileURLToPath(import.meta.url)), 'index.html');

createServer(async (_req, res) => {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
  });
  res.end(await readFile(file));
}).listen(port, () => console.log(`OTA console → http://localhost:${port}`));
