/* ---- Autenticação no servidor (login → token) ---- */
async function cloudLogin(usuario, senha){
  try{
    const email=normNome(usuario)+'@togethere.app';
    const { error }=await sb.auth.signInWithPassword({ email, password:senha });
    if(error) return {ok:false, erro:'senha'};
    const { data:{ user } }=await sb.auth.getUser();
    const { data:perfil }=await sb.from('perfis').select('*').eq('id',user.id).single();
    if(!perfil) return {ok:false, erro:'senha'};
    return {ok:true, token:'supabase', usuario:perfil.nome, perfil:perfil.papel};
  }catch(e){ return {ok:false, erro:'rede'}; }
}
async function cloudLogout(){ try{ await sb.auth.signOut(); }catch(e){} }
async function cloudTrocarSenha(nova){
  if(!CLOUD_TOKEN) return {ok:false, erro:'sessao'};
  try{
    const { error }=await sb.auth.updateUser({ password:nova });
    return error?{ok:false,erro:String(error.message)}:{ok:true};
  }catch(e){ return {ok:false, erro:'rede'}; }
}
async function cloudResetarSenha(alvo, nova){
  if(!CLOUD_TOKEN) return {ok:false, erro:'sessao'};
  try{
    const { data, error }=await sb.functions.invoke('admin-equipe', { body:{ acao:'senha', alvo, nova } });
    if(error) return {ok:false, erro:'rede'};
    return data||{ok:false, erro:'rede'};
  }catch(e){ return {ok:false, erro:'rede'}; }
}
// cria a CONTA de login (Supabase Auth) de um usuário novo da equipe — usada pelo Acessos
async function cloudCriarContaEquipe(nome, senha, papel){
  try{
    const { data, error }=await sb.functions.invoke('admin-equipe', { body:{ acao:'criar', alvo:nome, nova:senha, papel:papel||'professor' } });
    if(error) return {ok:false, erro:'rede'};
    return data||{ok:false, erro:'rede'};
  }catch(e){ return {ok:false, erro:'rede'}; }
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function hoje(){return ymd(new Date());}   // data LOCAL (antes usava UTC: depois das ~21h caía no dia seguinte)
function diasAtras(n){const d=new Date();d.setDate(d.getDate()-n);return ymd(d);}
function pesoFalta(turmaId){const t=S.turmas.find(x=>x.id===turmaId);const n=(t&&t.dias&&t.dias.length)?t.dias.length:(t&&t.vezesSemana);return n===1?2:1;}
function temAula2(turmaId){const t=S.turmas.find(x=>x.id===turmaId);const n=(t&&t.dias&&t.dias.length)?t.dias.length:(t&&t.vezesSemana);return n===1;}
const DIAS_SEMANA=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function weekdayOf(s){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d).getDay();}
function diasFromHorario(hor){const map={seg:1,ter:2,qua:3,qui:4,sex:5,sab:6,dom:0};const f=[];(hor||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z]+/).forEach(tok=>{const k=tok.slice(0,3);if(map[k]!=null&&!f.includes(map[k]))f.push(map[k]);});return f.sort((a,b)=>a-b);}
function diasTurmaLabel(t){return (t&&t.dias&&t.dias.length)?t.dias.map(d=>DIAS_SEMANA[d]).join('/'):'';}
function datasAula(turmaId,atras,frente){atras=atras==null?8:atras;frente=frente==null?2:frente;const t=S.turmas.find(x=>x.id===turmaId);if(!t||!t.dias||!t.dias.length)return[];const out=[];const a=new Date();a.setDate(a.getDate()-atras*7);const b=new Date();b.setDate(b.getDate()+frente*7);for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1)){if(t.dias.includes(d.getDay()))out.push(ymd(new Date(d)));}return out;}
function dataAulaPadrao(turmaId,datas){datas=datas||datasAula(turmaId);if(!datas.length)return hoje();const h=hoje();const pas=datas.filter(d=>d<=h).sort((x,y)=>y.localeCompare(x));if(pas.length)return pas[0];return datas.slice().sort()[0];}
function selectDataAula(id,turmaId,sel){let ds=datasAula(turmaId);if(!ds.length)return`<select id="${id}"><option value="">(defina os dias de aula da turma)</option></select>`;if(sel&&!ds.includes(sel))ds.push(sel);ds=[...new Set(ds)].sort((x,y)=>y.localeCompare(x));const def=sel||dataAulaPadrao(turmaId,ds);return`<select id="${id}">${ds.map(d=>`<option value="${d}" ${d===def?'selected':''}>${brDate(d)} · ${DIAS_SEMANA[weekdayOf(d)]}</option>`).join('')}</select>`;}
function proximaEntrega(turmaId,fromYmd){const ds=datasAula(turmaId,2,8).sort();const f=ds.filter(d=>d>(fromYmd||hoje()));return f[0]||ds[ds.length-1]||fromYmd||hoje();}

/* dados reais da escola (relatório Sponte 12/06/2026) */
function seed(){
  const T=[
    ['A2 TEENS TARDINHA','teens','A2','Franco','Ter–Qui 18:15–19:30',[2,4],['Artur Fellini Tedesco','Breno Apolinario Dias','Bruna Vitoria Brito de Almeida','Enrico Sccotti Mattos','Fernanda Cardoso Binotto','Gabriel Pereira dos Santos','Gabriela Porto Jerônimo','Helena Avila Henriques','Isabelly Pereira Dos santos','Isadora Douglas Polese','Lucca Jesus Capelão']],
    ['A1+ JUNIOR MANHÃ','junior','A1+','Franco','Seg–Qua 10:15–11:30',[1,3],['Catherine Cardoso Shvantes Bottini','Enzo Ferrari Velasques','Isabelle Ymai','Julia Nasario de Dillenburg','Lorenzo Braga Klahn','Manuela Canal Guedes','Maria Clara Sarmento Silveira','Martina Dupont Braga','Thomas de Freitas Sbruzzi de Toledo','Valentina Bitencourt Castro','Valentina Gonçalves pacheco']],
    ['C1 TEENS TARDE (Prep.)','teens','C1','Franco','Seg 14:00–16:45',[1],['Aleckssandra da Rosa Tavares','Isabella Pacheco Lima','Laís Antunes Motta Fernandes','Lucas Barcelos Mousquer','Maria Eduarda Pacheco Lima','Matheus Sakai','Murilo Garcia','Natália Tavares Goerl']],
  ];
  const turmas=[], alunos=[];
  T.forEach(([nome,nivel,cefr,prof,hor,dias,als])=>{
    const id=uid();
    turmas.push({id,nome,nivel,cefr,professor:prof,horario:hor,dias,vezesSemana:dias.length});
    als.forEach(n=>alunos.push({id:uid(),nome:n,turmaId:id}));
  });
  const usuarios=[
    {nome:'Franco',   perfil:'direcao',    ensina:'Franco'},
    {nome:'Fernanda', perfil:'direcao',    ensina:'Fernanda'},
    {nome:'Vlad',     perfil:'professor',  ensina:'Vlad'},
    {nome:'Mari',     perfil:'professor',  ensina:'Mariana'},
    {nome:'Leandro',  perfil:'professor',  ensina:'Leandro'},
    {nome:'Camila',   perfil:'professor',  ensina:'Camila'},
    {nome:'Maitê',    perfil:'professor',  ensina:'Maitê'},
    {nome:'Reginaldo',perfil:'secretaria', ensina:null},
  ];
  return {
    versao:3,
    usuario:null, perfil:null, usuarios, turmas, alunos,
    presencas:[], material:[], temas:[], testes:[], contatos:[], planos:[], comentarios:[],
    atas:[],
    tarefas:[],
    relatorios:[],
    eventos:[],
    recessos:[],
    exclusoes:[],
    vipAlunos:[],
    pacotesVip:[],
    contratos:[],
    matriculas:[],
    financeiro:[],
    configFin:[],
    permissoes:[],
    estoqueMov:[],
    livroPedidos:[],
    aulasVip:[],
    boletins:[],
    alertas:[],
    apoios:[],
    config:{assinatura:'— Equipe Togethere\ninglês para chegar lá', escolaEmail:'inglestogethere@gmail.com'},
  };
}

/* =========================================================================
   MOTOR DE ALERTAS
   ========================================================================= */
// turmas cujos alertas o usuário atual deve ver (professor: só as suas; secretaria/direção: todas as ativas)
function _turmasParaAlertas(){
  let ts=S.turmas.filter(t=>!t.arquivada);
  if(S.perfil==='professor'){ const u=S.usuarios.find(u=>u.nome===S.usuario); ts=ts.filter(t=>t.professor===(u&&u.ensina)); }
  return new Set(ts.map(t=>t.id));
}
// --- pausa de alertas durante recesso/férias ---
// Férias embutidas no plano (NÃO ficam em Recessos, senão bagunçam o ritmo previsto).
// Nestas janelas os alertas de falta/material pausam. Atualize as datas a cada ano.
const FERIAS_FIXAS=[
  {de:'2026-07-20', ate:'2026-08-02', nome:'Férias de meio de ano'}   // aulas voltam 03/08
];
function _emRecessoISO(iso){
  const d=_parseISO(iso); if(!d) return false;
  return (S.recessos||[]).some(r=>{ const de=_parseISO(r.de), ate=_parseISO(r.ate); return de&&ate&&d>=de&&d<=ate; });
}
function _emFeriasFixas(iso){
  const d=_parseISO(iso); if(!d) return false;
  return FERIAS_FIXAS.some(f=>{ const de=_parseISO(f.de), ate=_parseISO(f.ate); return de&&ate&&d>=de&&d<=ate; });
}
function escolaEmRecesso(){
  const h=hoje();
  return _emRecessoISO(h) || _emFeriasFixas(h);           // recessos cadastrados (verão/feriados longos) OU férias embutidas no plano
}
function alertasFaltas(){
  if(escolaEmRecesso()) return [];
  const out=[]; const vis=_turmasParaAlertas();
  S.alunos.forEach(a=>{
    if(a.arquivado) return;
    if(!vis.has(a.turmaId)) return;
    const dois=temAula2(a.turmaId);
    const sess=S.presencas.filter(p=>p.turmaId===a.turmaId && _aulaConta(p) && p.registros && a.id in p.registros)
                          .sort((x,y)=>x.data.localeCompare(y.data));
    const seq=[];
    sess.forEach(p=>{
      const s1=p.registros[a.id];
      if(p.registros2){ seq.push({s:s1,d:p.data}); seq.push({s:p.registros2[a.id]||'presente',d:p.data}); }
      else if(dois){ seq.push({s:s1,d:p.data}); seq.push({s:s1,d:p.data}); }   // legado conta por 2 aulas
      else { seq.push({s:s1,d:p.data}); }
    });
    let streak=0;
    for(let i=seq.length-1;i>=0;i--){ if(seq[i].s==='falta')streak++; else break; }
    if(streak>=3){
      const inicio=seq[seq.length-streak].d;   // data da 1ª falta da sequência ATUAL
      out.push({alunoId:a.id, tipo:'falta', n:streak, inicio, motivo:`${streak} faltas consecutivas`});
    }
  });
  return out.filter(o=>!jaContatado(o.alunoId,'falta',o.inicio));
}
function alertasMaterial(){
  if(escolaEmRecesso()) return [];
  const out=[]; const vis=_turmasParaAlertas();
  S.alunos.forEach(a=>{
    if(a.arquivado) return;
    if(!vis.has(a.turmaId)) return;
    const sess=S.material.filter(m=>m.turmaId===a.turmaId).sort((x,y)=>x.data.localeCompare(y.data));
    const ultC=_ultimoContato(a.id,'material');            // alternadas só contam depois do último contato
    let streak=0, total=0;
    sess.forEach(m=>{ if(m.faltantes.includes(a.id) && m.data>ultC) total++; });
    for(let i=sess.length-1;i>=0;i--){ if(sess[i].faltantes.includes(a.id))streak++; else break; }
    if(streak>=3){
      const inicio=sess[sess.length-streak].data;
      if(!jaContatado(a.id,'material',inicio)) out.push({alunoId:a.id,tipo:'material',motivo:`Sem material em ${streak} aulas seguidas`});
    }
    else if(total>=5) out.push({alunoId:a.id,tipo:'material',motivo:`Sem material em ${total} aulas (alternadas)`});
  });
  return out;
}
function _ultimoContato(alunoId,tipo){
  let d=''; (S.contatos||[]).forEach(c=>{ if(c.alunoId===alunoId && c.tipo===tipo && (c.data||'')>d) d=c.data||''; });
  return d;
}
// Contato "resolve" só a sequência em andamento: se uma NOVA sequência começar depois
// do último contato, o aluno volta a alertar (antes, 1 contato silenciava para sempre).
function jaContatado(alunoId,tipo,inicioSeq){
  const ult=_ultimoContato(alunoId,tipo);
  if(!ult) return false;
  if(!inicioSeq) return true;   // uso legado, sem referência de sequência
  return ult>=inicioSeq;
}
function criarAlerta(alunoId,tipo,motivo){
  if(!alunoId||!tipo||!motivo) return;
  const ja=S.alertas.find(a=>a.alunoId===alunoId&&a.tipo===tipo&&!a.resolvido);
  if(ja) return;
  S.alertas.push({id:uid(),alunoId,tipo,motivo,resolvido:false,atualizadoEm:Date.now()});
  save();
}
function resolverAlerta(alertaId){
  const a=S.alertas.find(x=>x.id===alertaId);
  if(!a) return;
  a.resolvido=true;
  a.resolvidoEm=hoje();
  a.atualizadoEm=Date.now();
  save();
  montarNav();
  VIEWS.alertas();
  toast('Alerta marcado como resolvido');
}
function totalAlertas(){return alertasFaltas().length+alertasMaterial().length+(S.alertas||[]).filter(a=>!a.resolvido).length;}
// clicar no KPI de alertas → mostra de onde vêm
function verAlertas(){
  if(S.perfil!=='professor'){ ir('alertas'); return; }
  const itens=alertasFaltas().concat(alertasMaterial());
  if(!itens.length){ toast('Nenhum alerta nas suas turmas 🎉'); return; }
  const linhas=itens.map(o=>{
    const a=S.alunos.find(x=>x.id===o.alunoId)||{};
    const t=S.turmas.find(x=>x.id===a.turmaId)||{};
    const ic=o.tipo==='falta'?'🔴':'📒';
    return `<div class="check"><span style="flex:1">${ic} <b>${esc(a.nome||'—')}</b> <span class="hint">· ${esc(t.nome||'—')}</span><br><small class="hint">${esc(o.motivo||'')}</small></span>
      <button class="btn ghost sm" onclick="fechar();abrirFicha('${o.alunoId}')">📇 ficha</button></div>`;
  }).join('');
  modal(`<h3>🔔 Alertas das suas turmas <button class="close" onclick="fechar()">×</button></h3>
    <p class="hint" style="margin:0 0 8px">Alunos com faltas ou sem material que merecem atenção. Quem contata os responsáveis é a secretaria.</p>${linhas}`);
}

/* ---- incidentes detalhados (para registro da direção e relatórios) ---- */
function faltasDoAluno(alunoId,turmaId){
  const dois=temAula2(turmaId), out=[];
  S.presencas.filter(p=>p.turmaId===turmaId && _aulaConta(p)).forEach(p=>{
    const f1 = p.registros && p.registros[alunoId]==='falta';
    if(p.registros2){ if(f1)out.push(p.data); if(p.registros2[alunoId]==='falta')out.push(p.data); }
    else if(dois){ if(f1){out.push(p.data);out.push(p.data);} }   // legado 1x/semana: vale por 2 aulas
    else { if(f1)out.push(p.data); }
  });
  return out.sort();
}
function materialDoAluno(alunoId,turmaId){
  return S.material.filter(m=>m.turmaId===turmaId && (m.faltantes||[]).includes(alunoId))
    .map(m=>m.data).sort();}
function atrasosDoAluno(alunoId,turmaId){
  return S.presencas.filter(p=>p.turmaId===turmaId && (p.atrasados||[]).includes(alunoId)).map(p=>p.data).sort();}
function saidasCedoDoAluno(alunoId,turmaId){
  return S.presencas.filter(p=>p.turmaId===turmaId && (p.saiuCedo||[]).includes(alunoId)).map(p=>p.data).sort();}
function temasNaoFeitosDoAluno(alunoId,turmaId){
  return S.temas.filter(t=>t.turmaId===turmaId && t.entregas && (t.entregas[alunoId]===false || t.entregas[alunoId]==='parcial'))
    .map(t=>({data:t.data,descricao:t.descricao,origem:t.origem||'extra',status:t.entregas[alunoId]==='parcial'?'parcial':'naofeito'})).sort((a,b)=>a.data.localeCompare(b.data));
}
function comentariosDoAluno(alunoId){
  return S.comentarios.filter(c=>c.alunoId===alunoId).sort((a,b)=>a.data.localeCompare(b.data));
}
// lista geral de incidentes de um tipo (para a direção)
function registroGeral(tipo){
  const out=[];
  S.alunos.forEach(a=>{
    if(a.arquivado) return;
    let datas=[];
    if(tipo==='falta') datas=faltasDoAluno(a.id,a.turmaId);
    else if(tipo==='material') datas=materialDoAluno(a.id,a.turmaId);
    else if(tipo==='tema') datas=temasNaoFeitosDoAluno(a.id,a.turmaId).map(t=>t.data);
    datas.forEach(d=>out.push({alunoId:a.id,turmaId:a.turmaId,data:d}));
  });
  return out.sort((x,y)=>y.data.localeCompare(x.data)); // mais recentes primeiro
}
