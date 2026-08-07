/* =====================================================================
   🔐 PERMISSÕES — SÓ DIREÇÃO
   Matriz de acesso (tela × perfil) + ajustes finos de ações (b179).
   Padrão = comportamento atual (roles de NAV). Guardado em S.permissoes
   [{id:'perm', off:{chave:true}, mod:{tela:{perfil:bool}}}] — sincroniza
   entre aparelhos. A direção nunca se tranca fora de Permissões/Acessos.
   ===================================================================== */
const PERMS_DEF={
  secretaria:[
    {k:'sec_cadastro',   t:'Editar turmas e alunos',            d:'Criar/editar turmas, alunos e os dados na ficha (nome, e-mail, telefone…).'},
    {k:'sec_vip_horas',  t:'Editar horas dos VIPs',             d:'Alterar horas contratadas/utilizadas e pacotes dos alunos VIP.'},
    {k:'sec_contratos',  t:'Contratos (PDF)',                   d:'Subir e remover o contrato assinado na ficha do aluno.'},
    {k:'sec_acessos',    t:'Acesso ao portal do aluno',         d:'Gerar senha nova, trocar usuário e enviar link de troca de senha.'},
    {k:'sec_pausa_vip',  t:'Pausar aulas de VIPs',              d:'Definir períodos de pausa (sem alerta de aula não lançada).'},
    {k:'sec_estoque',    t:'Livros (pedidos e entregas)',       d:'Pedir livros, marcar chegada na escola e entregar aos alunos.'},
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
function _permReg(){ let r=(S.permissoes||[]).find(x=>x.id==='perm'); if(!r){ r={id:'perm',off:{},mod:{}}; S.permissoes=S.permissoes||[]; S.permissoes.push(r); } r.off=r.off||{}; r.mod=r.mod||{}; return r; }
const PERM_PERFIS=[['direcao','👑 Direção'],['secretaria','🗂️ Secretaria'],['professor','👩‍🏫 Professor']];
function setPerm(k, ligada){
  if(!moduloOk('permissoes')) return toast('Só a direção altera permissões');
  const r=_permReg();
  if(ligada) delete r.off[k]; else r.off[k]=true;
  r.atualizadoEm=Date.now(); save();
  if(typeof montarNav==='function') montarNav();
  toast(ligada?'Permissão ligada':'Permissão desligada');
  VIEWS.permissoes();
}
// b179: liga/desliga o acesso de um perfil a uma tela (matriz). Guarda só as diferenças do padrão.
function setModulo(id, perfil, on){
  if(!moduloOk('permissoes')) return toast('Só a direção altera permissões');
  if(perfil==='direcao' && (id==='permissoes'||id==='acessos')) return;   // proteção: direção nunca se tranca fora
  const r=_permReg();
  const def=moduloPadrao(id,perfil);
  r.mod[id]=r.mod[id]||{};
  if(!!on===def) delete r.mod[id][perfil]; else r.mod[id][perfil]=!!on;
  if(!Object.keys(r.mod[id]).length) delete r.mod[id];
  r.atualizadoEm=Date.now(); save();
  if(typeof montarNav==='function') montarNav();
  VIEWS.permissoes();
}
function restaurarPermissoes(){
  if(!moduloOk('permissoes')) return toast('Sem permissão');
  if(!confirm('Voltar TODAS as permissões ao padrão do app?')) return;
  const r=_permReg(); r.off={}; r.mod={}; r.atualizadoEm=Date.now(); save(); montarNav(); VIEWS.permissoes(); toast('Permissões restauradas');
}
VIEWS.permissoes=()=>{
  const v=document.getElementById('view');
  if(!moduloOk('permissoes')){ v.innerHTML='<div class="card empty"><div class="big">🔒</div><b>Acesso restrito</b><br>Só a direção gerencia permissões.</div>'; return; }
  const reg=_permReg();
  const cell=(id,perfil)=>{ const on=moduloOk(id,perfil), fixo=(perfil==='direcao'&&(id==='permissoes'||id==='acessos'));
    const dif=(on!==moduloPadrao(id,perfil));
    return `<td class="pcell${dif?' dif':''}"><input type="checkbox" ${on?'checked':''} ${fixo?'disabled title="A direção sempre mantém esta tela"':''} onchange="setModulo('${id}','${perfil}',this.checked)"></td>`; };
  const grupos={}; NAV.forEach(n=>{ (grupos[n.grp]=grupos[n.grp]||[]).push(n); });
  const cabec=`<tr><th class="pk">Tela / o que dá pra fazer</th>${PERM_PERFIS.map(p=>`<th class="pc">${p[1]}</th>`).join('')}</tr>`;
  const corpo=Object.keys(grupos).map(grp=>
    `<tr class="pgrp"><td colspan="4">${esc(grp)}</td></tr>`+
    grupos[grp].map(n=>`<tr><td class="pk">${n.em||''} ${esc(n.label)}</td>${PERM_PERFIS.map(p=>cell(n.id,p[0])).join('')}</tr>`).join('')
  ).join('');
  const linhaFina=p=>{ const on=!(reg.off||{})[p.k];
    return `<div class="check" style="display:block"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div style="flex:1;min-width:200px"><b>${p.t}</b><br><span class="hint">${p.d}</span></div>
      <button class="btn sm" style="background:${on?'var(--ok)':'#8a97a8'};min-width:96px" onclick="setPerm('${p.k}',${on?'false':'true'})">${on?'✓ Ligada':'✕ Desligada'}</button>
    </div></div>`; };
  const nMod=Object.keys(reg.mod||{}).reduce((s,k)=>s+Object.keys(reg.mod[k]).length,0);
  const nOff=Object.keys(reg.off||{}).filter(k=>reg.off[k]).length;
  const nTotal=nMod+nOff;
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--vermelho)"></span><h2 class="display">🔐 Permissões</h2></div>
    <p class="sub">Marque o que cada perfil pode <b>abrir</b> no app. A direção pode tudo. Só a direção vê e altera esta tela. Vale em todos os aparelhos — para quem já está logado, entra em vigor na próxima sincronização/troca de tela.</p>
    ${nTotal?`<div class="card" style="border-left:4px solid var(--laranja);padding:12px 16px"><b>${nTotal}</b> ajuste(s) fora do padrão. <button class="btn ghost sm" onclick="restaurarPermissoes()">↺ Voltar ao padrão</button></div>`:''}
    <div class="card" style="overflow-x:auto"><table class="permx">${cabec}${corpo}</table>
      <p class="hint" style="margin:10px 2px 0">✅ marcado = o perfil abre a tela · <span class="pdif">destaque</span> = diferente do padrão. As edições dentro das telas sensíveis (Financeiro, Matrículas) seguem com a direção — peça se quiser abrir alguma ação específica.</p></div>
    <div class="card"><h3>🎚️ Ajustes finos por perfil</h3><p class="hint" style="margin:0 0 8px">Ações específicas dentro das telas.</p>
      <div style="font-weight:600;margin:6px 0 2px">🗂️ Secretaria</div>${PERMS_DEF.secretaria.map(linhaFina).join('')}
      <div style="font-weight:600;margin:10px 0 2px">👩‍🏫 Professores</div>${PERMS_DEF.professor.map(linhaFina).join('')}</div>`;
};
