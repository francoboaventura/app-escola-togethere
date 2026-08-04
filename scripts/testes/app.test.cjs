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

  const falhas=Object.keys(r).filter(k=>r[k]!==true);
  console.log(JSON.stringify(r,null,1));
  console.log(falhas.length?('FALHOU: '+falhas.join(', ')):('TUDO VERDE — '+Object.keys(r).length+' checks'));
  console.log('erros de página:',errs.filter(e=>!/supabase|net::|Failed to fetch/i.test(e)).slice(0,5));
  await b.close();
  process.exit(falhas.length?1:0);
})();
