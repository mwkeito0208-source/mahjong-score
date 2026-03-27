const CACHE_NAME = "mahjong-score-v2";
const OFFLINE_URL = "/";

// キャッシュ対象のパターン
const CACHEABLE_PATTERNS = [
  /\/_next\/static\//,   // Next.js静的アセット（JS/CSS）
  /\/icons\//,            // アイコン
  /\/manifest\.json$/,    // PWAマニフェスト
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ナビゲーションリクエスト: network-first、失敗時はキャッシュ済みのホームにフォールバック
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // ナビゲーション成功時にキャッシュを更新
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) => cached || caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }

  // 静的アセット: cache-first
  if (CACHEABLE_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
      )
    );
    return;
  }
});
