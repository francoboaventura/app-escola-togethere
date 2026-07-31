// =============================================================================
// alertas-faltas  ·  RASCUNHO para revisão (não implantado)
// -----------------------------------------------------------------------------
// Calcula os alertas de FALTAS e MATERIAL no SERVIDOR, lendo o documento `estado`
// (o mesmo blob que o app já usa). NÃO exige migração de dados (Etapa 2): usa a
// presença como ela é hoje. As regras são portadas 1:1 de alertasFaltas() /
// alertasMaterial() do app (arquivo src/js/02-...js).
//
// SEGURANÇA / MODO DE OPERAÇÃO:
//   • Padrão = DRY-RUN: apenas devolve os alertas calculados em JSON. NÃO envia nada.
//     → Compare o resultado com a tela "Alertas" do app. Só quando os números baterem,
//       ligue o envio (parâmetro ?enviar=1) e o agendamento.
//   • ?enviar=1: envia UM resumo por e-mail à secretaria (via função enviar-email já
//     existente) apenas com os alertas AINDA NÃO notificados (dedup na tabela
//     alertas_enviados) e respeitando quem já foi "Contatado" no app (S.contatos).
//
// PENDÊNCIAS A VALIDAR COM O FRANCO antes de ligar:
//   1) Recesso/férias: a pausa de alertas do app (escolaEmRecesso) NÃO está portada
//      aqui. Use o env PAUSAR_ALERTAS=1 durante as férias, ou me peça para portar a
//      lógica de recessos do plano.
//   2) Destinatário do resumo: definir SECRETARIA_EMAIL.
//   3) Agendamento (pg_cron/Supabase Scheduled Functions): ver supabase/sql/alertas.sql.
// =============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SB_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SECRETARIA_EMAIL = Deno.env.get('SECRETARIA_EMAIL') || ''
const PAUSAR = Deno.env.get('PAUSAR_ALERTAS') === '1'

const sb = createClient(SB_URL, SERVICE)

// --- regras portadas do app (mantidas idênticas de propósito) ---
const aulaConta = (p: any) => !p.statusAula || p.statusAula === 'normal'
const temAula2 = (turmas: any[], turmaId: string) => {
  const t = turmas.find(x => x.id === turmaId)
  const n = (t && t.dias && t.dias.length) ? t.dias.length : (t && t.vezesSemana)
  return n === 1   // turma de 1 encontro/semana conta cada sessão como 2 aulas
}
const jaContatado = (contatos: any[], alunoId: string, tipo: string) =>
  (contatos || []).some(c => c.alunoId === alunoId && c.tipo === tipo)

function alertasFaltas(S: any) {
  const out: any[] = []
  const ativas = new Set(S.turmas.filter((t: any) => !t.arquivada).map((t: any) => t.id))
  for (const a of S.alunos) {
    if (!ativas.has(a.turmaId)) continue
    const dois = temAula2(S.turmas, a.turmaId)
    const sess = S.presencas
      .filter((p: any) => p.turmaId === a.turmaId && aulaConta(p) && p.registros && (a.id in p.registros))
      .sort((x: any, y: any) => x.data.localeCompare(y.data))
    const seq: string[] = []
    for (const p of sess) {
      const s1 = p.registros[a.id]
      if (p.registros2) { seq.push(s1); seq.push(p.registros2[a.id] || 'presente') }
      else if (dois)   { seq.push(s1); seq.push(s1) }
      else             { seq.push(s1) }
    }
    let streak = 0
    for (let i = seq.length - 1; i >= 0; i--) { if (seq[i] === 'falta') streak++; else break }
    if (streak >= 3) out.push({ alunoId: a.id, turmaId: a.turmaId, tipo: 'falta', n: streak, motivo: `${streak} faltas consecutivas` })
  }
  return out.filter(o => !jaContatado(S.contatos, o.alunoId, 'falta'))
}

function alertasMaterial(S: any) {
  const out: any[] = []
  const ativas = new Set(S.turmas.filter((t: any) => !t.arquivada).map((t: any) => t.id))
  for (const a of S.alunos) {
    if (!ativas.has(a.turmaId)) continue
    const sess = S.material.filter((m: any) => m.turmaId === a.turmaId).sort((x: any, y: any) => x.data.localeCompare(y.data))
    let streak = 0, total = 0
    for (const m of sess) if ((m.faltantes || []).includes(a.id)) total++
    for (let i = sess.length - 1; i >= 0; i--) { if ((sess[i].faltantes || []).includes(a.id)) streak++; else break }
    if (streak >= 3) out.push({ alunoId: a.id, turmaId: a.turmaId, tipo: 'material', motivo: `Sem material em ${streak} aulas seguidas` })
    else if (total >= 5) out.push({ alunoId: a.id, turmaId: a.turmaId, tipo: 'material', motivo: `Sem material em ${total} aulas (alternadas)` })
  }
  return out.filter(o => !jaContatado(S.contatos, o.alunoId, 'material'))
}

const nomeAluno = (S: any, id: string) => (S.alunos.find((a: any) => a.id === id) || {}).nome || id
const nomeTurma = (S: any, id: string) => (S.turmas.find((t: any) => t.id === id) || {}).nome || id
const chave = (o: any) => `${o.alunoId}|${o.tipo}|${o.motivo}`

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const enviar = url.searchParams.get('enviar') === '1'

  if (PAUSAR) return Response.json({ ok: true, pausado: true, alertas: [] })

  // 1) lê o estado (blob) com service role
  const { data: row, error } = await sb.from('estado').select('dados').eq('id', 'app').single()
  if (error) return Response.json({ ok: false, erro: error.message }, { status: 500 })
  const S = row.dados

  // 2) calcula
  const alertas = [...alertasFaltas(S), ...alertasMaterial(S)]
    .map(o => ({ ...o, aluno: nomeAluno(S, o.alunoId), turma: nomeTurma(S, o.turmaId) }))

  // DRY-RUN: só devolve (compare com a tela de Alertas do app)
  if (!enviar) return Response.json({ ok: true, modo: 'dry-run', total: alertas.length, alertas })

  // 3) dedup contra o que já foi notificado
  const { data: enviados } = await sb.from('alertas_enviados').select('chave')
  const jaEnviado = new Set((enviados || []).map((e: any) => e.chave))
  const novos = alertas.filter(o => !jaEnviado.has(chave(o)))
  if (!novos.length) return Response.json({ ok: true, novos: 0, total: alertas.length })

  // 4) envia UM resumo à secretaria (reusa a função enviar-email já existente)
  if (!SECRETARIA_EMAIL) return Response.json({ ok: false, erro: 'defina SECRETARIA_EMAIL' }, { status: 400 })
  const linhas = novos.map(o => `• ${o.aluno} (${o.turma}) — ${o.motivo}`).join('\n')
  const texto = `Alertas automáticos do Togethere\n\n${linhas}\n\nAbra o app em Avisos/Alertas para registrar o contato.`
  const { error: eMail } = await sb.functions.invoke('enviar-email', {
    body: { to: [SECRETARIA_EMAIL], subject: `Togethere — ${novos.length} novo(s) alerta(s)`, text: texto },
  })
  if (eMail) return Response.json({ ok: false, erro: eMail.message }, { status: 500 })

  // 5) marca como notificado (para não repetir amanhã)
  await sb.from('alertas_enviados').insert(novos.map(o => ({ chave: chave(o) })))
  return Response.json({ ok: true, enviados: novos.length, total: alertas.length })
})
