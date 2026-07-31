// build.mjs — remonta o app (index.html) e o portal (portal-aluno.html) a partir de src/.
//   node scripts/build.mjs           -> saída idêntica ao b101 (sem minificar)
//   node scripts/build.mjs --min     -> minifica CSS + JS (só espaço/comentários; sem renomear
//                                       nomes globais nem transformar sintaxe -> risco mínimo)
//   node scripts/build.mjs --verify  -> prova que o build (sem --min) reproduz o b101 byte a byte
// Vendor (supabase, qrcode) e o <script src> do CDN do portal nunca são tocados.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const MIN = process.argv.includes('--min');
const VERIFY = process.argv.includes('--verify');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';

let esbuild = null;
const minifyJs = async (code) => {
  if (!MIN) return code;
  esbuild ??= await import('esbuild');
  // minifyIdentifiers:false + minifySyntax:false => NÃO renomeia funções globais (os onclick
  // continuam válidos) e NÃO reescreve o código. Só remove espaços/comentários. Seguro.
  return (await esbuild.transform(code, {
    loader: 'js', minifyWhitespace: true, minifySyntax: false, minifyIdentifiers: false,
    legalComments: 'none', target: 'es2019',
  })).code;
};
const minifyCss = async (code) => {
  if (!MIN) return code;
  esbuild ??= await import('esbuild');
  return (await esbuild.transform(code, { loader: 'css', minify: true })).code;
};

// Monta uma página trocando cada token (linha própria) pela peça correspondente.
const assemble = (template, pieces) =>
  template.split('\n').map((line) => (line in pieces ? pieces[line] : line)).join('\n');

// --------- APP (index.html) ---------
const manifest = JSON.parse(read('src/manifest.json'));
const appHtml = assemble(read('src/index.template.html'), {
  '/*__VENDOR_SUPABASE__*/': read('src/vendor/supabase.min.js'),      // vendor: nunca minifica
  '/*__APP_CSS__*/': await minifyCss(read('src/css/app.css')),
  '/*__APP_JS__*/': await minifyJs(manifest.appJs.map(read).join('\n')),
  '/*__VENDOR_QR__*/': read('src/vendor/qrcode.min.js'),              // vendor: nunca minifica
});

// --------- PORTAL (portal-aluno.html) ---------
const portalHtml = assemble(read('src/portal/index.template.html'), {
  '/*__PORTAL_CSS__*/': await minifyCss(read('src/portal/app.css')),
  '/*__PORTAL_JS__*/': await minifyJs(read('src/portal/app.js')),
});

// --------- Escreve dist/ ---------
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
// 1) copia os estáticos de public/ ...
for (const f of fs.readdirSync(path.join(ROOT, 'public'))) {
  fs.copyFileSync(path.join(ROOT, 'public', f), path.join(ROOT, 'dist', f));
}
// 2) ... e depois grava as páginas montadas (vencem qualquer cópia estática).
fs.writeFileSync(path.join(ROOT, 'dist/index.html'), appHtml);
fs.writeFileSync(path.join(ROOT, 'dist/portal-aluno.html'), portalHtml);
// 3) versao.json — usado pelo app para se auto-atualizar quando há deploy novo.
{
  const mv = read('src/js/01-nuvem-sincronizacao-com-o-google-apps-sc.js').match(/APP_VERSAO\s*=\s*['"]([^'"]+)['"]/);
  fs.writeFileSync(path.join(ROOT, 'dist/versao.json'), JSON.stringify({ v: (mv ? mv[1] : '') }));
}

console.log('Build:', MIN ? 'produção (minificado: só espaço/comentários)' : 'padrão (sem minificar)');
console.log('  dist/index.html       :', kb(appHtml));
console.log('  dist/portal-aluno.html:', kb(portalHtml));

if (VERIFY) {
  const baseIdx = read('scripts/reference/b101-index.html');
  const basePortal = read('scripts/reference/b101-portal-aluno.html');
  const okIdx = appHtml === baseIdx;
  const okPortal = portalHtml === basePortal;
  console.log('  verificação (só faz sentido sem --min e antes de editar os fontes):');
  console.log('   ', okIdx ? '✅ index.html idêntico ao b101' : '❌ index.html DIFERE do b101');
  console.log('   ', okPortal ? '✅ portal-aluno.html idêntico ao b101' : '❌ portal DIFERE do b101');
  if (MIN || !okIdx || !okPortal) process.exit(1);
}
