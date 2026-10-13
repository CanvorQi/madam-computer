/*
 * Madam Bilgisayar - Service Worker
 * Uygulama kabuğunu (HTML/CSS/JS/ikonlar) önbelleğe alır; KaTeX ve Google Fonts dosyaları
 * ilk kullanımda önbelleğe girer. Böylece bir kez açılan uygulama internetsiz de çalışır.
 * Dosyaları değiştirdikten sonra CACHE_NAME sürümünü artır ki kullanıcılar yeni sürümü alsın.
 */
const CACHE_PREFIX = "madam-cs-";
const CACHE_NAME = CACHE_PREFIX + "v4";
const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css",
    "./js/logic.js",
    "./js/widgets.js",
    "./js/cpu.js",
    "./js/content/mantik.js",
    "./js/content/mantik-testler.js",
    "./js/app.js",
    "./icons/icon.svg",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png",
];
const CDN_HOSTS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
            // Tek bir dosya eksik olsa bile service worker kurulsun
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    // Yalnızca bu uygulamanın eski önbelleklerini sil (aynı alan adındaki Madam Matematik'e dokunma)
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin && !CDN_HOSTS.includes(url.hostname)) return;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            const fromNetwork = () => fetch(event.request).then((res) => {
                if (res && (res.ok || res.type === "opaque")) cache.put(event.request, res.clone());
                return res;
            });
            if (sameOrigin) {
                // Kendi dosyalarımız: önce ağ (güncel sürüm), internet yoksa önbellek
                return fromNetwork().catch(() =>
                    cache.match(event.request, { ignoreSearch: true }).then((c) => c || cache.match("./index.html"))
                );
            }
            // CDN (KaTeX, fontlar): sürümlü ve değişmez dosyalar, önce önbellek
            return cache.match(event.request).then((c) => c || fromNetwork());
        })
    );
});
