const fs = require('fs');
const path = require('path');
const my = JSON.parse(fs.readFileSync('locales/my/common.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('locales/en/common.json', 'utf8'));
function has(obj, p) {
  return p.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj) !== undefined;
}
const used = new Set();
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (['node_modules', 'dist', '.git', '.next'].includes(f)) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(f)) {
      const src = fs.readFileSync(p, 'utf8');
      const re = /\bt\(\s*['"`]([a-zA-Z0-9_.]+)['"`]/g;
      let m;
      while ((m = re.exec(src))) used.add(m[1]);
    }
  }
}
walk('pages');
walk('components');
walk('lib');
const missing = [...used].filter((k) => k.includes('.') && !has(my, k));
console.log('used keys:', used.size);
console.log('missing in my:');
missing.forEach((k) => console.log(' ', k, has(en, k) ? '(exists in en)' : '(MISSING EVERYWHERE)'));
