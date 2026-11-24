// Builds city.html from the files in src/city (run: node build.mjs). No dependencies needed.
// Files are joined in name order: 00-head.html, then every .js file. They all share one scope,
// so a later file can use (and wrap) anything an earlier file defines.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const dir = 'src/city';
const files = readdirSync(dir).sort();
const head = files.find(f => f.endsWith('.html'));
const js = files.filter(f => f.endsWith('.js')).map(f => `\n/* ===== ${f} ===== */\n` + readFileSync(`${dir}/${f}`, 'utf8')).join('\n');
const html = readFileSync(`${dir}/${head}`, 'utf8') + js + '\n}\n</script></body></html>';
// syntax check: the whole app script must parse
const script = html.split('<script>').pop().split('</script>')[0];
try { new Function(script); } catch (e) { console.error('❌ Syntax error in src/city:', e.message); process.exit(1); }
// plugins: index must be valid JSON and every listed file must parse
const idx = JSON.parse(readFileSync('plugins/index.json', 'utf8'));
for (const p of idx.plugins) { try { new Function(readFileSync('plugins/' + p, 'utf8')); } catch (e) { console.error('❌ Plugin ' + p + ':', e.message); process.exit(1); } }
if (process.argv.includes('--check')) { console.log('✅ src/city and ' + idx.plugins.length + ' plugins are valid'); process.exit(0); }
writeFileSync('city.html', html);
console.log('✅ Built city.html (' + (html.length / 1024).toFixed(0) + ' KB) from ' + files.length + ' files · ' + idx.plugins.length + ' plugins listed');
