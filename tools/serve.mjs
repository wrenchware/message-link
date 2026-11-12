// Serves the site at http://localhost:8000/message-link/ the way GitHub Pages will: a folder address without its slash is
// redirected to it, and a missing page gets 404.html. Run from anywhere: node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = '/message-link';
const port = Number(process.argv[2] || 8000);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.md': 'text/plain; charset=utf-8' };

async function send(res, status, file) {
  res.writeHead(status, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(await readFile(file));
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/' || path === base) { res.writeHead(301, { Location: base + '/' }); return res.end(); }
  if (!path.startsWith(base + '/')) return send(res, 404, join(root, '404.html'));
  const file = normalize(join(root, path.slice(base.length)));
  if (!file.startsWith(root + sep) && file !== root) return send(res, 404, join(root, '404.html'));
  try {
    const info = await stat(file);
    if (info.isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(301, { Location: path + '/' }); return res.end(); }
      return await send(res, 200, join(file, 'index.html'));
    }
    return await send(res, 200, file);
  } catch {
    return send(res, 404, join(root, '404.html'));
  }
}).listen(port, () => console.log(`http://localhost:${port}${base}/`));
