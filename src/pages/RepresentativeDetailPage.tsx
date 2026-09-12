import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Compass,
  ExternalLink,
  Instagram,
  MessageCircle,
  Send,
  Globe,
  Share2,
  Navigation,
  Star,
  Check,
  Facebook,
  Youtube,
  Award,
} from "lucide-react";
import Header from "@/components/Header";
import Picture from "@/components/Picture";
import SEOHead from "@/components/SEOHead";
import {
  getRepresentativeById,
  getRepresentativeSocials,
  getRepresentativeTimezone,
  representatives,
} from "@/data/representatives";
import { useLanguage } from "@/contexts/LanguageContext";
import { navigateToRepresentatives } from "@/lib/representativesNav";

const formatCoord = (value: number, posLabel: string, negLabel: string) => {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = (((abs - deg) * 60 - min) * 60).toFixed(1);
  return `${deg}° ${min}' ${sec}" ${value >= 0 ? posLabel : negLabel}`;
};

const useLocalTime = (timezone: string) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(i);
  }, []);
  return useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
    } catch {
      return "—";
    }
  }, [now, timezone]);
};

const RepresentativeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const rep = id ? getRepresentativeById(id) : undefined;
  const [copied, setCopied] = useState(false);

  const goBackToMap = () => {
    navigateToRepresentatives(navigate);
  };

  const tz = rep ? getRepresentativeTimezone(rep) : "UTC";
  const localTime = useLocalTime(tz);

  if (!rep) {
    return (
      <div className="min-h-screen bg-premium-black text-foreground">
        <SEOHead
          title={`${t("representatives.notFoundTitle")} — M-Monogram`}
          description={t("representatives.notFoundDescription")}
          updateUrl={false}
        />
        <Header />
        <main className="pt-32 px-6 max-w-3xl mx-auto text-center">
          <h1 className="h-display-3 uppercase mb-4">{t("representatives.notFoundTitle")}</h1>
          <p className="text-foreground/60 mb-8">{t("representatives.notFoundDescription")}</p>
          <button
            onClick={goBackToMap}
            className="inline-flex items-center gap-2 border border-white/20 hover:border-white/50 px-6 py-3 text-sm tracking-widest uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("representatives.backToMap")}
          </button>
        </main>
      </div>
    );
  }

  const others = representatives.filter((r) => r.id !== rep.id).slice(0, 3);
  const socials = getRepresentativeSocials(rep);

  const [lng, lat] = rep.coordinates;
  const bbox = `${lng - 0.06},${lat - 0.03},${lng + 0.06},${lat + 0.03}`;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
  const gMapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const latStr = formatCoord(lat, "N", "S");
  const lngStr = formatCoord(lng, "E", "W");

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: `${rep.name} — ${rep.city}`, text: `${rep.name}, ${rep.city}`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  const socialLinks: Array<{ Icon: typeof Instagram; label: string; href: string }> = [];
  if (socials.instagram) socialLinks.push({ Icon: Instagram, label: t("representatives.followInstagram"), href: socials.instagram });
  if (socials.whatsapp) socialLinks.push({ Icon: MessageCircle, label: t("representatives.messageWhatsapp"), href: `https://wa.me/${socials.whatsapp}` });
  if (socials.telegram) socialLinks.push({ Icon: Send, label: t("representatives.writeTelegram"), href: `https://t.me/${socials.telegram}` });
  if (socials.facebook) socialLinks.push({ Icon: Facebook, label: t("representatives.followFacebook"), href: socials.facebook });
  if (socials.youtube) socialLinks.push({ Icon: Youtube, label: t("representatives.watchYoutube"), href: socials.youtube });
  if (socials.website) socialLinks.push({ Icon: Globe, label: t("representatives.visitWebsite"), href: socials.website });

  return (
    <div className="min-h-screen bg-premium-black text-foreground relative overflow-hidden">
      <SEOHead
        title={`${rep.name} — ${rep.city}, ${rep.country}`}
        description={`Visit M-Monogram official representative in ${rep.city}, ${rep.country}. ${rep.description ?? "Authorized partner of the M-Monogram global network."}`}
        path={`/representatives/${rep.id}`}
      />
      <Header />

      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-50"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 5%, hsl(0 0% 10%) 0%, transparent 60%), radial-gradient(50% 40% at 95% 90%, hsl(0 0% 7%) 0%, transparent 60%)",
        }}
      />

      <main className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        {/* Back link */}
        <button
          type="button"
          onClick={goBackToMap}
          className="tap-target group inline-flex items-center gap-2 text-[10px] sm:text-xs tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          {t("representatives.back")}
        </button>

        {/* Hero */}
        <section className="mt-10 sm:mt-14 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 text-foreground/40">
                <span className="h-px w-8 bg-foreground/30" />
                <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase">{rep.region}</span>
                {rep.flagship && (
                  <span className="inline-flex items-center gap-1.5 border border-white/20 px-2.5 py-1 text-[9px] tracking-[0.25em] uppercase text-foreground/80">
                    <Star className="w-3 h-3" strokeWidth={1.5} />
                    {t("representatives.flagship")}
                  </span>
                )}
                {rep.established && (
                  <span className="text-[10px] tracking-[0.25em] uppercase text-foreground/40">
                    {t("representatives.established")} {rep.established}
                  </span>
                )}
              </div>
              <h1 className="h-display-1 mt-4 uppercase leading-[0.9]">{rep.city}</h1>
              <p className="mt-3 text-base sm:text-lg text-foreground/55 tracking-wide">{rep.country}</p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase text-foreground/40">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="text-foreground/85 text-base tracking-widest">{localTime}</span>
                <span className="opacity-50">{t("representatives.localTime")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{latStr}</span>
                <span className="opacity-30">·</span>
                <span>{lngStr}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </section>

        {/* Main grid */}
        <section className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Map */}
          <div className="lg:col-span-7 space-y-6">
            <div
              className="relative bg-slate-900/30 backdrop-blur-xl border border-white/10 overflow-hidden"
              style={{ boxShadow: "inset 0 0 60px rgba(255,255,255,0.03), 0 30px 80px -40px rgba(0,0,0,0.8)" }}
            >
              <div className="aspect-[4/3] sm:aspect-[16/10] w-full bg-black relative">
                <iframe
                  title={`Map of ${rep.city}`}
                  src={osmEmbed}
                  className="w-full h-full border-0 grayscale contrast-125 brightness-75"
                  loading="lazy"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.7)" }}
                />
              </div>
              <div className="flex items-center border-t border-white/10">
                <a
                  href={directionsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 sm:px-5 py-3.5 text-[10px] sm:text-xs tracking-[0.25em] uppercase text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {t("representatives.directions")}
                </a>
                <a
                  href={gMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 sm:px-5 py-3.5 text-[10px] sm:text-xs tracking-[0.25em] uppercase text-foreground/60 hover:text-foreground border-l border-white/10 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {t("representatives.openGoogleMaps")}
                </a>
                <a
                  href={osmLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block px-4 sm:px-5 py-3.5 text-[10px] sm:text-xs tracking-[0.25em] uppercase text-foreground/40 hover:text-foreground border-l border-white/10 transition-colors"
                >
                  {t("representatives.osm")}
                </a>
              </div>
            </div>

            {/* Services */}
            {rep.services && rep.services.length > 0 && (
              <div
                className="bg-slate-900/30 backdrop-blur-xl border border-white/10 p-5 sm:p-6"
                style={{ boxShadow: "inset 0 0 30px rgba(255,255,255,0.02)" }}
              >
                <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40">
                  {t("representatives.services")}
                </span>
                <div className="mt-4 flex flex-wrap gap-2">
                  {rep.services.map((s) => (
                    <span
                      key={s}
                      className="border border-white/15 hover:border-white/40 px-3.5 py-1.5 text-[11px] tracking-[0.18em] uppercase text-foreground/80 transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certificate of partnership */}
            {rep.certificate && (
              <div
                className="bg-slate-900/30 backdrop-blur-xl border border-white/10 p-5 sm:p-6"
                style={{ boxShadow: "inset 0 0 30px rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-3.5 h-3.5 text-foreground/40" strokeWidth={1.5} />
                  <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40">
                    {t("representatives.certificate")}
                  </span>
                </div>
                <a
                  href={rep.certificate.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-4 block overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
                >
                  <Picture
                    src={rep.certificate.image}
                    alt={rep.certificate.alt}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.015]"
                  />
                </a>
                <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div>
                    <dt className="text-foreground/40 text-[10px] tracking-[0.25em] uppercase mb-1">
                      {t("representatives.certificateIssuedBy")}
                    </dt>
                    <dd className="text-foreground/85 leading-relaxed">{rep.certificate.issuedBy}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/40 text-[10px] tracking-[0.25em] uppercase mb-1">
                      {t("representatives.certificateIssued")}
                    </dt>
                    <dd className="text-foreground/85 leading-relaxed">{rep.certificate.issued}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Socials */}
            {socialLinks.length > 0 && (
              <div
                className="bg-slate-900/30 backdrop-blur-xl border border-white/10 p-5 sm:p-6"
                style={{ boxShadow: "inset 0 0 30px rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40">
                    {t("representatives.connect")}
                  </span>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="tap-target inline-flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copied ? t("representatives.copied") : t("representatives.shareLocation")}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {socialLinks.map(({ Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 border border-white/10 hover:border-white/40 hover:bg-white/5 px-4 py-3 transition-all"
                    >
                      <Icon className="w-4 h-4 text-foreground/60 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                      <span className="text-xs tracking-[0.18em] uppercase text-foreground/80 group-hover:text-foreground transition-colors flex-1 truncate">
                        {label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-5 animate-fade-in">
            <div
              className="bg-slate-900/30 backdrop-blur-xl border border-white/10 p-6 sm:p-8 space-y-7 lg:sticky lg:top-28"
              style={{ boxShadow: "inset 0 0 40px rgba(255,255,255,0.03)" }}
            >
              <div>
                <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40">
                  {t("representatives.atelier")}
                </span>
                <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide mt-2 leading-tight">
                  {rep.name}
                </h2>
                {rep.description && (
                  <p className="mt-3 text-sm text-foreground/60 leading-relaxed">{rep.description}</p>
                )}
              </div>

              <div className="h-px bg-white/10" />

              <ul className="space-y-5 text-sm">
                {[
                  { Icon: MapPin, label: t("representatives.address"), value: rep.address ?? t("representatives.addressFallback"), href: rep.address ? gMapsLink : undefined, external: true },
                  { Icon: Phone, label: t("representatives.phone"), value: rep.phone ?? t("representatives.phoneFallback"), href: rep.phone ? `tel:${rep.phone.replace(/\s/g, "")}` : undefined },
                  { Icon: Mail, label: t("representatives.email"), value: rep.email ?? "info@mmonogram.com", href: `mailto:${rep.email ?? "info@mmonogram.com"}` },
                  { Icon: Clock, label: t("representatives.hours"), value: rep.hours ?? t("representatives.hoursFallback"), href: undefined },
                ].map(({ Icon, label, value, href, external }) => {
                  const content = (
                    <>
                      <Icon className="w-4 h-4 mt-0.5 text-foreground/40 flex-shrink-0 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <div className="text-foreground/40 text-[10px] tracking-[0.25em] uppercase mb-1">{label}</div>
                        <div className="text-foreground/85 break-words">{value}</div>
                      </div>
                    </>
                  );
                  return (
                    <li key={label}>
                      {href ? (
                        <a
                          href={href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="group flex gap-3 hover:bg-white/5 -mx-2 px-2 py-1.5 transition-colors"
                        >
                          {content}
                        </a>
                      ) : (
                        <div className="flex gap-3 px-2 py-1.5">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-2">
                {socials.whatsapp && (
                  <a
                    href={`https://wa.me/${socials.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-full inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/60 hover:bg-white/5 px-6 py-4 text-[11px] tracking-[0.3em] uppercase transition-all overflow-hidden"
                  >
                    <MessageCircle className="w-4 h-4 relative z-10" strokeWidth={1.5} />
                    <span className="relative z-10">{t("representatives.messageWhatsapp")}</span>
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/contact")}
                  className="group relative w-full inline-flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-4 text-[11px] tracking-[0.3em] uppercase transition-all overflow-hidden"
                >
                  <span className="relative z-10">{t("representatives.requestAppointment")}</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Other in region */}
        {others.length > 0 && (
          <section className="mt-24 sm:mt-32">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40">
                  {t("representatives.continueExploring")}
                </span>
                <h3 className="h-display-3 mt-2 uppercase">
                  {t("representatives.otherLocations")}
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {others.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    navigate(`/representatives/${o.id}`);
                    window.scrollTo({ top: 0, behavior: "auto" });
                  }}
                  className="group relative text-left bg-slate-900/30 backdrop-blur-xl border border-white/10 hover:border-white/30 p-5 sm:p-6 transition-all duration-300"
                  style={{ boxShadow: "inset 0 0 30px rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-foreground/40 mb-2">
                        <MapPin className="w-3 h-3" strokeWidth={1.5} />
                        <span className="text-[9px] tracking-[0.25em] uppercase">{o.region}</span>
                      </div>
                      <h4 className="font-display text-lg uppercase tracking-wide truncate">{o.city}</h4>
                      <p className="text-xs text-foreground/50 mt-1 truncate">{o.country}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_40px_rgba(255,255,255,0.06)]" />
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default RepresentativeDetailPage;
