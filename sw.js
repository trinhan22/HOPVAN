self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Chỉ cần có file này để trình duyệt nhận diện là PWA
});