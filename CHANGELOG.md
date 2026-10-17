# Changelog

All notable changes to `@chatprd/icons`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semver](https://semver.org/) (see "Releasing" in the README for what counts as major, minor and patch for icons).

## 1.1.0 - 2026-10-17

### Added

- 27 line icons covering every remaining lucide and heroicons glyph chatprd-app uses (brand logos aside), so the app can draw all of its UI icons from this set:
  - Theme: `sun`, `moon`, `monitor` (system theme).
  - Account and chat: `log-out`, `quote`, `corner-down-right` (quoted reply), `thumbs-up`, `thumbs-down`, `heart`, `archive`.
  - Panels and devices: `maximize`, `smartphone`, `keyboard`.
  - Data and admin: `database`, `hard-drive`, `trending-down`, `bug`, `ticket`, `tag`, `palette`, `circle`.
  - File types, drawn as `document` with the type in place of its text lines: `file-spreadsheet`, `file-video`, `file-audio`, `file-archive`, `file-slides`, `file-type`.

## 1.0.2 - 2026-10-17

### Fixed

- `IconSpinner` and `IconStreamingDots` no longer render a `<style>` element inside the SVG. Its CSS showed up in the `textContent` of every ancestor (status regions, buttons, test queries). The keyframes are now injected once into `document.head` on mount, so the markup is shapes only. Under server rendering the icons sit still until hydration.

## 1.0.1 - 2026-10-17

### Changed

- team: redrawn as two people for legibility at small sizes. The small spot drawing (`color-small/team.svg`) follows the new line icon: a rose front figure and a violet back figure, separated by a cut-out gap instead of a white outline, so it reads on any background. The team spot now lists violet as its `second` family; the full spot is unchanged.
- Build check: a spot's `second` family may appear in either its full or its small drawing.

## 1.0.0 - 2026-10-12

First release as a package: 100 line icons, 12 spot icons with tones and a small tier, animated loaders, and raw SVG exports.

### Added

- 100 line icons (`IconDocument`, `IconChevronDown`, …) with the lucide-compatible API: `size`, `strokeWidth`, `absoluteStrokeWidth`, `className`, `title`, `aria-hidden` by default, `ref` forwarding.
- 2 animated icons: `IconSpinner` and `IconStreamingDots`, with reduced-motion fallbacks.
- 12 spot icons (`SpotDocument`, …) with `size`, `tone`, `variant` and `title`, in 14 tones: `brand`, `tint`, `rose`, `coral`, `violet`, `ink`, `white`, `app`, `app-accent`, `app-violet`, `app-pink`, `app-rose`, `app-teal`, `app-slate`, each with a full (64) and small (24) drawing.
- `chatprdIcons`, `chatprdSpots`, `chatprdSpotTones`, and the `ChatPRDIconName`, `ChatPRDSpotName` and `ChatPRDSpotTone` types.
- One ESM module per icon and spot, with `.d.ts` types and `sideEffects: false`. Deep imports: `@chatprd/icons/icons/<name>`, `@chatprd/icons/spots/<name>`, `@chatprd/icons/animated`.
- Raw SVGs: `@chatprd/icons/svg/*`, `@chatprd/icons/color/*`, `@chatprd/icons/color/<tone>/*`, `@chatprd/icons/color-small/*`, and `@chatprd/icons/manifest.json`.
- Spec checks (`npm run check`), a static preview (`npm run preview`), smoke tests, and CI that attaches a release tarball to a GitHub Release on `v*` tags.
