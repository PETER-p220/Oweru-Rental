import fs from 'fs';
import path from 'path';

const strings = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'scripts', 'clean-strings.json'), 'utf8'),
);
const outPath = path.join(process.cwd(), 'src', 'i18n', 'phrases.sw.json');
const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));

function shouldSkip(s) {
  if (s.length < 2) return true;
  if (/^[\d\s.+()-]+$/.test(s)) return true;
  if (s.includes('useState') || s.includes('=>')) return true;
  return false;
}

let added = 0;
for (const s of strings) {
  if (shouldSkip(s) || existing[s]) continue;
  existing[s] = s;
  added++;
}

fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
console.error('Added identity fallbacks:', added, 'total:', Object.keys(existing).length);
