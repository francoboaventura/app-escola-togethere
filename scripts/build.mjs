// build.mjs — remonta o index.html a partir de src/. Dois modos:
//   node scripts/build.mjs           -> saída IDÊNTICA ao original (prova de integridade)
//   node scripts/build.mjs --min     -> minifica CSS e o JS do app (sem renomear nomes globais)
// Vendor (supabase, qrcode) nunca é tocado. Nomes globais (usados nos onclick) são preservados.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const MIN = process.argv.includes('--min');
const VERIFY = process.argv.includes('--verify');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const template = read('src/index.template.html');
const manifest = JSON.parse(read('src/manifest.json'));

const vendorSupabase = read('src/vendor/supabase.min.js');
const vendorQr = read('src/vendor/qrcode.min.js');
let appCss = read('src/css/app.css');
let appJs = manifest.appJs.map(read).join('\n'); // concat na ordem exata

if (MIN) {
  const esbuild = await import('esbuild');
  // JS: só espaço/sintaxe. minifyIdentifiers:false => NÃO renomeia funções globais
  // (senão quebraria os 360 handlers onclick="..."). Zero risco de escopo.
  appJs = (await esbuild.transform(appJs, {
    loader: 'js', minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: false,
    legalComments: 'none', target: 'es2019',
  })).code;
  appCss = (await esbuild.transform(appCss, { loader: 'css', minify: true })).code;
}

// Substitui cada token (linha própria) pela peça correspondente.
const pieces = {
  '/*__VENDOR_SUPABASE__*/': vendorSupabase,
  '/*__APP_CSS__*/': appCss,
  '/*__APP_JS__*/': appJs,
  '/*__VENDOR_QR__*/': vendorQr,
};
const out = template.split('\n')
  .map((line) => (line in pieces ? pieces[line] : line))
  .join('\n');

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/index.html'), out);

// Copia os estáticos e apps auxiliares para o dist (o Pages serve a pasta inteira).
for (const f of fs.readdirSync(path.join(ROOT, 'public'))) {
  fs.copyFileSync(path.join(ROOT, 'public', f), path.join(ROOT, 'dist', f));
}

const sizeKB = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log('Build:', MIN ? 'produção (minificado)' : 'padrão (sem minificar)');
console.log('  dist/index.html:', sizeKB(out));

// --verify: prova de integridade do CUTOVER — só faz sentido ANTES de editar os fontes.
// Confere se o build (sem minificar) reproduz o b101 original byte a byte.
if (VERIFY) {
  const baseline = read('scripts/reference/b101-index.html');
  const identical = out === baseline && !MIN;
  console.log('  baseline b101:', sizeKB(baseline));
  console.log(identical ? '  ✅ IDÊNTICO ao b101 (byte a byte) — split sem perdas'
                        : (MIN ? '  ⚠️  use --verify sem --min' : '  ❌ DIFERENTE do b101 — investigar'));
  if (!identical) process.exit(1);
}
