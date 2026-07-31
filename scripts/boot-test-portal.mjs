// boot-test-portal.mjs — abre dist/portal-aluno.html headless e confere:
//  1) sem erro de JS (fora rede/CDN); 2) a tela de login do portal renderiza.
import { chromium } from 'playwright-core';
import path from 'node:path';
const file = 'file://' + path.resolve(import.meta.dirname, '..', 'dist/portal-aluno.html');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
await page.goto(file, { waitUntil: 'load' });
await page.waitForTimeout(1500);
const hasBtn = await page.$('#btnEntrar').then(Boolean);
const hasEmail = await page.$('#email').then(Boolean);
const jsErrors = errors.filter((e) => !/net::|Failed to load resource|jsdelivr|supabase|ERR_|favicon|fonts\.google/i.test(e));
console.log('arquivo: dist/portal-aluno.html');
console.log('  #btnEntrar presente:', hasBtn, '| #email presente:', hasEmail);
console.log('  erros de JS (fora rede/CDN):', jsErrors.length);
jsErrors.slice(0, 6).forEach((e) => console.log('    -', e.slice(0, 160)));
await browser.close();
const ok = hasBtn && hasEmail && jsErrors.length === 0;
console.log(ok ? '  ✅ BOOT OK' : '  ❌ FALHOU');
process.exit(ok ? 0 : 1);
