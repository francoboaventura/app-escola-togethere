# Togethere · Gestão Escolar

> *inglês para chegar lá*

Aplicativo interno da escola **Togethere** (Gravataí/RS) para o dia a dia pedagógico **e
comercial**: chamada, temas de casa, testes e boletins, planos de aula, relatórios por aluno e
por turma, avisos para a secretaria, alunos VIP com pacotes de horas, correção de writings com
IA, **matrículas e financeiro**, **livros sob demanda**, **permissões configuráveis** e um
**Portal do Aluno** — tudo com sincronização na nuvem. É um **PWA** (instalável no
celular/tablet/computador) publicado como um único `index.html`, mas **desenvolvido em módulos**
(pasta `src/`) com build automático.

> **Versão atual: `2026.08.04 · b168 (Supabase)`.**
> O app roda sobre **PostgreSQL no Supabase** (migração do Google Sheets em 25/07).
> Confira a versão em uso no **rodapé** do app — ele avisa sozinho quando há atualização.

---

## Como acessar

### Equipe (professores, secretaria, direção)
- **Site (nuvem):** `https://app.togethere.com.br` (domínio próprio; o GitHub Pages
  `francoboaventura.github.io/app-escola-togethere` redireciona).
- Abra o link em qualquer aparelho e **faça login**. Dá para **instalar como app**
  (Adicionar à Tela de Início / Instalar), com ícone próprio e tela cheia.

### Alunos e famílias — Portal do Aluno
- Página separada: **`portal-aluno.html`** (mesmo site).
- O aluno faz login e vê **as próprias informações ao vivo**. Detalhes em
  [Portal do Aluno](#portal-do-aluno). Alunos **VIP não têm portal** por enquanto.

### Logins e perfis

**Equipe** — login pelo **primeiro nome** + senha. Internamente cada usuário tem um e-mail
técnico `nome@togethere.app` (o app converte o nome digitado, sem acento).

- **Professor** — vê as próprias turmas: chamada, temas, testes, planos, writings, VIP
  (lançamentos). O que ele pode fazer é ajustável em **🔐 Permissões**.
- **Secretaria** — acompanhamento e operação: avisos, relatórios, livros, cadastros, horas VIP,
  pausas — cada ação pode ser ligada/desligada pela direção em **🔐 Permissões**.
- **Direção** — acesso completo, incluindo Painel de Gestão, Matrículas, Financeiro,
  Config. financeira, Permissões e Acessos.

**Alunos** — login único **primeiro nome + último sobrenome** + `@tgt.app`
(ex.: `davijachemet@tgt.app`); senhas distribuídas pelos **Cards de acesso**, com troca
obrigatória no 1º acesso.

---

## Funcionalidades

### Sala de aula
- **Chamada do dia** — presença, atraso, saiu cedo, material (🎒) e conferência do tema numa
  tela só; chamada salva fica travada (edição controlável por permissão).
- **Planos de aula** — checklist, anotações, **links úteis do professor** (vídeo, jogo,
  apresentação) e geração do relatório da aula.
- **Temas de casa** — registro e acompanhamento (feito/parcial/não feito).
- **Testes e boletim** — nota por habilidade (Grammar, Vocabulary, Listening, Reading, Writing,
  Speaking), faixas padrão Cambridge, boletim com **fluxo de aprovação** pela direção.
- **Correção de writings (IA)** — bandas por nível (A1–C1), **transcrição por foto** com
  **ferramenta de recorte** (✂️), relatório completo editável. A chamada externa passa pela
  Edge Function `wa-proxy` (sem problema de CORS).
- **Formação** — biblioteca da metodologia + registro de leituras e sessões.

### Acompanhamento
- **Ficha do aluno** — hero, tiles, abas (aulas, testes, writings, temas, material,
  comentários), card **📚 Livros** com o estágio do material, contratos e envio por e-mail.
- **Alunos VIP** — aulas particulares com **pacotes de horas** (contratadas × utilizadas,
  visíveis só para secretaria/direção), **aulas em dupla** com hora-aula própria (valor por
  aluno), horários previstos POR DIA (cada dia com hora E duração próprias), **pausas** (períodos sem alerta), **panorama com filtro de período** (mês/ano),
  **link de aula online** (Meet/Zoom) e **links úteis do professor** na ficha,
  **remanejamentos** de aula e alerta de aula prevista **não lançada em 24h**. Horas de
  **consolidação** (pré-app) ficam separadas e não contam como aula lançada.
- **Avisos automáticos** — 3 faltas consecutivas; sem material 3 seguidas ou 5 alternadas;
  aula VIP não lançada; **mensalidade vencida** (com "✓ Contatei" que realerta se outra vencer).
- **Relatórios** — por aluno, por turma e **relatório mensal da turma** (impressão + CSV);
  exportação de **horas VIP** em planilha.
- **Aprovar boletins**, **arquivo de relatórios**, **aula de apoio**, **comunicados**.

### Gestão
- **Turmas** — status **EM FORMAÇÃO / VIGENTE / ENCERRADA**; criação de turma e de
  **sequência** (herda dias/horário/professor e sugere o próximo CEFR); **nome automático**
  no padrão `CEFR + SEGMENTO + DIAS + HORA` (ex.: `A2+ JUNIOR SEG/QUA 18h`).
- **📚 Livros** — a escola **não mantém estoque**: fluxo por aluno
  **🛒 pedido → 📦 recebido → ✅ entregue**, com lista automática de quem precisa de livro,
  pedidos, recebimentos e entregas EM LOTE, pedido avulso, CSV e cobrança do material no financeiro na entrega.
- **📝 Matrículas** (direção) — **⚡ Fechar venda** (wizard: aluno+turma → valores da tabela →
  confirma; cria aluno, matrícula ativa, plano financeiro e pedido do livro numa sequência só),
  **orçamentos** exportáveis em PDF (atalho de venda), conversão
  em matrícula, **✖ não fechou** (registra o motivo da venda perdida, com reabrir) e exclusão
  de orçamentos; **📄 contrato oficial** com o texto jurídico completo da escola, preenchido
  automaticamente (partes, quadro, parcelas do plano, portal do aluno) em até 4 páginas —
  há também o contrato de **aulas particulares (VIP)**, gerado na ficha do aluno VIP.
- **💰 Financeiro** (direção) — plano por matrícula: mensalidade, parcelas, descontos em % e
  R$, carnê com recebimento manual e **🖨️ recibo em PDF por parcela/extra pago**,
  **negociação com senha da direção**, cobranças extras,
  multa/juros por atraso. Boleto e cartão por enquanto **simulados** (APIs depois).
- **⚙️ Config. financeira** (direção) — tabela de preços **por segmento** (Kids, Junior,
  Teens, Adults, Talking **+ segmentos cadastráveis**), hora-aula VIP (renovação, **aluno
  novo** e dupla), **política de descontos** (sai no orçamento), cobranças diversas, multa e
  juros, e **🧩 Produtos** (cadastrar segmentos, níveis CEFR e materiais novos — alimentam
  turmas, preços e livros). A tabela 2025 oficial já está carregada.
- **🔐 Permissões** (direção) — liga/desliga ações da secretaria e dos professores.
- **🎯 Tarefas internas** — matriz de Eisenhower da equipe com **Standby** no lugar de
  "delegar": Fazer agora / Agendar / Standby / Eliminar, com responsável e prazo.
- **Acessos** — senhas da equipe, logins do portal, cards de acesso, assinatura, backup.
- **Busca global (🔎)**, **limpeza de duplicidades**, **cards de acesso**.

### Aparência
- **Modo escuro** e **6 combinações de cores** da identidade Togethere — cada usuário escolhe
  no menu da conta; a preferência fica no aparelho.
- **Ergonomia de celular** revisada (alvos de toque, tabelas roláveis, modais).

### Tutorial no app
A aba **📖 Tutorial** é um guia **ilustrado com prints reais** de TODAS as telas (35 prints,
incluindo o Portal do Aluno e o menu de aparência). Professor e secretaria veem **só o que é
do seu dia a dia**; a direção vê tudo, com filtro por perfil. O guia **se adapta às
Permissões**: item desligado pela direção some do tutorial daquele perfil.
**Regra da casa (tripla): toda mudança publicada atualiza (1) o texto do Tutorial, (2) os
prints — `node scripts/tutorial-prints.cjs` — e (3) este README.**

---

## Portal do Aluno

Página `portal-aluno.html`. O aluno vê as próprias informações ao vivo; o **boletim só aparece
depois de aprovado**. A ponte é a Edge Function **`minha-ficha`** — o aluno nunca lê o documento
geral; a função devolve **apenas os dados dele** (LGPD), com tabelas protegidas por RLS.

---

## Identidade visual

Baseada no material da pasta **NUSA – ID Visual**: azul `#005EAF`, amarelo `#FFC800`, vermelho,
rosa, roxo e verde da paleta. Ícone: o **"e" vermelho com ponto azul**; logo `togethere`
embutido no app.

---

## Dados, nuvem e backup

Backend **Supabase** (PostgreSQL, região São Paulo): `https://wkmmlbzrfkkalcsxxtze.supabase.co`.

- **Login:** Supabase Auth; papéis na tabela `perfis`.
- **Estado do app:** documento **JSONB** na tabela `estado`, mesclado por coleção
  (`MERGE_COLS`) com marcas de exclusão — vários aparelhos podem trabalhar juntos.
- **Backup automático:** snapshot do estado **a cada 6h** via `pg_cron` na tabela
  `backups_estado` (retenção 30 dias, sem duplicar conteúdo idêntico), além do backup manual
  no app (Acessos) e dos backups do próprio Supabase.
- **Edge Functions:** `minha-ficha`, `criar-logins-alunos`, `cards-turma`,
  `forcar-troca-senha`, `enviar-email`, **`wa-proxy`** (transcrição/avaliação de writings).
- **Comunicação com os pais:** relatório da aula → Avisos → WhatsApp (copiar e marcar
  enviado). Envio por e-mail segue desligado de propósito.

---

## Como o código é organizado e como atualizar

O app é **desenvolvido em módulos** e **publicado como arquivo único**:

- `src/js/00…31-*.js` — os módulos do app (estado, nuvem, telas, módulos de gestão).
- `src/index.template.html` + `src/css/app.css` — casca e estilos.
- `scripts/build.mjs` — concatena tudo em `dist/index.html` e `dist/portal-aluno.html`
  (`node scripts/build.mjs --min`).
- **Deploy automático:** push na branch `main` → GitHub Actions constrói e publica no
  GitHub Pages (`app.togethere.com.br`). O app avisa os aparelhos quando a versão muda.

Checklist de cada publicação:
1. Alterar os módulos em `src/`.
2. Subir `APP_VERSAO` (módulo 01).
3. **Atualizar a aba Tutorial (módulo 26) e este README** com o que mudou.
4. Build + testes (harness Playwright + teste de boot) e push.

---

## Arquivos do repositório

| Arquivo | O que é |
|---|---|
| `src/` | **Código-fonte em módulos** (js, css, templates). |
| `scripts/build.mjs` | Build: gera o app final em `dist/`. |
| `.github/workflows/` | Build + deploy automáticos no GitHub Pages. |
| `dist/index.html` | O app publicado (gerado — não editar à mão). |
| `dist/portal-aluno.html` | Portal do Aluno publicado (gerado). |
| `admin-logins.html` | Ferramenta da direção para criar logins de alunos. |
| `sw.js` / `manifest.json` | Service worker + manifesto do PWA. |
| `supabase/` | Edge Functions e SQL. |
| `README.md` | Este arquivo. |

---

## Tecnologia

HTML/CSS/JavaScript **puro (vanilla)**, sem framework. Sincronização via **Supabase**
(Auth + Postgres + Edge Functions); correção de writings num **Cloudflare Worker** acessado
pela Edge Function `wa-proxy`. Build com Node + esbuild (só minificação leve), deploy via
GitHub Actions.

---

## Roadmap

**Concluído em 02/08 (auditoria geral com 4 revisores):** data local corrigida (lançamentos
noturnos), carimbos de sincronização em todas as edições (nada mais "volta sozinho"),
alertas por sequência (contato não silencia para sempre), gravação na nuvem com trava de
concorrência + histórico `estado_hist` no servidor, verificação de senha sem trocar sessão,
contas da equipe via Edge Function `admin-equipe`, financeiro fiel (recebido por snapshot,
orçamento congelado, trancada sem atraso, multa na baixa), livros com pendência de cobrança,
varredura anti-XSS, modo escuro consertado no login, abas da Formação, tarefas internas
(Eisenhower) e correções de boletim/média/temas.

**Concluído recentemente (31/07–01/08):** VIP com horários previstos, pausas, remanejamentos e
alerta de 24h · consolidação de horas importadas · recorte de foto e proxy dos writings ·
backup automático 6/6h · panorama de horas VIP · relatório mensal por turma · exportações CSV ·
busca global · modo escuro + temas de cor · ergonomia mobile · status/sequência de turmas ·
matrículas + financeiro separados (orçamentos, contrato-modelo, negociação com senha, preços
por segmento, multa/juros) · permissões configuráveis · livros sob demanda (pedido → recebido →
entregue) com cobrança do material.

**Concluído em 03/08 (b159–b160):** contratos **oficiais** no app — turmas e VIP — com o texto
jurídico exato fornecido pela direção, quadro preenchido automaticamente e limite de 4 páginas;
campos de endereço/fim de período/modalidade na matrícula; tabela de preços 2025 carregada
(mensalidades por segmento, hora VIP renovação/aluno novo/dupla, Material VIP, Talking,
descontos família+à vista). Ficha VIP **limpa para o professor** (painel "Sua aula com este
aluno" com próxima aula, 🎥 Entrar na aula em destaque e ➕ Lançar aula; link mantido pela
secretaria) e **regras de falta/cancelamento**: falta sem aviso é registrada pelo professor e
desconta a hora; cancelamento com **menos de 12h** é registrado pela **secretaria** (🚫 botão
na ficha) e também desconta — professor liberado não registra nada. Professor **não vê** pacote
de horas, totais de horas, contadores de presença/faltas/writings no topo da ficha nem
cancelamentos, e **não altera horários previstos** (só consulta);
a **hora real** da aula ele ajusta no lançamento (campo "Hora em que aconteceu", pré-preenchido
com o previsto do dia). Duração mínima de aula VIP: **30 minutos**.

**Concluído em 03/08 (b163):** níveis oficiais da escola em todo o app (KIDS Pré A1→A1+ ·
JUNIOR A1→A2+ · TEENS/ADULTS A1–C1+, **sem B2+**) — a secretaria agora cria turmas de
qualquer nível, com o card **➕ Nova turma** no topo da tela de Turmas (categoria e nível puxam
os produtos cadastrados); na lista de alunos da turma ficam só nome e ações (e-mail e
nascimento moram na ficha do aluno).

**Concluído em 04/08 (b164):** redesenho dos menus — no lugar de listas de linhas, **quadradinhos**
no estilo dos cards de "próximas aulas": ações do ambiente da turma, menus suspensos do topo
(computador), menu **☰ Mais** do celular e as seções do **Portal do Aluno** (com ícone e contador).
Funciona igual no modo escuro. Em seguida (b165) o mesmo conceito chegou à **ficha do aluno**:
as seções (Aulas, Testes, Writings, Temas, Material, Comentários) viram quadradinhos com ícone e
contador — no celular as seis cabem na tela, sem arrastar — e as ações do rodapé (enviar ao
responsável, boletim, copiar, imprimir) também, valendo igual para a ficha do aluno VIP.
E no **b166** os menus suspensos do topo deram lugar a um único botão **☰ Menu**, que abre o
painel de quadradinhos com tudo o que aquele perfil acessa — o mesmo menu aparece no **Painel**,
logo abaixo das próximas aulas. Cada perfil vê só os seus itens. Os cards de **próximas aulas**
passaram a abrir o **ambiente completo da turma** (antes abriam só a chamada).

**Concluído em 04/08 (b167):** campos de **data e hora** deixaram de fechar no meio da digitação —
o navegador dispara um evento a cada estado válido (ano 0002 → 0020 → 2026; hora 18:01 antes de
18:15) e o app re-renderizava a tela em cima disso; agora valores incompletos são ignorados e
qualquer atualização de tela espera você sair do campo. **Nome do aluno VIP** passou a ser
editável pela secretaria e pela direção, na ficha. O conjunto de testes automáticos virou parte
do repositório (`node scripts/testes/app.test.cjs`, 33 verificações).

**Concluído em 04/08 (b168):** aulas VIP já lançadas podem ser **editadas ou excluídas** direto da
ficha do aluno (direção edita tudo; professor edita as aulas dele; secretaria edita e desfaz os
cancelamentos que registra — excluir devolve a hora ao saldo). O card **⏱️ Pacote de horas** passou
a ficar **recolhido** por padrão, abrindo com um toque, e mostra um **(!)** vermelho quando o
pacote está na lista de atenção (saldo baixo/esgotado ou vigência vencendo).

**Próximos passos previstos:**
1. **APIs de boleto e cartão** (hoje simulados).
2. Alerta de faltas calculado no servidor.
3. Recuperação de senha no próprio app.
4. Multi-unidade (franquia).

> Contexto técnico e histórico ficam registrados no Projeto Claude (docs `claude/togethere-*`).
