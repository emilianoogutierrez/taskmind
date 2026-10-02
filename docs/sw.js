const cacheName = 'taskmindassetsv1'
const scopePath = new URL(self.registration.scope).pathname

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName)
    const page = await fetch(scopePath)
    const html = await page.clone().text()
    await cache.put(scopePath, page)
    const paths = [...html.matchAll(/(?:src|href)="([^\"]+)"/g)]
      .map(match => new URL(match[1], self.registration.scope))
      .filter(url => url.origin === self.location.origin)
    await Promise.all(paths.map(url => cache.add(url).catch(() => undefined)))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => key !== cacheName && key.startsWith('taskmindassets')).map(key => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith((async () => {
    const cache = await caches.open(cacheName)
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request)
        if (response.ok) await cache.put(scopePath, response.clone())
        return response
      } catch {
        return await cache.match(scopePath) || Response.error()
      }
    }
    const cached = await cache.match(request)
    if (cached) return cached
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  })())
})
