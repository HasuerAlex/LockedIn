/*
 * Service Worker von LockedIn: zeigt Push-Erinnerungen an und öffnet beim Antippen die App.
 * Nachrichten kommen von Firebase Cloud Messaging als Daten-Nachricht: { data: { title, body, tag } }.
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { data: { body: event.data ? event.data.text() : '' } }
  }
  const msg = payload.data || payload.notification || {}
  event.waitUntil(
    self.registration.showNotification(msg.title || 'LockedIn', {
      body: msg.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: msg.tag || undefined,
      data: { url: self.registration.scope },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
