# Changelog

All notable changes to `@chatprd/icons`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semver](https://semver.org/) (see "Releasing" in the README for what counts as major, minor and patch for icons).

## 1.0.1 - 2026-10-17

### Changed

- team: redrawn as two people for legibility at small sizes. The small spot drawing (`color-small/team.svg`) follows the new line icon, with the same colors (rose front, charcoal back); the full spot is unchanged.

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
