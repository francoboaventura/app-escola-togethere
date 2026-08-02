/* ---- ACESSOS (somente direção) ---- */
VIEWS.acessos=()=>{
  const v=document.getElementById('view');
  const rotulo={direcao:'Direção',professor:'Professor(a)',secretaria:'Secretaria'};
  const _contAl={}; (S.alunos||[]).forEach(a=>{ if(!a.arquivado) _contAl[a.turmaId]=(_contAl[a.turmaId]||0)+1; });
  const _optsTurmasAlunos=(S.turmas||[]).slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''))).map(t=>`<option value="${escAttr(t.id)}">${esc(t.nome)} — ${_contAl[t.id]||0} aluno(s)</option>`).join('');
  v.innerHTML=`<div class="section-title"><span class="feijao fj" style="background:var(--marinho)"></span><h2 class="display">Acessos e senhas</h2></div>
    <p class="sub">Defina ou troque as senhas da equipe. As senhas ficam guardadas com segurança (hash) no servidor — não no aparelho.</p>
    <div class="card"><h3>Usuários</h3><p class="hint">Digite uma nova senha (mín. 4 caracteres) e toque em <b>Salvar</b>. Use isto também para liberar quem ainda não tem senha.</p>
    <table><thead><tr><th>Usuário</th><th>Perfil</th><th>Nova senha</th><th></th></tr></thead><tbody>
    ${S.usuarios.map((u,i)=>`<tr>
      <td><b>${u.nome}</b></td>
      <td><span class="pill">${rotulo[u.perfil]}</span></td>
      <td><input type="text" id="sn_${i}" placeholder="nova senha" style="max-width:160px"></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn sm" onclick="salvarSenha(${i})">Salvar</button>
      </td></tr>`).join('')}
    </tbody></table></div>
    <div class="card"><h3>+ Novo usuário</h3><div class="row">
      <div><label class="lbl">Nome de acesso</label><input type="text" id="nuNome" placeholder="Ex: Ana"></div>
      <div><label class="lbl">Perfil</label><select id="nuPerfil"><option value="professor">Professor(a)</option><option value="secretaria">Secretaria</option><option value="direcao">Direção</option></select></div>
      <div><label class="lbl">Professor da turma (opcional)</label><input type="text" id="nuEnsina" placeholder="Nome usado nas turmas"></div>
    </div>
    <div class="field" style="margin-top:12px;max-width:260px"><label class="lbl">Senha inicial</label><input type="text" id="nuSenha" placeholder="mín. 4 caracteres"></div>
    <div style="margin-top:12px"><button class="btn" onclick="addUsuario()">Criar usuário</button></div></div>
    <div class="card"><h3>🔑 Logins do portal do aluno</h3>
      <p class="hint">Cria os acessos do <b>portal do aluno</b> (onde as famílias veem a ficha do aluno). Escolha a turma e toque em <b>Criar logins</b> — quem já tem login é pulado. As senhas aparecem <b>só uma vez</b>: toque em <b>Gerar cards</b> no resultado (ou use a aba <b>Cards de acesso</b>) para imprimir e colar nos livros.</p>
      <div class="row" style="align-items:flex-end">
        <div style="min-width:200px;flex:1"><label class="lbl">Turma</label><select id="alSelTurma">${_optsTurmasAlunos}</select></div>
        <button class="btn" id="alBtnCriar" onclick="criarLoginsAlunos()">Criar logins da turma</button>
      </div>
      <div id="alStatus" class="hint" style="margin-top:10px"></div>
      <div id="alResultado" style="overflow-x:auto"></div>
    </div>
    <div class="card"><h3>🔁 Forçar troca de senha (turma)</h3>
      <p class="hint">Faz todos os alunos da turma <b>criarem uma senha nova no próximo acesso</b>. Eles continuam entrando com a senha atual (do card) e definem a nova ao entrar — sem invalidar os cards já impressos. Útil para as turmas criadas antes dessa função existir.</p>
      <div class="row" style="align-items:flex-end">
        <div style="min-width:200px;flex:1"><label class="lbl">Turma</label><select id="ftSelTurma">${_optsTurmasAlunos}</select></div>
        <button class="btn" id="ftBtn" onclick="forcarTrocaTurma()">Forçar troca da turma</button>
      </div>
      <div id="ftStatus" class="hint" style="margin-top:10px"></div>
    </div>
    <div class="card"><h3>Assinatura e e-mail da escola</h3><p class="hint">Usados no relatório enviado às famílias. O e-mail é o remetente/cópia da escola.</p>
      <div class="field"><label class="lbl">E-mail da escola (remetente)</label><input type="email" id="cfgEmail" value="${escAttr((S.config&&S.config.escolaEmail)||'')}" placeholder="inglestogethere@gmail.com"></div>
      <div class="field"><label class="lbl">Assinatura</label><textarea id="cfgAssin" placeholder="— Equipe Togethere">${escAttr((S.config&&S.config.assinatura)||'')}</textarea></div>
      <button class="btn" onclick="salvarConfig()">Salvar assinatura</button></div>
    <div class="card"><h3>Backup dos dados</h3><p class="hint">Baixe uma cópia de segurança (arquivo .json) ou restaure os dados a partir de um backup.</p>
      <div class="row">
        <button class="btn" onclick="exportarBackup()">⬇️ Baixar backup agora</button>
        <button class="btn ghost" onclick="document.getElementById('impFile').click()">⬆️ Restaurar de um arquivo</button>
      </div>
      <input type="file" id="impFile" accept="application/json,.json" style="display:none" onchange="importarBackup(this)">
      <p class="hint" style="margin-top:10px">Guarde o arquivo no seu computador ou no Drive. Restaurar <b>substitui</b> todos os dados atuais.</p>
    </div>`;
};
function salvarConfig(){
  S.config=S.config||{};
  S.config.escolaEmail=(document.getElementById('cfgEmail').value||'').trim();
  S.config.assinatura=document.getElementById('cfgAssin').value;
  save(); toast('Assinatura salva');
}
function exportarBackup(){
  const dados=JSON.stringify(Object.assign({},S,{usuario:null,perfil:null}));
  const blob=new Blob([dados],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='backup-togethere-'+hoje()+'.json';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},200);
  toast('Backup baixado');
}
function importarBackup(input){
  const f=input.files&&input.files[0]; if(!f){return;}
  const r=new FileReader();
  r.onload=function(){
    let obj;
    try{ obj=JSON.parse(r.result); }catch(e){ toast('Arquivo inválido (não é um backup válido)'); return; }
    if(!obj || !obj.usuarios || !obj.alunos){ toast('Arquivo não parece um backup do app'); return; }
    if(!confirm('Isto vai SUBSTITUIR todos os dados atuais pelos do backup. Deseja continuar?')) return;
    S=migrar(obj); S.usuario=null; S.perfil=null;
    localStorage.setItem(KEY, JSON.stringify(S));
    toast('Restaurando…');
    cloudPut(true).then(function(){ location.reload(); });
  };
  r.readAsText(f); input.value='';
}
async function salvarSenha(i){
  const nova=(document.getElementById('sn_'+i).value||'').trim();
  if(nova.length<4)return toast('A senha precisa ter ao menos 4 caracteres');
  const alvo=S.usuarios[i].nome;
  const r=await cloudResetarSenha(alvo, nova);
  if(r && r.ok){ const inp=document.getElementById('sn_'+i); if(inp) inp.value=''; toast('Senha definida para '+alvo); }
  else if(r && r.erro==='permissao'){ toast('Apenas a direção pode redefinir senhas'); }
  else if(r && r.erro==='sessao'){ toast('Sessão expirada. Saia e entre novamente.'); }
  else if(r && r.erro==='dados'){ toast('Senha muito curta'); }
  else { toast('Não foi possível salvar agora. Tente de novo.'); }
}
function addUsuario(){
  const nome=document.getElementById('nuNome').value.trim();
  const senha=(document.getElementById('nuSenha').value||'').trim();
  if(!nome)return toast('Dê um nome de acesso');
  if(senha.length<4)return toast('Defina uma senha inicial (mín. 4 caracteres)');
  if(S.usuarios.some(u=>u.nome.toLowerCase()===nome.toLowerCase()))return toast('Já existe um usuário com esse nome');
  const perfil=document.getElementById('nuPerfil').value;
  const ensina=document.getElementById('nuEnsina').value.trim()||null;
  S.usuarios.push({nome,perfil,ensina,atualizadoEm:Date.now()});
  save();
  cloudResetarSenha(nome, senha).then(r=>{
    if(r && r.ok) toast('Usuário criado e senha definida');
    else toast('Usuário criado, mas defina a senha pela linha dele (botão Salvar)');
    VIEWS.acessos();
  });
}
