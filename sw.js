/* Service worker — بيخزّن ملفات الواجهة بس (مش بيانات المنيو).
   بيانات المنيو بتتخزن في localStorage وبتتحدّث برقم الإصدار، فمفيش خطر أسعار قديمة من هنا.
   غيّر VERSION مع كل رفع جديد للواجهة على GitHub. */
const VERSION = "menu-zamzam-v2.2.1";
const SHELL = [
  "./", "index.html", "app.js", "data.js", "config.js", "sample-menu.js", "admin.html", "admin.js", "dev.html", "devpage.js", "qr.js", "excel.js", "templates/menu-template.xlsx",
  "manifest.webmanifest", "assets/urcod-logo.jpg",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== VERSION + "-cdn").map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  /* Firestore / Auth / أي API: سيبها للشبكة على طول */
  if (/^(firestore|identitytoolkit|securetoken|firebaseinstallations)\.googleapis\.com$|firebaseio\.com$/.test(url.hostname)) return;

  /* ملفات الموقع نفسه: من الكاش فورًا، وتحديثه في الخلفية */
  if (url.origin === location.origin) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  /* الخطوط ومكتبة Firebase من الـ CDN: كاش بعد أول تحميل */
  if (/fonts\.(googleapis|gstatic)\.com$|www\.gstatic\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VERSION + "-cdn").then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const r = await fetch(e.request); if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r;
    }));
  }
});
