# Brief: ChatPRD spot icons, v2

Hand this to a design or code agent. It's self-contained.

## The job

Redraw the 12 full-color "spot" icons for ChatPRD, the AI product manager. They appear at 48–64px on feature cards, empty states, onboarding steps, and upgrade prompts, on the marketing site (chatprd.ai) and in the app.

The current set failed in three ways. Avoid all three.

1. **Cartoonish.** Robot faces, blobby shapes, and toy proportions. The target is polished, crafted, premium product illustration.
2. **Mixed colors.** Each icon combined two or three hues at equal weight (rose + aqua, violet + yellow), so the set looked chaotic. The target is **mostly tonal**: each icon is led by **one color family** in several shades, plus neutrals. It may have **one reasonable accent**: a small detail in a second family that harmonizes, like a gold star on a rose card or a rose check on a white page, at most ~10–15% of the colored area. Variety comes mainly from different icons having different lead families.
3. **Bad semantics.** Colors were assigned to balance the set, not to mean something (e.g. a green security shield). Security should be a **gold shield**. Pick the object and color that a viewer would expect for the concept.

The line-icon set (`svg/`) is approved. Don't change it. Spot icons should feel like richer, dimensional siblings of the line icons: the same object, the same silhouette logic.

## Style

- **Mostly tonal, stylized, and polished:**
  - One lead hue family per icon, drawn in 2–3 of its tones (deep, base, light, highlight).
  - Optionally, one second brand family that neighbors the lead on the brand gradient (pink + coral, pink + purple), and at most one small semantic accent (green success, amber warning, red error, blue info). Never two equal-weight hues; never orange + yellow.
  - Plus neutrals: white `#FFFFFF`, paper `#F7F6F9`, light gray `#E7E4EA`, mid gray `#B9B4BF`, and ink `#0B0A10` (ink for tiny details only).
- **Neutrals carry a lot of the drawing.** Paper, cards, and pages are white or light gray; the hue is the object's identity, not every surface. A document is a white page with a rose header and rose text bars, not a pink page.
- **Flat, crisp, editorial (v3 revision).** Match the site's UI: 12px card radii, hairline borders, flat stat colors.
  - **No shadows.** No drop shadows, contact shadows, or shadow planes under objects.
  - **No puffiness.** No thickness edges, bevels, or white→gray fades on pages and cards. White pages and cards get a **1px light-gray `#E7E4EA` edge** so they read on white. This hairline is the only allowed stroke-as-edge.
  - **Gradients cut to near zero.** Use flat planes, with at most one subtle single-hue tone shift where it adds form (for example the lighter left half of the shield). Never use multi-hue gradients, especially orange→purple or pink→purple.
  - **2–3 tones per family**, with flat, clean separations.
- **Geometry:**
  - Crisp, deliberate forms on a 64×64 grid with 4px padding.
  - Corner radii: about 2–3px for cards and pages, 1–2px for small parts. Straight edges wherever the line icon has them.
  - Precise, real proportions, not inflated or toy-like.
  - No outlines around colored shapes; edges come from tone changes. The only exception is the hairline on white pages and cards.
- **No characters or mascots, and no facial expression.** The agent is the line icon's friendly robot head: a very rounded head, an antenna dot, and two round eyes. It has no brows, mouth, visor or other features that could read as a mood. People in "team" are abstract silhouettes without features.
- **Readable at 48px:** two or three main shapes, with details that survive the downscale. Nothing thinner than 1.5px at 64.
- **Works on white and on ink `#0B0A10`.** On dark, the light tints and whites must still separate from the background. White pages keep their 1px light-gray hairline on ink too.

## Palette by family (one lead family per icon, plus at most one small accent)

Each family below gives four tones, deep → base → light → highlight. The brand families follow the site's brand gradient (`#FF4B26` → `#FF2E7E` → `#8B3DFF`); the semantic families follow common UI state colors.

**Update:** the vermilion/orange family is dropped from the spot set; the design lead felt orange doesn't fit. The stat color vermilion stays in the site palette, but no spot uses it. Project is now sky and team is rose.

| Family | deep | base | light | highlight | Use |
|---|---|---|---|---|---|
| Rose (hot pink) | #C1125A | #FF2E7E | #FF4FA3 | #FFE6F0 | Brand identity |
| Coral | #C23A12 | #FF4B26 | #FFB199 | #FFE7DF | Brand identity |
| Violet (purple) | #5B21B6 | #8B3DFF | #A66BFF | #E4D6FF | Brand identity |
| Gold | #A86A00 | #E39200 | #FFC94D | #FFF3D1 | Semantic trust: the security shield only. Do not change. |
| Green | #15803D | #16A34A | #4ADE80 | #DCFCE7 | Semantic accent only: success / done / connected |
| Amber | #B45309 | #F59E0B | #FCD34D | #FEF3C7 | Semantic accent only: warning |
| Red | #B91C1C | #DC2626 | #F87171 | #FEE2E2 | Semantic accent only: error |
| Blue | #1D4ED8 | #3B82F6 | #93C5FD | #DBEAFE | Semantic accent only: info / link |

**Update (current rule):** neutrals (white, paper, gray, charcoal, ink) are real materials; brand color marks the meaningful part. Pink, coral and purple are the only brand identity colors. Green, amber, red and blue are small semantic accents only. **Security = gold shield (semantic), do not change.** The build check enforces this.

## Semantics: object + family per icon

Each spot is the filled, tonal version of its line icon (`svg/<name>.svg`). Trace the line geometry at ×64/24 (about 2.667), keeping its proportions, curves and positions, and turn the strokes into flat planes. At 48px the spot and the line icon should obviously be the same picture.

| Spot | Draw | Family | Why |
|---|---|---|---|
| document (PRD) | A white page with a folded corner, a pink title bar and fold, and gray lines | Pink | The core artifact |
| template | A white card inside thin (3px) purple corner brackets, with pink and purple text bars | Purple + pink | Structure and reuse |
| project | A light-gray folder with a darker tab, a white page peeking out and a pink label strip | Neutral + pink | A body of work |
| scorecard | A white clipboard with a purple clip, three rising pink bars, and one small green "passed" check | Pink + purple, green accent | Review and quality |
| coaching | One white oval bubble (the line icon's silhouette, 1px edge) with a pink trend arrow. No stacked second bubble | Pink | Guidance and growth |
| prototype | A white window with light-gray chrome, gray UI blocks and a pink cursor (the only brand color) | Pink | Screens and the interface |
| agent | The friendly robot: a pink rounded head, round white eyes, a purple antenna | Pink + purple | AI acting on your behalf |
| integrations / MCP | Two overlapping rounded squares, charcoal (your tool) and pink (ChatPRD), with the overlap in deep pink. Logo-level simple; reads at 16px | Pink on neutrals | The connection |
| team | Three avatars in a round cluster filling the circle keyline, with hairline separators only | Pink on neutrals | People |
| knowledge | A book with white and paper pages, a charcoal cover and spine, and a pink ribbon bookmark | Pink (on neutrals) | Reference and learning |
| chat | A light-gray oval bubble with a charcoal line and one pink line | Pink (on neutrals) | Conversation |
| security / enterprise | **The gold shield** with a lighter left half and a white check. Semantic trust color; do not change (locked in the build check) | Gold | Trust and protection |

## Files and code

All paths are relative to this repo.

- **Artwork:** `color/<name>.svg`, 12 files with the same names as today. Use `viewBox="0 0 64 64"`, no `transform`, no embedded raster, no editor metadata.
- **Manifest:** `manifest.json`. Update each spot's `colors` entry and the `palette` to the family tables above.
- **Codegen and checks:** `scripts/build.mjs`. Update the spot checks:
  - Each spot's non-neutral fills must come from one lead family, plus at most one accent family whose fills stay small (e.g. under ~15% of colored area, or listed as `accent` in the manifest).
  - Vermilion/orange is not a spot family, so any vermilion color is rejected.
  - Single-hue linear gradients are allowed but should be rare (v3 uses none); multi-hue are rejected.
  - Neutrals are always allowed.
  - Rose must be the family of at least 3 spots.
  - No family may lead more than 4 spots.
- **Generated components:** run `npm run icons` to regenerate the TypeScript modules. Don't edit that file by hand. The components keep their names and API (`<SpotDocument size={56} />`, default `aria-hidden`, optional `title`).
- **Preview:** `npm run preview` serves every spot in every tone, full and small, on white and on ink at http://localhost:4600.
- **Docs:** the repo `README.md`. Update the spot section, palette, and per-icon table to match.

## Acceptance checks

- [ ] Each icon reads as one lead color family plus neutrals, with at most one small accent. Squint test: one dominant hue per icon.
- [ ] The set as a whole shows clear variety: at least five different families across 12, with rose most common.
- [ ] The objects are what a viewer would expect, e.g. security is the gold shield and document is a white page.
- [ ] No facial expressions or mascots (the agent robot is geometric only), no shadows, no outlines except the 1px hairline on white pages, no multi-hue gradients.
- [ ] Looks polished next to Stripe- or Linear-quality product illustration, not clip art. Judge at 56px on white.
- [ ] Every icon reads correctly at 48px and on ink.
- [ ] `npm run check`, `npm run build` and `npm test` pass.
- [ ] Line icons are untouched.

## Tones and small tier (added later)

- **Tones.** Every spot also renders in single-family mono tones (`rose`, `coral`, `violet`), in `ink` grayscale, and in `white` for dark or art backgrounds, through the `tone` prop and the generated `color/<tone>/` SVGs. Draw only the brand version. Codegen maps each color to its role, so keep to the palette tones and mark details drawn on top of colored shapes with `data-ko="1"`.
- **Small tier.** Every spot also has a simplified 24×24 drawing (`color-small/<name>.svg`) for 20–32px: the line icon filled with color, at most two tones plus white, no hairlines and at most one text bar. Components switch to it automatically at `size` ≤ 32.
- **Neon rose.** Rose is pushed to a hotter magenta-pink (base `#FF2E7E`, light `#FF4FA3`) so pink-on-pink spots pop. The deep tone `#A80F50` stays for contrast, for example on the back figure in team.
- **App tones.** `tone="app"` renders spots through app CSS variables (see the README's App tones section). Green and orange stay reserved for states.
- **Keyline grid.** Every spot sits on one keyline: circle Ø52, square 46, portrait 42×52 or landscape 54×42 on the 64 grid (Ø20, 18, 16×20 and 20×16 on the 24 grid). Use the same radii, bar and stroke weights, and hairline everywhere. See the README spot spec.
- **Tint tone.** `tone="tint"` renders the line icon in the spot's lead color with an 18% fill, like the app's DuotoneIcon. It's generated from the line geometry, so line and tint always align.
