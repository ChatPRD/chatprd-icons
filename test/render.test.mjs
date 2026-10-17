// Smoke tests against the built package (run `npm run build` first).
// Imports go through the package's own `exports` map (Node self-reference), so they
// exercise the same paths consumers use.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import * as root from "@chatprd/icons";
import IconDocumentDefault, { IconDocument as IconDocumentNamed } from "@chatprd/icons/icons/document";
import { SpotSecurity } from "@chatprd/icons/spots/security";
import { IconSpinner } from "@chatprd/icons/animated";

const html = (C, props = {}) => renderToStaticMarkup(React.createElement(C, props));
const require = createRequire(import.meta.url);

test("every line icon renders with the default API", () => {
  const names = Object.keys(root.chatprdIcons);
  assert.equal(names.length, 128);
  for (const name of names) {
    const out = html(root.chatprdIcons[name]);
    assert.match(out, /^<svg /, name);
    assert.match(out, /width="24" height="24" viewBox="0 0 24 24"/, name);
    assert.match(out, /stroke="currentColor" stroke-width="1.75"/, name);
    assert.match(out, /aria-hidden="true"/, name);
    assert.match(out, new RegExp(`class="chatprd-icon chatprd-icon-${name}"`), name);
  }
});

test("size, strokeWidth, className, title", () => {
  const out = html(root.IconDocument, { size: 16, strokeWidth: 2, className: "text-black/60", title: "Doc" });
  assert.match(out, /width="16" height="16"/);
  assert.match(out, /stroke-width="2"/);
  assert.match(out, /class="chatprd-icon chatprd-icon-document text-black\/60"/);
  assert.match(out, /role="img"/);
  assert.match(out, /<title id="[^"]+">Doc<\/title>/);
  assert.doesNotMatch(out, /aria-hidden/);
});

test("every spot renders in every tone and variant", () => {
  const spots = Object.keys(root.chatprdSpots);
  assert.equal(spots.length, 12);
  for (const name of spots)
    for (const tone of root.chatprdSpotTones)
      for (const variant of ["auto", "small", "full"]) {
        const out = html(root.chatprdSpots[name], { tone, variant });
        assert.match(out, /^<svg /, `${name} ${tone} ${variant}`);
        assert.match(out, /aria-hidden="true"/);
      }
  assert.match(html(root.SpotDocument), /viewBox="0 0 64 64"/);
  assert.match(html(root.SpotDocument, { size: 24 }), /viewBox="0 0 24 24"/);
  assert.match(html(root.SpotDocument, { size: 24, variant: "full" }), /viewBox="0 0 64 64"/);
});

test("deep imports resolve to the same components", () => {
  assert.equal(IconDocumentDefault, root.IconDocument);
  assert.equal(IconDocumentNamed, root.IconDocument);
  assert.equal(SpotSecurity, root.SpotSecurity);
  assert.equal(IconSpinner, root.IconSpinner);
});

test("raw SVG exports resolve", () => {
  for (const spec of ["@chatprd/icons/svg/document.svg", "@chatprd/icons/color/document.svg", "@chatprd/icons/color/rose/document.svg", "@chatprd/icons/color-small/white/agent.svg", "@chatprd/icons/manifest.json"])
    assert.ok(fs.existsSync(require.resolve(spec)), spec);
});

test("animated icons render shapes only, with no text content", () => {
  for (const C of [root.IconSpinner, root.IconStreamingDots]) {
    const out = html(C);
    assert.ok(!out.includes("<style"), `${C.displayName ?? C.name} must not render a <style> element`);
    assert.equal(out.replace(/<[^>]+>/g, ""), "");
  }
});
