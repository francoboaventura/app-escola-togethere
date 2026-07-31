/* PWA: registra o service worker (offline + instalável) */
function mostrarAtualizacao(){
  if(document.getElementById('updBanner')) return;
  var b=document.createElement('div');
  b.id='updBanner';
  b.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;background:var(--azul);color:#fff;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 26px rgba(0,0,0,.28);font-size:.92rem;max-width:560px;margin:0 auto';
  b.innerHTML='<span style="flex:1">✨ <b>Nova versão disponível.</b></span>'+
    '<button onclick="location.reload()" style="background:var(--amarelo);color:#1a1a1a;border:none;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer">Atualizar</button>'+
    '<button onclick="var e=document.getElementById(\'updBanner\');if(e)e.remove()" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);border-radius:10px;padding:8px 10px;cursor:pointer">Depois</button>';
  document.body.appendChild(b);
}
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    (function(){ try{ if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations){ navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){}); } if(window.caches&&caches.keys){ caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});}).catch(function(){}); } }catch(e){} return Promise.resolve({update:function(){},addEventListener:function(){}}); })().then(function(reg){
      try{ reg.update(); }catch(e){}
      setInterval(function(){ try{ reg.update(); }catch(e){} }, 60*60*1000);   // checa de hora em hora (sessões abertas o dia todo)
      reg.addEventListener('updatefound', function(){
        var nw=reg.installing; if(!nw) return;
        nw.addEventListener('statechange', function(){
          if(nw.state==='installed' && navigator.serviceWorker.controller){ mostrarAtualizacao(); }  // 'installed' + já há controlador = atualização (não 1ª instalação)
        });
      });
    }).catch(function(){});
  });
}

























