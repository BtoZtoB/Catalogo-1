"use strict";
const base = self.registration.scope;
const prefijo = "catalogo-web:" + new URL(base).pathname + ":";
const nombreCache = prefijo + "652a75e53185f79c";
const urls = ["c3-ui.css", "catalogo.js", "componentes.css", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "img/empanadas.jpg", "img/kit-de-graduacion.jpg", "img/logo-ponky.png", "img/mini-rollo-de-queso.jpg", "img/pucas.jpg", "img/queque.jpg", "img/rollo-de-queso.jpg", "index.html", "mejoras/experiencia.css", "mejoras/experiencia.js", "mejoras/productos.json", "mejoras/qr-demo.svg", "pantallas.css", "pantallas.js", "ponky-datos.js", "ponky.css", "ponky.js", "responsividad.css", "style.css", "vendor/jquery-3.7.1.min.js"].map(archivo => new URL(archivo, base).href);
const permitidos = new Set(urls);
const inicio = new URL("index.html", base).href;

self.addEventListener("install", evento => {
  evento.waitUntil((async () => {
    const cache = await caches.open(nombreCache);
    await cache.addAll(urls.map(url => new Request(url, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", evento => {
  evento.waitUntil((async () => {
    const anteriores = await caches.keys();
    const ruta = encodeURIComponent(new URL(base).pathname);
    await Promise.all(anteriores.filter(nombre => nombre !== nombreCache &&
      (nombre.startsWith(prefijo) || nombre.startsWith("ponky-c3a1-" + ruta + "-") ||
       nombre.startsWith("portafolio-" + ruta + "-ferrogrill-"))).map(nombre => caches.delete(nombre)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", evento => {
  if (evento.request.method !== "GET") return;
  const url = new URL(evento.request.url);
  if (!url.href.startsWith(base)) return;
  const esInicio = evento.request.mode === "navigate" && (url.pathname === new URL(base).pathname || url.pathname === new URL(inicio).pathname);
  const urlLocal = url.origin + url.pathname;
  if (!esInicio && !permitidos.has(urlLocal)) return;
  evento.respondWith((async () => {
    const cache = await caches.open(nombreCache);
    const respuesta = await cache.match(esInicio ? inicio : urlLocal);
    return respuesta || fetch(evento.request);
  })());
});
