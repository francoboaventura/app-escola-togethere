# Togethere · Gestão Escolar

> *inglês para chegar lá*

Aplicativo interno da escola **Togethere** (Gravataí/RS) para o dia a dia pedagógico:
chamada, temas de casa, testes e boletins, planos de aula, relatórios por aluno e por turma,
avisos para a secretaria, atas, tarefas internas, correção de writings com IA e alertas
automáticos — com sincronização na nuvem. É um **PWA** (instalável no celular/tablet/computador)
feito em um único arquivo `index.html`.

> **Atualizado em 2026-07 (versão `b91 · Supabase`).** O app passou por uma migração grande:
> saiu do Google Sheets e agora roda sobre um banco de dados **PostgreSQL no Supabase**. Veja
> [Dados, nuvem e backup](#dados-nuvem-e-backup).

---

## Como acessar

- **Site (nuvem):** publicado via GitHub Pages em
  `https://francoboaventura.github.io/app-escola-togethere/`
- Abra o link em qualquer aparelho e **faça login**.
- Dá para **instalar como app** (Adicionar à Tela de Início / Instalar), funcionando como um
  aplicativo de verdade, com ícone próprio e tela cheia.

### Logins e perfis

O login é pelo **primeiro nome** + senha. Senha padrão atual: **`Nome@2026`**
(ex.: `Franco@2026`, `Vlad@2026`). Internamente cada usuário tem um e-mail técnico
`nome@togethere.app` (o app converte o nome digitado, sem acento). A gestão de senhas é feita
hoje no painel do **Supabase → Authentication** (a recuperação/troca no próprio app é um
próximo passo do roadmap).

| Usuário   | Perfil      |
|-----------|-------------|
| Franco    | Direção     |
| Fernanda  | Direção     |
| Vlad      | Professor   |
| Mari      | Professor   |
| Leandro   | Professor   |
| Camila    | Professor   |
| Maitê     | Professor   |
| Reginaldo | Secretaria  |

- **Professor** — vê apenas as próprias turmas e os alunos VIP.
- **Secretaria** — telas enxutas: Painel, Relatórios por aluno, Relatórios por turma e Avisos.
- **Direção** — acesso completo à escola toda, incluindo o **Painel de Gestão**.

---

## Funcionalidades

### Painel de Gestão (direção)
Visão executiva na tela inicial da direção: **presença geral dos últimos 30 dias**, **alunos em
alerta**, e uma tabela por turma com nº de alunos, **barra de presença** (verde/âmbar/vermelho) e
alertas de falta. É a base de padronização pensada para a futura **franquia**.

### Chamada do dia
Uma única tela por turma/data reúne **presença**, **atraso**, **saiu mais cedo**,
**material não trazido** (🎒) e a **conferência do tema de casa** aluno por aluno. Depois de salva,
a chamada fica **travada** e só é alterada pelo botão *Editar chamada*.

### Planos de aula
Lista em acordeão de planos **pendentes** e **realizados**, com **checklist** dos itens da aula,
**anotações** e botão para **gerar o relatório da aula** (que vai para os Avisos).

### Temas de casa
Registro dos temas (inclusive vindos do plano) e acompanhamento de quem entregou.

### Correção de Writings (IA)
Aba na Sala de aula: avalia produções escritas por bandas (Content, Communicative Achievement,
Organisation, Language), com **OCR** de foto do texto. Roda num **Cloudflare Worker**
(`togethere-writing`). Guarda notas e o relatório completo por aluno.

### Alunos VIP
Alunos de aulas particulares/avulsas, **fora das turmas regulares**, com registro próprio.

### Testes e boletim
- Cada teste recebe **uma nota por habilidade**: Grammar, Vocabulary, Listening, Reading,
  Writing e Speaking.
- Nº de testes segue o nível: **KIDS** sem teste formal; **B2/C1** fazem 2; os demais, 3 no ano.
- **Faixas (padrão Cambridge):** 0–59 *in need of improvement* · 60–89 *pass* · 90–100 *merit* ·
  **★ Distinction** (supera o esperado; selo sem nota numérica).
- **Boletim de fim de ano** na identidade da escola, com parecer descritivo, impressão/PDF/cópia.

### Relatório individual e por turma
Relatório do aluno puxável a qualquer tempo, por período, com notas, faltas (com o conteúdo da
aula perdida), atrasos, material e temas pendentes. O relatório da aula gerado pelo professor cai
nos **Avisos** da secretaria, que **copia para os grupos de WhatsApp** e marca como enviado.

### Alertas automáticos (secretaria)
Avisa quando um aluno atinge **3 faltas consecutivas**, ou fica sem material em **3 aulas
seguidas** ou **5 alternadas**. As **faltas retroativas** de cada aluno vieram do histórico do
Sponte (importadas uma vez); as **datas de nascimento** também foram importadas dos relatórios
do Sponte (idade + dia/mês → data completa).

### Outros
- **Atas de reunião.**
- **Tarefas internas** — matriz de Eisenhower (com *Standby* no lugar de *Delegar*).
- **Acessos** (direção) — backup dos dados.

---

## Identidade visual

Baseada no material da pasta **NUSA – ID Visual**:
- **Cores:** azul `#005EAF`, amarelo `#FFC800`, vermelho e branco.
- **Ícone do app:** o **"e" vermelho com o ponto azul** (símbolo da marca), em fundo branco.
- **Logo dos documentos:** o letreiro `togethere` completo (embutido no `index.html`).

---

## Dados, nuvem e backup

O backend é o **Supabase** (PostgreSQL). Projeto: `https://wkmmlbzrfkkalcsxxtze.supabase.co`.

- **Login/autenticação:** Supabase Auth. Papéis (direção/professor/secretaria) na tabela `perfis`.
- **Estado do app:** guardado como um documento **JSONB** na tabela `estado` (o "estado `S`"
  inteiro do app). É o que o app lê/grava no dia a dia.
- **Tabelas normalizadas** já criadas e populadas (`turmas`, `alunos`, `aulas`, `presencas`),
  prontas para a próxima etapa (mover a presença do blob para elas e ligar o alerta no servidor).
- **Segurança (RLS):** só usuário **logado** acessa os dados. A chave *publishable* (pública) fica
  embutida no `index.html` — é segura porque quem protege é o RLS; a chave *secret* nunca sai do
  painel do Supabase.
- **Como o app fala com o banco:** tudo passa por 3 funções — `cloudLogin`, `cloudGet` (lê o blob
  `estado`) e `cloudPut` (mescla e grava o blob). A biblioteca `@supabase/supabase-js` está
  **embutida** no `index.html` (sem CDN).
- O rodapé mostra o status de sync e a **versão** publicada (ex.: `2026.07.25 · b91 (Supabase)`).

**Backup:**
1. **No app** — *Acessos → Baixar backup agora* (arquivo `.json`) / *Restaurar de um arquivo*.
2. **Supabase** — backups automáticos do projeto (painel do Supabase).

> O Google Apps Script antigo (planilha) está **desativado** — ficou como legado/histórico e não
> é mais o backend. O app oficial anterior é recuperável pelo histórico do GitHub, se necessário.

---

## Como atualizar o app

Tudo é servido pelo GitHub Pages, então publicar é subir o arquivo no repositório:

- **Pelo navegador:** repositório → abra `index.html` → *Edit* (ou *Upload files* para
  substituir) → *Commit changes*. Em ~1 minuto o site atualiza em todos os aparelhos.
- **Quase sempre basta o `index.html`.** O `sw.js` atual é **auto-destrutivo** (limpa o cache
  antigo e garante que todos recebam a versão nova); só precisa ser mexido em casos especiais.
- Confirme pelo **número da versão no rodapé**.
- **Ícone:** trocar o ícone do app não atualiza sozinho nos aparelhos já instalados — é preciso
  **remover o atalho da tela e adicionar de novo** (uma vez).

---

## Arquivos do projeto

| Arquivo | O que é |
|---|---|
| `index.html` | O aplicativo inteiro (interface + lógica + supabase-js embutido). |
| `sw.js` | Service worker auto-destrutivo (limpa cache antigo). |
| `manifest.json` | Manifesto do PWA (ícones, nome, cores). |
| `icon-192.png` / `icon-512.png` / `apple-touch-icon.png` | Ícones do app (o "e" vermelho). |
| `logo.png` | Letreiro `togethere` usado nos documentos/telas. |
| `README.md` | Este arquivo. |
| `Codigo.gs` / `backup_diario.gs` | **Legado** (Google Apps Script do backend antigo; desativado). |

---

## Tecnologia

HTML/CSS/JavaScript **puro (vanilla)** em **arquivo único**, com `localStorage` no aparelho e
sincronização via **Supabase** (Auth + Postgres). A biblioteca `@supabase/supabase-js` está
embutida. Sem build, sem dependências a instalar.

---

## Roadmap

Concluído recentemente: migração para Supabase, login por nome, Painel de Gestão, importação de
faltas retroativas e datas de nascimento do Sponte, PWA instalável e identidade visual nova.

Próximos passos previstos:
1. **Alerta de faltas automático no servidor** — normalizar a presença nas tabelas `aulas`/
   `presencas` e disparar o alerta sem depender de alguém abrir o app.
2. **Envio aos pais via WhatsApp** num toque (e, depois, reativar o e-mail).
3. **Trocar senha no 1º acesso** + recuperação de senha (segurança/LGPD com dados de menores).
4. **Completar nascimentos** das turmas B2/B1+ teens (faltou a idade no relatório de idades).
5. **Multi-unidade (franquia)** — cada unidade com dados isolados sob a marca Togethere, com a
   direção enxergando todas.

> Contexto técnico e histórico da migração ficam registrados no Projeto Claude
> (`togethere-migracao-status`, `plano-banco-de-dados-togethere`, `estado-tecnico-apps`).
