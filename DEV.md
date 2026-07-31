# Togethere — estrutura de desenvolvimento (Nível 1 + 2)

Este projeto transforma o **`index.html` único (b101, ~872 KB)** em **fontes organizados**
(Nível 1) com **publicação automática** pelo GitHub (Nível 2) — **sem mudar em nada o
comportamento do app**. O primeiro deploy gera um `index.html` **byte a byte igual** ao b101 atual.

## O que mudou

- O app deixou de ser um arquivo gigante para virar pastas navegáveis em **`src/`**:
  - `src/css/app.css` — todo o estilo do app.
  - `src/js/NN-*.js` — o app dividido em **27 arquivos por seção** (login, presença, testes,
    boletim, alertas, planejamento, etc.). São só recortes do mesmo código, na mesma ordem.
  - `src/vendor/` — as bibliotecas embutidas (`supabase`, `qrcode`). **Não editar.**
  - `src/index.template.html` — o esqueleto (cabeçalho + corpo do login/app) com marcadores.
- **`scripts/build.mjs`** remonta tudo num único `dist/index.html` (o mesmo formato de sempre —
  arquivo único, PWA, sem CDN). O navegador continua vendo exatamente um `index.html`.
- **`.github/workflows/deploy.yml`** publica sozinho a cada commit na `main`.

> **Por que não virou React/módulos ES?** Porque o app usa ~360 handlers `onclick="funcao()"`
> em escopo global. Trocar isso por módulos quebraria todos eles. O build por **concatenação**
> preserva o escopo global — mesmo comportamento, risco mínimo.

## O dia a dia (depois de instalado)

1. Edite o arquivo certo em `src/js/…` (ou `src/css/app.css`). Dá para fazer **pelo navegador**,
   direto no GitHub, como você já faz hoje — só que num arquivo pequeno em vez do gigante.
2. **Suba a versão** em `src/js/00-*.js` (a linha `APP_VERSAO = '...'`).
3. **Commit.** O GitHub monta o `index.html` e publica sozinho em ~1–2 min (aba **Actions**
   mostra o progresso; ✅ verde = no ar).

Não precisa mais subir o `index.html` na mão. O `dist/` é gerado pelo GitHub — não se commita.

## Comandos (se rodar localmente)

    npm install         # uma vez (baixa esbuild/playwright)
    npm run build       # monta dist/index.html (igual ao b101)
    npm run build:min   # monta minificado (~6% menor; opcional)
    npm run verify      # PROVA que o build reproduz o b101 byte a byte (use antes do cutover)
    npm run test:boot   # abre o dist num navegador headless e confere que sobe sem erro

O `npm run verify` compara com `scripts/reference/b101-index.html` (a foto do b101 original).
Ele só dá "idêntico" **antes** de você editar os fontes — depois de mudar algo, é esperado diferir.

## Instalação no repositório (uma vez) — passo a passo

Como esta sessão roda na nuvem, **eu não consigo dar push**. Você faz a migração assim
(é reversível a qualquer momento):

1. **Suba estes arquivos** para o repositório `app-escola-togethere` (arraste a pasta no
   *Add file → Upload files*, ou use um branch novo tipo `build-setup`):
   `package.json`, `package-lock.json`, `.gitignore`, `scripts/`, `src/`, `public/`,
   `.github/workflows/deploy.yml`, `DEV.md`.
   > **Não apague** o `index.html` atual da raiz ainda — ele é a sua rede de segurança.
2. Vá em **Settings → Pages → Build and deployment → Source** e troque de
   *Deploy from a branch* para **GitHub Actions**.
3. A Action roda, monta o `dist/` (idêntico ao b101) e publica. Confira no site e no número
   da versão no rodapé.
4. Deu tudo certo por alguns dias? Aí sim pode remover da raiz os arquivos antigos
   (`index.html`, `portal-aluno.html`, `admin-logins.html`, `sw.js`, `manifest.json`, ícones,
   `logo.png`) — eles agora vivem em `src/` e `public/`.

### Rollback (voltar ao de antes)
**Settings → Pages → Source → Deploy from a branch → `main` / root.** Em segundos o site volta
a ser servido pelo `index.html` da raiz, exatamente como hoje. Nada se perde.

## Arquivos auxiliares

`public/` guarda o que é servido como está (não passa pelo build): `portal-aluno.html`,
`admin-logins.html`, `sw.js`, `manifest.json`, ícones, `logo.png`, `portal-aluno.sql`.
Se um dia quiser, dá para modularizar o portal do mesmo jeito — por ora ele fica inteiro.
