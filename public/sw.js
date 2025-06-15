const CACHE_NAME = 'speakeasy-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/notification.mp3'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for reminders
self.addEventListener('sync', (event) => {
  if (event.tag === 'reminder-sync') {
    event.waitUntil(syncReminders());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'SpeakEasy Reminder',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'snooze',
        title: 'Snooze',
        icon: '/icons/snooze-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SpeakEasy Reminder', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'snooze') {
    // Handle snooze action
    console.log('Reminder snoozed');
  } else if (event.action === 'dismiss') {
    // Handle dismiss action
    console.log('Reminder dismissed');
  } else {
    // Handle notification click (open app)
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

async function syncReminders() {
  // Sync reminders with server or handle offline functionality
  console.log('Syncing reminders...');
}