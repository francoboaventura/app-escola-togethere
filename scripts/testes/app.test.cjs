/* Harness de regressão do app Togethere — rode com:  node scripts/testes/app.test.cjs
   Fica versionado no repo de propósito: /tmp some quando o ambiente recicla. */
const path=require('path');
const ROOT=path.resolve(__dirname,'..','..');
const { chromium } = require(process.env.PW || '/home/claude/.npm-global/lib/node_modules/playwright/index.js');
(async()=>{ const exe='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
  const b=await chromium.launch({executablePath:exe});
  const ctx=await b.newContext({timezoneId:'America/Sao_Paulo'});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await page.goto('file://'+ROOT+'/dist/index.html',{waitUntil:'load'}); await page.waitForTimeout(400);

  // ---- seed comum ----
  await page.evaluate(()=>{
    window.save=()=>{}; window.toast=(m)=>{window.__t=m;}; window.montarNav_=montarNav;
    document.getElementById('login').style.display='none'; document.getElementById('app').style.display='block';
    S.turmas=[{id:'t1',nome:'B1 TEENS',nivel:'teens',cefr:'B1',status:'aberta',dias:[3],vezesSemana:1,professor:'Franco',horario:'18:15'}];
    S.alunos=[{id:'a1',nome:'Anne Frare',turmaId:'t1'}];
    S.vipAlunos=[{id:'v1',nome:'Carlos Lima',professor:'Franco',horarios:[{dia:3,hora:'14:00',dur:45}],pausas:[]}];
    S.aulasVip=[];S.pacotesVip=[];S.exclusoes=[];S.permissoes=[];S.usuarios=[{nome:'Franco',usuario:'Franco',perfil:'direcao',ensina:'Franco'}];
    S.perfil='direcao'; S.usuario='Franco';
  });

  const r={};
  // ===== 1) DATA: eventos intermediários (ano 0002 → 0020 → 1990) =====
  const t1=await page.evaluate(async()=>{
    const o={}; rota='ficha'; _fichaAlunoId='a1'; VIEWS.ficha();
    const el=document.querySelector('#view input[type="date"]');
    o.tem_campo=!!el; o.limites = el.getAttribute('min')==='1900-01-01' && !!el.getAttribute('max');
    el.focus();
    const troca=v=>{ el.value=v; el.dispatchEvent(new Event('change',{bubbles:true})); };
    troca('0002-04-12'); troca('0020-04-12'); troca('0202-04-12');   // estados intermediários da digitação
    o.ignorou_parcial = !S.alunos[0].nascimento;                     // nada foi salvo
    o.campo_vivo_1 = document.contains(el) && document.activeElement===el;
    troca('1990-04-12');                                             // ano completo
    o.salvou = S.alunos[0].nascimento==='1990-04-12';
    o.campo_vivo_2 = document.contains(el) && document.activeElement===el;   // NÃO re-renderizou ainda
    el.blur(); await new Promise(z=>setTimeout(z,80));
    o.rerender_no_blur = !document.contains(el) && !!document.querySelector('#view input[type="date"]');
    return o;
  });
  r.data_tem_campo=t1.tem_campo; r.data_limites=t1.limites;
  r.data_ignora_ano_parcial=t1.ignorou_parcial; r.data_campo_sobrevive=t1.campo_vivo_1 && t1.campo_vivo_2;
  r.data_salva=t1.salvou; r.data_rerender_so_no_blur=t1.rerender_no_blur;

  // ===== 2) HORA: 18:01 (meio da digitação) → 18:15 =====
  const t2=await page.evaluate(async()=>{
    const o={}; rota='ficha'; _fichaAlunoId='v1'; VIEWS.ficha();
    const el=document.querySelector('#view input[type="time"]');
    o.tem_campo=!!el; el.focus();
    const troca=v=>{ el.value=v; el.dispatchEvent(new Event('change',{bubbles:true})); };
    troca('18:01');                                   // estado intermediário
    o.campo_vivo_1 = document.contains(el) && document.activeElement===el;
    troca('18:15');
    o.campo_vivo_2 = document.contains(el) && document.activeElement===el;
    o.valor_final = el.value;
    el.blur(); await new Promise(z=>setTimeout(z,120));
    o.salvou = vipHorarios(S.vipAlunos[0])[0].hora==='18:15';
    o.rerender_no_blur = !document.contains(el);
    return o;
  });
  r.hora_tem_campo=t2.tem_campo; r.hora_campo_sobrevive=t2.campo_vivo_1 && t2.campo_vivo_2;
  r.hora_valor_final=t2.valor_final==='18:15'; r.hora_salva=t2.salvou; r.hora_rerender_so_no_blur=t2.rerender_no_blur;

  // ===== 3) MODAL não fecha ao preencher a data =====
  const t3=await page.evaluate(async()=>{
    const o={}; rota='ficha'; _fichaAlunoId='v1'; VIEWS.ficha(); lancarAulaVip('v1');
    await new Promise(z=>setTimeout(z,80));
    const el=document.getElementById('laData'); o.abriu=!!el; el.focus();
    ['0002-08-05','0020-08-05','2026-08-05'].forEach(v=>{ el.value=v; el.dispatchEvent(new Event('change',{bubbles:true})); });
    o.modal_vivo = !!document.getElementById('laData') && !!document.getElementById('laDesc') && document.activeElement===el;
    o.valor = el.value==='2026-08-05';
    if(typeof fechar==='function') fechar();
    return o;
  });
  r.modal_abriu=t3.abriu; r.modal_nao_fecha=t3.modal_vivo; r.modal_data_ok=t3.valor;

  // ===== 4) NOME do VIP editável (secretaria e direção) =====
  const nomes=await page.evaluate(async()=>{
    const out={};
    // DIREÇÃO
    S.perfil='direcao'; S.usuario='Franco'; rota='ficha'; _fichaAlunoId='v1'; VIEWS.ficha();
    let inp=[...document.querySelectorAll('#view input[type="text"]')].find(i=>/setVipCampo\(.*'nome'/.test(i.getAttribute('onchange')||''));
    out.dir_tem_campo = !!inp;
    if(inp){ inp.value='Carlos Lima Souza'; setVipCampo('v1','nome',inp.value); }
    await new Promise(z=>setTimeout(z,60));
    out.dir_salvou = S.vipAlunos[0].nome==='Carlos Lima Souza';
    // vazio não apaga o nome
    window.__t=''; setVipCampo('v1','nome','   ');
    out.nao_aceita_vazio = S.vipAlunos[0].nome==='Carlos Lima Souza' && /não pode ficar vazio/.test(window.__t);
    // SECRETARIA
    S.perfil='secretaria'; S.usuario='Regi'; VIEWS.ficha();
    inp=[...document.querySelectorAll('#view input[type="text"]')].find(i=>/setVipCampo\(.*'nome'/.test(i.getAttribute('onchange')||''));
    out.sec_tem_campo = !!inp;
    setVipCampo('v1','nome','Carlos L. Souza');
    out.sec_salvou = S.vipAlunos[0].nome==='Carlos L. Souza';
    // PROFESSOR não vê o campo (o card de contato inteiro é da secretaria/direção)
    S.perfil='professor'; S.usuario='Franco'; VIEWS.ficha();
    out.prof_sem_campo = ![...document.querySelectorAll('#view input')].some(i=>/setVipCampo\(.*'nome'/.test(i.getAttribute('onchange')||''));
    // e sem permissão a função recusa
    window.__t=''; const antes=S.vipAlunos[0].nome; setVipCampo('v1','nome','Hacker');
    out.prof_bloqueado = S.vipAlunos[0].nome===antes;
    return out;
  });
  Object.assign(r,nomes);

  // ===== 5) regressões rápidas do b166 =====
  const reg=await page.evaluate(()=>{
    const o={};
    S.perfil='direcao'; S.usuario='Franco'; montarNav(); rota='painel'; VIEWS.painel();
    o.menu_topo = !!document.getElementById('btnMenuTopo') && document.querySelectorAll('.tnav-grp').length===0;
    o.menu_painel = !!document.querySelector('.menu-painel .mp-i');
    const pa=document.querySelector('.pa-card');
    o.pa_turma = !!pa && /abrirTurmaDoPainel/.test(pa.getAttribute('onclick'));
    rota='ficha'; _fichaAlunoId='a1'; VIEWS.ficha();
    o.ficha_quadros = document.querySelectorAll('.fx-tab .fem').length===6 && document.querySelectorAll('.fx-acao').length===4;
    return o;
  });
  Object.assign(r,reg);


  // ===== 6) regressões b159–b165 =====
  const reg2=await page.evaluate(()=>{
    const o={};
    window.imprimirDoc=(h)=>{window.__doc=h;};
    // b159 contrato oficial + visualizador de PDF assinado intacto
    S.perfil='direcao'; S.usuario='Franco';
    S.matriculas=[{id:'m1',status:'ativa',alunoId:'a1',turmaId:'t1',respNome:'Renan',dataInicio:'2026-01-05'}];
    S.financeiro=[];
    window.__doc=''; verContratoOficial('m1');
    o.b159_contrato = /III – ESTIPULAÇÕES/.test(window.__doc) && /THE CHOICE CENTRO DE IDIOMAS LTDA\./.test(window.__doc) && /Art\. 25\./.test(window.__doc);
    o.b159_visualizador_pdf = String(verContrato).slice(0,20).indexOf('async')>=0;
    // b160/b161 regras do VIP
    S.aulasVip=[];
    registrarCancelamentoVip('v1');
    const dur=document.getElementById('cz_dur'); dur.value='45';
    salvarCancelamentoVip('v1');
    const cz=S.aulasVip[S.aulasVip.length-1];
    o.b160_cancelamento = !!cz && cz.cancel12h===true && cz.cobrarFalta===true && cz.duracaoMin===45;
    S.perfil='professor'; S.usuario='Franco'; rota='ficha'; _fichaAlunoId='v1'; VIEWS.ficha();
    const h=document.getElementById('view').innerHTML;
    o.b161_prof_sem_cancel = h.indexOf('cancelou em cima da hora')<0 && h.indexOf('fx-tiles')<0;
    o.b161_horarios_leitura = h.indexOf('setVipHorarioLinha')<0;
    lancarAulaVip('v1');
    document.getElementById('laDesc').value='x'; document.getElementById('laDur').value='20'; window.__t='';
    salvarAulaVipFicha('v1');
    o.b161_min30 = /30 minutos/.test(window.__t);
    if(typeof fechar==='function') fechar();
    // b163 níveis oficiais
    o.b163_niveis = TRILHAS.teens.niveis.join(',')==='A1,A2,B1,B1+,B2,C1,C1+' && CEFR_ORDEM.indexOf('B2+')<0;
    S.perfil='secretaria'; S.usuario='Regi'; rota='turmas'; VIEWS.turmas();
    o.b163_sec_cria_turma = !!document.getElementById('nT') && [...document.getElementById('nC').options].map(x=>x.value).includes('B2');
    return o;
  });
  Object.assign(r,reg2);


  // ===== 7) b168: editar/excluir aula VIP + pacote recolhível =====
  const t8=await page.evaluate(async()=>{
    const o={};
    S.vipAlunos=[{id:'v1',nome:'Carlos Lima',professor:'Franco',horarios:[{dia:3,hora:'14:00',dur:45}],pausas:[]}];
    S.pacotesVip=[{id:'p1',vipId:'v1',horas:20,inicio:'2026-02-01',fim:''}];
    S.aulasVip=[
      {id:'x1',vipId:'v1',data:'2026-08-05',hora:'14:10',tema:'Job',descricao:'Aula normal',duracaoMin:45,faltou:false},
      {id:'x2',vipId:'v1',data:'2026-08-10',tema:'Cancelamento em cima da hora',descricao:'Avisou 1h antes',duracaoMin:45,faltou:true,cobrarFalta:true,cancel12h:true}
    ];
    const aula=S.aulasVip[0], canc=S.aulasVip[1];
    // permissões
    S.perfil='direcao'; o.dir_edita_tudo = podeEditarAulaVip(aula) && podeEditarAulaVip(canc);
    S.perfil='professor'; o.prof_edita_aula = podeEditarAulaVip(aula) && !podeEditarAulaVip(canc);
    S.perfil='secretaria'; o.sec_so_cancelamento = !podeEditarAulaVip(aula) && podeEditarAulaVip(canc);
    // botões na ficha (direção)
    S.perfil='direcao'; S.usuario='Franco'; rota='ficha'; _fichaAlunoId='v1'; VIEWS.ficha();
    let h=document.getElementById('view').innerHTML;
    o.ficha_botoes = /editarAulaVip\('x1'\)/.test(h) && /delAulaVip\('x1'\)/.test(h) && /editarAulaVip\('x2'\)/.test(h);
    // professor vê editar na dele e não vê a cancelada
    S.perfil='professor'; VIEWS.ficha(); h=document.getElementById('view').innerHTML;
    o.prof_botoes = /editarAulaVip\('x1'\)/.test(h) && !/editarAulaVip\('x2'\)/.test(h);
    // editar de verdade, a partir da ficha
    S.perfil='direcao'; VIEWS.ficha();
    editarAulaVip('x1'); await new Promise(z=>setTimeout(z,60));
    o.modal_abre = !!document.getElementById('evDesc') && !!document.getElementById('evHora');
    document.getElementById('evDesc').value='Aula revisada';
    document.getElementById('evDur').value='60';
    document.getElementById('evHora').value='15:00';
    salvarEdicaoAulaVip('x1'); await new Promise(z=>setTimeout(z,80));
    o.editou = aula.descricao==='Aula revisada' && aula.duracaoMin===60 && aula.hora==='15:00';
    o.voltou_pra_ficha = rota==='ficha' && /Ficha do aluno/.test(document.getElementById('view').innerHTML);
    // duração mínima continua valendo na edição
    editarAulaVip('x1'); await new Promise(z=>setTimeout(z,60));
    document.getElementById('evDur').value='10'; window.__t='';
    salvarEdicaoAulaVip('x1');
    o.min30_na_edicao = /30 minutos/.test(window.__t) && aula.duracaoMin===60;
    if(typeof fechar==='function') fechar();
    // editar cancelamento mantém a regra (não realizada + hora descontada)
    S.perfil='secretaria'; S.usuario='Regi';
    editarAulaVip('x2'); await new Promise(z=>setTimeout(z,60));
    o.cancel_sem_checkbox = !document.getElementById('evFaltou') && /cancelamento em cima da hora/i.test(document.body.innerHTML);
    document.getElementById('evDesc').value='Avisou 2h antes';
    salvarEdicaoAulaVip('x2'); await new Promise(z=>setTimeout(z,60));
    o.cancel_mantem_regra = canc.cancel12h===true && canc.faltou===true && canc.cobrarFalta===true && canc.descricao==='Avisou 2h antes';
    // excluir devolve a hora ao saldo
    const antes=vipConsumoMin('v1');
    window.confirm=()=>true; delAulaVip('x2'); await new Promise(z=>setTimeout(z,60));
    o.excluiu = !S.aulasVip.some(x=>x.id==='x2') && vipConsumoMin('v1')===antes-45;
    // professor não consegue apagar o registro da secretaria
    S.aulasVip.push({id:'x3',vipId:'v1',data:'2026-08-12',descricao:'c',duracaoMin:45,faltou:true,cobrarFalta:true,cancel12h:true});
    S.perfil='professor'; window.__t=''; delAulaVip('x3');
    o.prof_nao_apaga_cancel = S.aulasVip.some(x=>x.id==='x3');

    // ----- pacote de horas sempre visível (b175: cartões, sem sanfona) -----
    S.perfil='direcao'; S.usuario='Franco'; _qdAbertos={}; VIEWS.ficha();
    h=document.getElementById('view').innerHTML;
    o.pacote_sempre_visivel = /Pacote de horas/.test(h) && /Contratadas/.test(h) && /Utilizadas/.test(h) && /Saldo/.test(h);
    // selo (⚠) quando o pacote está na lista de atenção
    S.pacotesVip=[{id:'p1',vipId:'v1',horas:1,inicio:'2026-02-01',fim:''}];   // saldo baixo -> alerta
    VIEWS.ficha(); h=document.getElementById('view').innerHTML;
    o.pacote_alerta = /saldo (baixo|esgotado)/.test(h) && !!vipAlertaPacote('v1');
    S.pacotesVip=[{id:'p1',vipId:'v1',horas:40,inicio:'2026-02-01',fim:''}];  // sem alerta
    VIEWS.ficha();
    o.pacote_sem_alerta = !/saldo (baixo|esgotado)/.test(document.getElementById('view').innerHTML);

    // ----- b175: tela VIP em cartões + ficha lateral -----
    rota='vip'; vipSel='v1'; VIEWS.vip();
    h=document.getElementById('view').innerHTML;
    o.b175_cartoes = /class="ctv"/.test(h) && /abrirVipAulas\(\)/.test(h) && /abrirVipWritings\(\)/.test(h);
    o.b175_visao_cartoes = /abrir aluno ›/.test(h);   // visão geral em grade de cartões (direção)
    abrirVipAulas(); await new Promise(z=>setTimeout(z,60));
    o.b175_ficha_abre = document.getElementById('fichaLat').classList.contains('on')
      && /Aula revisada/.test(document.getElementById('fichaLatCorpo').innerHTML);
    VIEWS.vip();   // re-render da tela não pode fechar nem esvaziar a ficha lateral
    o.b175_ficha_sobrevive = document.getElementById('fichaLat').classList.contains('on')
      && /Aula revisada/.test(document.getElementById('fichaLatCorpo').innerHTML);
    fecharFichaLateral();
    o.b175_ficha_fecha = !document.getElementById('fichaLat').classList.contains('on');
    return o;
  });
  Object.assign(r,t8);


  // ===== 8) b169: botão voltar + tela VIP em quadradinhos =====
  const t9=await page.evaluate(async()=>{
    const o={};
    S.vipAlunos=[{id:'v1',nome:'Carlos Lima',professor:'Franco',horarios:[{dia:3,hora:'14:00',dur:45}]},{id:'v2',nome:'Ana Paula',professor:'Franco'}];
    S.pacotesVip=[{id:'p1',vipId:'v1',horas:20,inicio:'2026-02-01',fim:''}];
    S.aulasVip=[{id:'x1',vipId:'v1',data:'2026-08-05',hora:'14:10',tema:'Job',descricao:'Aula',duracaoMin:45,faltou:false}];
    S.writings=[{id:'w1',alunoId:'v1',data:'2026-07-20',levelLabel:'B1 Teens',overall_band:4,bands:{},subscales:[]}];
    S.perfil='direcao'; S.usuario='Franco'; montarNav();
    vipSel=null; _qdAbertos={}; rota='painel'; _histNav=[]; ir('vip');   // histórico limpo para testar o voltar
    let h=document.getElementById('view').innerHTML;
    o.vip_sem_atalhos_nome = !/onclick="abrirFicha\('v2'\)/.test(h);
    o.vip_visao_cartoes = /horas VIP/i.test(h) && /class="ctv"/.test(h);   // b175: visão geral em grade de cartões
    o.vip_dropdown_visivel = !!document.getElementById('vipSelAluno') && document.getElementById('vipSelAluno').options.length===3;   // b175: dropdown sempre à vista
    selecionarVip('v1'); await new Promise(z=>setTimeout(z,80));
    h=document.getElementById('view').innerHTML;
    o.vip_detalhes = /Carlos Lima/.test(h) && /abrirVipLancar\(\)/.test(h) && /abrirVipAulas\(\)/.test(h) && /abrirVipWritings\(\)/.test(h);
    o.vip_pacote_visivel = /Contratadas/.test(h);   // b175: pacote sem sanfona
    o.vip_aulas_preview = /05\/08\/2026/.test(h);  // prévia da última aula no cartão
    abrirVipLancar(); await new Promise(z=>setTimeout(z,60));
    o.vip_form = !!document.getElementById('vipDesc') && !!document.getElementById('vipHora');
    document.getElementById('vipDesc').value='Aula nova'; addAulaVip(); await new Promise(z=>setTimeout(z,80));
    o.vip_lanca = S.aulasVip.some(a=>a.descricao==='Aula nova');
    o.vip_ficha_fechou = !document.getElementById('fichaLat').classList.contains('on');   // lançar fecha a ficha lateral
    // funções que vivem no módulo VIP seguem existindo
    o.vip_funcoes = ['vipHorarios','vipHoraDoDia','vipDurDoDia','pendenciasAulaVip','renderPendenciasVipCard','alunoParaVip','vipParaAluno','vipPausaAtual'].every(f=>typeof window[f]==='function');
    // botão voltar
    const bv=document.getElementById('btnVoltar');
    o.voltar_aparece = !!bv && !bv.hidden;
    voltar(); await new Promise(z=>setTimeout(z,80));
    o.voltar_funciona = rota==='painel' && document.getElementById('btnVoltar').hidden;
    ir('turmas'); abrirTurma('t1'); await new Promise(z=>setTimeout(z,60));
    o.voltar_na_turma = !document.getElementById('btnVoltar').hidden;
    voltar(); await new Promise(z=>setTimeout(z,60));
    o.voltar_sai_da_turma = !painelTurma && rota==='turmas';
    voltar(); await new Promise(z=>setTimeout(z,60));
    o.voltar_encadeado = rota==='painel';
    return o;
  });
  Object.assign(r,t9);

  // ===== 10) b170: nº sequencial no lugar da inicial nas listas de alunos =====
  const t10=await page.evaluate(async()=>{
    const o={};
    // sem foto + com número → o número vai no centro (fotoav-ini), marca com-num, sem badge visível
    const semFoto=avatarFoto('av-sm','','A','',3);
    o.num_sem_foto = /class="[^"]*com-num/.test(semFoto) && />3<\/span>/.test(semFoto);
    // com foto + com número → mantém a foto e adiciona o badge pequeno fotoav-num com o número
    const comFoto=avatarFoto('av-sm','fotos/x.jpg','A','',7);
    o.num_com_foto_badge = /fotoav-num">7<\/span>/.test(comFoto) && /data-foto="fotos\/x\.jpg"/.test(comFoto);
    // sem número (ficha/usuário) → comportamento antigo: mostra a inicial, sem com-num nem badge
    const fichaAv=avatarFoto('fx-av','','M','');
    o.num_ficha_intacta = !/com-num/.test(fichaAv) && !/fotoav-num/.test(fichaAv) && />M<\/span>/.test(fichaAv);
    return o;
  });
  Object.assign(r,t10);

  // ===== 11) b171: matrícula Turma/VIP + responsável opcional 18+ =====
  const t11=await page.evaluate(async()=>{
    const o={};
    S.vipAlunos=[{id:'vv1',nome:'Paula Adulta',professor:'Franco'}];
    S.turmas=S.turmas||[]; if(!S.turmas.some(t=>t.id==='tt1')) S.turmas.push({id:'tt1',nome:'B1 Teens Seg/Qua'});
    // matrícula VIP resolve nome/local pelo aluno VIP
    const mVip={tipo:'vip',vipId:'vv1',professor:'Franco'};
    o.mat_vip_nome = matNome(mVip)==='Paula Adulta';
    o.mat_vip_local = /VIP/.test(matLocal(mVip)) && /Franco/.test(matLocal(mVip)) && matEhVip(mVip)===true;
    // matrícula de turma continua resolvendo pela turma
    const mTur={tipo:'turma',turmaId:'tt1',alunoNome:'João'};
    o.mat_turma_local = /🏫/.test(matLocal(mTur)) && matEhVip(mTur)===false && matNome(mTur)==='João';
    // regra de idade: 18+ é adulto (responsável opcional)
    o.idade_adulto = idadeDe('2000-01-01')>=18 && (idadeDe('2015-01-01')||0)<18;
    // o form abre sem erro com o novo seletor de tipo
    S.perfil='direcao'; abrirMatricula(''); await new Promise(z=>setTimeout(z,40));
    o.mat_form_tipo = !!document.getElementById('mat_tipo') && !!document.getElementById('mat_wrapProf') && !!document.getElementById('mat_wrapAlunoVip');
    fechar();
    return o;
  });
  Object.assign(r,t11);

  // ===== 12) b173: remanejar aula VIP "para o final do plano" =====
  const t12=await page.evaluate(async()=>{
    const o={};
    S.vipAlunos=[{id:'vf1',nome:'Josiane',professor:'Franco',horarios:[{dia:3,hora:'14:00',dur:60}]}]; // quarta-feira
    S.pacotesVip=[{id:'pf1',vipId:'vf1',horas:20,inicio:'2026-02-01',fim:'2026-09-30'}];
    S.aulasVip=[];
    const vip=S.vipAlunos[0];
    const nova=_vipDataFinalPlano(vip);
    o.final_depois_do_fim = nova>'2026-09-30';
    o.final_cai_na_quarta = weekdayOf(nova)===3;
    const est=_vipEstenderVigenciaAte('vf1', nova);
    o.estende_vigencia = est===true && S.pacotesVip[0].fim===nova;
    o.nao_estende_dentro = _vipEstenderVigenciaAte('vf1','2026-03-01')===false;
    return o;
  });
  Object.assign(r,t12);

  // ===== 13) b174: prospectivos — criar, registrar contato e encaminhar p/ matrícula =====
  const t13=await page.evaluate(async()=>{
    const o={};
    S.perfil='direcao'; S.prospectos=[]; S.matriculas=[];
    abrirProspecto(''); await new Promise(z=>setTimeout(z,30));
    o.form_abre = !!document.getElementById('pr_alunoNome') && !!document.getElementById('pr_trilha') && !!document.getElementById('pr_nivel');
    document.getElementById('pr_alunoNome').value='Maria Interessada';
    document.getElementById('pr_paiNome').value='João Pai';
    document.getElementById('pr_telefone').value='51999';
    document.getElementById('pr_email').value='m@e.com';
    document.getElementById('pr_trilha').value='teens'; _prospNiveis();
    document.getElementById('pr_nivel').value='A2';
    document.getElementById('pr_horario').value='ter/qui';
    salvarProspecto('');
    o.criou = S.prospectos.length===1 && S.prospectos[0].alunoNome==='Maria Interessada' && S.prospectos[0].nivel==='A2' && S.prospectos[0].trilha==='teens';
    const pid=S.prospectos[0].id;
    registrarContatoProspecto(pid); await new Promise(z=>setTimeout(z,20));
    document.getElementById('qc_nota').value='ligamos, retornar semana que vem';
    salvarContatoRapido(pid);
    o.contato = (S.prospectos[0].contatos||[]).length===1 && !!_prospUltimoContato(S.prospectos[0]);
    encaminharProspecto(pid); await new Promise(z=>setTimeout(z,20));
    const mt=(S.matriculas||[])[0];
    o.encaminhou = !!mt && mt.status==='orcamento' && mt.alunoNome==='Maria Interessada' && mt.respNome==='João Pai' && mt.prospectoId===pid;
    o.prosp_marcado = S.prospectos[0].status==='encaminhado' && S.prospectos[0].encaminhadoMatriculaId===mt.id;
    o.obs_nivel = /A2/.test(mt.observacoes||'');
    fechar();
    return o;
  });
  Object.assign(r,t13);

  // ===== 14) b176: trilha de matrícula (5 passos, Turma/VIP, rascunhos) =====
  const t14=await page.evaluate(async()=>{
    const o={};
    S.perfil='direcao'; S.usuario='Franco';
    S.matriculas=[]; S.vipAlunos=[]; S.pacotesVip=[]; S.alunos=S.alunos||[]; S.financeiro=[];
    S.turmas=[{id:'t1',nome:'B1 TEENS',nivel:'teens',cefr:'B1',status:'aberta',dias:[3],vezesSemana:1,professor:'Franco',horario:'18:15'}];
    S.usuarios=(S.usuarios||[]).some(u=>u.ensina)?S.usuarios:[{id:'u1',nome:'Franco',perfil:'direcao',ensina:'Franco'}];
    S.configFin=[{id:'fin', valorHoraVip:'120', valorHoraVipDupla:'90', atualizadoEm:Date.now()}];
    rota='matriculas';
    // --- fluxo VIP completo ---
    abrirTrilhaMatricula(); await new Promise(z=>setTimeout(z,40));
    o.tr_abre = !!document.getElementById('tr1_nome');
    document.getElementById('tr1_nome').value='Beatriz VIP'; document.getElementById('tr1_nasc').value='1990-05-10';
    trIr(2); await new Promise(z=>setTimeout(z,30));
    o.tr_rascunho_criado = S.matriculas.some(x=>x.status==='rascunho' && x.alunoNome==='Beatriz VIP');
    o.tr_adulto_opcional = /maior de 18/.test(document.getElementById('modal').innerHTML);
    document.getElementById('tr2_nome').value='Beatriz VIP'; document.getElementById('tr2_doc').value='000.000.000-00';
    document.getElementById('tr2_tel').value='51999'; document.getElementById('tr2_endereco').value='Rua X, 1';
    trIr(3); await new Promise(z=>setTimeout(z,30));
    document.getElementById('tr3_tipo').value='vip'; trIr(3); await new Promise(z=>setTimeout(z,30));
    o.tr_vip_campos = !!document.getElementById('tr3_horas') && !!document.getElementById('tr3_prof');
    document.getElementById('tr3_prof').value='Franco'; document.getElementById('tr3_horas').value='20';
    document.getElementById('tr3_vigini').value='2026-08-10'; document.getElementById('tr3_nivel').value='B1';
    trIr(4); await new Promise(z=>setTimeout(z,30));
    o.tr_vip_pag = !!document.getElementById('tr4_vipParcelas') && /120/.test(document.getElementById('modal').innerHTML);
    document.getElementById('tr4_vipParcelas').value='4'; document.getElementById('tr4_vipDesc').value='100';
    document.getElementById('tr4_forma').value='Pix';
    trIr(5); await new Promise(z=>setTimeout(z,30));
    o.tr_vip_resumo = /Beatriz VIP/.test(document.getElementById('modal').innerHTML) && /20h/.test(document.getElementById('modal').innerHTML);
    trConcluir('ativa'); await new Promise(z=>setTimeout(z,60));
    const nv=(S.vipAlunos||[]).find(v=>v.nome==='Beatriz VIP');
    o.tr_vip_criou_aluno = !!nv && nv.professor==='Franco';
    o.tr_vip_pacote = (S.pacotesVip||[]).some(pk=>pk.vipId===nv.id && pk.horas===20 && pk.inicio==='2026-08-10');
    const mv=(S.matriculas||[]).find(x=>x.vipId===nv.id);
    o.tr_vip_matricula = !!mv && mv.status==='ativa' && mv.tipo==='vip' && !mv.trilha;
    // contrato preenchido: 20h × 120 − 100 = 2300 em 4× (3×575,00 + ajuste)
    const cd=nv.contratoDados||{};
    o.tr_vip_contrato = cd.contratante==='Beatriz VIP' && cd.horas==='20' && (cd.parcelas||[]).length===4
      && cd.parcelas.every(pp=>/R\$/.test(pp.valor)) && /Pix/.test(cd.obs||'');
    o.tr_sem_rascunho_orfao = !S.matriculas.some(x=>x.status==='rascunho');
    if(typeof fechar==='function') fechar();
    // --- rascunho: salvar, aparecer no card, continuar e descartar ---
    abrirTrilhaMatricula(); await new Promise(z=>setTimeout(z,40));
    document.getElementById('tr1_nome').value='Rascunho Kid';
    trSairSalvando(); await new Promise(z=>setTimeout(z,40));
    o.tr_rascunho_salvo = S.matriculas.some(x=>x.status==='rascunho' && x.alunoNome==='Rascunho Kid');
    VIEWS.matriculas();
    o.tr_card_trilhas = /Matrículas em andamento/.test(document.getElementById('view').innerHTML) && /Rascunho Kid/.test(document.getElementById('view').innerHTML);
    o.tr_fora_da_lista = !/Rascunho Kid/.test(document.getElementById('matListaBox').innerHTML);
    const rid=S.matriculas.find(x=>x.status==='rascunho').id;
    abrirTrilhaMatricula(rid); await new Promise(z=>setTimeout(z,40));
    o.tr_continua = document.getElementById('tr1_nome') && document.getElementById('tr1_nome').value==='Rascunho Kid';
    if(typeof fechar==='function') fechar();
    window.confirm=()=>true; trilhaDescartar(rid); await new Promise(z=>setTimeout(z,30));
    o.tr_descarta = !S.matriculas.some(x=>x.id===rid);
    // --- fluxo turma com desconto caso a caso ---
    abrirTrilhaMatricula(); await new Promise(z=>setTimeout(z,40));
    document.getElementById('tr1_nome').value='Aluno Turma'; document.getElementById('tr1_nasc').value='2012-03-01';
    trIr(2); await new Promise(z=>setTimeout(z,30));
    document.getElementById('tr2_nome').value='Mãe Turma';
    trIr(3); await new Promise(z=>setTimeout(z,30));
    document.getElementById('tr3_turma').value='t1';
    trIr(4); await new Promise(z=>setTimeout(z,30));
    document.getElementById('tr4_mensal').value='400'; document.getElementById('tr4_descVal').value='50';
    trIr(5); await new Promise(z=>setTimeout(z,30));
    trConcluir('ativa'); await new Promise(z=>setTimeout(z,60));
    const al=(S.alunos||[]).find(a=>a.nome==='Aluno Turma');
    const mt2=(S.matriculas||[]).find(x=>x.alunoId===(al||{}).id);
    const f2=(S.financeiro||[]).find(x=>x.matriculaId===(mt2||{}).id);
    o.tr_turma_criou = !!al && !!mt2 && mt2.status==='ativa' && !!f2 && f2.descontoValor===50 && f2.valorMensalidade===400;
    // menor de 18 sem responsável: barra no passo 2
    abrirTrilhaMatricula(); await new Promise(z=>setTimeout(z,40));
    document.getElementById('tr1_nome').value='Menor Sem Resp'; document.getElementById('tr1_nasc').value='2015-01-01';
    trIr(2); await new Promise(z=>setTimeout(z,30));
    window.__t=''; trIr(3);
    o.tr_valida_resp = /responsável/.test(window.__t||'');
    trSairSalvando(); await new Promise(z=>setTimeout(z,30));
    const rid2=(S.matriculas.find(x=>x.status==='rascunho')||{}).id;
    if(rid2){ trilhaDescartar(rid2); }
    return o;
  });
  Object.assign(r,t14);

  const falhas=Object.keys(r).filter(k=>r[k]!==true);
  console.log(JSON.stringify(r,null,1));
  console.log(falhas.length?('FALHOU: '+falhas.join(', ')):('TUDO VERDE — '+Object.keys(r).length+' checks'));
  console.log('erros de página:',errs.filter(e=>!/supabase|net::|Failed to fetch/i.test(e)).slice(0,5));
  await b.close();
  process.exit(falhas.length?1:0);
})();
