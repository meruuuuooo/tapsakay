const { createHash } = require('node:crypto');
const { readdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join, relative, sep } = require('node:path');

const dist = join(__dirname, '..', 'dist');

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

const files = filesIn(dist)
  .filter((file) => !file.endsWith('sw.js') && !file.endsWith('+not-found.html') && !file.endsWith('_sitemap.html') && !file.endsWith('.routes.json'))
  .sort();
const urls = files.map((file) => '/' + relative(dist, file).split(sep).join('/'));
const version = createHash('sha256');
for (const file of files) {
  version.update(relative(dist, file));
  version.update(readFileSync(file));
}

const cacheName = `tapsakay-${version.digest('hex').slice(0, 16)}`;
writeFileSync(join(dist, 'sw.js'), `
const CACHE_NAME = ${JSON.stringify(cacheName)};
const APP_FILES = ${JSON.stringify(urls)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((name) => name.startsWith('tapsakay-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name))
  )));
});

self.addEventListener('fetch', (event) => {
  const pathname = new URL(event.request.url).pathname;
  if (['/api', '/sanctum', '/email'].some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))) return;
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
`);

console.log(`PWA service worker ready: ${urls.length} local files cached.`);
