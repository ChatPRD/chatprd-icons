// Shared runtime for the generated icon and spot modules. Hand-written.
// Every generated module in ./icons and ./spots calls createIcon or createSpot once,
// so importing one icon pulls in this file plus that icon's geometry only.
import * as React from "react";

import { SMALL_MAX, SPOT_APP, SPOT_PALETTE, SPOT_TONE_SPEC, type ChatPRDSpotTone } from "./spot-config.js";

export type IconNode = ReadonlyArray<readonly [string, Record<string, string>, IconNode?]>;

export type ChatPRDIconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  /** Width and height in px (or any CSS length). Default 24. */
  size?: number | string;
  /** Stroke width in grid units. Default 1.75. */
  strokeWidth?: number | string;
  /** Keep the rendered stroke at `strokeWidth` px regardless of size (lucide-compatible). */
  absoluteStrokeWidth?: boolean;
  /** Accessible label. When set, the icon is exposed to assistive tech; otherwise it is aria-hidden. */
  title?: string;
};

export type ChatPRDIcon = React.ForwardRefExoticComponent<ChatPRDIconProps & React.RefAttributes<SVGSVGElement>> & {
  iconName: string;
};

export function createIcon(iconName: string, displayName: string, node: IconNode): ChatPRDIcon {
  const Icon = React.forwardRef<SVGSVGElement, ChatPRDIconProps>(function ChatPRDIconImpl(
    { size = 24, strokeWidth = 1.75, absoluteStrokeWidth, title, className, children, ...rest },
    ref,
  ) {
    const titleId = React.useId();
    const sw = absoluteStrokeWidth && typeof size === "number" ? (Number(strokeWidth) * 24) / size : strokeWidth;
    const a11y: React.SVGProps<SVGSVGElement> = title ? { role: "img", "aria-labelledby": titleId } : { "aria-hidden": true };
    return React.createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: sw,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        focusable: "false",
        className: ["chatprd-icon", `chatprd-icon-${iconName}`, className].filter(Boolean).join(" "),
        ...a11y,
        ...rest,
      },
      title ? React.createElement("title", { id: titleId }, title) : null,
      ...node.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs })),
      children,
    );
  }) as ChatPRDIcon;
  Icon.displayName = displayName;
  Icon.iconName = iconName;
  return Icon;
}

// ---------------------------------------------------------------------------
// Spot icons: full-color, 64px grid, for feature cards, empty states and onboarding.
// Colors are baked in from the brand palette; they do not follow currentColor.
// ---------------------------------------------------------------------------

const COLOR_KEYS: Record<string, string> = { fill: "fillOpacity", stroke: "strokeOpacity", stopColor: "stopOpacity" };

/** Families a spot uses, from manifest.spots. Role tokens ("lead.base", "accent.light", "neutral.white") resolve against these. */
export type SpotFamilies = {
  lead: string;
  second?: string;
  third?: string;
  accent?: string;
  app?: string;
  appRoles?: Record<string, string>;
};

function applyTone(attrs: Record<string, string>, tone: ChatPRDSpotTone, fam: SpotFamilies, ko: boolean) {
  const { lead, second, accent, app } = fam;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "data-ko") continue;
    const opKey = COLOR_KEYS[k];
    if (!opKey || !/^(lead|second|third|accent|neutral)\./.test(v)) {
      out[k] = v;
      continue;
    }
    let [kind, t] = v.split(".");
    let color: string;
    let opacity: number | undefined;
    if (tone === "app" && fam.appRoles?.[kind] && SPOT_APP) {
      const f = SPOT_APP.families[fam.appRoles[kind]];
      const ref = `var(${f.var}, ${f.light})`;
      const role = SPOT_APP.roles[t];
      out[k] = role.mixBlack ? `color-mix(in srgb, ${ref} ${Math.round((1 - role.mixBlack) * 100)}%, #000)` : ref;
      if (role.opacity !== undefined && role.opacity !== 1) out[opKey] = String(role.opacity);
      continue;
    }
    if (kind === "third" && tone === "brand") {
      out[k] = SPOT_PALETTE[fam.third ?? lead][t];
      continue;
    }
    if ((kind === "second" || kind === "third") && tone !== "brand") {
      t = (SPOT_TONE_SPEC[kind === "second" ? "secondTone" : "thirdTone"] as Record<string, string>)[t] ?? t;
      kind = "lead";
    }
    if (tone.startsWith("app") && SPOT_APP) {
      if (kind === "neutral") {
        const n = SPOT_APP.neutral[t];
        color = `var(${n.var}, ${n.light})`;
      } else {
        const family = SPOT_APP.families[tone === "app" ? (app ?? "accent") : tone.slice(4)];
        const ref = `var(${family.var}, ${family.light})`;
        const role = SPOT_APP.roles[kind === "accent" ? "light" : t];
        color = role.mixBlack ? `color-mix(in srgb, ${ref} ${Math.round((1 - role.mixBlack) * 100)}%, #000)` : ref;
        opacity = role.opacity;
      }
    } else if (tone === "white") {
      const w = SPOT_TONE_SPEC.white as unknown as {
        roles: Record<string, number>;
        neutral: Record<string, number>;
        knockout: { color: string; opacity: number };
      };
      if (ko) {
        color = w.knockout.color;
        opacity = w.knockout.opacity;
      } else {
        color = "#FFFFFF";
        opacity = kind === "neutral" ? w.neutral[t] : w.roles[t];
      }
    } else if (kind === "neutral") color = SPOT_PALETTE.neutral[t];
    else if (tone === "brand") color = SPOT_PALETTE[kind === "lead" ? lead : kind === "second" ? (second ?? lead) : (accent ?? lead)][t];
    else if (tone === "ink") color = (SPOT_TONE_SPEC.ink as Record<string, string>)[t];
    else color = SPOT_PALETTE[tone][kind === "accent" ? (SPOT_TONE_SPEC.monoAccentTone as string) : t];
    out[k] = color;
    if (opacity !== undefined && opacity !== 1) out[opKey] = String(opacity);
  }
  return out;
}

export type ChatPRDSpotProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  /** Width and height in px (or any CSS length). Default 56. */
  size?: number | string;
  /**
   * Color treatment. "brand" (default) uses each spot's own family; "tint" is the line icon
   * stroked in the lead color; a family name ("rose", "coral", "violet") renders every spot in
   * that one family; "ink" is grayscale for light backgrounds; "white" is translucent white for
   * dark or art backgrounds; "app" and "app-*" follow the app's CSS variables.
   */
  tone?: ChatPRDSpotTone;
  /**
   * "auto" (default) switches to the simplified small drawing when `size` is a number at or
   * below the small-tier threshold (32); "small" or "full" force one drawing.
   */
  variant?: "auto" | "small" | "full";
  /** Accessible label. When set, the spot is exposed to assistive tech; otherwise it is aria-hidden. */
  title?: string;
};

export type ChatPRDSpot = React.ForwardRefExoticComponent<ChatPRDSpotProps & React.RefAttributes<SVGSVGElement>> & {
  spotName: string;
};

export function createSpot(
  spotName: string,
  displayName: string,
  fam: SpotFamilies,
  full: IconNode,
  small?: IconNode,
  tint?: IconNode,
  tintColor?: string,
): ChatPRDSpot {
  const Spot = React.forwardRef<SVGSVGElement, ChatPRDSpotProps>(function ChatPRDSpotImpl(
    { size = 56, tone = "brand", variant = "auto", title, className, children, ...rest },
    ref,
  ) {
    const titleId = React.useId();
    if (tone === "tint" && tint) {
      // Line geometry, brand stroke, 18% fill (the app's DuotoneIcon treatment).
      return React.createElement(
        "svg",
        {
          ref,
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: tintColor,
          strokeWidth: 1.75,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          focusable: "false",
          className: ["chatprd-spot", "chatprd-spot-tone-tint", `chatprd-spot-${spotName}`, className].filter(Boolean).join(" "),
          ...(title ? { role: "img", "aria-labelledby": titleId } : { "aria-hidden": true }),
          ...rest,
        },
        title ? React.createElement("title", { id: titleId }, title) : null,
        ...tint.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs })),
        children,
      );
    }
    const useSmall = !!small && (variant === "small" || (variant === "auto" && typeof size === "number" && size <= SMALL_MAX));
    const node = useSmall ? small! : full;
    // Gradient ids are scoped per instance so several copies on one page never collide.
    const uid = titleId.replace(/[^A-Za-z0-9_-]/g, "");
    const scope = (attrs: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => [k, k === "id" ? `${uid}-${v}` : v.replace(/url\(#([\w-]+)\)/g, `url(#${uid}-$1)`)]),
      );
    const render = (n: IconNode[number], i: number, ko = false): React.ReactElement => {
      const isKo = ko || n[1]["data-ko"] === "1";
      const attrs = applyTone(n[1], tone, fam, isKo);
      return React.createElement(n[0], { key: i, ...scope(attrs) }, ...(n[2] ?? []).map((k, j) => render(k, j, isKo)));
    };
    const gradients = node.filter((n) => n[0] === "linearGradient");
    const shapes = node.filter((n) => n[0] !== "linearGradient");
    const a11y: React.SVGProps<SVGSVGElement> = title ? { role: "img", "aria-labelledby": titleId } : { "aria-hidden": true };
    return React.createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: useSmall ? "0 0 24 24" : "0 0 64 64",
        fill: "none",
        focusable: "false",
        className: ["chatprd-spot", useSmall && "chatprd-spot-small", `chatprd-spot-${spotName}`, tone !== "brand" && `chatprd-spot-tone-${tone}`, className]
          .filter(Boolean)
          .join(" "),
        ...a11y,
        ...rest,
      },
      title ? React.createElement("title", { id: titleId }, title) : null,
      gradients.length ? React.createElement("defs", null, ...gradients.map((n, i) => render(n, i))) : null,
      ...shapes.map((n, i) => render(n, i)),
      children,
    );
  }) as ChatPRDSpot;
  Spot.displayName = displayName;
  Spot.spotName = spotName;
  return Spot;
}
