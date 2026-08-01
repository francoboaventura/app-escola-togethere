/* =========================================================================
   ESTADO  —  persistência em localStorage
   ========================================================================= */
const KEY='togethere_v2';
let S=load();

function load(){
  let s=null;
  try{const r=localStorage.getItem(KEY);if(r)s=JSON.parse(r);}catch(e){}
  if(!s) s=seed();
  return migrar(s);
}
function migrar(s){
  s.versao=s.versao||1;
  if(s.versao<2){                 // (legado) não mexe mais em senhas
    s.versao=2;
  }
  if(s.versao<3){                 // Segurança: senhas saem do app; agora ficam só no servidor (com hash)
    (s.usuarios||[]).forEach(u=>{ delete u.senha; });
    s.versao=3;
  }
  if(s.versao<4){ s.versao=4; }   // marca para os campos novos (nascimento/arquivado/saldo)
  if(s.versao<5){                 // novo usuário: Maitê (professora)
    s.usuarios=s.usuarios||[];
    if(!s.usuarios.some(u=>u.nome==='Maitê')) s.usuarios.push({nome:'Maitê', perfil:'professor', ensina:'Maitê'});
    s.versao=5;
  }
  (s.alunos||[]).forEach(a=>{ if(typeof a.arquivado==='undefined') a.arquivado=false; if(typeof a.nascimento==='undefined') a.nascimento=''; if(typeof a.faltasRetro==='undefined') a.faltasRetro=(a.saldo&&a.saldo.faltas)||0; });
  (s.turmas||[]).forEach(t=>{ if(typeof t.arquivada==='undefined') t.arquivada=false; });
  (s.turmas||[]).forEach(t=>{ if(typeof t.status==='undefined') t.status = t.arquivada ? 'encerrada' : 'aberta'; if(t.status==='encerrada') t.arquivada=true; });
  s.comentarios=s.comentarios||[]; // garante campos novos
  s.relatorios=s.relatorios||[];
  s.comunicados=s.comunicados||[];
  s.exclusoes=s.exclusoes||[];     // marcas de exclusão (para sincronização entre aparelhos)
  s.boletins=s.boletins||[];
  s.eventos=s.eventos||[];
  s.aulasVip=s.aulasVip||[];
  s.vipAlunos=s.vipAlunos||[];
  s.pacotesVip=s.pacotesVip||[];   // pacotes de horas contratadas dos alunos VIP
  s.contratos=s.contratos||[];     // PDFs de contrato assinado por aluno (bucket 'contratos')
  s.planejamento=s.planejamento||[];
  s.recessos=s.recessos||[];       // recessos/férias (pausam o ritmo previsto)
  s.alertas=s.alertas||[];
  s.apoios=s.apoios||[];           // indicações para aula de apoio (professor→direção→secretaria)
  s.writings=s.writings||[];       // notas das correções de writings (só as bandas, ligadas ao aluno)
  s.formacao=s.formacao||[];         // biblioteca da metodologia (tópicos)
  s.formacaoReg=s.formacaoReg||[];   // quem leu/foi treinado em cada tópico
  s.formacaoSessoes=s.formacaoSessoes||[];   // sessões de formação registradas pela direção
  s.matriculas=s.matriculas||[];     // módulo de matrículas (só cadastro) — só direção
  s.financeiro=s.financeiro||[];     // módulo financeiro (mensalidades/carnê), ligado à matrícula
  // migração b136: separa o financeiro que ficava dentro da matrícula para a coleção 'financeiro'
  (s.matriculas||[]).forEach(m=>{
    const temFin = (m.valorMensalidade!=null||m.valorMatricula!=null||m.parcelas!=null||m.diaVencimento!=null||m.formaPagamento||m.pagos);
    if(!temFin) return;
    const fid='fin_'+m.id;
    if(!s.financeiro.some(f=>f.id===fid || f.matriculaId===m.id)){
      s.financeiro.push({ id:fid, matriculaId:m.id, criadoEm:m.criadoEm||'', criadoPor:m.criadoPor||'', atualizadoEm:Date.now(),
        valorMatricula:m.valorMatricula||0, valorMensalidade:m.valorMensalidade||0, descontoPct:m.descontoPct||0,
        parcelas:(m.parcelas!=null?m.parcelas:12), diaVencimento:(m.diaVencimento!=null?m.diaVencimento:10), formaPagamento:m.formaPagamento||'',
        dataInicio:m.dataInicio||'', pagos:m.pagos||{}, observacoes:'' });
    }
    // limpa os campos financeiros da matrícula (agora vivem no financeiro)
    delete m.valorMatricula; delete m.valorMensalidade; delete m.descontoPct; delete m.parcelas; delete m.diaVencimento; delete m.formaPagamento; delete m.pagos;
    m.atualizadoEm=Date.now();
  });
  if(s.versao<6){ _semearFormacao(s); s.versao=6; }
  if(s.versao<7){ _semearFormacao(s); s.versao=7; }   // b90: tópicos do Pedagogical Guide   // b89: quadro do treinamento vira biblioteca inicial
  (s.aulasVip||[]).forEach(a=>{
    if(!a.vipId && a.alunoId){
      const al=(s.alunos||[]).find(x=>x.id===a.alunoId);
      const nome=al?al.nome:'Aluno VIP';
      let vp=s.vipAlunos.find(x=>x.nome===nome);
      if(!vp){ vp={id:uid(),nome}; s.vipAlunos.push(vp); }
      a.vipId=vp.id; delete a.alunoId;
    }
    if(typeof a.faltou==='undefined') a.faltou=false;
    if(typeof a.tema==='undefined') a.tema='';
  });
  (s.alunos||[]).forEach(a=>{ if('vip' in a) delete a.vip; });
  (s.temas||[]).forEach(t=>{ if(!t.dataEntrega) t.dataEntrega=t.data; });
  (s.presencas||[]).forEach(p=>{ if(typeof p.fechada==='undefined') p.fechada=true; });   // chamadas já existentes = salvas
  (s.turmas||[]).forEach(t=>{
    if(!Array.isArray(t.dias)||!t.dias.length){
      t.dias=diasFromHorario(t.horario);
      if(!t.dias.length) t.dias = (t.vezesSemana===1)?[1]:[1,3];
    }
    t.vezesSemana=t.dias.length;
    if(!t.cefr) t.cefr=cefrFromNome(t.nome);   // tenta achar A1/A2/B1+/C1... no nome
  });
  (s.testes||[]).forEach(t=>{                  // novo modelo: nota por habilidade
    t.notas=t.notas||{};
    Object.keys(t.notas).forEach(aid=>{ if(typeof t.notas[aid]!=='object'||t.notas[aid]===null) t.notas[aid]={}; });
  });
  s.config=s.config||{assinatura:'— Equipe Togethere\ninglês para chegar lá', escolaEmail:'inglestogethere@gmail.com'};
  if(s.config.escolaEmail==='admin@togethere.com.br') s.config.escolaEmail='inglestogethere@gmail.com';
  return s;
}