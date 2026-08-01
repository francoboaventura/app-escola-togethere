/* =====================================================================
   🔐 PERMISSÕES (b139) — SÓ DIREÇÃO
   A direção liga/desliga o que a SECRETARIA e os PROFESSORES podem fazer.
   Tudo começa LIGADO (comportamento atual). Guardado em S.permissoes
   [{id:'perm', off:{chave:true}}] — sincroniza entre aparelhos; nos outros
   perfis vale no próximo sync/navegação. Direção nunca é bloqueada.
   ===================================================================== */
const PERMS_DEF={
  secretaria:[
    {k:'sec_cadastro',   t:'Editar turmas e alunos',            d:'Criar/editar turmas, alunos e os dados na ficha (nome, e-mail, telefone…).'},
    {k:'sec_vip_horas',  t:'Editar horas dos VIPs',             d:'Alterar horas contratadas/utilizadas e pacotes dos alunos VIP.'},
    {k:'sec_contratos',  t:'Contratos (PDF)',                   d:'Subir e remover o contrato assinado na ficha do aluno.'},
    {k:'sec_acessos',    t:'Acesso ao portal do aluno',         d:'Gerar senha nova, trocar usuário e enviar link de troca de senha.'},
    {k:'sec_pausa_vip',  t:'Pausar aulas de VIPs',              d:'Definir períodos de pausa (sem alerta de aula não lançada).'},
    {k:'sec_estoque',    t:'Estoque de livros',                 d:'Registrar entradas, ajustes e entregas de livros aos alunos.'},
  ],
  professor:[
    {k:'prof_del_plano',      t:'Excluir planos não realizados', d:'Apagar planos de aula ainda não dados nas suas turmas.'},
    {k:'prof_vip_lancar',     t:'Lançar aulas VIP e tema',       d:'Registrar aulas dadas e tema de casa dos seus alunos VIP.'},
    {k:'prof_vip_remanejar',  t:'Remanejar aulas VIP',           d:'Trocar dia/horário de uma aula prevista de VIP.'},
    {k:'prof_editar_chamada', t:'Reabrir chamada fechada',       d:'Editar uma chamada já salva.'},
    {k:'prof_writings',       t:'Correção de writings',          d:'Usar o corretor de redações (some do menu se desligado).'},
    {k:'prof_apoio',          t:'Indicar aula de apoio',         d:'Encaminhar alunos para aula de apoio (some do menu se desligado).'},
  ],
};
function _permReg(){ let r=(S.permissoes||[]).find(x=>x.id==='perm'); if(!r){ r={id:'perm',off:{}}; S.permissoes=S.permissoes||[]; S.permissoes.push(r); } r.off=r.off||{}; return r; }
function setPerm(k, ligada){
  if(S.perfil!=='direcao') return toast('Só a direção altera permissões');
  const r=_permReg();
  if(ligada) delete r.off[k]; else r.off[k]=true;
  r.atualizadoEm=Date.now(); save();
  if(typeof montarNav==='function') montarNav();
  toast(ligada?'Permissão ligada':'Permissão desligada');
  VIEWS.permissoes();
}
function restaurarPermissoes(){
  if(S.perfil!=='direcao') return toast('Sem permissão');
  if(!confirm('Religar TODAS as permissões (padrão do app)?')) return;
  const r=_permReg(); r.off={}; r.atualizadoEm=Date.now(); save(); montarNav(); VIEWS.permissoes(); toast('Permissões restauradas');
}
VIEWS.permissoes=()=>{
  const v=document.getElementById('view');
  if(S.perfil!=='direcao'){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>Só a direção gerencia permissões.</div>'; return; }
  const off=(_permReg()).off||{};
  const linha=p=>{ const on=!off[p.k];
    return `<div class="check" style="display:block">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:200px"><b>${p.t}</b><br><span class="hint">${p.d}</span></div>
        <button class="btn sm" style="background:${on?'var(--ok)':'#8a97a8'};min-width:96px" onclick="setPerm('${p.k}',${on?'false':'true'})">${on?'✓ Ligada':'✕ Desligada'}</button>
      </div></div>`; };
  const nOff=Object.keys(off).filter(k=>off[k]).length;
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--vermelho)"></span><h2 class="display">🔐 Permissões</h2></div>
    <p class="sub">Ligue e desligue o que cada tipo de acesso pode fazer. Tudo começa <b>ligado</b> (o comportamento normal do app). A direção nunca é bloqueada. Vale em todos os aparelhos — para quem já está logado, entra em vigor na próxima sincronização/troca de tela.</p>
    ${nOff?`<div class="card" style="border-left:4px solid var(--laranja);padding:12px 16px"><b>${nOff}</b> permissão(ões) desligada(s). <button class="btn ghost sm" onclick="restaurarPermissoes()">↺ Restaurar todas</button></div>`:''}
    <div class="card"><h3>🗂️ Secretaria</h3>${PERMS_DEF.secretaria.map(linha).join('')}</div>
    <div class="card"><h3>👩‍🏫 Professores</h3>${PERMS_DEF.professor.map(linha).join('')}</div>
    <p class="hint">Obs.: isso controla o que aparece e funciona no app. As permissões de servidor (quem entra em cada perfil) seguem em 🔑 Acessos.</p>`;
};
