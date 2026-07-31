/* ---- MATERIAL ---- */
let matTurma=null, matData=hoje(), matBusca='';
VIEWS.material=()=>{
  matTurma=matTurma||primeiraTurma();
  if(!datasAula(matTurma).includes(matData)) matData=dataAulaPadrao(matTurma);
  const v=document.getElementById('view');
  v.innerHTML=`${btnVoltaPainel()}<div class="section-title"><span class="feijao fj" style="background:var(--laranja)"></span><h2 class="display">Material não trazido</h2></div>
    <p class="sub">Marque quem veio sem material. Alimenta os alertas: 3 aulas seguidas ou 5 alternadas.</p>
    <div class="card"><div class="row">
      <div><label class="lbl">Turma</label>${selectTurma('mT',matTurma)}</div>
      <div><label class="lbl">Data da aula</label>${selectDataAula('mD',matTurma,matData)}</div></div></div>
    <div class="card" id="mBox"></div>
    <div class="card"><input type="text" id="mBusca" placeholder="🔎 Buscar registro anterior por data" value="${escAttr(matBusca)}" oninput="matBusca=this.value;renderMatLista()"><div id="mLista" style="margin-top:8px"></div></div>`;
  document.getElementById('mT').onchange=e=>{matTurma=e.target.value;matData=dataAulaPadrao(matTurma);VIEWS.material();};
  document.getElementById('mD').onchange=e=>{matData=e.target.value;renderMat();};
  renderMat(); renderMatLista();
};
function renderMat(){
  const box=document.getElementById('mBox');
  const rec=S.material.find(m=>m.turmaId===matTurma&&m.data===matData);
  const falt=rec?rec.faltantes:[];
  const als=alunosDa(matTurma);
  if(!als.length){box.innerHTML='<div class="empty"><div class="big">🎒</div>Sem alunos nesta turma.</div>';return;}
  box.innerHTML=`<h3>${brDate(matData)}</h3><p class="hint">Marque quem <b>não trouxe</b> o material.</p>
    ${als.map(a=>`<div class="check"><input type="checkbox" ${falt.includes(a.id)?'checked':''} onchange="toggleMat('${a.id}')"><span>${a.nome}</span>${falt.includes(a.id)?'<span class="pill" style="margin-left:auto;background:#ffeee5;color:var(--laranja)">sem material</span>':''}</div>`).join('')}
    <div style="margin-top:16px"><button class="btn" onclick="salvarMat()">Salvar</button></div>`;
}
function toggleMat(aid){
  let rec=S.material.find(m=>m.turmaId===matTurma&&m.data===matData);
  if(!rec){rec={id:uid(),turmaId:matTurma,data:matData,faltantes:[]};S.material.push(rec);}
  const i=rec.faltantes.indexOf(aid);
  if(i>=0)rec.faltantes.splice(i,1);else rec.faltantes.push(aid);
  renderMat();
}
function salvarMat(){save();montarNav();renderMatLista();toast('Material registrado');}
function carregaMat(data){matData=data;const el=document.getElementById('mD');if(el)el.value=data;renderMat();window.scrollTo({top:0,behavior:'smooth'});}
function renderMatLista(){
  const box=document.getElementById('mLista'); if(!box)return;
  const recs=S.material.filter(m=>m.turmaId===matTurma);
  const q=matBusca.trim();
  let filt,titulo;
  if(q){ filt=recs.filter(m=>m.data.includes(q)||brDate(m.data).includes(q)); titulo=`Resultados (${filt.length})`; }
  else { const lim=diasAtras(7); filt=recs.filter(m=>m.data>=lim); titulo='Registros dos últimos 7 dias'; }
  filt.sort((a,b)=>b.data.localeCompare(a.data));
  if(!filt.length){ box.innerHTML=`<p class="hint">${q?'Nenhum registro encontrado.':'Nenhum registro nos últimos 7 dias.'}</p>`; return; }
  box.innerHTML=`<p class="hint" style="margin:4px 0 6px">${titulo}</p>`+filt.map(m=>`<div class="check"><span>${brDate(m.data)} · ${(m.faltantes||[]).length} sem material</span><button class="btn ghost sm" style="margin-left:auto" onclick="carregaMat('${m.data}')">abrir</button></div>`).join('');
}
