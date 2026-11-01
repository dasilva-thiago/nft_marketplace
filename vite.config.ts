import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

// Skeleton bars shared across routes
const skBar = (w: string, h: string, extra = '') =>
  `<div style="width:${w};height:${h};background:#2a2018;border-radius:4px;${extra}"></div>`;

const skNav =
  `<div style="height:64px;background:#130e0d;display:flex;align-items:center;padding:0 24px;gap:16px;border-bottom:1px solid #2a2018">` +
  `<span style="color:#f2eee8;font-weight:700;font-size:18px;opacity:.9">Kurio</span>` +
  `<div style="flex:1"></div>` +
  `<span style="color:#7a6a5a;font-size:14px">Explorar</span>` +
  `<span style="color:#7a6a5a;font-size:14px">Perfil</span>` +
  skBar('32px', '32px', 'border-radius:50%') +
  `</div>`;

const skCard = (first = false) =>
  `<div style="background:#1a1310;border-radius:12px;overflow:hidden">` +
  (first
    ? `<img src="/assets/monkey4-480.webp" alt="" fetchpriority="high" style="width:100%;aspect-ratio:1;object-fit:cover;display:block">`
    : `<div style="aspect-ratio:1;background:#2a2018"></div>`) +
  `<div style="padding:12px;display:flex;flex-direction:column;gap:8px">` +
  `<span style="display:block;width:70%;height:14px;background:#2a2018;border-radius:4px;font-size:0"> </span>` +
  `<span style="display:block;width:50%;height:12px;background:#2a2018;border-radius:4px;font-size:0"> </span>` +
  `</div></div>`;

const skHomeSkeleton =
  skNav +
  `<div style="max-width:1280px;margin:0 auto;padding:40px 24px">` +
  `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px">` +
  skCard(true) +
  Array.from({ length: 7 }, () => skCard(false)).join('') +
  `</div></div>`;

const skDetailSkeleton =
  skNav +
  `<div style="max-width:1280px;margin:0 auto;padding:40px 24px;display:grid;grid-template-columns:1fr 1fr;gap:40px">` +
  `<img src="/assets/monkey3-480.webp" alt="" fetchpriority="high" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px;display:block">` +
  `<div style="display:flex;flex-direction:column;gap:16px;padding-top:8px">` +
  `<h1 style="margin:0;font-size:24px;color:#4a3a2a;font-weight:600"> </h1>` +
  `<p style="margin:0;font-size:14px;color:#4a3a2a"> </p>` +
  skBar('80%', '14px') +
  skBar('80%', '14px') +
  `<button style="width:100px;height:40px;background:#2a2018;border:none;border-radius:8px;margin-top:16px;cursor:default;color:#4a3a2a;font-size:12px"> </button>` +
  `</div></div>`;

const skScript =
  `<script>` +
  `(function(){` +
  `var r=document.getElementById('root');` +
  `if(!r)return;` +
  `var p=location.pathname;` +
  `var isDetail=/^\\/nft\\//.test(p);` +
  `r.innerHTML=isDetail?` +
  JSON.stringify(skDetailSkeleton) +
  `:` +
  JSON.stringify(skHomeSkeleton) +
  `;` +
  `})();` +
  `</script>`;

const criticalCssPlugin: Plugin = {
  name: 'critical-css',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const critical =
        `<style>` +
        `:root{--color-bg:#100d0c;--color-text:#f2eee8;background:var(--color-bg);color:var(--color-text);font-family:'Space Grotesk',system-ui,sans-serif}` +
        `@media(prefers-color-scheme:light){:root:not([data-theme=dark]){--color-bg:#f7f3ef;--color-text:#1a1310}}` +
        `:root[data-theme=light]{--color-bg:#f7f3ef;--color-text:#1a1310}` +
        `body{margin:0;min-height:100vh;background:var(--color-bg)}` +
        `#root{min-height:100vh;background:var(--color-bg)}` +
        `@keyframes sk-pulse{0%,100%{opacity:.6}50%{opacity:1}}` +
        `#root>div>div>div{animation:sk-pulse 1.4s ease-in-out infinite}` +
        `</style>`;
      return html
        .replace('<div id="root"></div>', `<div id="root"></div>${skScript}`)
        .replace('</head>', `${critical}\n  </head>`)
        .replace(
          /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
          `<link rel="preload" as="style" crossorigin href="$1" onload="this.onload=null;this.rel='stylesheet'">\n    <noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`,
        );
    },
  },
};

export default defineConfig({
  plugins: [react(), criticalCssPlugin],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          const nm = id.replace(/\\/g, '/');
          // React ecosystem (keep together to avoid scheduler issues)
          if (
            nm.includes('/react-dom/') ||
            nm.includes('/react/index') ||
            nm.includes('/react/cjs') ||
            nm.includes('/scheduler/') ||
            nm.includes('/react-is/') ||
            nm.includes('use-sync-external-store')
          )
            return 'vendor-react';
          // TanStack — ALL sub-packages together
          if (nm.includes('@tanstack/')) return 'vendor-tanstack';
          // Validation
          if (nm.includes('/zod/') || nm.includes('/zod@')) return 'vendor-zod';
          // HTTP client
          if (
            nm.includes('/axios/') ||
            nm.includes('follow-redirects') ||
            nm.includes('proxy-from-env')
          )
            return 'vendor-axios';
          // Font files: let Vite handle them through CSS pipeline
          if (nm.includes('@fontsource/')) return;
          // MSW, socket.io, tldts (all variants) — keep in lazy-loaded chunks (NOT critical path)
          if (
            nm.includes('/msw/') ||
            nm.includes('@mswjs') ||
            nm.includes('socket.io') ||
            nm.includes('engine.io') ||
            nm.includes('@socket.io/') ||
            nm.match(/\/tldts/)
          )
            return;
          // Icons
          if (nm.includes('/lucide-react/') || nm.includes('/lucide-react@'))
            return 'vendor-lucide';
          // Small UI utilities that are definitely in the sync critical path
          if (
            nm.includes('/clsx/') ||
            nm.includes('/clsx@') ||
            nm.includes('tailwind-merge') ||
            nm.includes('class-variance-authority') ||
            nm.includes('/big.js/') ||
            nm.includes('/big.js@')
          )
            return 'vendor-misc';
          // Everything else: don't override (let Rollup bundle with importer)
          return;
        },
      },
    },
  },
});
