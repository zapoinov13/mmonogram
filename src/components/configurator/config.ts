/**
 * Пресеты и состояние 3D-конфигуратора.
 * Состояние кодируется в URL (?c=version-model-color-rim-rimColor-kit-carbon-lights-env-grille...),
 * чтобы сборкой можно было делиться ссылкой — как у Mansory.
 */

import { CAR_IDS, DEFAULT_CAR, type CarId } from "./models";

export interface PaintOption {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
}

export interface RimDesign {
  id: string;
  name: string;
}

export interface RimFinish {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
}

export const PAINTS: PaintOption[] = [
  { id: "obsidian", name: "Obsidian Black", color: "#0b0b0d", metalness: 0.9, roughness: 0.32 },
  { id: "polar", name: "Polar White", color: "#e8e8e6", metalness: 0.55, roughness: 0.3 },
  { id: "nardo", name: "Nardo Silver", color: "#7d8287", metalness: 0.6, roughness: 0.34 },
  { id: "emerald", name: "Emerald", color: "#0e3d2c", metalness: 0.85, roughness: 0.3 },
  { id: "oxblood", name: "Oxblood", color: "#4a0f14", metalness: 0.85, roughness: 0.3 },
  { id: "aurum", name: "Desert Aurum", color: "#8a6d3b", metalness: 0.95, roughness: 0.28 },
  { id: "graphite-blue", name: "Graphite Blue", color: "#182431", metalness: 0.8, roughness: 0.31 },
  { id: "selenite", name: "Selenite Silver", color: "#9fa4a8", metalness: 0.9, roughness: 0.24 },
  { id: "cashmere", name: "Cashmere Sand", color: "#b5a17d", metalness: 0.72, roughness: 0.34 },
  { id: "designo-red", name: "Designo Red", color: "#8b1118", metalness: 0.86, roughness: 0.29 },
];

export const RIM_DESIGNS: RimDesign[] = [
  { id: "monoblock", name: "MG.1 Monoblock" },
  { id: "multispoke", name: "ICONIC Original" },
  { id: "crossspoke", name: "MG.9 Cross-Spoke" },
  { id: "turbine", name: "MG.11 Turbine" },
  { id: "disc", name: "MG.12 Aero Disc" },
];

export const RIM_FINISHES: RimFinish[] = [
  { id: "graphite", name: "Graphite", color: "#26282b", metalness: 0.9, roughness: 0.35 },
  { id: "silver", name: "Brushed Silver", color: "#b9bec4", metalness: 1.0, roughness: 0.25 },
  { id: "gold", name: "Champagne Gold", color: "#9c7c45", metalness: 1.0, roughness: 0.28 },
  { id: "black", name: "Gloss Black", color: "#070708", metalness: 0.82, roughness: 0.16 },
  { id: "bronze", name: "Smoked Bronze", color: "#6f5635", metalness: 0.95, roughness: 0.25 },
];

export interface CaliperFinish {
  id: string;
  name: string;
  color: string;
}

export const CALIPER_FINISHES: CaliperFinish[] = [
  { id: "red", name: "Performance Red", color: "#b41618" },
  { id: "black", name: "Gloss Black", color: "#050505" },
  { id: "gold", name: "M Gold", color: "#b48a43" },
  { id: "silver", name: "Silver", color: "#c4c7ca" },
  { id: "blue", name: "Electric Blue", color: "#1d5dff" },
];

export interface KitPackage {
  id: string;
  name: string;
}

/* Обвес приходит одним файлом body-kit-wheels.glb. Раньше пакетов было
   четыре — Signature, Blackline, Heritage выглядели в сцене абсолютно
   одинаково, посетитель нажимал и не понимал, почему ничего не происходит.

   «Stock Version» убран следом и по той же причине, только хуже: он прятал
   весь файл обвеса, а там лежат не только накладки, но и колёса, арки и
   бамперы. Оставался голый каркас с открытой подвеской и без единого
   колеса — машина выглядела разобранной. Стокового кузова, пригодного для
   показа, у нас просто нет: отдельной выгрузки под него никто не делал.

   Появятся отдельные файлы — вернём и выбор. */
export const KIT_PACKAGES: KitPackage[] = [
  { id: "signature", name: "M Monogram ICONIC" },
];

export interface InteriorFinish {
  id: string;
  name: string;
  primary: string;
  accent: string;
}

export const INTERIOR_FINISHES: InteriorFinish[] = [
  { id: "burgundy", name: "Burgundy Atelier", primary: "#241f1e", accent: "#4a231c" },
  { id: "onyx", name: "Onyx Black", primary: "#0c0c0d", accent: "#19191b" },
  { id: "sand", name: "Cashmere Sand", primary: "#1a1714", accent: "#a98e68" },
  { id: "cognac", name: "Cognac Heritage", primary: "#161210", accent: "#8a4d2b" },
];

/** Отделка решётки и декоративного металла: у G63 Iconic он золотой. */
export interface GrilleFinish {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
}

export const GRILLE_FINISHES: GrilleFinish[] = [
  { id: "gold", name: "Brushed Gold", color: "#a58a5e", metalness: 1, roughness: 0.19 },
  { id: "silver", name: "Polished Silver", color: "#cfd3d6", metalness: 1, roughness: 0.1 },
  { id: "black", name: "Gloss Black", color: "#101113", metalness: 0.9, roughness: 0.16 },
];

export interface BuildConfig {
  model: CarId;
  paint: number;
  rim: number;
  rimFinish: number;
  caliper: number;
  kitPackage: number;
  kit: boolean;
  carbon: boolean;
  lights: boolean;
  night: boolean;
  grille: number;
  interior: number;
  doors: boolean;
  hood: boolean;
  trunk: boolean;
  saved: boolean;
}

/** Camera presets tied to config panel sections */
export type CameraFocus =
  | "default" | "exterior" | "wheels" | "kit" | "carbon" | "lights" | "env"
  /* Ракурсы внутри салона */
  | "interiorFront" | "interiorDriver" | "interiorRear";

/* Ракурсы, в которых камера находится внутри салона */
const INTERIOR_FOCUS: CameraFocus[] = ["interiorFront", "interiorDriver", "interiorRear"];
export const isInteriorFocus = (f: CameraFocus) => INTERIOR_FOCUS.includes(f);

/* По умолчанию машина собирается в тёмном гараже: чёрный лак на светлом фоне
   терялся, а тёмный зал — фирменная подача ателье. */
export const DEFAULT_CONFIG: BuildConfig = {
  model: DEFAULT_CAR,
  paint: 0,
  rim: 1,
  rimFinish: 0,
  caliper: 0,
  kitPackage: 0,
  kit: true,
  carbon: true,
  lights: true,
  night: false,
  grille: 0,
  interior: 0,
  doors: false,
  hood: false,
  trunk: false,
  saved: false,
};

/**
 * Три фирменных пакета из линейки ателье, собранные заранее.
 *
 * Раньше конфигуратор открывался на заводской машине, и посетитель должен был
 * сам догадаться, что собирать. Между тем на сайте уже продаются ровно три
 * готовых пакета — с них и логично начинать: одно касание показывает товар,
 * дальше его можно править как угодно.
 *
 * Значения взяты из спецификаций в src/data/projects.ts, чтобы 3D и страницы
 * проектов не разъезжались.
 */
export interface SignatureBuild {
  id: string;
  name: string;
  tagline: string;
  /** Страница проекта на сайте — та же машина в фотографиях. */
  slug: string;
  /**
   * Пакет — это отделка металла: решётка, кант по борту, вставки порогов и
   * диски. Кузов он не перекрашивает: цвет человек выбирает отдельно, и
   * терять его выбор при нажатии на пакет нельзя.
   */
  config: BuildConfig;
}

export const SIGNATURE_BUILDS: SignatureBuild[] = [
  {
    id: "black",
    name: "Black Package",
    tagline: "Grille, trim and wheels in gloss black",
    slug: "g3-iconic-black",
    config: { ...DEFAULT_CONFIG, grille: 2 /* Gloss Black */, rimFinish: 3 /* Gloss Black */ },
  },
  {
    id: "gold",
    name: "Gold Package",
    tagline: "Brushed gold grille, gold-centred wheels",
    slug: "g3-iconic-gold",
    config: { ...DEFAULT_CONFIG, grille: 0 /* Brushed Gold */, rimFinish: 2 /* Champagne Gold */ },
  },
  {
    id: "silver",
    name: "Silver Package",
    tagline: "Polished chrome grille and wheels",
    slug: "g3-iconic-grey",
    config: { ...DEFAULT_CONFIG, grille: 1 /* Polished Silver */, rimFinish: 1 /* Brushed Silver */ },
  },
];

/**
 * Какому пакету отвечает текущая сборка.
 *
 * Сравниваются только решётка и отделка дисков — то, что пакет и задаёт.
 * Краска, салон, свет и окружение остаются за человеком: он выбирает цвет
 * кузова сам, и подпись «Black Package» от смены краски слетать не должна.
 */
export function matchSignatureBuild(c: BuildConfig): SignatureBuild | null {
  return (
    SIGNATURE_BUILDS.find((b) => b.config.grille === c.grille && b.config.rimFinish === c.rimFinish) ??
    null
  );
}

/* Первый сегмент — версия схемы: старые ссылки не ломаются при добавлении опций */
const SCHEMA_VERSION = 4;

export function encodeConfig(c: BuildConfig): string {
  const model = Math.max(CAR_IDS.indexOf(c.model), 0);
  return [
    SCHEMA_VERSION,
    model,
    c.paint,
    c.rim,
    c.rimFinish,
    c.kitPackage,
    +c.carbon,
    +c.lights,
    +c.night,
    c.grille,
    c.caliper,
    c.interior,
    +c.doors,
    +c.hood,
    +c.trunk,
    +c.saved,
  ].join("-");
}

export function decodeConfig(raw: string | null): BuildConfig {
  if (!raw) return DEFAULT_CONFIG;
  const rawParts = raw.split("-");

  /* Четвёртое поколение ссылок: версия 3 добавила выбор 3D-модели.
     Старые ссылки сохраняют модель по умолчанию. */
  let model = DEFAULT_CONFIG.model;
  let p: number[];
  if (rawParts[0] === "4" || rawParts[0] === "3") {
    const modelIdx = parseInt(rawParts[1], 10);
    model = CAR_IDS[modelIdx] ?? DEFAULT_CONFIG.model;
    p = rawParts.slice(2).map((n) => parseInt(n, 10));
  } else {
    p = rawParts.map((n) => parseInt(n, 10));
  }

  if (p.some((n) => Number.isNaN(n))) return DEFAULT_CONFIG;

  /* Старые поколения: 7 сегментов без версии, 8 с версией 1,
     9 с версией 2 и отделкой решётки. Недостающее берётся из умолчаний. */
  if ((p.length === 9 && p[0] === 2) || (p.length === 8 && p[0] === 1)) p = p.slice(1);
  if (p.length !== 7 && p.length !== 8 && p.length !== 14) return DEFAULT_CONFIG;

  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
  const fromV4 = p.length === 14;
  const kitPackage = fromV4 ? clamp(p[3], KIT_PACKAGES.length - 1) : p[3] === 1 ? 1 : 0;
  return {
    model,
    paint: clamp(p[0], PAINTS.length - 1),
    rim: clamp(p[1], RIM_DESIGNS.length - 1),
    rimFinish: clamp(p[2], RIM_FINISHES.length - 1),
    caliper: fromV4 ? clamp(p[8], CALIPER_FINISHES.length - 1) : DEFAULT_CONFIG.caliper,
    kitPackage,
    /* Обвес стоит всегда. Раньше признак выводился из номера пакета
       (kitPackage > 0), но пакет теперь один и его номер — ноль, так что
       старое правило выключало обвес на каждой ссылке и оставляло машину
       без колёс. Выбирать тут нечего, пока нет отдельной стоковой выгрузки. */
    kit: true,
    /* Карбон-пакет входит в сборку всегда: выбирать его больше негде (см.
       ConfiguratorPage), а старая ссылка с нулём показывала бы в
       спецификации «нет», хотя на машине ничего не меняется. */
    carbon: true,
    lights: p[5] === 1,
    night: p[6] === 1,
    grille: clamp(p[7] ?? DEFAULT_CONFIG.grille, GRILLE_FINISHES.length - 1),
    interior: fromV4 ? clamp(p[9], INTERIOR_FINISHES.length - 1) : DEFAULT_CONFIG.interior,
    doors: fromV4 ? p[10] === 1 : DEFAULT_CONFIG.doors,
    hood: fromV4 ? p[11] === 1 : DEFAULT_CONFIG.hood,
    trunk: fromV4 ? p[12] === 1 : DEFAULT_CONFIG.trunk,
    saved: fromV4 ? p[13] === 1 : DEFAULT_CONFIG.saved,
  };
}
