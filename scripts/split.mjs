// split.mjs — separa o index.html oficial (b101) em partes editáveis,
// SEM alterar o comportamento. Gera src/index.template.html + src/vendor/*,
// src/css/app.css e src/js/NN-*.js. A prova de que nada se perdeu é o build.mjs,
// que remonta e compara byte a byte com o original.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const original = fs.readFileSync(path.join(ROOT, 'scripts/reference/b101-index.html'), 'utf8');
const lines = original.split('\n');

// Acha as TAGS reais (as que estão sozinhas na linha; as que aparecem dentro de
// strings JS têm outro conteúdo na mesma linha e são ignoradas).
const idxOf = (tag) => lines.map((l, i) => [l.trim(), i]).filter(([t]) => t === tag).map(([, i]) => i);
const scriptOpen = idxOf('<script>');   // [supabase, appB, qr]
const scriptClose = idxOf('</script>'); // [supabase, appB, qr]
const styleOpen = idxOf('<style>')[0];
const styleClose = idxOf('</style>')[0];

const [supaOpen, appOpen, qrOpen] = scriptOpen;
const [supaClose, appClose, qrClose] = scriptClose;

// Sanidade: a ordem esperada dos marcadores.
const ok = supaOpen < supaClose && supaClose < styleOpen && styleOpen < styleClose
  && styleClose < appOpen && appOpen < appClose && appClose < qrOpen && qrOpen < qrClose;
if (!ok) { console.error('Marcadores fora da ordem esperada', { supaOpen, supaClose, styleOpen, styleClose, appOpen, appClose, qrOpen, qrClose }); process.exit(1); }

// Conteúdo entre as tags (sem incluir as tags).
const slice = (a, b) => lines.slice(a + 1, b); // linhas a+1 .. b-1
const vendorSupabase = slice(supaOpen, supaClose);
const appCss = slice(styleOpen, styleClose);
const appBlockB = slice(appOpen, appClose);
const vendorQr = slice(qrOpen, qrClose);

// --- Quebra do bloco B (o app) em arquivos por seção. Os "starts" são linhas
// (1-indexadas no arquivo original) onde há um banner de seção. Concatenar as
// faixas na ordem reproduz o bloco B exatamente. O nome sai do texto do banner.
const startsOneIdx = [423,501,744,969,1017,1187,1433,1679,1840,2335,2510,2558,2739,2900,3052,3339,3607,4086,4388,4502,4706,4844,5016,5084,5135,5791,6498];
const blockBStartOneIdx = appOpen + 2;       // 1ª linha de conteúdo do bloco B (1-indexada)
const blockBEndOneIdx = appClose;            // última linha de conteúdo (1-indexada) = linha antes de </script>
const bounds = startsOneIdx.filter(s => s >= blockBStartOneIdx && s <= blockBEndOneIdx);
if (bounds[0] !== blockBStartOneIdx) bounds.unshift(blockBStartOneIdx);

const slug = (s) => (s.replace(/\(.*?\)/g, ' ')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'secao');

const jsFiles = [];
for (let i = 0; i < bounds.length; i++) {
  const startOne = bounds[i];
  const endOne = (i + 1 < bounds.length ? bounds[i + 1] - 1 : blockBEndOneIdx);
  const chunk = lines.slice(startOne - 1, endOne); // converte p/ 0-indexado
  // Nome vem do banner; se a linha for só um divisor (===), procura o título nas próximas.
  let title = '';
  for (let k = startOne - 1; k < Math.min(startOne + 4, lines.length); k++) {
    const s = slug(lines[k] || '');
    if (s && s !== 'secao') { title = s; break; }
  }
  const name = String(i).padStart(2, '0') + '-' + (title || 'secao') + '.js';
  fs.writeFileSync(path.join(ROOT, 'src/js', name), chunk.join('\n'));
  jsFiles.push('src/js/' + name);
}

fs.writeFileSync(path.join(ROOT, 'src/vendor/supabase.min.js'), vendorSupabase.join('\n'));
fs.writeFileSync(path.join(ROOT, 'src/vendor/qrcode.min.js'), vendorQr.join('\n'));
fs.writeFileSync(path.join(ROOT, 'src/css/app.css'), appCss.join('\n'));

// Template = original com as 4 fatias trocadas por tokens (cada token numa linha).
const T = {
  supa: '/*__VENDOR_SUPABASE__*/',
  css: '/*__APP_CSS__*/',
  js: '/*__APP_JS__*/',
  qr: '/*__VENDOR_QR__*/',
};
const templateLines = [
  ...lines.slice(0, supaOpen + 1),      // ... <script>
  T.supa,
  ...lines.slice(supaClose, styleOpen + 1), // </script> ... <style>
  T.css,
  ...lines.slice(styleClose, appOpen + 1),  // </style> ... <body> ... <script>
  T.js,
  ...lines.slice(appClose, qrOpen + 1),     // </script> ... <script>
  T.qr,
  ...lines.slice(qrClose),                    // </script> ... fim
];
fs.writeFileSync(path.join(ROOT, 'src/index.template.html'), templateLines.join('\n'));

// Manifesto: ordem exata de montagem do JS do app.
fs.writeFileSync(path.join(ROOT, 'src/manifest.json'), JSON.stringify({ appJs: jsFiles }, null, 2));

console.log('Split OK:');
console.log('  vendor/supabase.min.js  ', vendorSupabase.length, 'linhas');
console.log('  vendor/qrcode.min.js    ', vendorQr.length, 'linhas');
console.log('  css/app.css             ', appCss.length, 'linhas');
console.log('  js/*.js                 ', jsFiles.length, 'arquivos');
jsFiles.forEach(f => console.log('     ', f));
