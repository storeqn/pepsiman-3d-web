import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    {
      name: "offline-game",
      generateBundle(_, bundle) {
        const urls = [
          "/",
          "/index.html",
          "/manifest.webmanifest",
          "/icon-192.png",
          "/icon-512.png",
          ...["px", "py", "pz", "nx", "ny", "nz"].map(
            (f) => `/environment/${f}.png`,
          ),
          ...Object.keys(bundle).map((f) => "/" + f),
        ];
        const version = "silver-rush-" + Date.now();
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: `const CACHE=${JSON.stringify(version)};const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('silver-rush-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request,{ignoreVary:true});if(cached)return cached;try{return await fetch(e.request);}catch(err){if(e.request.mode==='navigate')return (await c.match('/index.html'))||Response.error();return Response.error();}}));});`,
        });
      },
    },
  ],
  build: { chunkSizeWarningLimit: 900 },
});
