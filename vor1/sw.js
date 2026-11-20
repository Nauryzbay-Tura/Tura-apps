/* TURA VOR×1 — service worker: офлайн-работа и кэш распознавания лица */
const VERSION = 'vor1-1.2.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './qrcode.js', './icon-180.png', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];
const CDN_HOSTS = ['cdn.jsdelivr.net', 'storage.googleapis.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'vor1-cdn').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin === self.location.origin){
    // приложение: сначала сеть (чтобы обновления доходили), без сети — кэш
    e.respondWith(fetch(req).then(res => {
      if(res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch:true}).then(r => r || caches.match('./index.html'))));
    return;
  }
  if(CDN_HOSTS.includes(url.hostname)){
    // версионированные файлы MediaPipe, модель и шрифты: сначала кэш
    e.respondWith(caches.open('vor1-cdn').then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if(res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }))));
  }
});
