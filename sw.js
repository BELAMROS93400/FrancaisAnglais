/* Service worker : met l'application en cache pour qu'elle fonctionne sans Internet.
   Changez SHELL_VERSION a chaque modification du code (html/css/js) ; DATA_CACHE quand les exercices changent
   (et la meme valeur dans js/app.js). */
const SHELL_VERSION = "eaf-shell-1.0.1-web1";
const DATA_CACHE = "eaf-data-v1";
const SHELL = [
  "./", "index.html", "manifest.webmanifest", "css/style.css", "js/engine.js", "js/store.js", "js/app.js",
  "data/meta.json", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png",
  "icons/favicon-32.png", "sounds/correct.mp3", "sounds/wrong.mp3", "sounds/win.mp3", "sounds/lose.mp3",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL_VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL_VERSION && k !== DATA_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) {
        const isData = /\/data\/(a1|a2|b1|b2|c1|c2|expert)\.json$|\/data\/(writing_tasks\.json|words\.txt)$/.test(req.url);
        const c = await caches.open(isData ? DATA_CACHE : SHELL_VERSION);
        c.put(req, res.clone());
      }
      return res;
    } catch (err) {
      if (req.mode === "navigate") { const idx = await caches.match("index.html"); if (idx) return idx; }
      throw err;
    }
  })());
});
