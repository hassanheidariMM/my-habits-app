// ============ Service Worker — FATEH ============
const CACHE_VERSION = 'fateh-v1';
const CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// نصب — کش کردن فایل‌ها
self.addEventListener('install', function(event) {
  console.log('🔧 SW در حال نصب...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(CACHE_ASSETS).then(function() {
        console.log('✅ فایل‌ها کش شدن');
        return self.skipWaiting();
      });
    }).catch(function(err) {
      console.log('⚠️ خطا در کش:', err);
    })
  );
});

// فعال‌سازی — پاک کردن کش‌های قدیمی
self.addEventListener('activate', function(event) {
  console.log('🚀 SW فعال شد');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_VERSION;
        }).map(function(key) {
          console.log('🗑️ پاک کردن کش قدیمی:', key);
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// دریافت — استراتژی: اول کش، بعد شبکه
self.addEventListener('fetch', function(event) {
  // فقط درخواست‌های GET
  if (event.request.method !== 'GET') return;

  // برای فایل‌های همنوع (same-origin) از کش استفاده کن
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // از کش بده، ولی در پس‌زمینه آپدیت کن
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_VERSION).then(function(cache) {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(function() {});
        return cachedResponse;
      }

      // اگه در کش نبود، از شبکه بگیر
      return fetch(event.request).then(function(networkResponse) {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // ذخیره در کش
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(function() {
        // اگه شبکه هم نبود، صفحه اصلی رو بده
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// پیام‌ها (برای بروزرسانی)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker FATEH بارگذاری شد');
