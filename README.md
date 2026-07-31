# Togethere · Gestão Escolar

> *inglês para chegar lá*

Aplicativo interno da escola **Togethere** (Gravataí/RS) para o dia a dia pedagógico:
chamada, temas de casa, testes e boletins, planos de aula, relatórios por aluno e por turma,
avisos para a secretaria, atas, tarefas internas, correção de writings com IA, **alertas
automáticos** e um **Portal do Aluno** — tudo com sincronização na nuvem. É um **PWA**
(instalável no celular/tablet/computador) feito em um único arquivo `index.html`.

> **Versão atual: `2026.07.30 · b101 (Supabase)`.**
> O app roda sobre um banco **PostgreSQL no Supabase** (a migração saiu do Google Sheets em
> 25/07). Em 30/07 entrou um bloco grande de novidades — login único de alunos, cards de acesso,
> aprovação de boletim, Ficha redesenhada e o **Portal do Aluno ao vivo**. Veja
> [Dados, nuvem e backup](#dados-nuvem-e-backup).

---

## Como acessar

### Equipe (professores, secretaria, direção)
- **Site (nuvem):** GitHub Pages em `https://francoboaventura.github.io/app-escola-togethere/`
- Abra o link em qualquer aparelho e **faça login**. Dá para **instalar como app**
  (Adicionar à Tela de Início / Instalar), com ícone próprio e tela cheia.

### Alunos e famílias — Portal do Aluno
- Página separada: **`portal-aluno.html`** (mesmo repositório).
- O aluno faz login e vê **as próprias informações ao vivo**, sem a escola precisar publicar nada.
  Detalhes em [Portal do Aluno](#portal-do-aluno).

### Logins e perfis

**Equipe** — login pelo **primeiro nome** + senha padrão **`Nome@2026`** (ex.: `Franco@2026`,
`Vlad@2026`). Internamente cada usuário tem um e-mail técnico `nome@togethere.app` (o app
converte o nome digitado, sem acento).

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

**Alunos** — login único no formato **primeiro nome + último sobrenome** + `@tgt.app`
(ex.: "Davi de Vargas Jachemet" → `davijachemet@tgt.app`); em caso de repetição, o sistema
acrescenta `1`, `2`… ao fim. As senhas são geradas e distribuídas pelos **Cards de acesso**
(ver abaixo), e no **1º acesso** o aluno é obrigado a criar uma senha nova.

---

## Funcionalidades

### Painel de Gestão (direção)
Visão executiva na tela inicial da direção: **presença geral dos últimos 30 dias**, **alunos em
alerta** e uma tabela por turma com nº de alunos, **barra de presença** (verde/âmbar/vermelho) e
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
(`togethere-writing`). Guarda as notas **e o relatório completo** por aluno — com barras por
subskill, justificativas, chips PASS/CEFR, pontos fortes, próximos passos e correções, que
reaparecem na Ficha e no Portal.

### Alunos VIP
Alunos de aulas particulares/avulsas, **fora das turmas regulares**, com registro próprio.

### Testes e boletim
- Cada teste recebe **uma nota por habilidade**: Grammar, Vocabulary, Listening, Reading,
  Writing e Speaking.
- Nº de testes segue o nível: **KIDS** sem teste formal; **B2/C1** fazem 2; os demais, 3 no ano.
- **Faixas (padrão Cambridge):** 0–59 *in need of improvement* · 60–89 *pass* · 90–100 *merit* ·
  **★ Distinction** (supera o esperado; selo sem nota numérica).
- **Boletim de fim de ano** na identidade da escola, com parecer descritivo, impressão/PDF/cópia,
  passando pelo **fluxo de aprovação** abaixo.

### Fluxo de aprovação do boletim
1. O **professor** preenche conceitos/parecer e clica **Gerar boletim completo** → o boletim vai
   para a aba **"Aprovar boletins"** (toast "enviado para a aprovação").
2. **Aprovar boletins** (direção) lista **Aguardando aprovação**, **Reprovados (com o professor)**
   e **Aprovados**.
   - **Aprovar** → libera envio/impressão/PDF **e a exibição no Portal do Aluno**.
   - **Reprovar** → abre um **modal com o motivo (obrigatório)**; vira aviso para o professor.
   - **🗑️ Apagar** → remove o boletim.
3. O **professor** vê no Painel um card **"Boletins reprovados"** (só das turmas dele) com o motivo
   e o botão **Abrir e corrigir**. Ao editar, a reprovação é limpa; ao gerar de novo, volta para
   "Aguardando aprovação".

### Relatório individual e por turma
Relatório do aluno puxável a qualquer tempo, por período, com notas, faltas (com o conteúdo da
aula perdida), atrasos, material e temas pendentes. O relatório da aula gerado pelo professor cai
nos **Avisos** da secretaria, que **copia para os grupos de WhatsApp** e marca como enviado.

### Alertas automáticos (secretaria)
Avisa quando um aluno atinge **3 faltas consecutivas**, ou fica sem material em **3 aulas
seguidas** ou **5 alternadas**. As **faltas retroativas** e as **datas de nascimento** foram
importadas uma vez do histórico do Sponte.

### Ficha do aluno (redesenhada)
Tela no estilo do Portal: **hero** (avatar, nome, turma/professor/idade, status), **tiles**
(Presenças/Faltas/Temas/Material), dados e ações do aluno (e-mail do responsável, Trocar turma,
VIP, período) e **abas** — Aulas (cards expansíveis com chips), Testes (média + barras por
habilidade), Writings (relatório rico), Temas, Material e Comentários. Ações no rodapé: Enviar,
Gerar boletim, Copiar, Imprimir.

### Cards de acesso dos alunos (secretaria + direção)
Em **Gestão → 🖨️ Cards de acesso**: escopo **Uma turma / Um aluno / Todas as turmas** →
**Gerar cards** → abre a folha (agrupada por turma) já pronta para imprimir/salvar em PDF, com o
login e a senha de cada aluno — **sem CSV**. Gerar os cards também **conserta logins antigos** para
o formato único (nome+sobrenome). Existe ainda a ferramenta avulsa **`admin-logins.html`**
("Criar logins de alunos") para a direção.

### Outros
- **Atas de reunião.**
- **Tarefas internas** — matriz de Eisenhower (com *Standby* no lugar de *Delegar*).
- **Acessos** (direção) — backup dos dados e **Forçar troca de senha** por turma.

---

## Portal do Aluno

Página `portal-aluno.html`. O aluno vê **todas as suas informações ao vivo** — a escola **não
precisa publicar** nada. Comentários aparecem; o **boletim só aparece depois de aprovado**
(aba sempre visível, com cadeado até liberar).

**Como é seguro (LGPD).** Todos os alunos vivem num único documento na nuvem, e o aluno **nunca lê
esse documento**. Quem faz a ponte é a **Edge Function `minha-ficha`**: recebe o login do aluno,
descobre a quem ele corresponde e devolve **apenas os dados daquele aluno**, já estruturados
(resumo, aulas, temas, testes, writings, comentários e boletim, quando aprovado). As tabelas ficam
protegidas por RLS — só a função, com credencial de servidor, monta a resposta.

**No Portal:** login → hero (nome/turma) → tiles de resumo → botão **Baixar ficha em PDF** →
abas roláveis: **Aulas** (cada aula é um botão expansível com chips e detalhes), **Writings**,
**Testes**, **Temas**, **Comentários** e **Boletim** (cadeado até a direção liberar).

---

## Identidade visual

Baseada no material da pasta **NUSA – ID Visual**:
- **Cores:** azul `#005EAF`, amarelo `#FFC800`, vermelho e branco.
- **Ícone do app:** o **"e" vermelho com o ponto azul** (símbolo da marca), em fundo branco.
- **Logo dos documentos:** o letreiro `togethere` completo (embutido no `index.html`).

---

## Dados, nuvem e backup

O backend é o **Supabase** (PostgreSQL). Projeto: `https://wkmmlbzrfkkalcsxxtze.supabase.co`
(região São Paulo).

- **Login/autenticação:** Supabase Auth. Papéis (direção/professor/secretaria/**aluno**) na tabela
  `perfis`; o perfil de aluno guarda o vínculo `aluno_id`.
- **Estado do app:** guardado como um documento **JSONB** na tabela `estado` (o "estado `S`" inteiro
  do app). É o que a equipe lê/grava no dia a dia. A policy garante que **só a equipe** (papel
  diferente de `aluno`) acessa esse documento.
- **Tabelas normalizadas** já criadas e populadas (`turmas`, `alunos`, `aulas`, `presencas`),
  prontas para a próxima etapa (mover a presença do documento para elas e disparar o alerta no
  servidor). Há também `relatorios_aluno` e `acessos_alunos` (registro global de logins de aluno).
- **Segurança (RLS):** só usuário **logado** acessa os dados. A chave *publishable* (pública) fica
  embutida nos apps — é segura porque quem protege é o RLS; a chave *secret* nunca sai do painel.
- **Como o app fala com o banco:** `cloudLogin`, `cloudGet` (lê o documento `estado`) e `cloudPut`
  (mescla e grava). A biblioteca `@supabase/supabase-js` está **embutida** (sem CDN).

### Edge Functions (Supabase)
- **`minha-ficha`** — devolve ao Portal os dados estruturados de um aluno (boletim só se aprovado).
- **`criar-logins-alunos`** — cria os logins de aluno já no formato único.
- **`cards-turma`** — gera/guarda senha, corrige logins antigos e monta os cards de acesso.
- **`forcar-troca-senha`** — marca "trocar senha no 1º acesso" por turma.
- **`enviar-email`** — envio de e-mail (base para recuperação/contato).

### Comunicação com os pais
Hoje o resumo da aula chega às famílias pelo **WhatsApp**: o professor gera o relatório, ele cai
nos **Avisos** da secretaria, que copia para os grupos e marca como enviado. O envio direto por
**e-mail aos pais** segue **desligado de propósito** (será religado mais adiante).

### Backup
1. **No app** — *Acessos → Baixar backup agora* (`.json`) / *Restaurar de um arquivo*.
2. **Supabase** — backups automáticos do projeto (painel do Supabase).

> O Google Apps Script antigo (planilha) está **desativado** — ficou como legado/histórico. O app
> oficial anterior é recuperável pelo histórico do GitHub, se necessário.

---

## Como atualizar o app

Tudo é servido pelo GitHub Pages, então publicar é subir o arquivo no repositório:

- **Regra de ouro:** construa e valide numa **cópia de teste** (`index-teste.html` / `app-teste.html`)
  e só então promova para o **`index.html`** oficial. Nunca editar o oficial no escuro.
- **Pelo navegador:** repositório → abra o arquivo → *Edit* (ou *Upload files* para substituir) →
  *Commit changes*. Em ~1 minuto o site atualiza em todos os aparelhos.
- **Quase sempre basta o `index.html`.** O `sw.js` atual é **auto-destrutivo** (limpa o cache antigo
  e garante que todos recebam a versão nova).
- **Suba a versão** em `APP_VERSAO` a cada publicação e confira pelo número no **rodapé**.
- **Portal:** mudanças em `portal-aluno.html` sobem do mesmo jeito; mudanças nas Edge Functions
  exigem **re-deploy** no Supabase.
- **Ícone:** trocar o ícone não atualiza sozinho nos aparelhos já instalados — é preciso remover o
  atalho da tela e adicionar de novo (uma vez).

---

## Arquivos do repositório

| Arquivo | O que é |
|---|---|
| `index.html` | **O aplicativo oficial** (interface + lógica + supabase-js embutido). Versão `b101`. |
| `portal-aluno.html` | **Portal do Aluno** (login do aluno → chama `minha-ficha`). |
| `admin-logins.html` | Ferramenta da direção para **criar logins de alunos**. |
| `index-teste.html` / `app-teste.html` | **Cópias de teste** (não são o app oficial). |
| `togethere-poc-presenca.html` | Protótipo/estudo de presença normalizada. |
| `portal-aluno.sql` | SQL do Portal (tabela `relatorios_aluno`, grants, RLS). |
| `sw.js` | Service worker auto-destrutivo (limpa cache antigo). |
| `manifest.json` | Manifesto do PWA (ícones, nome, cores). |
| `icon-192.png` / `icon-512.png` / `apple-touch-icon.png` | Ícones do app (o "e" vermelho). |
| `logo.png` | Letreiro `togethere` usado nos documentos/telas. |
| `README.md` | Este arquivo. |

---

## Tecnologia

HTML/CSS/JavaScript **puro (vanilla)** em **arquivo único**, com sincronização via **Supabase**
(Auth + Postgres + Edge Functions) e correção de writings num **Cloudflare Worker**. A biblioteca
`@supabase/supabase-js` está embutida. Sem build, sem dependências a instalar.

---

## Roadmap

**Concluído recentemente (25–30/07):** migração para Supabase · Painel de Gestão · importação de
faltas e nascimentos do Sponte · PWA instalável · **login único de alunos** · **Cards de acesso
sem CSV** · **troca de senha no 1º acesso** · **fluxo de aprovação de boletim** · **Ficha do aluno
redesenhada** · **Writings ricos** · **Portal do Aluno ao vivo** (`minha-ficha`, boletim só quando
aprovado).

**Próximos passos previstos:**
1. **Alerta de faltas automático no servidor** — normalizar a presença nas tabelas `aulas`/`presencas`
   e disparar o alerta sem depender de alguém abrir o app.
2. **Rollout dos logins de aluno** — piloto em uma turma e depois a escola toda (gerar/imprimir os
   cards pelo app *antes* de os alunos acessarem).
3. **Religar o e-mail aos pais** (e envio via WhatsApp num toque).
4. **Recuperação de senha** no próprio app (segurança/LGPD com dados de menores).
5. **Completar nascimentos** das turmas B2/B1+ teens.
6. **Multi-unidade (franquia)** — cada unidade com dados isolados sob a marca Togethere, com a
   direção enxergando todas.
7. **Profissionalizar a estrutura do código** (separar o `index.html` em módulos + build/deploy
   automático) — em avaliação.

> Contexto técnico e histórico ficam registrados no Projeto Claude
> (`togethere-migracao-status`, `plano-banco-de-dados-togethere`, `estado-tecnico-apps`,
> `togethere-portal-aluno`, `togethere-boletim-aprovacao`, `togethere-rollout-logins`).
