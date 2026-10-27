const CACHE = 'one-step-shell-v6';
// Only generic static assets. Never cache sign-in pages, API responses or user records.
const ASSETS = ['/offline.html','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-180.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(async cache => {
  for (const path of ASSETS) { const response = await fetch(path, {cache:'reload'}); if (!response.ok || response.redirected) continue; const type=response.headers.get('content-type')||''; const valid=path==='/offline.html' ? type.includes('text/html') && (await response.clone().text()).includes('name="one-step-offline" content="v2"') : type.includes('image/png'); if(valid) await cache.put(path,response); }
}).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('one-step-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' && ['/', '/demo', '/about'].includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(async()=>await caches.match('/offline.html') || Response.error()));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached=>cached || fetch(event.request)));
  }
});
