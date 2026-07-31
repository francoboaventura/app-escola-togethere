# Supabase — funções e SQL (Togethere)

> **Achado importante:** hoje as Edge Functions (`minha-ficha`, `enviar-email`,
> `criar-logins-alunos`, `cards-turma`, `forcar-troca-senha`) vivem **só no painel do
> Supabase** — não estão no controle de versão. Recomendo trazer o código de cada uma
> para `supabase/functions/<nome>/index.ts` (dá pra baixar com `supabase functions download <nome>`).
> Assim elas ficam versionadas junto com o app, com histórico e revisão.

## O que tem aqui (rascunhos desta madrugada)
- `functions/alertas-faltas/index.ts` — alerta de faltas/material **no servidor**, lendo o
  blob `estado` (sem migração de dados). Começa em **dry-run** (não envia nada).
- `sql/alertas.sql` — tabela de dedup + como agendar.

## Como validar e ligar (com o Franco, com acesso ao Supabase)
1. **Instalar CLI e logar:** `npm i -g supabase` → `supabase login` → `supabase link --project-ref wkmmlbzrfkkalcsxxtze`.
2. **Deploy da função:** `supabase functions deploy alertas-faltas`.
3. **Dry-run:** abrir `https://wkmmlbzrfkkalcsxxtze.functions.supabase.co/alertas-faltas`
   (com o header Authorization: Bearer <anon key>). Comparar a lista devolvida com a tela
   **Alertas** do app. **Os números têm que bater** antes de seguir.
4. **Rodar o SQL:** `sql/alertas.sql` (cria `alertas_enviados`).
5. **Secrets:** `supabase secrets set SECRETARIA_EMAIL=<email da secretaria>` (e
   `PAUSAR_ALERTAS=1` quando for férias).
6. **Ligar o envio:** testar `.../alertas-faltas?enviar=1` uma vez (manda o resumo à
   secretaria e marca como notificado). Conferindo que chegou certo, **agendar** (ver
   `sql/alertas.sql`, opção A ou B).

## Por que este caminho (e não a "Etapa 2" agora)
A Etapa 2 (migrar a presença do blob para tabelas normalizadas e mudar como o app grava)
é grande e mexe em produção. Esta função entrega o **mesmo resultado** — alerta que dispara
sozinho — **sem tocar em como os dados são gravados**, então o risco é muito menor. A Etapa 2
continua valendo como evolução futura (relatórios em SQL, etc.), mas não é pré-requisito
para o alerta automático.
