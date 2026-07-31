# ☀️ Revisão da manhã — trabalho da madrugada (31/07)

Oi, Franco! Deixei tudo numa branch chamada **`melhorias-noturnas`** — **nada foi pro ar**.
O `main` (o que a escola usa) continua intacto no b102. Aqui está o mapa do que fiz, separado
por **o que já está aplicado e testado** e **o que é proposta/rascunho pra você aprovar**.

Como revisar: abra a branch `melhorias-noturnas` no GitHub, veja os arquivos, e quando gostar,
me diga "aprova X" que eu faço o merge (ou você mesmo mescla). O que depende do Supabase, a
gente liga junto quando você me passar o acesso.

---

## ✅ Aplicado e testado (seguro pra mesclar) — vira b103

### 1. Camada de acessibilidade + polimento (CSS)
Adicionei ao fim do `src/css/app.css` um bloco **aditivo** (não mexi em nada do que já existia):
- **Foco visível no teclado** (WCAG 2.4.7): quem navega por Tab agora enxerga onde está — o app
  não tinha isso. Só aparece na navegação por teclado; no mouse continua igual.
- **Botões desabilitados** finalmente parecem desabilitados (antes ficavam iguais aos ativos).
- **Alvos de toque maiores no celular** (~44px) nos botões e no menu — chamada mais fácil no dedo.
- Pequenos caprichos: seleção de texto na cor da marca e barra de rolagem discreta.

**Verificação:** build minificado + boot test headless (login renderiza, **zero erros de JS**).
**Risco:** baixo (CSS aditivo). Recomendo abrir a branch no celular e no PC antes de mesclar.

---

## 🎨 Proposta pra você aprovar a direção (não toca no app)

### 2. Redesign das telas principais → `propostas/proposta-redesign.html`
Uma maquete conceitual do **Painel** e da **Chamada**, mantendo 100% a identidade NUSA. As ideias
(baseadas no que há de melhor em apps de escola hoje) são: um painel que **olha pra frente**
(próximas aulas), números **com tendência**, cada alerta com **contato em 1 toque**, e uma chamada
com **botões grandes** e tema/material já na linha do aluno. Abra o arquivo no navegador (ou veja
o print que te mandei). Se curtir a direção, eu implemento **por partes**, cada uma numa branch pra
você validar antes de publicar. Nada aqui está no app — é só pra decidirmos o rumo.

---

## 🔌 Features engatilhadas (precisam de você + Supabase)

### 3. E-mail aos pais — *surpresa: já está quase tudo pronto!*
Investigando o código, descobri que o envio por e-mail **já está ligado no app**: na tela de
**Avisos** existe o botão **"✉️ Enviar por e-mail"** que chama a função `enviar-email`, e mostra
"N/M com e-mail" por turma. Ou seja, aquela nota antiga de "e-mail desligado" está **desatualizada**
— foi religado no trabalho do dia 30. O que falta é **só do lado do Supabase/dados**, não é código:
1. Confirmar que a função `enviar-email` está mesmo publicada e com um **provedor de e-mail
   configurado** (Resend/SMTP/etc.).
2. **Cadastrar os e-mails dos responsáveis** (em Turmas e alunos) — o indicador "N/M com e-mail"
   mostra quantos já têm.
3. **Testar mandando um para você primeiro**, antes de enviar pra qualquer família.

Não mexi no código do envio de propósito: está funcionando e eu não conseguiria testar sem o
Supabase. Quando você me der o acesso, a gente confirma o provedor e faz um envio de teste.

### 4. Alerta de faltas no servidor → `supabase/functions/alertas-faltas/` + `supabase/sql/alertas.sql`
Rascunho pronto pra revisar. **Insight importante:** dá pra ter o alerta automático **sem a Etapa 2**
(sem migrar a presença pra tabelas novas). A função lê o **mesmo blob `estado`** que o app já usa,
aplica as **regras idênticas** (portei 1:1 o `alertasFaltas`/`alertasMaterial` do app: 3 faltas
seguidas, 3 materiais seguidos ou 5 alternados) e manda **um resumo por e-mail à secretaria**.
Muito menos risco que mexer em como os dados são gravados.

Segurança embutida: a função começa em **dry-run** — ela só *lista* os alertas, não envia nada.
O plano (em `supabase/README.md`) é: implantar → rodar o dry-run → **comparar com a tela Alertas
do app** → só quando os números baterem, ligar o envio (`?enviar=1`) e agendar. Tem dedup (não
repete o mesmo alerta todo dia) e respeita quem você já marcou como "Contatado".

**Pendências que anotei:** a pausa de férias (recesso) ainda não está portada — durante férias usa-se
um `PAUSAR_ALERTAS=1`, ou me peça pra portar a lógica de recesso. E precisa definir o e-mail da
secretaria. Tudo detalhado no `supabase/README.md`.

---

## 🔎 Dois achados que valem sua atenção
1. **As Edge Functions não estão no controle de versão** — vivem só no painel do Supabase. Se uma
   for editada errado ou sumir, não tem histórico. Recomendo trazê-las pro repo em
   `supabase/functions/` (dá pra baixar com `supabase functions download <nome>`). Deixei a pasta
   começada com a nova função.
2. A nota "e-mail desligado" nos docs do projeto estava **desatualizada** (item 3). Já corrijo isso
   no registro do projeto.

---

## O que eu recomendo aprovar primeiro
1. **Mesclar a camada de acessibilidade** (item 1) — ganho real, risco baixo, vira b103.
2. **Olhar o redesign** (item 2) e me dizer se seguimos nessa direção.
3. Quando você tiver um tempo com o Supabase aberto, a gente **liga o alerta** (item 4, começando
   pelo dry-run) e **confirma o e-mail** (item 3). Esses dois eu não ativo sozinho — são os que
   tocam alunos e pais de verdade.

Qualquer coisa, é só me falar "aprova o item 1", "não curti o redesign, muda X", etc. Bom dia! ☕
