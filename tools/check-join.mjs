import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../join/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
assert.doesNotMatch(html, /<script\s+[^>]*src=/i);
const fingerprint = 'ab'.repeat(32);
const common = `n=sample.tail.test&a=192.0.2.5%3A8787&f=${fingerprint}&c=ABCDE-FGHJK&u=sample%2Bphone%40example.invalid`;
let checks = 0;
function page(fragment, android = true) {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const nodes = Object.fromEntries(ids.map(id => [id, { hidden: true, textContent: '', href: '#' }]));
  const listeners = {};
  const location = Object.freeze({ hash: '#' + fragment });
  const refuse = () => { throw new Error('The join page must not make a network request or navigate automatically'); };
  vm.runInNewContext(scripts[0][1], {
    location, navigator: { userAgent: android ? 'Android' : 'Desktop' },
    document: { getElementById: id => { assert.ok(nodes[id], id); return nodes[id]; } },
    window: { addEventListener: (event, handler) => { listeners[event] = handler; }, open: refuse },
    fetch: refuse, XMLHttpRequest: refuse, WebSocket: refuse, Image: refuse,
  }, { timeout: 1000 });
  assert.equal(typeof listeners.hashchange, 'function');
  checks++;
  return nodes;
}

for (const [version, port, server] of [['1', '', 'sample.tail.test'], ['2', '&p=9443', 'sample.tail.test:9443']]) {
  const fragment = `v=${version}&${common}${port}`;
  const nodes = page(fragment);
  assert.equal(nodes.for.hidden, false);
  assert.equal(nodes.android.hidden, false);
  assert.equal(nodes.server.textContent, server);
  assert.ok(nodes.open.href.startsWith('intent://wrenchware.github.io/messages/join#' + fragment + '#Intent;'));
  assert.ok(nodes.open.href.includes('package=com.wrenchware.messages;'));
  assert.ok(nodes.open.href.endsWith(encodeURIComponent('https://wrenchware.github.io/messages/join/#no-app') + ';end'));
  assert.equal(nodes.open.href.split('#')[0].includes('c='), false);
  const desktop = page(fragment, false);
  assert.equal(desktop.elsewhere.hidden, false);
  assert.equal(desktop.android.hidden, true);
  assert.equal(desktop.open.href, '#');
}
for (const port of ['', '&p=0', '&p=65536', '&p=-1', '&p=9.5', '&p=no', '&p=%20', '&p=%ZZ']) {
  const nodes = page(`v=2&${common}${port}`);
  assert.equal(nodes.damaged.hidden, false);
  assert.equal(nodes.android.hidden, true);
  assert.equal(nodes.open.href, '#');
}
for (const port of ['1', '65535']) assert.equal(page(`v=2&${common}&p=${port}`).for.hidden, false);
assert.equal(page(`v=3&${common}`).newer.hidden, false);
assert.equal(page(common).damaged.hidden, false);
assert.equal(page(`v=1&${common}&f=ignored`).for.hidden, false); // First value wins, as in the clients.
assert.equal(page(`v=1&${common}&unknown=%2B`).for.hidden, false);
assert.equal(page(`v=1&${common}#Intent;`).damaged.hidden, false);
assert.equal(page('no-app')['no-app'].hidden, false);
assert.equal(page('').general.hidden, false);
console.log(`JOIN ${checks} fragment cases passed; no automatic navigation or network access.`);
