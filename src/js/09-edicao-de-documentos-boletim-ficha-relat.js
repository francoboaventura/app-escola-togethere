/* ===== Edição de documentos (WYSIWYG) — boletim / ficha / relatórios ===== */
if(typeof S==='object' && S && !S.docEdicoes) S.docEdicoes={};
function _docStore(){ if(!S.docEdicoes) S.docEdicoes={}; return S.docEdicoes; }
function docTemEdicao(k){ return !!_docStore()[k]; }
function docHtmlEdit(k){ const e=_docStore()[k]; return e?e.html:null; }
function docTxtEdit(k){ const e=_docStore()[k]; return e?(e.txt||''):null; }
function salvarDocEdicao(k, html, txt){ _docStore()[k]={html:html||'', txt:txt||'', ts:Date.now()}; save(); }
function descartarDocEdicao(k){ const st=_docStore(); if(st[k]){ delete st[k]; save(); } }
function _escTA(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function editarDocIframe(frId){
  const fr=document.getElementById(frId); if(!fr) return toast('Gere o documento primeiro');
  let d=null; try{ d=fr.contentDocument||(fr.contentWindow&&fr.contentWindow.document); }catch(e){ d=null; }
  if(!d||!d.body) return toast('Gere o documento de novo para poder editar.');
  d.body.contentEditable='true'; d.body.style.outline='2px dashed #FFC800'; d.body.style.outlineOffset='-2px';
  try{ d.body.focus(); }catch(e){}
  toast('Modo edição: altere o texto direto no documento e clique em “Salvar edições”.');
}
function lerDocIframe(frId){
  const fr=document.getElementById(frId); if(!fr) return null;
  let d=null; try{ d=fr.contentDocument||(fr.contentWindow&&fr.contentWindow.document); }catch(e){ return null; }
  if(!d) return null;
  if(d.body){ d.body.contentEditable='false'; d.body.style.outline=''; }
  const html='<!doctype html>\n'+d.documentElement.outerHTML;
  const txt=(d.body?(d.body.innerText||d.body.textContent||''):'').trim();
  return { html:html, txt:txt };
}
/* Boletim */
function _boletimKey(){ return 'boletim:'+testeTurma+':'+boletimAluno; }
function editarBoletim(){ if(!_boletimHTML) return toast('Gere o boletim primeiro'); editarDocIframe('boFrame'); }
function salvarBoletim(){
  const r=lerDocIframe('boFrame'); if(!r) return toast('Nada para salvar');
  _boletimHTML=r.html; _boletimTxt=r.txt;
  salvarDocEdicao(_boletimKey(), r.html, r.txt);
  const bn=document.getElementById('boEditBanner'); if(bn) bn.style.display='block';
  toast('Edições do boletim salvas.');
}
async function enviarBoletimEmail(){
  if(!_boletimHTML) return toast('Gere o boletim primeiro');
  if(!_boletimAprovadoOuAvisa()) return;
  if(typeof ehProfessor==='function' && ehProfessor()) return toast('Sem permissão para enviar');
  const a=(S.alunos||[]).find(x=>x.id===boletimAluno)||{};
  const email=((a.email||'').trim());
  if(!email || email.indexOf('@')<1) return toast('Sem e-mail do responsável. Cadastre em Turmas e alunos (ou na Ficha).');
  if(!confirm('Enviar o boletim de '+(a.nome||'')+' para '+email+'?')) return;
  toast('Enviando…');
  const assunto='Boletim '+(new Date().getFullYear())+' — '+(a.nome||'')+' · Togethere';
  const bAp=(S.boletins||[]).find(x=>x.turmaId===testeTurma&&x.alunoId===boletimAluno);
  const txtEnv=(bAp&&bAp.aprovado&&bAp.txtAprovado)||_boletimTxt, htmlEnv=(bAp&&bAp.aprovado&&bAp.htmlAprovado)||_boletimHTML;   // envia a versão APROVADA
  const res=await cloudEmail([email], assunto, txtEnv, htmlEnv);
  if(res && res.ok) toast('Boletim enviado por e-mail.');
  else toast('Não enviei: '+((res&&res.erro)||'erro')+'. Use Imprimir/PDF ou Copiar.');
}
/* Ficha do aluno — relatório editável (texto) */
function _fichaTextoAtual(aid){
  const el=document.getElementById('fichaCorpo');
  if(el && typeof el.value==='string') return el.value;
  const ed=docTxtEdit('ficha:'+aid); if(ed!=null) return ed;
  return corpoFichaAluno(aid,_fichaDe,_fichaAte);
}
function _fichaCorpoInput(aid){ const el=document.getElementById('fichaCorpo'); if(el) salvarDocEdicao('ficha:'+aid,'',el.value); }
function _fichaCorpoReset(aid){ descartarDocEdicao('ficha:'+aid); const el=document.getElementById('fichaCorpo'); if(el) el.value=corpoFichaAluno(aid,_fichaDe,_fichaAte); toast('Texto do relatório restaurado.'); }

/* ===== Portal do aluno — publicar relatórios ===== */
async function publicarNoPortal(aluno_id, tipo, titulo, html, texto){
  if(!aluno_id) return toast('Sem aluno para publicar.');
  try{
    const { error } = await sb.from('relatorios_aluno').insert({
      aluno_id:String(aluno_id), tipo:tipo||'relatorio', titulo:titulo||'',
      html:html||'', texto:texto||'', publicado_por:(typeof S!=='undefined'?(S.usuario||''):'')
    });
    if(error) return toast('Não publiquei: '+(error.message||'erro')+' — a tabela do portal já foi criada no Supabase?');
    toast('Publicado no portal do aluno \u2713');
  }catch(e){ toast('Falha ao publicar: '+((e&&e.message)||e)); }
}
function publicarBoletimPortal(){
  if(!_boletimHTML) return toast('Gere o boletim primeiro');
  if(!_boletimAprovadoOuAvisa()) return;
  const a=(S.alunos||[]).find(x=>x.id===boletimAluno)||{};
  const bAp2=(S.boletins||[]).find(x=>x.turmaId===testeTurma&&x.alunoId===boletimAluno);
  publicarNoPortal(boletimAluno, 'boletim', 'Boletim '+(new Date().getFullYear())+' — '+(a.nome||''), (bAp2&&bAp2.aprovado&&bAp2.htmlAprovado)||_boletimHTML, (bAp2&&bAp2.aprovado&&bAp2.txtAprovado)||_boletimTxt);
}
function publicarFichaPortal(aid){
  const doc=montarFichaHTML(aid,_fichaDe,_fichaAte);
  publicarNoPortal(aid, 'ficha', 'Relatório — '+brDate(hoje()), doc.html, doc.txt);
}
/* ===== Ficha em documento (visual Togethere) + PDF ===== */
function montarFichaHTML(alunoId, de, ate){
  const a=(S.alunos||[]).find(x=>x.id===alunoId)||{};
  const turma=(S.turmas||[]).find(t=>t.id===a.turmaId)||{};
  const txt=corpoFichaAluno(alunoId, de, ate);
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const periodo=(de||ate)?((de?brDate(de):'início')+' a '+(ate?brDate(ate):'hoje')):'todo o histórico';
  const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<style>@page{margin:14mm}*{box-sizing:border-box;margin:0;padding:0}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}'
    +'body{font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:#10243a;background:#fff;line-height:1.55}'
    +'.page{max-width:760px;margin:0 auto}'
    +'.hd{background:linear-gradient(135deg,#0a6dc4,#005EAF);color:#fff;padding:24px 28px}'
    +'.hd .wm{font-weight:800;font-size:1.6rem;letter-spacing:-.5px}.hd .wm b{color:#FFC800}'
    +'.hd .sub{opacity:.92;font-size:.95rem;margin-top:2px}'
    +'.meta{display:flex;flex-wrap:wrap;gap:6px 22px;padding:14px 28px;border-bottom:3px solid #FFC800;background:#f7fafd}'
    +'.meta div{font-size:.92rem}.meta b{color:#005EAF}'
    +'.corpo{padding:20px 28px;white-space:pre-wrap;font-size:.95rem}'
    +'.foot{padding:16px 28px;color:#5b6b7c;font-size:.8rem;border-top:1px solid #e7eef6;margin-top:6px;text-align:center}</style></head>'
    +'<body><div class="page">'
    +'<div class="hd"><div class="wm">togeth<b>e</b>re</div><div class="sub">Ficha de acompanhamento do aluno</div></div>'
    +'<div class="meta"><div><b>Aluno:</b> '+esc(a.nome||'')+'</div><div><b>Turma:</b> '+esc(turma.nome||'—')+'</div><div><b>Período:</b> '+esc(periodo)+'</div></div>'
    +'<div class="corpo">'+esc(txt)+'</div>'
    +'<div class="foot">Togethere · Gravataí/RS — inglês para chegar lá</div>'
    +'</div></body></html>';
  return { html:html, txt:txt };
}
function montarFichaEmailHTML(alunoId, de, ate){
  const a=(S.alunos||[]).find(x=>x.id===alunoId)||{};
  const turma=(S.turmas||[]).find(t=>t.id===a.turmaId)||{};
  const txt=corpoFichaAluno(alunoId, de, ate);
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const periodo=(de||ate)?((de?brDate(de):'início')+' a '+(ate?brDate(ate):'hoje')):'todo o histórico';

  // Parse do texto em seções (cabeçalho começa com emoji; itens com "•")
  const linhas=String(txt||'').split('\n');
  const isHeader=l=>/^[\u{1F300}-\u{1FAFF}☀-➿←-⇿⬀-⯿]/u.test(l);
  const secoes=[]; let atual=null;
  for(const raw of linhas){
    const l=raw.replace(/\s+$/,'');
    if(!l.trim()) continue;
    if(isHeader(l)){ atual={titulo:l.trim(), itens:[]}; secoes.push(atual); }
    else if(atual){ atual.itens.push(l.replace(/^•\s*/,'').trim()); }
  }

  // Indicadores (tiles)
  const numDe=re=>{ const m=String(txt).match(re); return m?m[1]:null; };
  const pres=numDe(/Presen[çc]as:\s*(\d+)/i);
  const falt=numDe(/Faltas:\s*(\d+)/i);
  const contHead=t=>{ const m=String(t||'').match(/\((\d+)\)\s*$/); return m?+m[1]:null; };
  const temasSec=secoes.find(x=>/TEMAS/i.test(x.titulo));
  const matSec=secoes.find(x=>/MATERIAL/i.test(x.titulo));
  const temasN=temasSec?contHead(temasSec.titulo):null;
  const matN=matSec?contHead(matSec.titulo):null;
  const tile=(label,val,cor,bg)=>'<td width="25%" style="padding:5px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:'+bg+';border-radius:10px;"><tr><td style="padding:12px 6px;text-align:center;"><div style="font-size:22px;font-weight:bold;color:'+cor+';line-height:1;">'+(val==null?'—':esc(''+val))+'</div><div style="font-size:10px;color:#5b6b7c;text-transform:uppercase;letter-spacing:.04em;margin-top:3px;">'+esc(label)+'</div></td></tr></table></td>';
  const tiles='<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
    + tile('Presenças', pres, '#16A07A', '#E6F6F0')
    + tile('Faltas', falt, (falt&&+falt>0)?'#E52524':'#5b6b7c', (falt&&+falt>0)?'#FDECEC':'#f1f4f8')
    + tile('Temas pend.', temasN, (temasN&&temasN>0)?'#B8860B':'#5b6b7c', (temasN&&temasN>0)?'#FBF3D6':'#f1f4f8')
    + tile('Material', matN, (matN&&matN>0)?'#B8860B':'#5b6b7c', (matN&&matN>0)?'#FBF3D6':'#f1f4f8')
    + '</tr></table>';

  // Seções no corpo (frequência vira tiles; aulas viram só as faltas)
  const corDe=t=>/TEMA|MATERIAL/i.test(t)?'#B8860B':/TESTE|WRITING/i.test(t)?'#6C4BD8':/AULA|FALTA/i.test(t)?'#E52524':'#005EAF';
  const secHTML=secoes.filter(x=>!/FREQU/i.test(x.titulo)).map(sec=>{
    let titulo=sec.titulo, itens=sec.itens.slice().filter(it=> it && it!=='—' && !/^Togethere/i.test(it));
    if(/AULAS/i.test(titulo)){ itens=itens.filter(it=>/FALTOU/i.test(it)); titulo='📅 Faltas no período (com o conteúdo perdido)'; }
    const vazia = itens.length===0 || (itens.length===1 && /^Nenhum/i.test(itens[0]));
    const cor=corDe(titulo);
    const corpo = vazia
      ? '<div style="font-size:13px;color:#9aa6b6;font-style:italic;">Nada no período.</div>'
      : itens.map(it=>'<div style="font-size:13px;color:#233;padding:4px 0;border-bottom:1px solid #eef2f7;">'+esc(it)+'</div>').join('');
    return '<tr><td style="padding:16px 24px 2px;"><div style="font-weight:bold;color:'+cor+';font-size:14px;">'+esc(titulo)+'</div></td></tr>'
      + '<tr><td style="padding:4px 24px 6px;">'+corpo+'</td></tr>';
  }).join('');

  const corpoFinal = secoes.length ? secHTML : '<tr><td style="padding:20px 24px;font-size:14px;">'+esc(txt).replace(/\n/g,'<br>')+'</td></tr>';

  return '<!doctype html><html><body style="margin:0;padding:0;background:#eef3f8;">'
    +'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f8;padding:16px 0;"><tr><td align="center">'
    +'<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#10243a;">'
    +'<tr><td style="background:#005EAF;padding:20px 24px;"><div style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px;">togeth<span style="color:#FFC800;">e</span>re</div><div style="font-size:14px;color:#dce8f6;margin-top:2px;">Ficha de acompanhamento</div></td></tr>'
    +'<tr><td style="padding:14px 24px;border-bottom:3px solid #FFC800;background:#f7fafd;"><div style="font-size:16px;font-weight:bold;color:#005EAF;">'+esc(a.nome||'')+'</div><div style="color:#5b6b7c;font-size:13px;margin-top:2px;">'+esc(turma.nome||'—')+' &middot; '+esc(periodo)+'</div></td></tr>'
    +'<tr><td style="padding:14px 19px 2px;">'+tiles+'</td></tr>'
    + corpoFinal
    +'<tr><td style="padding:16px 24px;border-top:1px solid #e7eef6;color:#5b6b7c;font-size:12px;text-align:center;">Togethere &middot; Gravataí/RS — inglês para chegar lá</td></tr>'
    +'</table></td></tr></table></body></html>';
}
function abrirBoletimDoAluno(aid, turmaId){
  const a=(S.alunos||[]).find(x=>x.id===aid); if(!a) return toast('Aluno não encontrado');
  testeTurma=turmaId||a.turmaId; boletimAluno=aid;
  ir('testes');
  setTimeout(()=>{ try{ gerarBoletim(); }catch(e){} const el=document.getElementById('teBoletim'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }, 90);
}