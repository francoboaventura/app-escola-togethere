# Togethere · Gestão Escolar

> *inglês para chegar lá*

Aplicativo interno da escola **Togethere** (Gravataí/RS) para o dia a dia pedagógico:
chamada, temas de casa, testes e boletins, planos de aula, relatórios por aluno e por turma,
avisos para a secretaria, atas, tarefas internas e alertas automáticos — com sincronização
na nuvem. É um **PWA** (instalável no celular/tablet) feito em um único arquivo `index.html`.

---

## Como acessar

- **Site (nuvem):** publicado via GitHub Pages em
  `https://francoboaventura.github.io/app-escola-togethere/`
- Abra o link em qualquer aparelho (computador, tablet, celular) e **faça login**.
- Dá para **instalar como app** (Adicionar à Tela de Início), funcionando como um aplicativo.

### Logins e perfis

A senha padrão de todos é **`12345`**. A direção pode trocar qualquer senha na aba **Acessos**.

| Usuário   | Perfil      |
|-----------|-------------|
| Franco    | Direção     |
| Fernanda  | Direção     |
| Vlad      | Professor   |
| Mari      | Professor   |
| Leandro   | Professor   |
| Camila    | Professor   |
| Reginaldo | Secretaria  |

- **Professor** — vê apenas as próprias turmas e os alunos VIP.
- **Secretaria** — telas enxutas: Painel, Relatórios por aluno, Relatórios por turma e Avisos.
- **Direção** — acesso completo à escola toda.

---

## Funcionalidades

### Chamada do dia
Uma única tela por turma/data reúne **presença**, **atraso**, **saiu mais cedo**,
**material não trazido** (🎒) e a **conferência do tema de casa** (feito / parcial / não feito)
aluno por aluno. Depois de salva, a chamada fica **travada** e só é alterada pelo botão
*Editar chamada* (evita mudança sem querer).

### Planos de aula
Lista em acordeão de planos **pendentes** e **realizados**, com **checklist** dos itens da aula,
campo de **anotações** e botão para **gerar o relatório da aula** (que vai para os Avisos).

### Temas de casa
Registro dos temas (inclusive vindos do plano de aula) e acompanhamento de quem entregou.

### Alunos VIP
Alunos de aulas particulares/avulsas, **fora das turmas regulares**, com registro próprio de
presença e faltas.

### Testes e boletim
- Cada teste recebe **uma nota por habilidade**: Grammar, Vocabulary, Listening, Reading,
  Writing e Speaking.
- O número de testes segue o nível: turmas **KIDS** não têm teste formal; níveis **B2/C1**
  fazem **2 testes**; os demais, **3 testes** no ano.
- **Faixas de conceito (padrão Cambridge):**
  - **0–59** — *in need of improvement*
  - **60–89** — *pass*
  - **90–100** — *merit*
  - **★ Distinction** — concedido quando o aluno **supera o esperado para o nível** (selo de
    honra, **sem nota numérica**), marcável por habilidade e no conceito geral.
- O **boletim de fim de ano** sai na identidade visual da escola, com conceitos por habilidade,
  conceito geral, **parecer descritivo do professor** e um resumo do acompanhamento do ano.
  Pode ser **impresso / salvo em PDF** ou copiado como texto.

### Relatório individual do aluno
Documento **puxável a qualquer tempo**, por período (de/até), com **mais detalhes** e
**sem parecer**: resumo do período, notas de testes por habilidade, faltas **com o conteúdo da
aula perdida**, atrasos, saídas antecipadas, material e temas pendentes e comentários.
Sai na mesma arte do boletim, com **impressão / PDF** e cópia em texto.

### Relatórios por turma e Avisos
O professor gera o relatório de uma aula; ele aparece nos **Avisos** da secretaria, que **copia
para os grupos de WhatsApp** e marca como enviado. O histórico fica pesquisável por data em
*Relatórios por turma*.

### Alertas automáticos (secretaria)
Avisa quando um aluno atinge **3 faltas consecutivas**, ou fica sem material em **3 aulas
seguidas** ou **5 alternadas**.

### Outros
- **Atas de reunião.**
- **Tarefas internas** — matriz de Eisenhower (com *Standby* no lugar de *Delegar*).
- **Acessos** (direção) — gerenciar senhas e backup.

---

## Identidade visual

Baseada no material da pasta **NUSA – ID Visual**:
- **Cores:** azul `#005EAF` e amarelo `#FFC800` (principais).
- **Tipografia:** Poppins (principal), Zilla Slab Italic e Urbanist (apoio).
- **Símbolo:** o "t" orgânico com o blob amarelo. (Embutido no `index.html` para os documentos.)

---

## Dados, nuvem e backup

- Os dados ficam numa **planilha do Google** (aba `DB`, em JSON), controlada por um projeto
  **Google Apps Script**.
- O app **sincroniza automaticamente**: baixa ao abrir e salva a cada alteração. O rodapé mostra
  o status e a **versão** publicada (ex.: `2026.06.18 · b17`).
- A sessão (quem está logado) fica **apenas no aparelho**.
- Há uma **trava de proteção** que impede que um aparelho desatualizado/offline sobrescreva a
  nuvem cheia com dados vazios.

**Backup (3 camadas):**
1. **Histórico da planilha** — Arquivo → Histórico de versões.
2. **No app** — aba *Acessos* → *Baixar backup* / *Restaurar de um arquivo*.
3. **Diário automático** — função no Apps Script + acionador diário (aba `BACKUPS`).

---

## Como atualizar o app

Tudo é servido pelo GitHub Pages, então publicar é subir os arquivos no repositório:

- **Pelo navegador:** no repositório → *Add file → Upload files* → arraste os arquivos →
  *Commit changes*. Em ~1 minuto o site no ar está atualizado em todos os aparelhos.
- **Quase sempre basta o `index.html`.** Suba **também o `sw.js`** quando ele mudar (ele força a
  atualização do cache nos aparelhos).
- Confirme que atualizou pelo **número da versão no rodapé** do app.

> O `logo` dos documentos (boletim/relatório) está **embutido no `index.html`** — não é preciso
> subir imagem para eles funcionarem.

---

## Arquivos do projeto

| Arquivo                  | O que é                                                          |
|--------------------------|------------------------------------------------------------------|
| `index.html`             | O aplicativo (interface + lógica). É o que o GitHub Pages serve.  |
| `sw.js`                  | Service worker (PWA / cache offline).                            |
| `manifest.json`          | Manifesto do PWA (ícones, nome, cores).                          |
| `icon-192.png` / `icon-512.png` / `apple-touch-icon.png` | Ícones do app.          |
| `logo.png`               | Logomarca usada na interface.                                   |
| `Codigo.gs`              | Backend no Google Apps Script (sincronização).                  |
| `backup_diario.gs`       | Backup automático diário (Apps Script).                         |
| `README.md`              | Este arquivo.                                                   |

---

## Tecnologia

HTML/CSS/JavaScript **puro (vanilla)**, em **arquivo único**, com `localStorage` no aparelho e
sincronização via Google Apps Script → Google Sheets. Sem build, sem dependências externas.

---

## Segurança e próximos passos

Hoje o `index.html` é público e contém o endereço/chave de acesso à planilha; as senhas são
iguais e em texto. Por isso, **não divulgue o link** publicamente — é uma ferramenta interna.

**Roadmap previsto:**
1. **Segurança** — tornar o repositório **privado** e tirar a chave/URL do código do app;
   senhas **individuais** e não trafegadas em texto puro.
2. **Importar alunos do Sponte** (turmas + frequência) via exportação Excel/CSV.
3. **E-mail de comunicados** pela secretaria/direção.
4. **Atas automáticas por áudio** (gravar → transcrever → resumir), com atenção à LGPD.
