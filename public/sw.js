/* TaskTango service worker: caches the static app shell only.
   User data lives in localStorage and no dynamic or cross-origin response is ever cached. */
const CACHE = 'tasktango-shell-v2'
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const isStatic = (url) =>
  url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || /\.(woff2?|svg|png|webmanifest)$/.test(url.pathname)

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Page loads: network first so deploys show up, cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // The page is a static shell (all user data lives in localStorage), so keep it fresh for offline use.
          if (res.ok && url.pathname === '/') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put('/', copy))
          }
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Fingerprinted static files: cache first.
  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok && res.type === 'basic') {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
