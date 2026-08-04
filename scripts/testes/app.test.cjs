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

    // ----- pacote de horas recolhível -----
    S.perfil='direcao'; S.usuario='Franco'; _vipPacoteAberto=false; VIEWS.ficha();
    h=document.getElementById('view').innerHTML;
    o.pacote_recolhido = /pac-card/.test(h) && /Pacote de horas/.test(h) && !/Contratadas/.test(h);
    o.pacote_tem_cabecalho = !!document.querySelector('.pac-h');
    document.querySelector('.pac-h').click(); await new Promise(z=>setTimeout(z,80));
    h=document.getElementById('view').innerHTML;
    o.pacote_abre = /Contratadas/.test(h) && /Utilizadas/.test(h) && /Saldo/.test(h);
    document.querySelector('.pac-h').click(); await new Promise(z=>setTimeout(z,80));
    o.pacote_fecha = !/Contratadas/.test(document.getElementById('view').innerHTML);
    // sinal (!) quando o pacote está na lista de atenção
    S.pacotesVip=[{id:'p1',vipId:'v1',horas:1,inicio:'2026-02-01',fim:''}];   // saldo baixo -> alerta
    VIEWS.ficha(); h=document.getElementById('view').innerHTML;
    o.pacote_alerta = /pac-alerta/.test(h) && !!vipAlertaPacote('v1');
    S.pacotesVip=[{id:'p1',vipId:'v1',horas:40,inicio:'2026-02-01',fim:''}];  // sem alerta
    VIEWS.ficha();
    o.pacote_sem_alerta = !/pac-alerta/.test(document.getElementById('view').innerHTML);
    return o;
  });
  Object.assign(r,t8);

  const falhas=Object.keys(r).filter(k=>r[k]!==true);
  console.log(JSON.stringify(r,null,1));
  console.log(falhas.length?('FALHOU: '+falhas.join(', ')):('TUDO VERDE — '+Object.keys(r).length+' checks'));
  console.log('erros de página:',errs.filter(e=>!/supabase|net::|Failed to fetch/i.test(e)).slice(0,5));
  await b.close();
  process.exit(falhas.length?1:0);
})();
