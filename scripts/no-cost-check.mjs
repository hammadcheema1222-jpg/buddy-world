// Guard: Buddy World must never need a paid service or a secret key.
// Fails the build if the code contains secret-looking keys or calls paid / billed APIs.
import { readdirSync, readFileSync, statSync } from 'node:fs';
const roots = ['src', 'plugins', 'live.html', 'earth.html', 'index.html', 'catch-it'];
const files = [];
const walk = p => { const s = statSync(p); if (s.isDirectory()) readdirSync(p).forEach(f => walk(p + '/' + f)); else if (/\.(js|html|mjs|json)$/.test(p)) files.push(p); };
roots.forEach(r => { try { walk(r); } catch (e) {} });
const PAID_HOSTS = /(api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis|maps\.googleapis\.com|api\.mapbox\.com|tiles\.mapbox|api\.maptiler\.com|\.here\.com|api\.tomtom\.com|bingmapsportal|virtualearth\.net|api\.stripe\.com|twilio\.com|api\.openrouteservice\.org)/i;
const SECRETS = [
  [/sk-[A-Za-z0-9]{20,}/, 'OpenAI/Anthropic-style secret key'],
  [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
  [/pk\.eyJ[0-9A-Za-z._-]{20,}/, 'Mapbox token'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/ghp_[0-9A-Za-z]{30,}/, 'GitHub token'],
  [/(api[_-]?key|app[_-]?key|token|secret)\s*[:=]\s*['"][0-9A-Za-z_-]{16,}['"]/i, 'hard-coded key'],
  [/api_key=(?!DEMO_KEY)[0-9A-Za-z]{16,}/, 'hard-coded api_key in a URL']
];
const problems = [];
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  const h = t.match(PAID_HOSTS); if (h) problems.push(`${f}: uses a paid/billed service (${h[0]})`);
  for (const [re, what] of SECRETS) { const m = t.match(re); if (m) problems.push(`${f}: looks like a ${what}: ${m[0].slice(0, 12)}…`); }
}
if (problems.length) { console.error('❌ No-cost policy:\n - ' + problems.join('\n - ') + '\nBuddy World must only use free services without secret keys. Let users paste their own key (stored in their browser) instead.'); process.exit(1); }
console.log('✅ No-cost policy: ' + files.length + ' files checked, no paid services or secret keys');
