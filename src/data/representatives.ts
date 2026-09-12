export interface RepresentativeSocials {
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
  website?: string;
  facebook?: string;
  youtube?: string;
}

/**
 * Свидетельство о партнёрстве, выданное ателье. Показывается на странице
 * представителя отдельным блоком: для дилера это главный аргумент, что он
 * работает с нами официально, а не просто перепродаёт.
 */
export interface RepresentativeCertificate {
  image: string;
  alt: string;
  issuedBy: string;
  issued: string;
}

export interface Representative {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  coordinates: [number, number];
  timezone?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  description?: string;
  image?: string;
  flagship?: boolean;
  established?: number;
  services?: string[];
  socials?: RepresentativeSocials;
  certificate?: RepresentativeCertificate;
}

export const DEFAULT_SOCIALS: RepresentativeSocials = {
  instagram: "https://www.instagram.com/metagarage_m_monogram/?igsh=MTBtejVmOGdzYW5jMQ%3D%3D",
  whatsapp: "971545077707",
};

export const getRepresentativeTimezone = (rep: Representative) =>
  rep.timezone ?? "Europe/Zurich";

export const getRepresentativeSocials = (rep: Representative): RepresentativeSocials => ({
  ...DEFAULT_SOCIALS,
  ...(rep.socials ?? {}),
});

import ugogbuzuoCertificate from "@/assets/partners/ugogbuzuo-partnership-certificate.webp";

export const representatives: Representative[] = [
  {
    id: "switzerland-hungary",
    name: "M-Monogram Switzerland & Hungary",
    city: "Zurich",
    country: "Switzerland",
    region: "Switzerland / Hungary",
    coordinates: [8.5417, 47.3769],
    timezone: "Europe/Zurich",
    description: "Official representative covering Switzerland and Hungary.",
    services: ["Exterior", "Interior", "Forged Wheels"],
  },
  {
    id: "germany",
    name: "M-Monogram Germany",
    city: "Munich",
    country: "Germany",
    region: "Germany",
    coordinates: [11.5820, 48.1351],
    timezone: "Europe/Berlin",
    description: "Official representative for Germany.",
    services: ["Exterior", "Interior", "Forged Wheels"],
  },
  {
    id: "france-monaco",
    name: "M-Monogram France & Monaco",
    city: "Nice",
    country: "France",
    region: "France / Monaco / French Riviera",
    coordinates: [7.2620, 43.7102],
    timezone: "Europe/Paris",
    description: "Official representative covering France, Monaco and the French Riviera.",
    services: ["Exterior", "Interior", "Forged Wheels"],
  },
  {
    id: "nigeria",
    name: "Ugogbuzuo Auto Link Ltd",
    city: "Enugu",
    country: "Nigeria",
    region: "Nigeria / West Africa",
    coordinates: [7.5464, 6.4584],
    timezone: "Africa/Lagos",
    address: "9A Nitel Quarters, P&T Bus Stop, Ogui Road, Enugu, Nigeria",
    phone: "+234 (0) 809 2997 000",
    email: "noreply@ugoautosltd.com",
    description:
      "Official representative for Nigeria and West Africa. Ugogbuzuo Auto Link Ltd specialises in the finest selection of GCC Spec cars from leading manufacturers around the globe, working with us on the purchase and modification of vehicles.",
    services: ["GCC Spec Vehicles", "Exterior", "Interior", "Forged Wheels"],
    socials: {
      instagram: "https://www.instagram.com/ugogbuzuoautoltd/",
      website: "https://ugoautosltd.com/",
      facebook: "https://www.facebook.com/ugogbuzuoautoltd/",
      youtube: "https://www.youtube.com/@ugoautostv1982",
    },
    certificate: {
      image: ugogbuzuoCertificate,
      alt: "Partnership Award Certificate presented to Ugogbuzuo Auto Link Ltd by Metagarage Auto General Repairing Co LLC, Dubai",
      issuedBy: "Metagarage Auto General Repairing Co LLC, Dubai, U.A.E.",
      issued: "Dubai, June 2026",
    },
  },
];

export const getRepresentativeById = (id: string) =>
  representatives.find((r) => r.id === id);
