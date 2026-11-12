// Checks every link and image in the site's pages: each relative or /message-link/ address must lead to a file here,
// and each #fragment to an id on that page. Run from anywhere: node tools/check-links.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = '/message-link/';

function pages(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...pages(path));
    else if (name.endsWith('.html')) found.push(path);
  }
  return found;
}

// The address a page is served at: setup/index.html is /message-link/setup/.
function addressOf(file) {
  const rel = relative(root, file).split(sep).join('/');
  return base + (rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel);
}

// The file an address leads to, as GitHub Pages serves it (a folder without its slash is redirected to it).
function fileOf(pathname) {
  if (!pathname.startsWith(base)) return null;
  let rel = decodeURIComponent(pathname.slice(base.length));
  let file = join(root, rel);
  if (rel === '' || rel.endsWith('/')) file = join(file, 'index.html');
  else if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

const ids = new Map();
function idsOf(file) {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
}

let checked = 0;
const problems = [];
for (const file of pages(root)) {
  const html = readFileSync(file, 'utf8');
  const here = new URL(addressOf(file), 'https://site.invalid');
  for (const [, attr, value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|intent:)/i.test(value)) continue;
    // The join page fills its button in from the code; its placeholder is not a link.
    if (value === '#' && file.endsWith(join('join', 'index.html'))) continue;
    checked++;
    const url = new URL(value, here);
    const name = relative(root, file);
    const target = fileOf(url.pathname);
    if (!target) { problems.push(`${name}: ${attr}="${value}" leads to nothing (${url.pathname})`); continue; }
    const fragment = decodeURIComponent(url.hash.slice(1));
    if (fragment && target.endsWith('.html') && !idsOf(target).has(fragment)) {
      problems.push(`${name}: ${attr}="${value}" has no id="${fragment}" on ${relative(root, target)}`);
    }
  }
}

for (const problem of problems) console.log(problem);
console.log(problems.length ? `${problems.length} broken of ${checked} links` : `All ${checked} links lead somewhere.`);
process.exit(problems.length ? 1 : 0);
