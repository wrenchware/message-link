// The Security page and Security details stay in step: every section of the Security page that has a "Learn more" leads to
// a section of the details page, in the same order, and every section of the details page (past its threat model and
// diagram, and before reporting) is reached from one. Run from anywhere: node tools/check-security.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plain = readFileSync(join(root, 'security/index.html'), 'utf8');
const details = readFileSync(join(root, 'security/details/index.html'), 'utf8');

const learnMore = [...plain.matchAll(/<a href="details\/#([a-z-]+)">Learn more<\/a>/g)].map(m => m[1]);
const sections = [...details.matchAll(/<h2 id="([a-z-]+)">/g)].map(m => m[1]);
const reached = sections.filter(id => !['threat-model', 'architecture', 'report'].includes(id));

const problems = [];
if (learnMore.length === 0) problems.push('the Security page has no Learn more links');
if (learnMore.join(',') !== reached.join(',')) {
  problems.push(`the Security page's Learn more links (${learnMore.join(', ')}) don't match the details page's sections in order (${reached.join(', ')})`);
}
// Each section of the Security page carries exactly one Learn more, after its list.
const plainSections = plain.split(/<h2 id="/).slice(1);
for (const section of plainSections) {
  const id = section.slice(0, section.indexOf('"'));
  const count = (section.match(/>Learn more</g) || []).length;
  if (!['summary', 'report'].includes(id) && count !== 1) problems.push(`the Security page's section ${id} has ${count} Learn more links`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`The Security page's ${learnMore.length} sections each lead to their part of Security details.`);
