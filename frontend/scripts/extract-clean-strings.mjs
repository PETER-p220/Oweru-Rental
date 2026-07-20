import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src');
const texts = new Set();

const JSX_TEXT = />\s*([A-Za-z0-9][A-Za-z0-9\s&',./:;!?–—\-()]{1,100}?)\s*</g;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory() && f !== 'node_modules') walk(p);
    else if (/\.tsx$/.test(f)) {
      const c = fs.readFileSync(p, 'utf8');
      for (const m of c.matchAll(JSX_TEXT)) {
        const t = m[1].trim().replace(/\s+/g, ' ');
        if (
          t.length >= 2 &&
          t.length <= 90 &&
          !t.includes('useState') &&
          !t.includes('const ') &&
          !t.includes('=>') &&
          !/^[\d\s./]+$/.test(t)
        ) {
          texts.add(t);
        }
      }
      for (const m of c.matchAll(/placeholder="([^"]+)"/g)) texts.add(m[1].trim());
      for (const m of c.matchAll(/\blabel:\s*'([^']+)'/g)) texts.add(m[1].trim());
      for (const m of c.matchAll(/name:\s*'([^']+)'/g)) texts.add(m[1].trim());
    }
  }
}

walk(root);
const sorted = [...texts].sort((a, b) => a.localeCompare(b));
fs.writeFileSync(path.join(process.cwd(), 'scripts', 'clean-strings.json'), JSON.stringify(sorted, null, 2));
console.error('Wrote', sorted.length, 'strings');
