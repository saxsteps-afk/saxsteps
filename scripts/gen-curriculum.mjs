// Builds src/data/curriculum.json for the landing page from the lesson files and
// the lesson plan, so the public page shows the 30 days without a database call.
//
//   npm run curriculum            (lessons in ../../ky am/score/bai-tap/30daysForSax)
//   LESSONS_DIR=... npm run curriculum
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.env.LESSONS_DIR || path.join(root, '../../ky am/score/bai-tap/30daysForSax'));
const EXT = '.nhac.json';

const days = new Map();
const day = (n) => {
  if (!days.has(n)) days.set(n, { day: n, title: '', goal: '', notes: '', song: '', bonus: [] });
  return days.get(n);
};

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(EXT))) {
  const m = /^Day\s*0*(\d+)\s*-\s*(Notes|Song|Bonus)\s*-/i.exec(name);
  if (!m) continue;
  const s = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const d = day(Number(m[1]));
  const title = String(s.title ?? '').trim();
  const kind = m[2].toLowerCase();
  if (kind === 'bonus') d.bonus.push(title);
  else d[kind] = title;
}

const plan = path.join(dir, 'lesson-plan.md');
if (fs.existsSync(plan)) {
  let cur = null;
  for (const line of fs.readFileSync(plan, 'utf8').split(/\r?\n/)) {
    const h = /^##\s*Day\s*0*(\d+)\s*[·:.\-–—]\s*(.*)$/i.exec(line.trim());
    if (h) {
      cur = day(Number(h[1]));
      cur.title = h[2].trim();
    } else if (/^##\s/.test(line)) cur = null;
    else if (cur && !cur.goal) {
      const g = /^\*\*Goal:\*\*\s*(.+)$/.exec(line.trim());
      if (g) cur.goal = g[1].replace(/\*\*/g, '').trim();
    }
  }
}

const out = [...days.values()].sort((a, b) => a.day - b.day);
const file = path.join(root, 'src/data/curriculum.json');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`${out.length} days -> ${path.relative(root, file)}`);
