// Recall offline cache (20261031193733): the app loads even without internet; cards sync when you're back online
const C = 'recall-20261031193733', SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js', 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && !k.endsWith('-img')).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET') return;
  const same = u.origin === location.origin, cdn = /cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.host);
  // card images: keep a copy so they show offline (stored by file path, since the access link changes)
  if (/supabase\.co$/.test(u.host) && u.pathname.includes('/storage/v1/object/')){
    const key = u.origin + u.pathname.replace('/object/sign/', '/object/');
    return e.respondWith(caches.open('recall-img').then(c => c.match(key).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(key, r.clone()); return r; }))));
  }
  if (!same && !cdn) return;
  if (e.request.mode === 'navigate') return e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put('index.html', cp)); return r; }).catch(() => caches.match('index.html')));
  e.respondWith(caches.match(e.request).then(hit => { const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit); return hit || net; }));
});
