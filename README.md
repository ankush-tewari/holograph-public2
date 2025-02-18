This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```
holograph
├─ .next
│  ├─ app-build-manifest.json
│  ├─ build
│  │  └─ chunks
│  │     ├─ [root of the server]__05f88b._.js
│  │     ├─ [root of the server]__05f88b._.js.map
│  │     ├─ [root of the server]__fd836e._.js
│  │     ├─ [root of the server]__fd836e._.js.map
│  │     ├─ [turbopack]_runtime.js
│  │     ├─ [turbopack]_runtime.js.map
│  │     ├─ postcss_config_mjs_transform_ts_89c7e7._.js
│  │     └─ postcss_config_mjs_transform_ts_89c7e7._.js.map
│  ├─ build-manifest.json
│  ├─ cache
│  │  └─ .rscinfo
│  ├─ fallback-build-manifest.json
│  ├─ package.json
│  ├─ react-loadable-manifest.json
│  ├─ server
│  │  ├─ app
│  │  │  ├─ _not-found
│  │  │  │  ├─ page
│  │  │  │  │  ├─ app-build-manifest.json
│  │  │  │  │  ├─ app-paths-manifest.json
│  │  │  │  │  ├─ build-manifest.json
│  │  │  │  │  ├─ next-font-manifest.json
│  │  │  │  │  ├─ react-loadable-manifest.json
│  │  │  │  │  └─ server-reference-manifest.json
│  │  │  │  ├─ page.js
│  │  │  │  ├─ page.js.map
│  │  │  │  └─ page_client-reference-manifest.js
│  │  │  ├─ api
│  │  │  │  └─ auth
│  │  │  │     ├─ login
│  │  │  │     │  ├─ route
│  │  │  │     │  │  ├─ app-build-manifest.json
│  │  │  │     │  │  ├─ app-paths-manifest.json
│  │  │  │     │  │  ├─ build-manifest.json
│  │  │  │     │  │  ├─ next-font-manifest.json
│  │  │  │     │  │  ├─ react-loadable-manifest.json
│  │  │  │     │  │  └─ server-reference-manifest.json
│  │  │  │     │  ├─ route.js
│  │  │  │     │  ├─ route.js.map
│  │  │  │     │  └─ route_client-reference-manifest.js
│  │  │  │     ├─ logout
│  │  │  │     │  ├─ route
│  │  │  │     │  │  ├─ app-build-manifest.json
│  │  │  │     │  │  ├─ app-paths-manifest.json
│  │  │  │     │  │  ├─ build-manifest.json
│  │  │  │     │  │  ├─ next-font-manifest.json
│  │  │  │     │  │  ├─ react-loadable-manifest.json
│  │  │  │     │  │  └─ server-reference-manifest.json
│  │  │  │     │  ├─ route.js
│  │  │  │     │  ├─ route.js.map
│  │  │  │     │  └─ route_client-reference-manifest.js
│  │  │  │     ├─ register
│  │  │  │     │  ├─ route
│  │  │  │     │  │  ├─ app-build-manifest.json
│  │  │  │     │  │  ├─ app-paths-manifest.json
│  │  │  │     │  │  ├─ build-manifest.json
│  │  │  │     │  │  ├─ next-font-manifest.json
│  │  │  │     │  │  ├─ react-loadable-manifest.json
│  │  │  │     │  │  └─ server-reference-manifest.json
│  │  │  │     │  ├─ route.js
│  │  │  │     │  ├─ route.js.map
│  │  │  │     │  └─ route_client-reference-manifest.js
│  │  │  │     └─ user
│  │  │  │        ├─ route
│  │  │  │        │  ├─ app-build-manifest.json
│  │  │  │        │  ├─ app-paths-manifest.json
│  │  │  │        │  ├─ build-manifest.json
│  │  │  │        │  ├─ next-font-manifest.json
│  │  │  │        │  ├─ react-loadable-manifest.json
│  │  │  │        │  └─ server-reference-manifest.json
│  │  │  │        ├─ route.js
│  │  │  │        ├─ route.js.map
│  │  │  │        └─ route_client-reference-manifest.js
│  │  │  ├─ dashboard
│  │  │  │  ├─ page
│  │  │  │  │  ├─ app-build-manifest.json
│  │  │  │  │  ├─ app-paths-manifest.json
│  │  │  │  │  ├─ build-manifest.json
│  │  │  │  │  ├─ next-font-manifest.json
│  │  │  │  │  ├─ react-loadable-manifest.json
│  │  │  │  │  └─ server-reference-manifest.json
│  │  │  │  ├─ page.js
│  │  │  │  ├─ page.js.map
│  │  │  │  └─ page_client-reference-manifest.js
│  │  │  ├─ favicon.ico
│  │  │  │  ├─ route
│  │  │  │  │  ├─ app-paths-manifest.json
│  │  │  │  │  ├─ next-font-manifest.json
│  │  │  │  │  └─ react-loadable-manifest.json
│  │  │  │  ├─ route.js
│  │  │  │  └─ route.js.map
│  │  │  ├─ login
│  │  │  │  ├─ page
│  │  │  │  │  ├─ app-build-manifest.json
│  │  │  │  │  ├─ app-paths-manifest.json
│  │  │  │  │  ├─ build-manifest.json
│  │  │  │  │  ├─ next-font-manifest.json
│  │  │  │  │  ├─ react-loadable-manifest.json
│  │  │  │  │  └─ server-reference-manifest.json
│  │  │  │  ├─ page.js
│  │  │  │  ├─ page.js.map
│  │  │  │  └─ page_client-reference-manifest.js
│  │  │  ├─ page
│  │  │  │  ├─ app-build-manifest.json
│  │  │  │  ├─ app-paths-manifest.json
│  │  │  │  ├─ build-manifest.json
│  │  │  │  ├─ next-font-manifest.json
│  │  │  │  ├─ react-loadable-manifest.json
│  │  │  │  └─ server-reference-manifest.json
│  │  │  ├─ page.js
│  │  │  ├─ page.js.map
│  │  │  ├─ page_client-reference-manifest.js
│  │  │  └─ register
│  │  │     ├─ page
│  │  │     │  ├─ app-build-manifest.json
│  │  │     │  ├─ app-paths-manifest.json
│  │  │     │  ├─ build-manifest.json
│  │  │     │  ├─ next-font-manifest.json
│  │  │     │  ├─ react-loadable-manifest.json
│  │  │     │  └─ server-reference-manifest.json
│  │  │     ├─ page.js
│  │  │     ├─ page.js.map
│  │  │     └─ page_client-reference-manifest.js
│  │  ├─ app-paths-manifest.json
│  │  ├─ chunks
│  │  │  ├─ [root of the server]__253018._.js
│  │  │  ├─ [root of the server]__253018._.js.map
│  │  │  ├─ [root of the server]__2b49a4._.js
│  │  │  ├─ [root of the server]__2b49a4._.js.map
│  │  │  ├─ [root of the server]__427628._.js
│  │  │  ├─ [root of the server]__427628._.js.map
│  │  │  ├─ [root of the server]__890a2d._.js
│  │  │  ├─ [root of the server]__890a2d._.js.map
│  │  │  ├─ [root of the server]__b18f30._.js
│  │  │  ├─ [root of the server]__b18f30._.js.map
│  │  │  ├─ [root of the server]__d176c2._.js
│  │  │  ├─ [root of the server]__d176c2._.js.map
│  │  │  ├─ [root of the server]__fad775._.js
│  │  │  ├─ [root of the server]__fad775._.js.map
│  │  │  ├─ [turbopack]_runtime.js
│  │  │  ├─ [turbopack]_runtime.js.map
│  │  │  ├─ _1d39b1._.js
│  │  │  ├─ _1d39b1._.js.map
│  │  │  ├─ _5cc4bb._.js
│  │  │  ├─ _5cc4bb._.js.map
│  │  │  ├─ _c63f35._.js
│  │  │  ├─ _c63f35._.js.map
│  │  │  ├─ _cb53d6._.js
│  │  │  ├─ _cb53d6._.js.map
│  │  │  └─ ssr
│  │  │     ├─ [next]_internal_font_google_geist_e531dabc_module_b52d8e.css
│  │  │     ├─ [next]_internal_font_google_geist_e531dabc_module_b52d8e.css.map
│  │  │     ├─ [next]_internal_font_google_geist_mono_68a01160_module_b52d8e.css
│  │  │     ├─ [next]_internal_font_google_geist_mono_68a01160_module_b52d8e.css.map
│  │  │     ├─ [root of the server]__0702e5._.js
│  │  │     ├─ [root of the server]__0702e5._.js.map
│  │  │     ├─ [root of the server]__0a905c._.js
│  │  │     ├─ [root of the server]__0a905c._.js.map
│  │  │     ├─ [root of the server]__1365a7._.js
│  │  │     ├─ [root of the server]__1365a7._.js.map
│  │  │     ├─ [root of the server]__3d6cd8._.js
│  │  │     ├─ [root of the server]__3d6cd8._.js.map
│  │  │     ├─ [root of the server]__51f148._.js
│  │  │     ├─ [root of the server]__51f148._.js.map
│  │  │     ├─ [root of the server]__592060._.js
│  │  │     ├─ [root of the server]__592060._.js.map
│  │  │     ├─ [root of the server]__5df83f._.js
│  │  │     ├─ [root of the server]__5df83f._.js.map
│  │  │     ├─ [root of the server]__688d87._.js
│  │  │     ├─ [root of the server]__688d87._.js.map
│  │  │     ├─ [root of the server]__86e789._.js
│  │  │     ├─ [root of the server]__86e789._.js.map
│  │  │     ├─ [root of the server]__8bce3c._.js
│  │  │     ├─ [root of the server]__8bce3c._.js.map
│  │  │     ├─ [root of the server]__8ebb6d._.css
│  │  │     ├─ [root of the server]__8ebb6d._.css.map
│  │  │     ├─ [root of the server]__c171d5._.js
│  │  │     ├─ [root of the server]__c171d5._.js.map
│  │  │     ├─ [root of the server]__dad040._.js
│  │  │     ├─ [root of the server]__dad040._.js.map
│  │  │     ├─ [root of the server]__e237d7._.js
│  │  │     ├─ [root of the server]__e237d7._.js.map
│  │  │     ├─ [root of the server]__f73aa8._.js
│  │  │     ├─ [root of the server]__f73aa8._.js.map
│  │  │     ├─ [turbopack]_runtime.js
│  │  │     ├─ [turbopack]_runtime.js.map
│  │  │     ├─ _6384b7._.js
│  │  │     ├─ _6384b7._.js.map
│  │  │     ├─ _aa6a8b._.js
│  │  │     ├─ _aa6a8b._.js.map
│  │  │     ├─ _b13560._.js
│  │  │     ├─ _b13560._.js.map
│  │  │     ├─ _bd4a5d._.js
│  │  │     ├─ _bd4a5d._.js.map
│  │  │     ├─ _d34f58._.js
│  │  │     ├─ _d34f58._.js.map
│  │  │     ├─ _d5c2a2._.js
│  │  │     ├─ _d5c2a2._.js.map
│  │  │     ├─ _e667d2._.js
│  │  │     ├─ _e667d2._.js.map
│  │  │     ├─ src_app_896cde._.js
│  │  │     ├─ src_app_896cde._.js.map
│  │  │     ├─ src_app_dashboard_page_tsx_610b24._.js
│  │  │     ├─ src_app_dashboard_page_tsx_610b24._.js.map
│  │  │     ├─ src_app_globals_b52d8e.css
│  │  │     ├─ src_app_globals_b52d8e.css.map
│  │  │     ├─ src_app_login_page_tsx_e3f5a2._.js
│  │  │     ├─ src_app_login_page_tsx_e3f5a2._.js.map
│  │  │     ├─ src_app_register_page_tsx_1e0a74._.js
│  │  │     └─ src_app_register_page_tsx_1e0a74._.js.map
│  │  ├─ interception-route-rewrite-manifest.js
│  │  ├─ middleware-build-manifest.js
│  │  ├─ middleware-manifest.json
│  │  ├─ middleware-react-loadable-manifest.js
│  │  ├─ next-font-manifest.js
│  │  ├─ next-font-manifest.json
│  │  ├─ pages
│  │  │  ├─ _app
│  │  │  │  ├─ build-manifest.json
│  │  │  │  ├─ next-font-manifest.json
│  │  │  │  ├─ pages-manifest.json
│  │  │  │  └─ react-loadable-manifest.json
│  │  │  ├─ _app.js
│  │  │  ├─ _app.js.map
│  │  │  ├─ _document
│  │  │  │  ├─ next-font-manifest.json
│  │  │  │  ├─ pages-manifest.json
│  │  │  │  └─ react-loadable-manifest.json
│  │  │  ├─ _document.js
│  │  │  ├─ _document.js.map
│  │  │  ├─ _error
│  │  │  │  ├─ build-manifest.json
│  │  │  │  ├─ next-font-manifest.json
│  │  │  │  ├─ pages-manifest.json
│  │  │  │  └─ react-loadable-manifest.json
│  │  │  ├─ _error.js
│  │  │  └─ _error.js.map
│  │  ├─ pages-manifest.json
│  │  ├─ server-reference-manifest.js
│  │  └─ server-reference-manifest.json
│  ├─ static
│  │  ├─ chunks
│  │  │  ├─ [next]_internal_font_google_geist_e531dabc_module_b52d8e.css
│  │  │  ├─ [next]_internal_font_google_geist_e531dabc_module_b52d8e.css.map
│  │  │  ├─ [next]_internal_font_google_geist_mono_68a01160_module_b52d8e.css
│  │  │  ├─ [next]_internal_font_google_geist_mono_68a01160_module_b52d8e.css.map
│  │  │  ├─ [root of the server]__2e1cf5._.js
│  │  │  ├─ [root of the server]__2e1cf5._.js.map
│  │  │  ├─ [root of the server]__31723f._.js
│  │  │  ├─ [root of the server]__31723f._.js.map
│  │  │  ├─ [root of the server]__8ebb6d._.css
│  │  │  ├─ [root of the server]__8ebb6d._.css.map
│  │  │  ├─ [root of the server]__f265a1._.js
│  │  │  ├─ [root of the server]__f265a1._.js.map
│  │  │  ├─ [root of the server]__f81d50._.js
│  │  │  ├─ [root of the server]__f81d50._.js.map
│  │  │  ├─ [turbopack]_browser_dev_hmr-client_d6d8d4._.js
│  │  │  ├─ [turbopack]_browser_dev_hmr-client_d6d8d4._.js.map
│  │  │  ├─ [turbopack]_browser_dev_hmr-client_hmr-client_ts_8e6352._.js
│  │  │  ├─ [turbopack]_browser_dev_hmr-client_hmr-client_ts_d0a96d._.js
│  │  │  ├─ [turbopack]_browser_dev_hmr-client_hmr-client_ts_d0a96d._.js.map
│  │  │  ├─ _0c9a08._.js
│  │  │  ├─ _0c9a08._.js.map
│  │  │  ├─ _783bcf._.js
│  │  │  ├─ _783bcf._.js.map
│  │  │  ├─ _98050b._.js
│  │  │  ├─ _98050b._.js.map
│  │  │  ├─ _a91c21._.js
│  │  │  ├─ _a91c21._.js.map
│  │  │  ├─ _d38100._.js
│  │  │  ├─ _d38100._.js.map
│  │  │  ├─ _d95469._.js
│  │  │  ├─ _d95469._.js.map
│  │  │  ├─ _e69f0d._.js
│  │  │  ├─ _fe6b60._.js
│  │  │  ├─ _fe6b60._.js.map
│  │  │  ├─ pages
│  │  │  │  ├─ _app.js
│  │  │  │  └─ _error.js
│  │  │  ├─ pages__app_5771e1._.js
│  │  │  ├─ pages__app_f2320d._.js
│  │  │  ├─ pages__app_f2320d._.js.map
│  │  │  ├─ pages__error_5771e1._.js
│  │  │  ├─ pages__error_b8c4c3._.js
│  │  │  ├─ pages__error_b8c4c3._.js.map
│  │  │  ├─ src_app_dashboard_page_tsx_36054f._.js
│  │  │  ├─ src_app_dashboard_page_tsx_5b2001._.js
│  │  │  ├─ src_app_dashboard_page_tsx_5b2001._.js.map
│  │  │  ├─ src_app_dashboard_page_tsx_e12b08._.js
│  │  │  ├─ src_app_favicon_ico_mjs_ddfdf0._.js
│  │  │  ├─ src_app_globals_b52d8e.css
│  │  │  ├─ src_app_globals_b52d8e.css.map
│  │  │  ├─ src_app_layout_tsx_20a9fc._.js
│  │  │  ├─ src_app_layout_tsx_20a9fc._.js.map
│  │  │  ├─ src_app_layout_tsx_61af54._.js
│  │  │  ├─ src_app_login_page_tsx_36054f._.js
│  │  │  ├─ src_app_login_page_tsx_9ae2fd._.js
│  │  │  ├─ src_app_login_page_tsx_9ae2fd._.js.map
│  │  │  ├─ src_app_login_page_tsx_e12b08._.js
│  │  │  ├─ src_app_page_tsx_36054f._.js
│  │  │  ├─ src_app_page_tsx_61af54._.js
│  │  │  ├─ src_app_page_tsx_8b213b._.js
│  │  │  ├─ src_app_page_tsx_8b213b._.js.map
│  │  │  ├─ src_app_page_tsx_e12b08._.js
│  │  │  ├─ src_app_register_page_tsx_36054f._.js
│  │  │  ├─ src_app_register_page_tsx_d0c14f._.js
│  │  │  ├─ src_app_register_page_tsx_d0c14f._.js.map
│  │  │  └─ src_app_register_page_tsx_e12b08._.js
│  │  ├─ development
│  │  │  ├─ _buildManifest.js
│  │  │  ├─ _clientMiddlewareManifest.json
│  │  │  └─ _ssgManifest.js
│  │  └─ media
│  │     ├─ favicon.45db1c09.ico
│  │     ├─ gyByhwUxId8gMEwSGFWNOITddY4-s.81df3a5b.woff2
│  │     ├─ gyByhwUxId8gMEwcGFWNOITd-s.p.da1ebef7.woff2
│  │     ├─ or3nQ6H_1_WfwkMZI_qYFrcdmhHkjko-s.p.be19f591.woff2
│  │     └─ or3nQ6H_1_WfwkMZI_qYFrkdmhHkjkotbA-s.e32db976.woff2
│  ├─ trace
│  ├─ transform.js
│  ├─ transform.js.map
│  └─ types
├─ README.md
├─ eslint.config.mjs
├─ holograph-project-overview.md
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ prisma
│  ├─ migrations
│  │  ├─ 20250217233747_implement_holograph_system
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ public
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ src
│  ├─ app
│  │  ├─ api
│  │  │  └─ auth
│  │  │     ├─ login
│  │  │     │  └─ route.ts
│  │  │     ├─ logout
│  │  │     │  └─ route.ts
│  │  │     ├─ register
│  │  │     │  └─ route.ts
│  │  │     └─ user
│  │  │        └─ route.ts
│  │  ├─ components
│  │  │  └─ layout
│  │  │     └─ navbar.tsx
│  │  ├─ dashboard
│  │  │  └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  └─ register
│  │     └─ page.tsx
│  └─ lib
│     └─ db.ts
├─ tailwind.config.ts
└─ tsconfig.json

```