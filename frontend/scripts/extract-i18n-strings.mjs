import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src');
const texts = new Set();

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory() && f !== 'node_modules') walk(p);
    else if (/\.tsx?$/.test(f)) {
      const c = fs.readFileSync(p, 'utf8');
      for (const m of c.matchAll(/>([^<>{}][^<]{0,120})</g)) {
        const t = m[1].trim().replace(/\s+/g, ' ');
        if (t && !t.includes('{') && /[A-Za-z]/.test(t) && t.length < 100) texts.add(t);
      }
      for (const m of c.matchAll(/placeholder="([^"]+)"/g)) texts.add(m[1]);
      for (const m of c.matchAll(/title="([^"]+)"/g)) texts.add(m[1]);
      for (const m of c.matchAll(/aria-label="([^"]+)"/g)) texts.add(m[1]);
    }
  }
}

walk(root);
const sorted = [...texts].sort();
console.log(sorted.join('\n'));
console.error('TOTAL', sorted.length);
