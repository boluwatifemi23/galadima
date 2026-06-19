self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})
 
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
self.addEventListener('push', function (event) {
  let data = {
    title: 'Harmony Garden & Estate',
    body: 'New notification received',
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (error) {
      data = {
        title: 'Harmony Garden & Estate',
        body: event.data.text(),
      }
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title,
      options
    )
  )
})