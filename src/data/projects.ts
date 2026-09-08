// G3.0 M Monogram ICONIC – edition covers
import g3Black from "@/assets/g-2.jpg";
import g3BlackAlt from "@/assets/g3-black-04.jpg";
import g3BlackHood from "@/assets/g3-black-01.jpg";
import g3BlackOverhead from "@/assets/g3-black-02.jpg";
import g3BlackRear from "@/assets/g3-black-07.jpg";
import g3BlackSide from "@/assets/g3-black-03.jpg";
import g3GoldCover from "@/assets/g-3.jpg";
import g3GoldFront from "@/assets/g3-iconic-gold-front.jpg";
import greyCover from "@/assets/iconic-silver-g1.jpg";
import greyStudio from "@/assets/g3-grey-studio.jpg";
import greyRear from "@/assets/g3-grey-rear.jpg";
import greyDetail from "@/assets/g3-grey-detail.jpg";
import greyOverhead from "@/assets/g3-grey-overhead.jpg";
import g3GoldSide from "@/assets/g3-iconic-gold-side.jpg";
import g3GoldRear from "@/assets/g3-iconic-gold-rear.jpg";
import g3GoldDetail from "@/assets/g3-iconic-gold-detail.jpg";
import g3GoldWindow from "@/assets/g3-iconic-gold-window.jpg";
import g3GoldWheel from "@/assets/g3-iconic-gold-wheel.jpg";
import g3GoldInterior from "@/assets/g3-iconic-gold-interior.jpg";
import g3GoldRearSeats from "@/assets/g3-iconic-gold-rearseats.jpg";
import g3GoldCabin from "@/assets/g3-iconic-gold-cabin.jpg";
import g3GoldDash from "@/assets/g3-iconic-gold-dash.jpg";

import fusionCover from "@/assets/fusion/cover.jpg";
import fusion01 from "@/assets/fusion/01-front-3q.jpg";
import fusion02 from "@/assets/fusion/02-front-side.jpg";
import fusion03 from "@/assets/fusion/03-front-passenger.jpg";
import fusion04 from "@/assets/fusion/04-side.jpg";
import fusion05 from "@/assets/fusion/05-rear-top.jpg";
import fusion06 from "@/assets/fusion/06-rear-3q.jpg";
import fusion07 from "@/assets/fusion/07-rear.jpg";
import fusion08 from "@/assets/fusion/08-top.jpg";
import fusion09 from "@/assets/fusion/09-interior-top.jpg";

const fusionTurquoiseCoverUrl = "/__l5e/assets-v1/8970a228-257e-40e6-8477-ea6d545d805b/03-_1.jpg";

import fusionCrimsonStudio from "@/assets/fusion-editions/crimson.jpg";
import fusionTurquoiseStudio from "@/assets/fusion-editions/turquoise.jpg";
import fusionAzureStudio from "@/assets/fusion-editions/azure.jpg";
import fusionArcticStudio from "@/assets/fusion-editions/arctic.jpg";
import fusionAmethystStudio from "@/assets/fusion-editions/amethyst.jpg";

// Original Fusion archive photos
import img6694 from "@/assets/IMG_6694.webp";
import img6695 from "@/assets/IMG_6695.webp";
import img6696 from "@/assets/IMG_6696.webp";
import img6697 from "@/assets/IMG_6697.webp";
import img6698 from "@/assets/IMG_6698.webp";
import img6699 from "@/assets/IMG_6699.webp";
import img6700 from "@/assets/IMG_6700.webp";
import img6701 from "@/assets/IMG_6701.webp";
import img6702 from "@/assets/IMG_6702.webp";
import img6703 from "@/assets/IMG_6703.webp";
import img6704 from "@/assets/IMG_6704.webp";
import img6705 from "@/assets/IMG_6705.webp";
import img6706 from "@/assets/IMG_6706.webp";
import img6707 from "@/assets/IMG_6707.webp";
import img6708 from "@/assets/IMG_6708.webp";

export interface ProjectSpecs {
  exterior: string;
  interior: string;
  carbon: string;
  spoilers: string;
  wheels: string;
  aeroKit: string;
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  duration: string;
  package: string;
  category: string;
  coverImage: string;
  images: { src: string; title: string }[];
  description: string;
  modifications: string[];
  specs: ProjectSpecs;
  videoUrl?: string;
  isHub?: boolean;
  editionOf?: string;
}

export const GWAGEN_HUB_ID = "g3-iconic";
export const FUSION_HUB_ID = "rolls-royce-fusion";

export const GWAGEN_EDITION_ORDER = [
  "g3-iconic-black",
  "g3-iconic-grey",
  "g3-iconic-gold",
] as const;

export const FUSION_EDITION_ORDER = [
  "fusion-crimson",
  "fusion-turquoise",
  "fusion-azure",
  "fusion-arctic",
  "fusion-amethyst",
] as const;

export const STATIC_FAMILY_SLUGS = new Set<string>([
  GWAGEN_HUB_ID,
  FUSION_HUB_ID,
  ...GWAGEN_EDITION_ORDER,
  ...FUSION_EDITION_ORDER,
]);

export function projectKey(project: { id: string; slug?: string }) {
  return project.slug ?? project.id;
}

export function isGWagenHubId(id: string) {
  return id === GWAGEN_HUB_ID;
}

export function isFusionHubId(id: string) {
  return id === FUSION_HUB_ID;
}

export function isHubProject(project: { id: string; slug?: string; isHub?: boolean }) {
  const id = projectKey(project);
  return Boolean(project.isHub) || isGWagenHubId(id) || isFusionHubId(id);
}

export function getEditionsOf<T extends { id: string; slug?: string; editionOf?: string }>(
  hubId: string,
  projects: T[]
): T[] {
  const order =
    hubId === GWAGEN_HUB_ID
      ? GWAGEN_EDITION_ORDER
      : hubId === FUSION_HUB_ID
        ? FUSION_EDITION_ORDER
        : null;
  const map = new Map(projects.map((p) => [projectKey(p), p]));
  if (order) {
    return order.map((id) => map.get(id)).filter((p): p is T => Boolean(p));
  }
  return projects.filter((p) => p.editionOf === hubId);
}

export function getGWagenEditionsFrom<T extends { id: string; slug?: string }>(projects: T[]): T[] {
  return getEditionsOf(GWAGEN_HUB_ID, projects);
}

export function getLatestAdditionHubs<T extends { id: string; slug?: string }>(projects: T[]): T[] {
  const map = new Map(projects.map((p) => [projectKey(p), p]));
  return [GWAGEN_HUB_ID, FUSION_HUB_ID].map((id) => map.get(id)).filter((p): p is T => Boolean(p));
}

export function getListingProjects<T extends { id: string; slug?: string; editionOf?: string }>(
  projects: T[]
): T[] {
  return projects.filter((p) => !p.editionOf);
}

export const projects: Project[] = [
  {
    id: "g3-iconic",
    title: "ICONIC",
    subtitle: "Black Edition",
    year: "2024",
    duration: "12 weeks",
    package: "Ultra-Limited",
    category: "G-Class",
    coverImage: g3Black,
    isHub: true,
    images: [{ src: g3Black, title: "Black Package" }],
    description: "An ultra-limited G-Class transformation in three exclusive packages — Black, Gold and Silver.",
    modifications: [
      "M Monogram exterior identity package",
      "Three exclusive packages: Black, Gold, Silver",
    ],
    specs: {
      exterior: "Three exclusive finishes",
      interior: "Bespoke Nappa cabin",
      carbon: "Carbon detailing",
      spoilers: "Integrated roof spoiler",
      wheels: "24'' Forged M Monogram",
      aeroKit: "M Monogram ICONIC bodykit",
    },
  },
  {
    id: "g3-iconic-black",
    editionOf: "g3-iconic",
    title: "Black Package",
    subtitle: "ICONIC",
    year: "2024",
    duration: "12 weeks",
    package: "Ultra-Limited",
    category: "G-Class",
    coverImage: g3Black,
    images: [
      { src: g3Black, title: "Front three-quarter" },
      { src: g3BlackAlt, title: "Stealth studio three-quarter" },
      { src: g3BlackOverhead, title: "Overhead" },
      { src: g3BlackHood, title: "Hood overhead" },
      { src: g3BlackSide, title: "Side profile" },
      { src: g3BlackRear, title: "Rear three-quarter" },
    ],
    description: "Black Package — a pure dark signature. Discreet, aggressive and uncompromising, with a commanding collector-level presence.",
    modifications: [
      "M Monogram exterior identity package",
      "Full stealth black-out: grille, trim and wheels",
      "Illuminated star air intakes",
      "24'' forged black turbine wheels",
    ],
    specs: {
      exterior: "Obsidian Black stealth",
      interior: "Black Nappa",
      carbon: "Gloss black carbon",
      spoilers: "Integrated roof spoiler",
      wheels: "24'' Forged black turbine",
      aeroKit: "M Monogram ICONIC bodykit",
    },
  },
  {
    id: "g3-iconic-gold",
    editionOf: "g3-iconic",
    title: "Gold Package",
    subtitle: "ICONIC",
    year: "2024",
    duration: "12 weeks",
    package: "Ultra-Limited",
    category: "G-Class",
    coverImage: g3GoldCover,
    images: [
      { src: g3GoldCover, title: "Gold grille three-quarter" },
      { src: g3GoldFront, title: "Front view" },
      { src: g3GoldSide, title: "Side profile" },
      { src: g3GoldRear, title: "Rear view" },
      { src: g3GoldDetail, title: "Hood & wheel detail" },
      { src: g3GoldWindow, title: "Cabin through window" },
      { src: g3GoldWheel, title: "Forged wheel" },
      { src: g3GoldInterior, title: "Cockpit" },
      { src: g3GoldDash, title: "Dashboard signature" },
      { src: g3GoldCabin, title: "Rear cabin & door detail" },
      { src: g3GoldRearSeats, title: "Rear seats" },
    ],
    description: "Gold Package — a bold black-and-gold statement for those who choose visibility, power and ultimate luxury.",
    modifications: [
      "M Monogram exterior identity package",
      "24K gold-accented forged wheels",
      "Custom Maybach grille with gold mesh",
      "Bespoke two-tone leather cabin (black / cognac)",
      "M Monogram signature dashboard inlay",
    ],
    specs: {
      exterior: "Obsidian Black with gold trim",
      interior: "Black & Cognac Nappa, gold accents",
      carbon: "Gloss black carbon detailing",
      spoilers: "Integrated roof spoiler",
      wheels: "24'' Forged M Monogram, gold center",
      aeroKit: "M Monogram ICONIC bodykit",
    },
  },
  {
    id: "g3-iconic-grey",
    editionOf: "g3-iconic",
    title: "Silver Package",
    subtitle: "ICONIC",
    year: "2024",
    duration: "12 weeks",
    package: "Ultra-Limited",
    category: "G-Class",
    coverImage: greyCover,
    images: [
      { src: greyCover, title: "Front three-quarter" },
      { src: greyStudio, title: "Studio high angle" },
      { src: greyRear, title: "Rear three-quarter" },
      { src: greyDetail, title: "Front detail" },
      { src: greyOverhead, title: "Overhead front" },
    ],
    description: "Silver Package — a refined monochrome interpretation with a sharper, colder and more futuristic character.",
    modifications: [
      "M Monogram exterior identity package",
      "Maybach-style chrome grille",
      "Satin-dark body with silver trim",
      "24'' forged chrome wheels",
    ],
    specs: {
      exterior: "Graphite Silver / chrome",
      interior: "Black Nappa, silver accents",
      carbon: "Dark carbon detailing",
      spoilers: "Integrated roof spoiler",
      wheels: "24'' Forged chrome",
      aeroKit: "M Monogram ICONIC bodykit",
    },
  },

  {
    id: "rolls-royce-fusion",
    title: "The Fusion",
    subtitle: "Bespoke Edition",
    year: "2024",
    duration: "12 weeks",
    package: "Full",
    category: "Bespoke Concept",
    coverImage: fusionCrimsonStudio,
    isHub: true,
    images: [{ src: fusionCrimsonStudio, title: "Crimson edition" }],
    description: "The Fusion is a modern luxury statement in exclusive colourways — Crimson, Turquoise, Azure, Arctic and Amethyst.",
    modifications: [
      "Bespoke exterior design elements",
      "Sculpted signature grille",
      "Handcrafted open-top interior",
      "Five exclusive colour editions",
    ],
    specs: {
      exterior: "Five exclusive finishes",
      interior: "Bespoke handcrafted leather",
      carbon: "Carbon fiber hood accents",
      spoilers: "Integrated rear diffuser",
      wheels: "22'' Forged dark finish",
      aeroKit: "Custom open-top conversion",
    },
  },
  {
    id: "fusion-crimson",
    editionOf: "rolls-royce-fusion",
    title: "Crimson",
    subtitle: "The Fusion",
    year: "2024",
    duration: "12 weeks",
    package: "Full",
    category: "Bespoke Concept",
    coverImage: fusionCrimsonStudio,
    images: [
      { src: fusionCrimsonStudio, title: "Studio front three-quarter" },
      { src: fusionCover, title: "Studio front three-quarter alt" },
      { src: img6708, title: "Street front three-quarter" },
      { src: img6694, title: "Side profile" },
      { src: img6700, title: "Rear three-quarter" },
    ],
    description: "Crimson Edition — a deep ruby-red body with a black hood. A bold, nocturnal presence for the open-top Fusion.",
    modifications: [
      "Bespoke crimson metallic body",
      "Gloss black hood and lower body",
      "Sculpted signature grille",
      "Handcrafted open-top cabin",
    ],
    specs: {
      exterior: "Crimson metallic with black hood",
      interior: "Burgundy leather",
      carbon: "Carbon fiber hood accents",
      spoilers: "Integrated rear diffuser",
      wheels: "22'' Forged dark finish",
      aeroKit: "Custom open-top conversion",
    },
  },
  {
    id: "fusion-turquoise",
    editionOf: "rolls-royce-fusion",
    title: "Turquoise",
    subtitle: "The Fusion",
    year: "2024",
    duration: "12 weeks",
    package: "Full",
    category: "Bespoke Concept",
    coverImage: fusionTurquoiseCoverUrl,
    images: [
      { src: fusion01, title: "Front three-quarter" },
      { src: fusionTurquoiseStudio, title: "Studio front three-quarter" },
      { src: fusion02, title: "Front side profile" },
      { src: fusion03, title: "Front passenger side" },
      { src: fusion04, title: "Side profile" },
      { src: fusion05, title: "Rear top view" },
      { src: fusion06, title: "Rear three-quarter" },
      { src: fusion07, title: "Rear view" },
      { src: fusion08, title: "Top view" },
      { src: fusion09, title: "Interior overhead" },
    ],
    description: "Turquoise Edition — a deep teal body with a matte black hood. The signature studio colourway of The Fusion.",
    modifications: [
      "Bespoke turquoise metallic body",
      "Matte black hood",
      "Sculpted signature grille",
      "Handcrafted open-top interior",
      "22'' forged wheels with dark finish",
    ],
    specs: {
      exterior: "Turquoise metallic with black hood",
      interior: "White / grey leather",
      carbon: "Carbon fiber hood accents",
      spoilers: "Integrated rear diffuser",
      wheels: "22'' Forged dark finish",
      aeroKit: "Custom open-top conversion",
    },
  },
  {
    id: "fusion-bronze",
    editionOf: "rolls-royce-fusion",
    title: "Fusion Bronze",
    subtitle: "The Fusion",
    year: "2024",
    duration: "12 weeks",
    package: "Full",
    category: "Bespoke Concept",
    coverImage: img6701,
    images: [
      { src: img6701, title: "Front three-quarter" },
      { src: img6698, title: "Overhead" },
      { src: img6699, title: "Rear three-quarter" },
    ],
    description: "Bronze Edition — warm metallic bronze and champagne, with a yacht-inspired teak rear deck.",
    modifications: [
      "Bespoke bronze metallic body",
      "Champagne hood contrast",
      "Teak rear deck",
      "Handcrafted cognac cabin",
    ],
    specs: {
      exterior: "Bronze metallic with champagne hood",
      interior: "Cognac and cream leather",
      carbon: "Carbon fiber hood accents",
      spoilers: "Integrated rear diffuser",
      wheels: "22'' Forged dark finish",
      aeroKit: "Custom open-top conversion",
    },
  },
  {
    id: "fusion-azure",
    editionOf: "rolls-royce-fusion",
    title: "Azure",
    subtitle: "The Fusion",
    year: "2024",
    duration: "12 weeks",
    package: "Full",
    category: "Bespoke Concept",
    coverImage: fusionAzureStudio,
    images: [
      { src: fusionAzureStudio, title: "Studio front three-quarter" },
      { src: img6697, title: "Front three-quarter" },
      { src: img6705, title: "Side profile" },
      { src: img6695, title: "Rear overhead" },
      { src: img6702, title: "Cabin — blue leather" },
    ],
    description: "Azure Edition — a cool cornflower-blue body with a black hood and a matching blue cabin.",
    modifications: [
      "Bespoke azure metallic body",
      "Gloss black hood",
      "Blue leather cabin",
      "Sculpted signature grille",
    ],
    specs: {
      exterior: "Azure metallic with black hood",
      interior: "Cornflower blue and grey leather",
      carbon: "Carbon fiber hood accents",
      spoilers: "Integrated rear diffuser",
      wheels: "22'' Forged dark finish",
      aeroKit: "Custom open-top conversion",
    },
  },
  {
    id: "fusion-arctic",
    editionOf: "rolls-royce-fusion",
    title: "Arctic",
    subtitle: "The Fusion",
    year: "2024",
    duration: "12 weeks",
    package: "Full",
    category: "Bespoke Concept",
    coverImage: fusionArcticStudio,
    images: [
      { src: fusionArcticStudio, title: "Studio front three-quarter" },
      { src: img6696, title: "Overhead" },
      { src: img6706, title: "Overhead alt" },
      { src: img6707, title: "Cabin — tan leather" },
    ],
    description: "Arctic Edition — pearlescent silver-white with a black hood and a white / saddle-brown cabin.",
    modifications: [
      "Bespoke arctic white metallic body",
      "Gloss black hood",
      "Teak rear deck",
      "White and tan leather cabin",
    ],
    specs: {
      exterior: "Arctic white with black hood",
      interior: "Arctic white and saddle-brown leather",
      carbon: "Carbon fiber hood accents",
      spoilers: "Integrated rear diffuser",
      wheels: "22'' Forged dark finish",
      aeroKit: "Custom open-top conversion",
    },
  },
  {
    id: "fusion-amethyst",
    editionOf: "rolls-royce-fusion",
    title: "Amethyst",
    subtitle: "The Fusion",
    year: "2024",
    duration: "12 weeks",
    package: "Full",
    category: "Bespoke Concept",
    coverImage: fusionAmethystStudio,
    images: [
      { src: fusionAmethystStudio, title: "Studio front three-quarter" },
      { src: img6703, title: "Side profile" },
      { src: img6704, title: "Overhead" },
    ],
    description: "Amethyst Edition — a muted plum body with a yacht deck and a cream-and-purple cabin.",
    modifications: [
      "Bespoke amethyst metallic body",
      "Teak rear deck",
      "Cream and plum leather cabin",
      "Sculpted signature grille",
    ],
    specs: {
      exterior: "Amethyst metallic",
      interior: "Cream and plum leather",
      carbon: "Carbon fiber hood accents",
      spoilers: "Integrated rear diffuser",
      wheels: "22'' Forged dark finish",
      aeroKit: "Custom open-top conversion",
    },
  },
];
