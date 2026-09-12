/**
 * Одна точка правды по SEO: заголовок, описание и ключи каждой страницы.
 *
 * Раньше title и description жили строками внутри самих страниц. Из-за этого
 * их никто не мог ни пересчитать, ни проверить на длину и повторы, а карта
 * сайта правилась руками и отставала от маршрутов.
 *
 * Отсюда берут данные сразу трое:
 *   - страницы через SEOHead (то, что видит человек и Google после JS);
 *   - плагин сборки в vite.config.ts — он раскладывает готовый <head> по
 *     файлам dist/<путь>/index.html и собирает sitemap.xml;
 *   - scripts/seo-check.mjs — проверяет длины, повторы и расхождения.
 *
 * Файл намеренно без единого импорта картинок и без алиаса «@/»: его
 * загружает конфиг сборки, где ни того ни другого нет.
 */

import { BRAND, COACHBUILD, CRAFT, PLACE, merge } from "./keywords.ts";

export type ChangeFreq = "daily" | "weekly" | "monthly" | "yearly";

export interface PageSeo {
  /** До 60 знаков: дальше Google обрезает строку в выдаче. */
  title: string;
  /** 70–160 знаков. Короче — сниппет допишет сам поисковик, длиннее — обрежет. */
  description: string;
  keywords: string[];
  /** Служебные страницы, которым в индексе делать нечего. */
  noindex?: boolean;
  changefreq?: ChangeFreq;
  priority?: number;
}

const CRAFT_DUBAI = merge(CRAFT, PLACE, BRAND);

/* ------------------------------------------------------------------ */
/* Постоянные страницы                                                 */
/* ------------------------------------------------------------------ */

export const STATIC_PAGES: Record<string, PageSeo> = {
  "/": {
    title: "Bespoke G-Class Customization in Dubai | M Monogram",
    description:
      "M Monogram is a Dubai atelier rebuilding the Mercedes G-Class to order: widebody kits, forged wheels, carbon packages and fully retrimmed interiors.",
    keywords: CRAFT_DUBAI,
    changefreq: "weekly",
    priority: 1.0,
  },
  "/brand": {
    title: "The Atelier — Philosophy and Craft | M Monogram",
    description:
      "How M Monogram works: one commission at a time, drawn by hand, built in Dubai. The people, the standards and the reason every car leaves different.",
    keywords: merge(BRAND, ["luxury car atelier", "bespoke automotive design"], PLACE),
    changefreq: "monthly",
    priority: 0.9,
  },
  "/projects": {
    title: "Bespoke Builds — G-Class and Rolls-Royce | M Monogram",
    description:
      "Every car the atelier has delivered: the ICONIC G-Class in three packages and The Fusion Rolls-Royce in six finishes, with full build sheets.",
    keywords: merge(CRAFT, COACHBUILD, BRAND),
    changefreq: "weekly",
    priority: 0.9,
  },
  "/configurator": {
    title: "3D G-Class Configurator — Build Yours | M Monogram",
    description:
      "Build your G-Class in the browser: paint, forged wheel finishes, the ICONIC body kit, carbon and cabin leather, rendered in 3D as you choose.",
    keywords: merge(
      ["G-Class configurator", "3D car configurator", "build your G-Wagon"],
      CRAFT,
      BRAND
    ),
    changefreq: "monthly",
    priority: 0.9,
  },
  "/commission": {
    title: "Commission a Build — Upgrades and Pricing | M Monogram",
    description:
      "What the atelier fits and what it costs: body kits, forged wheels, carbon detailing, bespoke interiors, paint protection and ceramic coating.",
    keywords: merge(CRAFT, PLACE, ["car modification Dubai", "paint protection film Dubai"]),
    changefreq: "monthly",
    priority: 0.8,
  },
  "/verify": {
    title: "VIN Verification — Check a Build | M Monogram",
    description:
      "Enter a VIN to confirm a car was built by M Monogram and see the specification it left the atelier with. Protection against counterfeit kits.",
    keywords: merge(BRAND, ["VIN check", "verify custom build", "authenticity certificate"]),
    changefreq: "monthly",
    priority: 0.6,
  },
  "/contact": {
    title: "Contact the Dubai Atelier | M Monogram",
    description:
      "Reach M Monogram in Dubai by phone, WhatsApp or email, and find the representatives covering Germany, France, Monaco, Switzerland, Hungary and Nigeria.",
    keywords: merge(BRAND, PLACE, ["contact car atelier Dubai"]),
    changefreq: "monthly",
    priority: 0.8,
  },
  "/booking": {
    title: "Book a Consultation — Dubai Atelier | M Monogram",
    description:
      "Tell us the car and what you want done with it. Bookings go straight to the atelier in Dubai and are answered by the people who build the cars.",
    keywords: merge(BRAND, PLACE, ["book car customization", "consultation"]),
    changefreq: "monthly",
    priority: 0.7,
  },
  "/press": {
    title: "Press and Features | M Monogram",
    description:
      "Coverage of the atelier and its cars, from the reveal of the G 3.0 Iconic to features in the international motoring press.",
    keywords: merge(BRAND, ["M Monogram press", "G 3.0 Iconic news"]),
    changefreq: "weekly",
    priority: 0.7,
  },
  "/privacy-policy": {
    title: "Privacy Policy — How We Handle Your Data | M Monogram",
    description:
      "What personal data M Monogram collects through this site, how long it is kept, who can see it and how to have it removed.",
    keywords: ["privacy policy", "personal data", "M Monogram"],
    changefreq: "yearly",
    priority: 0.3,
  },
  "/offer-agreement": {
    title: "Offer Agreement and Terms of Service | M Monogram",
    description:
      "The public offer covering commissions and services carried out by M Monogram: scope of work, payment, timelines and liability.",
    keywords: ["offer agreement", "terms", "M Monogram"],
    changefreq: "yearly",
    priority: 0.3,
  },
};

/* ------------------------------------------------------------------ */
/* Проекты                                                             */
/* ------------------------------------------------------------------ */

const g = (title: string, description: string, extra: string[] = []): PageSeo => ({
  title,
  description,
  keywords: merge(CRAFT, BRAND, PLACE, extra),
  changefreq: "monthly",
  priority: 0.8,
});

const rr = (title: string, description: string, extra: string[] = []): PageSeo => ({
  title,
  description,
  keywords: merge(COACHBUILD, BRAND, PLACE, extra),
  changefreq: "monthly",
  priority: 0.8,
});

export const PROJECT_PAGES: Record<string, PageSeo> = {
  "g3-iconic": g(
    "ICONIC — The G-Class Rebuilt | M Monogram",
    "The ICONIC takes a Mercedes G-Class down to the shell and back: Maybach-style grille, widened arches, 24-inch forged wheels and a hand-trimmed cabin.",
    ["G-Class ICONIC", "G 3.0 Iconic"]
  ),
  "g3-iconic-black": g(
    "ICONIC Black Package — Stealth G-Class | M Monogram",
    "Obsidian black over a full black-out: grille, trim and 24-inch forged turbine wheels in gloss black, with black Nappa throughout the cabin.",
    ["black G-Wagon", "blacked out G63"]
  ),
  "g3-iconic-gold": g(
    "ICONIC Gold Package — Black and 24K Gold | M Monogram",
    "Obsidian black with 24K gold trim: gold-mesh Maybach-style grille, gold-centred forged wheels and a two-tone black and cognac Nappa interior.",
    ["gold G-Wagon", "gold G63"]
  ),
  "g3-iconic-grey": g(
    "ICONIC Silver Package — Graphite and Chrome | M Monogram",
    "Graphite Silver with a chrome Maybach-style grille, silver exterior trim and 24-inch forged chrome wheels over black Nappa with silver accents.",
    ["silver G-Wagon", "chrome G63"]
  ),
  "rolls-royce-fusion": rr(
    "The Fusion — Coachbuilt Rolls-Royce | M Monogram",
    "The Fusion reworks a Rolls-Royce into a two-tone speedster: reshaped rear deck, hand-laid paint and a cabin retrimmed to match, in six finishes.",
    ["Rolls-Royce Fusion", "coachbuilt speedster"]
  ),
  "fusion-crimson": rr(
    "Fusion Crimson — Rolls-Royce in Crimson | M Monogram",
    "Crimson metallic over a black hood, with the reshaped Fusion rear deck and an interior trimmed to carry the same two-tone through the cabin.",
    ["crimson Rolls-Royce"]
  ),
  "fusion-turquoise": rr(
    "Fusion Turquoise — Rolls-Royce in Turquoise | M Monogram",
    "Turquoise metallic against a black hood: the rarest reading of The Fusion, with cabin leather mixed to sit against the exterior rather than match it.",
    ["turquoise Rolls-Royce"]
  ),
  "fusion-bronze": rr(
    "Fusion Bronze — Rolls-Royce in Bronze | M Monogram",
    "Bronze metallic with a champagne hood, the warmest of the Fusion finishes, trimmed inside in leather chosen to hold the same light.",
    ["bronze Rolls-Royce"]
  ),
  "fusion-azure": rr(
    "Fusion Azure — Rolls-Royce in Azure | M Monogram",
    "Azure metallic over black: the coolest reading of The Fusion, with the coachbuilt rear deck and a cabin retrimmed to the same specification.",
    ["azure Rolls-Royce", "blue Rolls-Royce"]
  ),
  "fusion-arctic": rr(
    "Fusion Arctic — Rolls-Royce in Arctic White | M Monogram",
    "Arctic white over the coachbuilt Fusion body, the plainest surface the atelier offers and the one that shows the panel work most clearly.",
    ["white Rolls-Royce"]
  ),
  "fusion-amethyst": rr(
    "Fusion Amethyst — Rolls-Royce in Amethyst | M Monogram",
    "Amethyst metallic on the coachbuilt Fusion body, a purple mixed for this car alone, with an interior trimmed to sit against it.",
    ["purple Rolls-Royce", "amethyst Rolls-Royce"]
  ),
};

/* ------------------------------------------------------------------ */
/* Пресса                                                              */
/* ------------------------------------------------------------------ */

const press = (title: string, description: string, extra: string[] = []): PageSeo => ({
  title,
  description,
  keywords: merge(BRAND, ["G 3.0 Iconic"], extra),
  changefreq: "monthly",
  priority: 0.6,
});

export const PRESS_PAGES: Record<string, PageSeo> = {
  "was-g63-became-m-monogram-iconic": press(
    "It Was a G63 — Now It Is the G 3.0 Iconic | M Monogram",
    "What actually changes when a G63 becomes the M Monogram G 3.0 Iconic: the panels that are replaced, the ones that are reshaped and what stays.",
    ["G63 conversion"]
  ),
  "m-monogram-g-3-0-iconic": press(
    "G 3.0 Iconic — A G-Wagen Reimagined | M Monogram",
    "The G 3.0 Iconic reads the modern G-Class through the classic Mercedes saloons: upright grille, slim lamps and chrome used the way it once was.",
    ["classic Mercedes design"]
  ),
  "dubai-tuner-700k-g-class-face-mercedes-only-sketched": press(
    "The $700,000 G-Class Mercedes Only Sketched | M Monogram",
    "International coverage of the M Monogram G-Class that wears a front end Mercedes drew as a concept and never put into production.",
    ["Dubai tuner", "G-Class concept"]
  ),
};

/* ------------------------------------------------------------------ */
/* Представительства                                                   */
/* ------------------------------------------------------------------ */

const rep = (region: string, description: string): PageSeo => ({
  title: `M Monogram ${region} — Local Representative`,
  description,
  keywords: merge(BRAND, [`G-Class customization ${region}`, "M Monogram representative"]),
  changefreq: "monthly",
  priority: 0.5,
});

export const REP_PAGES: Record<string, PageSeo> = {
  "switzerland-hungary": rep(
    "Switzerland & Hungary",
    "The M Monogram representative for Switzerland and Hungary: local viewings, commissions and delivery of cars built by the Dubai atelier."
  ),
  germany: rep(
    "Germany",
    "The M Monogram representative for Germany: local viewings, commissions and delivery of cars built by the atelier in Dubai."
  ),
  "france-monaco": rep(
    "France & Monaco",
    "The M Monogram representative for France and Monaco: local viewings, commissions and delivery of cars built by the Dubai atelier."
  ),
  nigeria: rep(
    "Nigeria",
    "Ugogbuzuo Auto Link Ltd, Enugu — the M Monogram representative for Nigeria and West Africa: GCC spec vehicles, local viewings and delivery from Dubai."
  ),
};

/* ------------------------------------------------------------------ */

/** Все индексируемые адреса сайта с их SEO — в порядке карты сайта. */
export function allPages(): Array<{ path: string; seo: PageSeo }> {
  return [
    ...Object.entries(STATIC_PAGES).map(([path, seo]) => ({ path, seo })),
    ...Object.entries(PROJECT_PAGES).map(([slug, seo]) => ({ path: `/projects/${slug}`, seo })),
    ...Object.entries(PRESS_PAGES).map(([slug, seo]) => ({ path: `/press/${slug}`, seo })),
    ...Object.entries(REP_PAGES).map(([slug, seo]) => ({ path: `/representatives/${slug}`, seo })),
  ].filter((p) => !p.seo.noindex);
}

/** SEO конкретного адреса; для неизвестных путей — null. */
export function seoForPath(path: string): PageSeo | null {
  const clean = path.replace(/\/+$/, "") || "/";
  if (STATIC_PAGES[clean]) return STATIC_PAGES[clean];
  const project = clean.match(/^\/projects\/(.+)$/);
  if (project) return PROJECT_PAGES[project[1]] ?? null;
  const article = clean.match(/^\/press\/(.+)$/);
  if (article) return PRESS_PAGES[article[1]] ?? null;
  const representative = clean.match(/^\/representatives\/(.+)$/);
  if (representative) return REP_PAGES[representative[1]] ?? null;
  return null;
}
