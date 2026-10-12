#!/usr/bin/env node
/**
 * Static preview of the built package: every line icon at 16/20/24/32px, the animated icons,
 * and every spot in every tone (full and small drawings) on white and on Ink.
 *
 *   npm run preview                      # build, write preview/out/index.html, serve it on :4600
 *   node scripts/preview.mjs --no-serve  # just write the file (e.g. in CI)
 *   PORT=5000 npm run preview
 *
 * Renders from dist/ with react-dom/server, so it shows exactly what consumers get. No dependencies
 * beyond the package's devDependencies.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const lib = await import(path.join(root, "dist/index.js"));

const h = React.createElement;
const SIZES = [16, 20, 24, 32];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const render = (el) => renderToStaticMarkup(el);

const groups = {};
for (const icon of manifest.icons) (groups[icon.group] ??= []).push(icon);
const groupTitle = { product: "Product concepts", ui: "UI glyphs", status: "App states and tools" };

const lineSection = Object.entries(groups)
  .map(
    ([group, icons]) => `
  <h3>${esc(groupTitle[group] ?? group)} <span class="count">${icons.length}</span></h3>
  <div class="grid lines">
    ${icons
      .map((icon) => {
        const C = lib.chatprdIcons[icon.name];
        return `<figure class="cell" title="${esc(icon.concept)}">
          <div class="sizes">${SIZES.map((s) => `<span>${render(h(C, { size: s }))}<small>${s}</small></span>`).join("")}</div>
          <figcaption><code>${esc(icon.name)}</code></figcaption>
        </figure>`;
      })
      .join("")}
  </div>`,
  )
  .join("");

const animated = ["IconSpinner", "IconStreamingDots"]
  .map(
    (n) => `<figure class="cell"><div class="sizes">${SIZES.map((s) => `<span>${render(h(lib[n], { size: s }))}<small>${s}</small></span>`).join("")}</div><figcaption><code>${n}</code></figcaption></figure>`,
  )
  .join("");

const DARK_TONES = new Set(["white"]);
const spotRow = (tone, bg) => `
  <div class="spot-row ${bg}">
    ${Object.entries(lib.chatprdSpots)
      .map(
        ([name, C]) => `<figure class="spot">
          <div class="spot-art">${render(h(C, { tone, size: 56 }))}${render(h(C, { tone, size: 24 }))}</div>
          <figcaption><code>${esc(name)}</code></figcaption>
        </figure>`,
      )
      .join("")}
  </div>`;

const spotSection = lib.chatprdSpotTones
  .map(
    (tone) => `
  <h3 id="tone-${tone}">tone="${esc(tone)}"</h3>
  ${DARK_TONES.has(tone) ? spotRow(tone, "ink") : spotRow(tone, "white") + spotRow(tone, "ink")}`,
  )
  .join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>ChatPRD icons ${esc(pkg.version)}</title>
<style>
  :root { --ink: #0B0A10; --line: #E7E4EA; --muted: #6B6672; color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); background: #fff; }
  header, main { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
  header { border-bottom: 1px solid var(--line); }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 40px 0 8px; }
  h3 { font-size: 14px; margin: 24px 0 8px; color: var(--muted); font-weight: 600; }
  .count { font-weight: 400; }
  nav a { color: var(--ink); margin-right: 16px; }
  code { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
  .cell { margin: 0; padding: 12px; border: 1px solid var(--line); border-radius: 12px; }
  .sizes { display: flex; align-items: flex-end; gap: 10px; min-height: 48px; }
  .sizes span { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .sizes small { font-size: 10px; color: var(--muted); }
  figcaption { margin-top: 8px; }
  .spot-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; padding: 12px; border-radius: 12px; margin-bottom: 8px; }
  .spot-row.white { border: 1px solid var(--line); }
  .spot-row.ink { background: var(--ink); color: #fff; }
  .spot { margin: 0; text-align: center; }
  .spot-art { display: flex; align-items: center; justify-content: center; gap: 12px; height: 64px; }
  .ink figcaption code { color: rgba(255,255,255,.7); }
  p.note { color: var(--muted); max-width: 70ch; }
</style>
</head>
<body>
<header>
  <h1>@chatprd/icons <span class="count">v${esc(pkg.version)}</span></h1>
  <p class="note">${manifest.icons.length} line icons, 2 animated icons and ${manifest.spots.length} spot icons in ${lib.chatprdSpotTones.length} tones. Rendered from <code>dist/</code>. Spots show the full drawing at 56px and the small drawing at 24px.</p>
  <nav><a href="#line">Line icons</a><a href="#animated">Animated</a><a href="#spots">Spot icons</a></nav>
</header>
<main>
  <h2 id="line">Line icons</h2>
  ${lineSection}
  <h2 id="animated">Animated</h2>
  <div class="grid lines">${animated}</div>
  <h2 id="spots">Spot icons</h2>
  <p class="note">The <code>app</code> tones use the app's CSS variables; outside the app they fall back to the light-mode hexes shown here.</p>
  ${spotSection}
</main>
</body>
</html>
`;

const outDir = path.join(root, "preview/out");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "index.html");
fs.writeFileSync(outFile, html);
console.log(`Wrote ${path.relative(process.cwd(), outFile)}`);

if (!process.argv.includes("--no-serve")) {
  const port = Number(process.env.PORT ?? 4600);
  http
    .createServer((req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(outFile));
    })
    .listen(port, () => console.log(`Preview: http://localhost:${port}`));
}
