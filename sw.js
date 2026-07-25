// sw.js — auto-desativação (migração Supabase, 2026-07-25).
// Substitui o service worker antigo: limpa os caches guardados,
// se desregistra e recarrega as abas abertas com a versão nova.
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    try{ var ks=await caches.keys(); await Promise.all(ks.map(function(k){return caches.delete(k);})); }catch(err){}
    try{ await self.registration.unregister(); }catch(err){}
    try{ var cs=await self.clients.matchAll({type:'window'}); cs.forEach(function(c){ try{ c.navigate(c.url); }catch(e){} }); }catch(err){}
  })());
});
// sem handler de 'fetch' que responda do cache → tudo vai direto pra rede (sempre fresco)
