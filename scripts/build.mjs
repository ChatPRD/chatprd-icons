#!/usr/bin/env node
/**
 * Codegen and spec checks for @chatprd/icons.
 *
 * Reads ./svg/*.svg (line icons), ./color/*.svg and ./color-small/*.svg (spot icons) and
 * ./manifest.json, validates them against the spec (docs/README.md), and writes:
 *   - color/<tone>/*.svg and color-small/<tone>/*.svg   raw tone exports (committed)
 *   - src/icons/<name>.ts, src/spots/<name>.ts           one module per icon (gitignored)
 *   - src/spot-config.ts, src/index.ts                   shared spot config and the root barrel (gitignored)
 *
 *   node scripts/build.mjs           # validate and write everything
 *   node scripts/build.mjs --check   # validate; exit 1 if a committed tone export is stale
 *   node scripts/build.mjs --src <dir> --out-dir <dir>
 *
 * No dependencies.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const SRC = path.resolve(flag("--src") ?? path.join(here, ".."));
const OUT_DIR = path.resolve(flag("--out-dir") ?? path.join(SRC, "src"));
const CHECK = args.includes("--check");

const ALLOWED_TAGS = new Set(["path", "circle", "rect", "line", "polyline", "polygon", "ellipse"]);
const ATTR_MAP = {
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "stroke-dasharray": "strokeDasharray",
};

const manifest = JSON.parse(fs.readFileSync(path.join(SRC, "manifest.json"), "utf8"));
const svgDir = path.join(SRC, "svg");
const files = fs.readdirSync(svgDir).filter((f) => f.endsWith(".svg")).sort();
const errors = [];

const manifestNames = new Set(manifest.icons.map((i) => i.name));
for (const f of files) if (!manifestNames.has(f.replace(/\.svg$/, ""))) errors.push(`${f}: missing from manifest.json`);
for (const n of manifestNames) if (!files.includes(`${n}.svg`)) errors.push(`${n}: in manifest.json but no svg/${n}.svg`);

const pascal = (name) => name.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");

// Spot (full-color) icons: optional ./color folder, listed under manifest.spots.
// manifest.palette is { family: { tone: hex } }; the "neutral" family is always allowed.
// Rules (docs/icons/spot-icon-brief.md): one lead family in several tones, plus neutrals,
// plus at most one small accent family; single-hue linear gradients only.
const colorDir = path.join(SRC, "color");
const colorFiles = fs.existsSync(colorDir) ? fs.readdirSync(colorDir).filter((f) => f.endsWith(".svg")).sort() : [];
const spotNames = new Set((manifest.spots ?? []).map((s) => s.name));
for (const f of colorFiles) if (!spotNames.has(f.replace(/\.svg$/, ""))) errors.push(`color/${f}: missing from manifest.json spots`);
for (const n of spotNames) if (!colorFiles.includes(`${n}.svg`)) errors.push(`${n}: in manifest.json spots but no color/${n}.svg`);
const familyOf = {};
for (const [family, tones] of Object.entries(manifest.palette ?? {}))
  if (tones && typeof tones === "object") for (const hex of Object.values(tones)) familyOf[hex.toUpperCase()] = family;
const rules = manifest.spotRules ?? {};
const attrsOf = (raw) => {
  const attrs = {};
  for (const a of raw.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[ATTR_MAP[a[1]] ?? a[1]] = a[2];
  return attrs;
};

function parseSvg(dir, file, kind) {
  const label = `${path.basename(dir)}/${file}`;
  let src = fs.readFileSync(path.join(dir, file), "utf8").trim();
  const open = src.match(/^<svg\b([^>]*)>/);
  if (!open) throw new Error(`${label}: not an <svg>`);
  const rootAttrs = Object.fromEntries([...open[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  if (kind === "line") {
    if (rootAttrs.viewBox !== "0 0 24 24") errors.push(`${label}: viewBox must be "0 0 24 24"`);
    if (rootAttrs["stroke-width"] !== "1.75") errors.push(`${label}: stroke-width must be 1.75`);
    if (rootAttrs.stroke !== "currentColor") errors.push(`${label}: stroke must be currentColor`);
    if (/<(g|defs|style|metadata|title|desc|linearGradient|radialGradient|filter|image)\b|sodipodi|inkscape|data-name|transform=/.test(src))
      errors.push(`${label}: contains groups, gradients, transforms or editor metadata; flatten it`);
  } else {
    const vb = kind === "small" ? "0 0 24 24" : "0 0 64 64";
    if (rootAttrs.viewBox !== vb) errors.push(`${label}: viewBox must be "${vb}"`);
    if (/<(g|style|metadata|title|desc|radialGradient|filter|image|mask|pattern)\b|sodipodi|inkscape|data-name|transform=|gradientTransform/.test(src))
      errors.push(`${label}: contains groups, filters, rasters, transforms or editor metadata; flatten it`);
  }

  // Spot gradients: <defs><linearGradient id> <stop/>… </linearGradient></defs>, each within one family.
  const gradients = {};
  const nodes = [];
  if (kind !== "line") {
    const defsBlock = src.match(/<defs>([\s\S]*?)<\/defs>/);
    if (defsBlock) {
      for (const g of defsBlock[1].matchAll(/<linearGradient\b([^>]*)>([\s\S]*?)<\/linearGradient>/g)) {
        const gAttrs = attrsOf(g[1]);
        const stops = [...g[2].matchAll(/<stop\b([^>]*?)\/>/g)].map((m) => ["stop", attrsOf(m[1])]);
        const fams = new Set(stops.map(([, a]) => familyOf[(a["stop-color"] ?? "").toUpperCase()]));
        if (fams.has(undefined)) errors.push(`${label}: gradient #${gAttrs.id} uses a color outside manifest.palette`);
        const hues = [...fams].filter((x) => x && x !== "neutral");
        if (hues.length > 1) errors.push(`${label}: gradient #${gAttrs.id} mixes ${hues.join(" + ")}; gradients must stay within one hue`);
        gradients[gAttrs.id] = hues[0] ?? "neutral";
        for (const st of stops) {
          st[1].stopColor = st[1]["stop-color"];
          delete st[1]["stop-color"];
        }
        nodes.push(["linearGradient", gAttrs, stops]);
      }
      src = src.replace(defsBlock[0], "");
    }
  }

  const fillsByFamily = {}; // family -> number of shapes using it
  for (const m of src.matchAll(/<(\w+)\b([^>]*?)\/>/g)) {
    const [, tag, rawAttrs] = m;
    if (!ALLOWED_TAGS.has(tag)) {
      errors.push(`${label}: unsupported element <${tag}>`);
      continue;
    }
    const attrs = attrsOf(rawAttrs);
    if (kind === "line") {
      if (attrs.fill && attrs.fill !== "none" && attrs.fill !== "currentColor") errors.push(`${label}: fills must be currentColor (accent dots only)`);
    } else {
      for (const key of ["fill", "stroke"]) {
        const v = attrs[key];
        if (!v || v === "none") continue;
        const ref = v.match(/^url\(#([\w-]+)\)$/);
        const fam = ref ? gradients[ref[1]] : familyOf[v.toUpperCase()];
        if (!fam) errors.push(`${label}: ${key} ${v} is not in manifest.palette (or an unknown gradient)`);
        else fillsByFamily[fam] = (fillsByFamily[fam] ?? 0) + 1;
      }
    }
    nodes.push([tag, attrs]);
  }
  if (!nodes.length) errors.push(`${label}: no drawable elements`);

  if (kind !== "line") {
    const meta = (manifest.spots ?? []).find((sp) => `${sp.name}.svg` === file);
    const hues = Object.keys(fillsByFamily).filter((x) => x !== "neutral");
    if (!meta?.lead) errors.push(`${label}: manifest spot needs a "lead" family`);
    else if (!fillsByFamily[meta.lead]) errors.push(`${label}: lead family "${meta.lead}" isn't used in the artwork`);
    // A lead family, optionally one "second" family that must be a neighbouring brand-gradient stop
    // (manifest.spotRules.pairs), and optionally one small "accent".
    if (meta?.second) {
      // The second family may appear in either drawing (full or small); checked once both are parsed.
      if (kind !== "line") (secondUse[meta.name] ??= new Set()).add(fillsByFamily[meta.second] ? kind : null);
      const ok = (rules.pairs ?? []).some(([a, b]) => (a === meta.lead && b === meta.second) || (b === meta.lead && a === meta.second));
      if (!ok) errors.push(`${label}: ${meta.lead} + ${meta.second} isn't an allowed pair (${(rules.pairs ?? []).map((x) => x.join("+")).join(", ")})`);
    }
    // White/paper first: identity colors (lead, second, third) come only from the brand families;
    // semantic families (success, warning, error, info) may only be the one small accent.
    const spotName = file.replace(/\.svg$/, "");
    // Required leads lock semantic choices (security = gold shield).
    if (rules.requiredLeads?.[spotName] && meta?.lead !== rules.requiredLeads[spotName])
      errors.push(`${label}: ${spotName} must lead with "${rules.requiredLeads[spotName]}" (semantic, do not change); found "${meta?.lead}"`);
    if (rules.brandFamilies)
      for (const key of ["lead", "second", "third"])
        if (meta?.[key] && !rules.brandFamilies.includes(meta[key]) && !(key === "lead" && [].concat(rules.semanticLeads?.[spotName] ?? []).includes(meta[key])))
          errors.push(`${label}: ${key} "${meta[key]}" isn't a brand family (${rules.brandFamilies.join(", ")}); other colors may only be a semantic accent`);
    if (meta?.accent && rules.semanticFamilies && !rules.semanticFamilies.includes(meta.accent))
      errors.push(`${label}: accent "${meta.accent}" must be semantic (${rules.semanticFamilies.join(", ")})`);
    if (meta?.third) {
      const ok = (rules.triads ?? []).some((t) => t.includes(meta.lead) && t.includes(meta.second) && t.includes(meta.third));
      if (!ok) errors.push(`${label}: ${meta.second} + ${meta.lead} + ${meta.third} isn't an allowed brand-gradient triad`);
      if (!fillsByFamily[meta.third]) errors.push(`${label}: third family "${meta.third}" isn't used in the artwork`);
    }
    const extra = hues.filter((h) => h !== meta?.lead && h !== meta?.second && h !== meta?.third);
    if (extra.length > 1) errors.push(`${label}: uses ${hues.join(", ")}; a lead (plus its pair) and at most one accent`);
    for (const h of extra) {
      if (meta?.accent !== h) errors.push(`${label}: ${h} isn't the lead or its pair; list it as "accent" in the manifest or remove it`);
      if (fillsByFamily[h] > (rules.maxAccentElements ?? 3))
        errors.push(`${label}: accent ${h} is on ${fillsByFamily[h]} shapes; keep it to a small detail (max ${rules.maxAccentElements ?? 3})`);
      if (meta?.lead && fillsByFamily[h] >= fillsByFamily[meta.lead]) errors.push(`${label}: accent ${h} is as heavy as the lead ${meta.lead}`);
    }
    for (const [x, y] of rules.bannedPairs ?? [])
      if (fillsByFamily[x] && fillsByFamily[y]) errors.push(`${label}: pairs ${x} with ${y}, which the palette rules ban`);
  }
  return nodes;
}

const secondUse = {}; // spot name -> drawings ("spot", "small") that use its second family
const entries = files.map((f) => {
  const name = f.replace(/\.svg$/, "");
  return { name, component: `Icon${pascal(name)}`, nodes: parseSvg(svgDir, f, "line"), meta: manifest.icons.find((i) => i.name === name) };
});
const spots = colorFiles.map((f) => {
  const name = f.replace(/\.svg$/, "");
  return { name, component: `Spot${pascal(name)}`, nodes: parseSvg(colorDir, f, "spot"), meta: manifest.spots.find((s) => s.name === name) };
});
// Small tier: a simplified drawing per spot on a 24×24 grid (color-small/<name>.svg), used at 20–32px.
// At most two colors plus white, no hairline edges.
const smallDir = path.join(SRC, "color-small");
if (fs.existsSync(smallDir)) {
  for (const s of spots) {
    const f = `${s.name}.svg`;
    if (!fs.existsSync(path.join(smallDir, f))) {
      errors.push(`color-small/${f}: missing small drawing for spot "${s.name}"`);
      continue;
    }
    s.small = parseSvg(smallDir, f, "small");
    const cols = new Set();
    const walk = (nodes) => {
      for (const [, a, kids] of nodes) {
        for (const k of ["fill", "stroke"]) if (a[k] && a[k] !== "none" && !a[k].startsWith("url(")) cols.add(a[k].toUpperCase());
        if (kids) walk(kids);
      }
    };
    walk(s.small);
    // Neutrals are materials; only brand/semantic colors count toward the limit.
    for (const hex of Object.values(manifest.palette.neutral)) cols.delete(hex.toUpperCase());
    const maxCols = s.meta.third ? 3 : 2;
    if (cols.size > maxCols) errors.push(`color-small/${f}: uses ${cols.size} colors plus white (${[...cols].join(", ")}); max ${maxCols}`);
    // Neutrals are real materials, so grays and charcoal may fill shapes; they count toward the color limit.
  }
  for (const s of spots)
    if (s.meta?.second && ![...(secondUse[s.name] ?? [])].some(Boolean))
      errors.push(`${s.name}: second family "${s.meta.second}" isn't used in the full or small drawing`);
  for (const f of fs.readdirSync(smallDir).filter((x) => x.endsWith(".svg")))
    if (!spotNames.has(f.replace(/\.svg$/, ""))) errors.push(`color-small/${f}: no matching spot in manifest.json`);
}
// Line/spot alignment: every spot pairs with an existing line icon (the tint tone and the
// "same picture as the line icon" rule depend on it).
for (const sp of manifest.spots ?? []) {
  if (!sp.line) errors.push(`${sp.name}: manifest spot needs a "line" icon`);
  else if (!manifestNames.has(sp.line)) errors.push(`${sp.name}: line icon "${sp.line}" doesn't exist in svg/`);
}
for (const [name, fam] of Object.entries(rules.requiredLeads ?? {})) {
  const sp = (manifest.spots ?? []).find((x) => x.name === name);
  if (!sp) errors.push(`spot set: required spot "${name}" is missing`);
  else if (sp.lead !== fam) errors.push(`spot set: ${name} must lead with "${fam}" (semantic, do not change); found "${sp.lead}"`);
}
// Set-level balance: rose (core brand) leads enough spots, and no family dominates.
if (spots.length) {
  const leads = {};
  for (const s of manifest.spots ?? []) leads[s.lead] = (leads[s.lead] ?? 0) + 1;
  if (rules.core && (leads[rules.core] ?? 0) < (rules.minLeadCore ?? 0))
    errors.push(`spot set: ${rules.core} leads ${leads[rules.core] ?? 0} spots; needs at least ${rules.minLeadCore}`);
  if (rules.core && rules.minSpotsWithCore) {
    const withCore = (manifest.spots ?? []).filter((sp) => [sp.lead, sp.second, sp.accent].includes(rules.core)).length;
    if (withCore < rules.minSpotsWithCore) errors.push(`spot set: ${rules.core} appears in ${withCore} spots; needs at least ${rules.minSpotsWithCore}`);
  }
  for (const [fam, n] of Object.entries(leads))
    if (rules.maxLeadPerFamily && n > rules.maxLeadPerFamily) errors.push(`spot set: ${fam} leads ${n} spots; max ${rules.maxLeadPerFamily}`);
}

// ---- Spot tones ---------------------------------------------------------------
// Source SVGs keep the brand hexes. Codegen maps every spot color to a role token
// ("lead.<tone>", "accent.<tone>" or "neutral.<name>") and re-renders it per tone in
// manifest.spotTones: brand (identical to the source), one mono variant per family,
// ink (grayscale) and white (translucent white for dark or art backgrounds).
// Stop before rendering tones if the sources already break the rules.
if (errors.length) {
  console.error(errors.map((e) => `  - ${e}`).join("\n"));
  console.error(`\n${errors.length} problem(s) in ${path.relative(process.cwd(), SRC)}`);
  process.exit(1);
}
const toneSpec = manifest.spotTones;
const TONES = toneSpec?.tones ?? ["brand"];
const roleOfHex = {};
for (const [family, tones] of Object.entries(manifest.palette ?? {}))
  if (tones && typeof tones === "object") for (const [tone, hex] of Object.entries(tones)) roleOfHex[hex.toUpperCase()] = [family, tone];
const COLOR_KEYS = { fill: "fillOpacity", stroke: "strokeOpacity", stopColor: "stopOpacity" };
function tokenize(nodes, meta) {
  return nodes.map(([tag, attrs, kids]) => {
    const a = { ...attrs };
    if (a["stop-color"]) {
      a.stopColor = a["stop-color"];
      delete a["stop-color"];
    }
    for (const k of Object.keys(COLOR_KEYS)) {
      const v = a[k];
      if (!v || v === "none" || v.startsWith("url(")) continue;
      const hit = roleOfHex[v.toUpperCase()];
      if (!hit) continue;
      const [family, tone] = hit;
      a[k] = family === "neutral" ? `neutral.${tone}` : family === meta.lead ? `lead.${tone}` : family === meta.second ? `second.${tone}` : family === meta.third ? `third.${tone}` : `accent.${tone}`;
    }
    return kids ? [tag, a, tokenize(kids, meta)] : [tag, a];
  });
}
const mixBlack = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (sh) => Math.round(((n >> sh) & 255) * (1 - amt)).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`.toUpperCase();
};
const appFamilyOf = (tone, meta) => (tone === "app" ? meta.app : tone.slice(4));
function resolveToken(token, tone, meta, ko) {
  let [kind, t] = token.split(".");
  if (tone === "app" && meta.appRoles?.[kind]) {
    const AP = manifest.appPalette;
    const hex = AP.families[meta.appRoles[kind]].light;
    const role = AP.roles[t];
    return role.mixBlack ? { color: mixBlack(hex, role.mixBlack) } : { color: hex, opacity: role.opacity };
  }
  if (kind === "second" || kind === "third") {
    if (tone === "brand") return { color: manifest.palette[meta[kind]][t] };
    t = toneSpec[`${kind}Tone`]?.[t] ?? t;
    kind = "lead";
  }
  const P = manifest.palette;
  if (tone.startsWith("app")) {
    const AP = manifest.appPalette;
    if (kind === "neutral") return { color: AP.neutral[t].light };
    const hex = AP.families[appFamilyOf(tone, meta)].light;
    const role = AP.roles[kind === "accent" ? "light" : t];
    if (role.mixBlack) return { color: mixBlack(hex, role.mixBlack) };
    return { color: hex, opacity: role.opacity };
  }
  if (tone === "white") {
    const w = toneSpec.white;
    if (ko) return { color: w.knockout.color, opacity: w.knockout.opacity };
    return { color: "#FFFFFF", opacity: kind === "neutral" ? w.neutral[t] : w.roles[t] };
  }
  if (kind === "neutral") return { color: P.neutral[t] };
  if (tone === "brand") return { color: P[kind === "lead" ? meta.lead : meta.accent][t] };
  if (tone === "ink") return { color: toneSpec.ink[t] };
  return { color: P[tone][kind === "accent" ? toneSpec.monoAccentTone : t] };
}
function renderTone(nodes, tone, meta, ko = false) {
  return nodes.map(([tag, attrs, kids]) => {
    const a = { ...attrs };
    const isKo = ko || a["data-ko"] === "1";
    for (const [k, opKey] of Object.entries(COLOR_KEYS)) {
      const v = a[k];
      if (!v || !/^(lead|second|third|accent|neutral)\./.test(v)) continue;
      const { color, opacity } = resolveToken(v, tone, meta, isKo);
      a[k] = color;
      if (opacity !== undefined && opacity !== 1) a[opKey] = String(opacity);
    }
    return kids ? [tag, a, renderTone(kids, tone, meta, isKo)] : [tag, a];
  });
}
const KEBAB = { strokeWidth: "stroke-width", strokeLinecap: "stroke-linecap", strokeLinejoin: "stroke-linejoin", fillRule: "fill-rule", clipRule: "clip-rule", strokeDasharray: "stroke-dasharray", fillOpacity: "fill-opacity", strokeOpacity: "stroke-opacity", stopColor: "stop-color", stopOpacity: "stop-opacity" };
const svgNode = ([tag, attrs, kids]) => {
  const at = Object.entries(attrs).filter(([k]) => k !== "data-ko").map(([k, v]) => ` ${KEBAB[k] ?? k}="${v}"`).join("");
  return kids ? `<${tag}${at}>${kids.map(svgNode).join("")}</${tag}>` : `<${tag}${at}/>`;
};
const spotSvg = (nodes, size = 64) => {
  const grads = nodes.filter((n) => n[0] === "linearGradient");
  const shapes = nodes.filter((n) => n[0] !== "linearGradient");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">${grads.length ? `<defs>${grads.map(svgNode).join("")}</defs>` : ""}${shapes.map(svgNode).join("")}</svg>\n`;
};
const colorsIn = (nodes, out = new Set()) => {
  for (const [, a, kids] of nodes) {
    for (const k of Object.keys(COLOR_KEYS)) if (a[k] && a[k] !== "none" && !a[k].startsWith("url(")) out.add(a[k].toUpperCase());
    if (kids) colorsIn(kids, out);
  }
  return out;
};
if (TONES.includes("app"))
  for (const s of spots)
    if (!manifest.appPalette?.families?.[s.meta.app]) errors.push(`${s.name}: manifest spot needs an "app" family (one of ${Object.keys(manifest.appPalette?.families ?? {}).join(", ")})`);
// Tint tone: the spot's line icon, stroked in its lead brand color with closed shapes filled at
// manifest.spotTones.tint.fillOpacity (like the app's DuotoneIcon). Same geometry as the line set.
const TINT = manifest.spotTones?.tint;
const isClosed = ([tag, a]) => ["rect", "circle", "ellipse", "polygon"].includes(tag) || (tag === "path" && /z\s*$/i.test(a.d ?? ""));
function tintNodes(lineName, color) {
  const line = entries.find((e) => e.name === lineName);
  if (!line) return null;
  return line.nodes.map(([tag, a]) => {
    const attrs = { ...a };
    if (attrs.fill === "currentColor") attrs.fill = color; // accent dots
    else if (isClosed([tag, a])) {
      attrs.fill = color;
      attrs.fillOpacity = String(TINT.fillOpacity);
    }
    return [tag, attrs];
  });
}
const tintSvg = (nodes, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${nodes.map(svgNode).join("")}</svg>\n`;
const toneExports = []; // [absolute path, svg text]
const tiers = [
  { key: "nodes", tok: "tokens", dir: colorDir, label: "color", size: 64 },
  { key: "small", tok: "smallTokens", dir: smallDir, label: "color-small", size: 24 },
];
for (const tier of tiers)
for (const s of spots) {
  if (!s[tier.key]) continue;
  s[tier.tok] = tokenize(s[tier.key], s.meta);
  // Brand must reproduce the source exactly.
  const brand = renderTone(s[tier.tok], "brand", s.meta).map(([t, a, k]) => [t, Object.fromEntries(Object.entries(a).filter(([key]) => key !== "data-ko")), k]);
  const orig = s[tier.key].map(([t, a, k]) => [t, Object.fromEntries(Object.entries(a).filter(([key]) => key !== "data-ko")), k]);
  if (JSON.stringify(brand) !== JSON.stringify(orig).replaceAll('"stop-color"', '"stopColor"'))
    errors.push(`${tier.label}/${s.name}.svg: brand tone doesn't reproduce the source artwork`);
  if (TINT && tier.key === "nodes") {
    const color = manifest.palette[s.meta.lead].base;
    s.tint = tintNodes(s.meta.line, color);
    if (!s.tint) errors.push(`${s.name}: no line icon "${s.meta.line}" for the tint tone`);
    else for (const t of [tier, tiers[1]]) toneExports.push([path.join(t.dir, "tint", `${s.name}.svg`), tintSvg(s.tint, color)]);
  }
  for (const tone of TONES) {
    if (tone === "brand" || tone === "tint") continue;
    const rendered = renderTone(s[tier.tok], tone, s.meta);
    const allowed = new Set(
      (tone === "white"
        ? ["#FFFFFF", toneSpec.white.knockout.color]
        : tone.startsWith("app")
        ? (() => {
            const AP = manifest.appPalette;
            const fams = [appFamilyOf(tone, s.meta), ...(tone === "app" ? Object.values(s.meta.appRoles ?? {}) : [])];
            return [...fams.flatMap((fm) => [AP.families[fm].light, mixBlack(AP.families[fm].light, AP.roles.deep.mixBlack)]), ...Object.values(AP.neutral).map((n) => n.light)];
          })()
        : [...Object.values(manifest.palette.neutral), ...Object.values(tone === "ink" ? toneSpec.ink : manifest.palette[tone] ?? {})]
      ).map((h) => h.toUpperCase()),
    );
    for (const col of colorsIn(rendered))
      if (!allowed.has(col)) errors.push(`${tier.label}/${tone}/${s.name}.svg: ${col} is outside the ${tone} family and neutrals`);
    toneExports.push([path.join(tier.dir, tone, `${s.name}.svg`), spotSvg(rendered, tier.size)]);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `  - ${e}`).join("\n"));
  console.error(`\n${errors.length} problem(s) in ${path.relative(process.cwd(), SRC)}`);
  process.exit(1);
}


// ---- TypeScript codegen -------------------------------------------------------
// One module per icon and per spot, so a consumer's bundle only contains what it imports.
const lit = (v) => JSON.stringify(v);
const SMALL_MAX = manifest.spotSmall?.autoMaxSize ?? 32;
const nodeLit = (nodes) =>
  "[" +
  nodes
    .map(
      ([tag, attrs, children]) =>
        `[${lit(tag)}, {${Object.entries(attrs).map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : lit(k)}: ${lit(v)}`).join(", ")}}${children ? `, ${nodeLit(children)}` : ""}]`,
    )
    .join(", ") +
  "]";
const HEADER = `// AUTO-GENERATED by scripts/build.mjs from svg/, color/, color-small/ and manifest.json. Do not edit.\n`;
const generated = new Map(); // relative path in OUT_DIR -> text

for (const e of entries) {
  const replaces = [...e.meta.replaces.lucide.map((n) => `lucide ${n}`), ...e.meta.replaces.heroicons.map((n) => `heroicons ${n}`)].join(", ");
  generated.set(
    `icons/${e.name}.ts`,
    `${HEADER}import { createIcon } from "../runtime.js";

/** ${e.meta.concept}. Replaces ${replaces || "nothing yet (new concept)"}. */
export const ${e.component} = /*#__PURE__*/ createIcon(${lit(e.name)}, ${lit(e.component)}, ${nodeLit(e.nodes)});

export default ${e.component};
`,
  );
}

for (const s of spots) {
  const fam = Object.fromEntries(
    Object.entries({ lead: s.meta.lead, second: s.meta.second, third: s.meta.third, accent: s.meta.accent, app: s.meta.app, appRoles: s.meta.appRoles }).filter(([, v]) => v),
  );
  generated.set(
    `spots/${s.name}.ts`,
    `${HEADER}import { createSpot } from "../runtime.js";

/** ${s.meta.concept} (spot). Pairs with line icon \`${s.meta.line}\`. */
export const ${s.component} = /*#__PURE__*/ createSpot(${lit(s.name)}, ${lit(s.component)}, ${lit(fam)}, ${nodeLit(s.tokens)}, ${s.smallTokens ? nodeLit(s.smallTokens) : "undefined"}${s.tint ? `, ${nodeLit(s.tint)}, ${lit(manifest.palette[s.meta.lead].base)}` : ""});

export default ${s.component};
`,
  );
}

const spotApp = manifest.appPalette
  ? {
      families: Object.fromEntries(Object.entries(manifest.appPalette.families).map(([k, v]) => [k, { var: v.var, light: v.light }])),
      neutral: Object.fromEntries(Object.entries(manifest.appPalette.neutral).map(([k, v]) => [k, { var: v.var, light: v.light }])),
      roles: manifest.appPalette.roles,
    }
  : null;
generated.set(
  "spot-config.ts",
  `${HEADER}
export type ChatPRDSpotTone = ${TONES.map((t) => lit(t)).join(" | ")};

/** All spot tones, in display order. */
export const chatprdSpotTones: readonly ChatPRDSpotTone[] = ${lit(TONES)};

/** Sizes at or below this (in px) use the small drawing when variant="auto". */
export const SMALL_MAX = ${SMALL_MAX};

export const SPOT_PALETTE: Record<string, Record<string, string>> = ${lit(manifest.palette)};

export const SPOT_TONE_SPEC = ${lit(toneSpec ? { monoAccentTone: toneSpec.monoAccentTone, secondTone: toneSpec.secondTone ?? {}, thirdTone: toneSpec.thirdTone ?? {}, ink: toneSpec.ink, white: toneSpec.white } : {})} as const;

// App tones resolve to the app's CSS variables (light-mode hex fallbacks), so they follow the app theme.
export const SPOT_APP = ${lit(spotApp)} as {
  families: Record<string, { var: string; light: string }>;
  neutral: Record<string, { var: string; light: string }>;
  roles: Record<string, { opacity?: number; mixBlack?: number }>;
} | null;
`,
);

generated.set(
  "index.ts",
  `${HEADER}
export { createIcon, createSpot } from "./runtime.js";
export type { ChatPRDIcon, ChatPRDIconProps, ChatPRDSpot, ChatPRDSpotProps, IconNode, SpotFamilies } from "./runtime.js";
export { chatprdSpotTones, type ChatPRDSpotTone } from "./spot-config.js";
export * from "./animated.js";

${entries.map((e) => `import { ${e.component} } from "./icons/${e.name}.js";`).join("\n")}
${spots.map((s) => `import { ${s.component} } from "./spots/${s.name}.js";`).join("\n")}

export {
${[...entries, ...spots].map((e) => `  ${e.component},`).join("\n")}
};

/** Every line icon keyed by its kebab-case name. Useful for previews and string-keyed menus (imports every icon). */
export const chatprdIcons = {
${entries.map((e) => `  ${lit(e.name)}: ${e.component},`).join("\n")}
} as const;

export type ChatPRDIconName = keyof typeof chatprdIcons;

/** Every spot icon keyed by its kebab-case name (imports every spot). */
export const chatprdSpots = {
${spots.map((s) => `  ${lit(s.name)}: ${s.component},`).join("\n")}
} as const;

export type ChatPRDSpotName = keyof typeof chatprdSpots;

/** Version of manifest.json the package was built from. */
export const chatprdIconsManifestVersion = ${lit(manifest.version)};
`,
);

if (CHECK) {
  const stale = toneExports.filter(([file, text]) => !fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text);
  // Tone folders must contain only generated files.
  const expected = new Set(toneExports.map(([f]) => f));
  for (const base of [colorDir, smallDir])
    for (const tone of TONES) {
      const dir = path.join(base, tone);
      if (tone === "brand" || !fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) if (!expected.has(path.join(dir, f))) stale.push([path.join(dir, f)]);
    }
  if (stale.length) {
    console.error(`Stale: ${stale.map(([f]) => path.relative(process.cwd(), f)).join(", ")}. Run: npm run icons`);
    process.exit(1);
  }
  console.log(`OK: ${entries.length} line icons and ${spots.length} spots pass the spec; ${toneExports.length} tone exports up to date`);
} else {
  for (const base of [colorDir, smallDir])
    for (const tone of TONES) {
      if (tone === "brand" || !fs.existsSync(base)) continue; // tint dirs are cleaned here too
      const dir = path.join(base, tone);
      fs.mkdirSync(dir, { recursive: true });
      for (const f of fs.readdirSync(dir)) if (f.endsWith(".svg")) fs.unlinkSync(path.join(dir, f));
    }
  for (const [file, text] of toneExports) fs.writeFileSync(file, text);
  for (const sub of ["icons", "spots"]) fs.rmSync(path.join(OUT_DIR, sub), { recursive: true, force: true });
  for (const [rel, text] of generated) {
    const file = path.join(OUT_DIR, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
  console.log(`Wrote ${toneExports.length} spot tone exports (color/<tone>/, color-small/<tone>/)`);
  console.log(`Wrote ${entries.length} icon modules, ${spots.length} spot modules, spot-config.ts and index.ts to ${path.relative(process.cwd(), OUT_DIR) || "."}`);
}
