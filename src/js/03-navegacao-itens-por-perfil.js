/* =========================================================================
   NAVEGAÇÃO  —  itens por perfil
   ========================================================================= */
const NAV=[
  {id:'painel', label:'Painel', em:'📊', grp:'Início', roles:['professor','secretaria','direcao']},
  {id:'tutorial', label:'Tutorial', em:'📖', grp:'Início', roles:['professor','secretaria','direcao']},
  {id:'perfil', label:'Meu perfil', em:'👤', grp:'Início', roles:['professor','secretaria','direcao'], menu:false},
  {id:'presenca', label:'Chamada do dia', em:'📋', grp:'Sala de aula', roles:['professor','direcao'], menu:false},
  {id:'testes', label:'Testes', em:'✏️', grp:'Sala de aula', roles:['professor','direcao'], menu:false},
  {id:'planos', label:'Planos de aula', em:'🗒️', grp:'Sala de aula', roles:['professor','direcao'], menu:false},
  {id:'relatorio', label:'Relatório do dia', em:'🧾', grp:'Sala de aula', roles:['professor','direcao'], menu:false},
  {id:'planejamento', label:'Planejamento', em:'📅', grp:'Sala de aula', roles:['professor','direcao']},
  {id:'writings', label:'Correção de writings', em:'📝', grp:'Sala de aula', roles:['professor','direcao']},
  {id:'formacao', label:'Formação', em:'🎓', grp:'Sala de aula', roles:['professor','direcao']},
  {id:'ficha', label:'Ficha do aluno', em:'📇', grp:'Acompanhamento', roles:['professor','secretaria','direcao'], menu:false},
  {id:'resumo', label:'Relatórios por aluno', em:'📄', grp:'Acompanhamento', roles:['secretaria','direcao']},
  {id:'relturma', label:'Relatórios por turma', em:'🏫', grp:'Acompanhamento', roles:['secretaria','direcao']},
  {id:'aprovacoes', label:'Aprovar boletins', em:'✅', grp:'Acompanhamento', roles:['direcao']},
  {id:'arquivo', label:'Arquivo de relatórios', em:'🗄️', grp:'Acompanhamento', roles:['secretaria','direcao']},
  {id:'vip', label:'Alunos VIP', em:'👑', grp:'Acompanhamento', roles:['professor','secretaria','direcao']},
  {id:'apoio', label:'Aula de apoio', em:'🤝', grp:'Acompanhamento', roles:['professor','secretaria','direcao'], badgeApoio:true},
  {id:'alertas', label:'Avisos', em:'🔔', grp:'Acompanhamento', roles:['secretaria','direcao'], badge:true},
  {id:'comunicados', label:'Comunicados', em:'📣', grp:'Acompanhamento', roles:['secretaria','direcao']},
  {id:'turmas', label:'Turmas', em:'🏫', grp:'Gestão', roles:['professor','secretaria','direcao']},
  {id:'alunos', label:'Alunos', em:'🧑\u200d🎓', grp:'Gestão', roles:['professor','secretaria','direcao']},
  {id:'dupes', label:'Limpar duplicidades', em:'🧹', grp:'Gestão', roles:['secretaria','direcao']},
  {id:'gturmas', label:'Trocar / criar turma', em:'🔄', grp:'Gestão', roles:['secretaria','direcao']},
  {id:'gestaoturmas', label:'Gestão rápida de turmas', em:'🔁', grp:'Gestão', roles:['direcao'], menu:false},
  {id:'acessos', label:'Acessos', em:'🔑', grp:'Gestão', roles:['direcao']},
  {id:'cards', label:'Cards de acesso', em:'🖨️', grp:'Gestão', roles:['secretaria','direcao']},
];
function ehProfessor(){ return S.perfil==='professor'; }
function soLeitura(){ return S.perfil==='secretaria'; }   // secretaria: leitura nas telas de SALA (chamada, testes, temas, planos)
function podeCadastro(){ return S.perfil==='secretaria' || S.perfil==='direcao'; }   // cadastro de turmas e alunos: secretaria + direção
const PERFIS={
  professor:{nome:'Professor(a)',cor:'var(--azul)',bg:'#eaf3ff'},
  secretaria:{nome:'Secretaria',cor:'var(--vermelho)',bg:'#fdeaea'},
  direcao:{nome:'Direção',cor:'#b88600',bg:'#fff8e0'}
};
let _verArquivadas=false;
function turmasVisiveis(){
  let ts=S.turmas;
  if(S.perfil==='professor'){
    const u=S.usuarios.find(u=>u.nome===S.usuario);
    ts=ts.filter(t=>t.professor===(u&&u.ensina));
  }
  if(!_verArquivadas) ts=ts.filter(t=>!t.arquivada);
  return ts;
}
let rota='painel', loginNome=null;
