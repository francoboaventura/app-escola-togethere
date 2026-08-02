// Gera os prints do tutorial (public/tutorial/*.png) com dados de demonstração.
// Rode após mudanças visuais grandes:  node scripts/tutorial-prints.cjs
// Requer Playwright + Chromium. Depois: build + commit (dist ganha os prints).
const path=require('path'); const ROOT=path.resolve(__dirname,'..');
let chromium; try{ ({chromium}=require('playwright')); }catch(e){ ({chromium}=require('/home/claude/.npm-global/lib/node_modules/playwright/index.js')); }
(async()=>{ const exe=process.env.TG_CHROMIUM||'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
  const b=await chromium.launch({executablePath:exe});
  const ctx=await b.newContext({viewport:{width:1000,height:1400},deviceScaleFactor:1,timezoneId:'America/Sao_Paulo'});
  const page=await ctx.newPage();
  await page.goto('file://'+ROOT+'/dist/index.html',{waitUntil:'load'}); await page.waitForTimeout(400);

  // ===== seed rico de demonstração =====
  await page.evaluate(()=>{
    window.save=()=>{};window.montarNav=()=>{};window.toast=()=>{};window.confirm=()=>false;
    const H=hoje();
    S.turmas=[
      {id:'t1',nome:'A2 TEENS TER/QUI 18h',nivel:'teens',cefr:'A2',status:'aberta',dias:[2,4],vezesSemana:2,professor:'Franco',horario:'Ter–Qui 18:00–19:15'},
      {id:'t2',nome:'B1 JUNIOR SEG/QUA 10h',nivel:'junior',cefr:'B1',status:'aberta',dias:[1,3],vezesSemana:2,professor:'Camila',horario:'Seg–Qua 10:15–11:30'}
    ];
    S.alunos=[
      {id:'a1',nome:'Sofia Martins',turmaId:'t1',nascimento:'2011-04-12',email:'familia.martins@gmail.com'},
      {id:'a2',nome:'Théo Ribeiro',turmaId:'t1',nascimento:'2010-09-30'},
      {id:'a3',nome:'Helena Costa',turmaId:'t1',nascimento:'2011-01-22'},
      {id:'a4',nome:'Pedro Luz',turmaId:'t2',nascimento:'2013-06-05'},
      {id:'a5',nome:'Mari Souza',turmaId:'t2',nascimento:'2013-11-17'}
    ];
    S.vipAlunos=[{id:'v1',nome:'Ana Beatriz',professor:'Franco',material:'Own It 3',dupla:false,
      linkAula:'https://meet.google.com/abc-defg-hij',
      horarios:[{dia:1,hora:'10:00',dur:60},{dia:3,hora:'15:30',dur:90}],dias:[1,3],horaPrev:'10:00'}];
    S.pacotesVip=[{id:'pk1',vipId:'v1',horas:40,inicio:'2026-02-01',fim:'2026-12-20'}];
    S.aulasVip=[{id:'av1',vipId:'v1',data:H,tema:'Job interviews',descricao:'Conversação: entrevista de emprego',duracaoMin:60,faltou:false,atualizadoEm:1}];
    S.presencas=[{id:'p1',turmaId:'t1',data:H,fechada:false,registros:{a1:'presente',a2:'falta',a3:'presente'},atrasados:['a3'],atualizadoEm:1}];
    S.temas=[{id:'tm1',turmaId:'t1',data:H,dataEntrega:H,descricao:'Workbook p. 34, ex. 1–4',entregas:{a1:true,a2:false,a3:'parcial'},origem:'plano',atualizadoEm:1}];
    S.material=[{id:'mt1',turmaId:'t1',data:H,faltantes:['a2'],atualizadoEm:1}];
    S.testes=[{id:'ts1',turmaId:'t1',numero:1,data:'2026-06-10',notas:{a1:{Grammar:85,Vocabulary:90,Listening:78,Reading:88,Writing:74,Speaking:92},a2:{Grammar:62,Vocabulary:70},a3:{Grammar:95,Vocabulary:88}},atualizadoEm:1}];
    S.planos=[{id:'pl1',turmaId:'t1',data:H,titulo:'Unit 5 — Past Simple',itens:[{txt:'Warm-up: weekend talk',done:true},{txt:'Grammar: past simple (regular verbs)',done:true},{txt:'Listening p. 52',done:false},{txt:'Speaking pairs: last vacation',done:false}],anotacoes:'Turma participativa hoje.',realizado:false,atualizadoEm:1}];
    S.tarefas=[
      {id:'tf1',titulo:'Ligar para a gráfica dos cards',quadrante:'fazer',responsavel:'Reginaldo',prazo:H,feita:false,criadoPor:'Franco',atualizadoEm:1},
      {id:'tf2',titulo:'Planejar festa de fim de semestre',quadrante:'agendar',responsavel:'Franco',prazo:'2026-09-15',feita:false,criadoPor:'Franco',atualizadoEm:1},
      {id:'tf3',titulo:'Orçamento material de limpeza',quadrante:'standby',feita:false,criadoPor:'Reginaldo',atualizadoEm:1}];
    S.livroPedidos=[
      {id:'lp1',alunoId:'a4',vip:false,titulo:'Power Up 2',status:'pedido',pedidoEm:H,por:'Reginaldo',atualizadoEm:1},
      {id:'lp2',alunoId:'a1',vip:false,titulo:'Own It 2',status:'recebido',pedidoEm:'2026-07-25',recebidoEm:H,atualizadoEm:1},
      {id:'lp3',alunoId:'v1',vip:true,titulo:'Own It 3',status:'entregue',pedidoEm:'2026-07-10',recebidoEm:'2026-07-18',entregueEm:'2026-07-22',por:'Franco',atualizadoEm:1}];
    S.planejamento=[{id:'t1',colecao:'Own It 2',dadas:{}},{id:'t2',colecao:'Power Up 2',dadas:{}}];
    S.matriculas=[
      {id:'m1',status:'ativa',alunoId:'a1',turmaId:'t1',respNome:'Carla Martins',criadoEm:'2026-07-20',atualizadoEm:1},
      {id:'m2',status:'orcamento',alunoNome:'Lucas Andrade',respNome:'Paulo Andrade',turmaId:'t2',criadoEm:H,atualizadoEm:1},
      {id:'m3',status:'negada',alunoNome:'Rafael Souza',negada:{motivo:'Vai decidir em setembro',em:H,por:'Franco'},turmaId:'t1',atualizadoEm:1}];
    S.financeiro=[{id:'f1',matriculaId:'m1',valorMatricula:200,valorMensalidade:420,descontoPct:5,parcelas:12,diaVencimento:10,formaPagamento:'Pix',dataInicio:'2026-02-10',pagos:{1:{em:'2026-02-10',valor:399},2:{em:'2026-03-10',valor:399}},extras:[{id:'e1',nome:'Material — Own It 2',valor:350,em:'2026-07-22',origem:'livros',pago:null}],atualizadoEm:1}];
    S.configFin=[{id:'fin',seg:{kids:{taxa:150,anual:3900,material:280},junior:{taxa:180,anual:4400,material:320},teens:{taxa:200,anual:4800,material:350},adults:{taxa:200,anual:5200,material:380},talking:{taxa:0,anual:2400,material:0}},valorHoraVip:120,valorHoraVipDupla:80,multaPct:2,jurosMesPct:1,diversos:[{nome:'Taxa de prova Cambridge',valor:250}]}];
    S.permissoes=[]; S.exclusoes=[]; S.contatos=[]; S.recessos=[]; S.alertas=[]; S.comentarios=[]; S.relatorios=[]; S.apoios=[]; S.writings=[]; S.boletins=[]; S.comunicados=[]; S.eventos=[];
    // 3 faltas seguidas do Théo → alerta real
    ['-7','-5','-2'].forEach((off,i)=>{ const d=new Date(); d.setDate(d.getDate()+parseInt(off)); S.presencas.push({id:'pf'+i,turmaId:'t1',data:ymd(d),fechada:true,registros:{a1:'presente',a2:'falta',a3:'presente'},atualizadoEm:1}); });
    document.getElementById('login').style.display='none'; document.getElementById('app').style.display='block'; document.body.style.background='var(--bg)';
  });

  const shots=[
    ['painel','direcao','painel',''],
    ['presenca','professor','presenca','presTurma="t1";presData=hoje();'],
    ['temas','professor','temas','temaTurma="t1";'],
    ['material','professor','material','matTurma="t1";matData=hoje();'],
    ['testes','professor','testes','testeTurma="t1";'],
    ['planos','professor','planos',''],
    ['relatorio','professor','relatorio',''],
    ['ficha','professor','ficha','_fichaAlunoId="a1";_fichaDe="";_fichaAte="";'],
    ['vip','direcao','ficha','_fichaAlunoId="v1";'],
    ['formacao','professor','formacao','_fmAba="biblioteca";'],
    ['alertas','secretaria','alertas',''],
    ['turmas','professor','turmas',''],
    ['estoque','secretaria','estoque',''],
    ['matriculas','direcao','matriculas','_negVerLista=true;'],
    ['financeiro','direcao','financeiro',''],
    ['configfin','direcao','configfin',''],
    ['permissoes','direcao','permissoes',''],
    ['tarefas','direcao','tarefas',''],
    ['relturma','secretaria','relturma',''],
    ['resumo','secretaria','resumo',''],
  ];
  const ok=[], fail=[];
  for(const [id,perfil,rota,setup] of shots){
    try{
      const r=await page.evaluate(([perfil,rota,setup])=>{
        try{
          S.perfil=perfil; S.usuario=perfil==='direcao'?'Franco':(perfil==='secretaria'?'Reginaldo':'Franco');
          window.rota=rota; eval(setup||'');
          document.getElementById('view').innerHTML='';
          VIEWS[rota]();
          window.scrollTo(0,0);
          return 'ok';
        }catch(e){ return 'ERR '+e.message; }
      },[perfil,rota,setup]);
      if(r!=='ok'){ fail.push(id+': '+r); continue; }
      await page.waitForTimeout(220);
      const box=await page.evaluate(()=>{ const v=document.getElementById('view'); const r=v.getBoundingClientRect(); return {x:Math.max(0,r.x-8), y:Math.max(0,r.y+4), width:Math.min(1000,r.width+16), height:Math.min(1150, Math.max(260,r.height+8))}; });
      await page.screenshot({path:ROOT+'/public/tutorial/'+id+'.png', clip:box});
      ok.push(id);
    }catch(e){ fail.push(id+': '+e.message.slice(0,80)); }
  }
  console.log('OK:',ok.join(','));
  console.log('FALHOU:',fail.join(' | ')||'nenhum');
  await b.close();
})();
