-- ============================================================================
-- Togethere — Portal do Aluno · SQL de base (segurança + publicação)
-- Rode no Supabase → SQL Editor, POR PARTES, lendo os comentários.
-- ⚠️ A Parte 2 mexe na segurança do 'estado'. Teste com um login da EQUIPE logo
--    depois (o app precisa continuar abrindo). Há rollback no fim.
-- ============================================================================

-- ── PARTE 1 — papel 'aluno' + vínculo com o id do aluno no app ──────────────
alter table if exists perfis
  add column if not exists aluno_id text;   -- só preenchido quando papel='aluno'


-- ── PARTE 2 — TRAVAR o 'estado' para a EQUIPE (LGPD) ────────────────────────
-- Hoje qualquer usuário logado lê o blob 'estado' (TODOS os alunos). Antes de
-- existir qualquer login de aluno, isso precisa ficar restrito à equipe.
--
-- ATENÇÃO: no Postgres, políticas RLS se SOMAM (OR). Não basta adicionar uma
-- política restritiva: é preciso APAGAR as políticas permissivas atuais, senão
-- o aluno ainda leria pelo caminho antigo.
--
-- 2a) Veja as políticas atuais do 'estado' (anote os nomes):
--     SELECT policyname, cmd, qual FROM pg_policies WHERE tablename='estado';
--
-- 2b) APAGUE as políticas permissivas atuais (troque os nomes pelos que apareceram):
--     DROP POLICY IF EXISTS "<nome-da-politica-atual-1>" ON estado;
--     DROP POLICY IF EXISTS "<nome-da-politica-atual-2>" ON estado;
--
-- 2c) Crie as políticas só-equipe:
alter table estado enable row level security;

drop policy if exists "estado_equipe_select" on estado;
create policy "estado_equipe_select" on estado
  for select using (
    exists (select 1 from perfis p where p.id = auth.uid()
            and coalesce(p.papel,'') <> 'aluno')
  );

drop policy if exists "estado_equipe_write" on estado;
create policy "estado_equipe_write" on estado
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid()
            and coalesce(p.papel,'') <> 'aluno')
  ) with check (
    exists (select 1 from perfis p where p.id = auth.uid()
            and coalesce(p.papel,'') <> 'aluno')
  );
-- 2d) TESTE AGORA: abra o app e logue como Franco/professor. Tem que abrir normal.


-- ── PARTE 3 — Relatórios publicados para o aluno ────────────────────────────
create table if not exists relatorios_aluno (
  id           uuid primary key default gen_random_uuid(),
  aluno_id     text not null,                    -- = id do aluno no app (S.alunos[].id)
  tipo         text not null default 'ficha',    -- ficha | boletim | writing | aula
  titulo       text not null default '',
  html         text,                             -- versão p/ visualizar e baixar PDF
  texto        text,                             -- versão texto (fallback)
  publicado_em timestamptz not null default now(),
  publicado_por text
);
create index if not exists relatorios_aluno_aid on relatorios_aluno(aluno_id, publicado_em desc);

alter table relatorios_aluno enable row level security;

-- Aluno lê só os próprios (via vínculo perfis.aluno_id):
drop policy if exists "rel_aluno_le_proprios" on relatorios_aluno;
create policy "rel_aluno_le_proprios" on relatorios_aluno
  for select using (
    exists (select 1 from perfis p where p.id = auth.uid()
            and p.aluno_id = relatorios_aluno.aluno_id)
  );

-- Equipe (não-aluno) lê e publica tudo:
drop policy if exists "rel_equipe_tudo" on relatorios_aluno;
create policy "rel_equipe_tudo" on relatorios_aluno
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid()
            and coalesce(p.papel,'') <> 'aluno')
  ) with check (
    exists (select 1 from perfis p where p.id = auth.uid()
            and coalesce(p.papel,'') <> 'aluno')
  );


-- ── PARTE 4 — Ligar um aluno ao login (repita por aluno) ────────────────────
-- Passo A: crie o usuário em Authentication → Users → Add user (e-mail + senha).
-- Passo B: pegue o UUID desse usuário e o id do aluno no app, e rode:
--
--   insert into perfis (id, nome, papel, aluno_id)
--   values ('<uuid-do-usuario-auth>', '<Nome do Aluno>', 'aluno', '<id-do-aluno-no-app>')
--   on conflict (id) do update
--     set papel='aluno', aluno_id=excluded.aluno_id, nome=excluded.nome;
--
-- (O <id-do-aluno-no-app> é o mesmo usado no app; dá para achar no backup JSON,
--  em S.alunos[].id. Se quiser, te ajudo a montar essa lista.)


-- ── ROLLBACK (se algo travar a equipe no 'estado') ──────────────────────────
-- Reabre o 'estado' para qualquer logado (volta ao comportamento antigo):
--   DROP POLICY IF EXISTS "estado_equipe_select" ON estado;
--   DROP POLICY IF EXISTS "estado_equipe_write" ON estado;
--   CREATE POLICY "estado_logado" ON estado FOR ALL
--     USING (auth.uid() is not null) WITH CHECK (auth.uid() is not null);
