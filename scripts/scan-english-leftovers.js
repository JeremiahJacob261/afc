const fs = require('fs');
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}
const my = flatten(JSON.parse(fs.readFileSync('locales/my/common.json', 'utf8')));
const allowed = new Set([
  'UCL', 'VIP', 'PIN', 'FAQ', 'MMK', 'USDT', 'FCFA', 'PNG', 'JPG', 'BTTS', 'WhatsApp', 'Supabase',
  'johndoe', 'you', 'com', 'A', 'G', 'X',
]);
for (const [k, v] of Object.entries(my)) {
  if (typeof v !== 'string') continue;
  const stripped = v
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+/gi, ' ');
  const words = stripped.match(/[A-Za-z]{2,}/g) || [];
  const real = words.filter((w) => !allowed.has(w) && !allowed.has(w.replace(/[.,!]/g, '')));
  if (real.length) console.log(k, '=>', JSON.stringify(v));
  if (real.length) console.log('   words:', real.join(', '));
}
