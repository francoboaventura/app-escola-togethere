-- =============================================================================
-- alertas.sql · RASCUNHO para revisão (rodar no SQL Editor do Supabase)
-- Suporte para a função Edge `alertas-faltas` (dedup + agendamento).
-- Rode DEPOIS de validar o dry-run da função (comparar com a tela Alertas do app).
-- =============================================================================

-- 1) Tabela de dedup: guarda o que já foi notificado, para não repetir todo dia.
create table if not exists public.alertas_enviados (
  chave       text primary key,              -- "<alunoId>|<tipo>|<motivo>"
  notificado_em timestamptz not null default now()
);
alter table public.alertas_enviados enable row level security;
-- só o service_role (a função) acessa; ninguém logado precisa ler isto direto.
grant select, insert, delete on public.alertas_enviados to service_role;

-- Reabrir um caso (ex.: aluno voltou a faltar depois de contato): basta apagar a
-- chave correspondente. Opcional: limpeza automática de registros antigos:
--   delete from public.alertas_enviados where notificado_em < now() - interval '120 days';

-- 2) AGENDAMENTO — duas opções (escolher uma, depois de ligar o ?enviar=1):
--
-- (A) Supabase → Edge Functions → alertas-faltas → Schedules (jeito mais simples):
--     cron "0 21 * * 1-5" (21h UTC = 18h Brasília, dias de semana), com ?enviar=1.
--
-- (B) pg_cron (se preferir no banco). Requer as extensões pg_cron e pg_net:
--     create extension if not exists pg_cron;
--     create extension if not exists pg_net;
--     select cron.schedule(
--       'alertas-faltas-diario', '0 21 * * 1-5',
--       $$ select net.http_post(
--            url    := 'https://wkmmlbzrfkkalcsxxtze.functions.supabase.co/alertas-faltas?enviar=1',
--            headers:= jsonb_build_object('Authorization','Bearer <ANON_OU_SERVICE_KEY>')
--          ); $$
--     );
--
-- Durante férias/recesso: setar o secret PAUSAR_ALERTAS=1 na função (ou remover o
-- schedule) até as aulas voltarem — enquanto a lógica de recesso do app não é portada.
