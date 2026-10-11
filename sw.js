// WorkSync — service worker mínimo para que la plataforma se pueda instalar como app.
// Estrategia: SIEMPRE se intenta la red primero (así cada push a index.html llega
// al momento, sin reinstalar). La copia guardada solo se usa si no hay señal.
// Las llamadas al API (otro dominio) no pasan por aquí.
const CACHE = 'worksync-v1';
const BASICOS = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // API, CDNs, mapas: directo a la red
  e.respondWith(
    fetch(req).then(resp => {
      if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return resp;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('/') : undefined)))
  );
});
