const C='tp-v6',F=['./','index.html','app.css','app.js','logo.png','icon-192.png','icon-512.png','apple-touch-icon.png','manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
