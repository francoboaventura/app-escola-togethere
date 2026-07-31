// boot-test.mjs — abre o dist/index.html num Chromium headless e verifica:
//  1) nenhum erro de JS no console/página durante o carregamento;
//  2) a tela de login renderiza (título "Entrar" + painel de login preenchido).
import { chromium } from 'playwright-core';
import path from 'node:path';

const file = 'file://' + path.resolve(import.meta.dirname, '..', process.argv[2] || 'dist/index.html');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto(file, { waitUntil: 'load' });
await page.waitForTimeout(1500); // deixa o boot rodar (render do login)

const loginTitle = (await page.textContent('#loginTitulo').catch(() => '') || '').trim();
const loginPanelFilled = await page.$eval('#loginPanel', (el) => el.innerHTML.trim().length > 0).catch(() => false);
const appVer = await page.$eval('#appVer', (el) => el.textContent).catch(() => '(nao lido)');

// Erros de rede externa (fontes google, supabase) não contam — filtramos.
const jsErrors = errors.filter((e) => !/net::|Failed to load resource|fonts\.google|supabase\.co|ERR_|favicon/i.test(e));

console.log('arquivo:', process.argv[2] || 'dist/index.html');
console.log('  #loginTitulo:', JSON.stringify(loginTitle));
console.log('  #loginPanel preenchido:', loginPanelFilled);
console.log('  versão no rodapé:', appVer);
console.log('  erros de JS (fora rede):', jsErrors.length);
jsErrors.slice(0, 8).forEach((e) => console.log('    -', e.slice(0, 160)));
await browser.close();

const ok = loginTitle.length > 0 && loginPanelFilled && jsErrors.length === 0;
console.log(ok ? '  ✅ BOOT OK' : '  ❌ FALHOU');
process.exit(ok ? 0 : 1);
