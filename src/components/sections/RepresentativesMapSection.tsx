import { memo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { representatives } from "@/data/representatives";
import { useLanguage } from "@/contexts/LanguageContext";
import MediaEdgeFade from "@/components/MediaEdgeFade";

const GEO_URL = "/maps/countries-110m.json";

/**
 * Куда отвести подпись от точки и с какой стороны её якорить. Цюрих, Мюнхен и
 * Ницца в этом масштабе стоят в тридцати пикселях друг от друга, поэтому их
 * подписи разведены веером: Мюнхен вправо, Цюрих и Ницца влево и вниз — иначе
 * три слова ложатся друг на друга. Энугу стоит особняком, ему хватает
 * обычного отступа вправо.
 */
const LABEL: Record<string, { offset: string; anchor: "start" | "end" }> = {
  "switzerland-hungary": { offset: "translate(-9, -1)", anchor: "end" },
  germany: { offset: "translate(9, -5)", anchor: "start" },
  "france-monaco": { offset: "translate(-9, 10)", anchor: "end" },
  nigeria: { offset: "translate(9, -5)", anchor: "start" },
};

const DEFAULT_LABEL = { offset: "translate(8, -5)", anchor: "start" } as const;

const GEO_STYLE = {
  default: {
    fill: "hsl(0 0% 10%)",
    stroke: "hsl(0 0% 22%)",
    strokeWidth: 0.4,
    outline: "none" as const,
    pointerEvents: "none" as const,
  },
  hover: {
    fill: "hsl(0 0% 10%)",
    stroke: "hsl(0 0% 22%)",
    strokeWidth: 0.4,
    outline: "none" as const,
    pointerEvents: "none" as const,
  },
  pressed: {
    outline: "none" as const,
    pointerEvents: "none" as const,
  },
};

const WorldGeographies = memo(function WorldGeographies() {
  return (
    <Geographies geography={GEO_URL}>
      {({ geographies }) =>
        geographies.map((geo) => (
          <Geography key={geo.rsmKey} geography={geo} style={GEO_STYLE} />
        ))
      }
    </Geographies>
  );
});

const MapMarkers = memo(function MapMarkers({
  hovered,
  onHover,
  onOpen,
}: {
  hovered: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      {representatives.map((rep) => {
        const isActive = hovered === rep.id;
        return (
          <Marker key={rep.id} coordinates={rep.coordinates}>
            <g
              role="button"
              tabIndex={0}
              aria-label={rep.city}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onHover(rep.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onOpen(rep.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(rep.id);
                }
              }}
            >
              {/* Невидимая площадь касания. r=48 давало 33 css-пикселя после
                 масштабирования карты — мимо пальца; 68 даёт около 47. Метки
                 стоят достаточно далеко друг от друга, чтобы не перекрыться. */}
              <circle r={68} fill="transparent" />
              <circle
                r={isActive ? 26 : 18}
                fill="url(#marker-glow)"
                style={{ pointerEvents: "none", transition: "r 0.25s ease" }}
              />
              {isActive && (
                <circle
                  r={10}
                  fill="none"
                  stroke="hsl(0 0% 100%)"
                  strokeOpacity={0.35}
                  strokeWidth={0.8}
                  style={{ pointerEvents: "none" }}
                >
                  <animate attributeName="r" values="8;16;8" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.45;0;0.45" dur="2.2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                r={isActive ? 5.25 : 3.9}
                fill="hsl(0 0% 100%)"
                stroke="hsl(0 0% 0%)"
                strokeWidth={1.15}
                style={{ pointerEvents: "none" }}
              />
              <g transform={(LABEL[rep.id] ?? DEFAULT_LABEL).offset}>
                <text
                  x={0}
                  y={0}
                  textAnchor={(LABEL[rep.id] ?? DEFAULT_LABEL).anchor}
                  fill="hsl(0 0% 100%)"
                  fillOpacity={isActive ? 1 : 0.72}
                  fontSize={isActive ? 8.2 : 7.4}
                  fontFamily="var(--font-family-primary), sans-serif"
                  style={{
                    letterSpacing: "0.16em",
                    paintOrder: "stroke",
                    stroke: "hsl(0 0% 0%)",
                    strokeWidth: 2.4,
                    strokeLinejoin: "round",
                    pointerEvents: "none",
                  }}
                >
                  {rep.city.toUpperCase()}
                </text>
              </g>
            </g>
          </Marker>
        );
      })}
    </>
  );
});

const LocationCard = memo(function LocationCard({
  id,
  index,
  city,
  region,
  atelierLabel,
  isActive,
  onHover,
  onOpen,
}: {
  id: string;
  index: number;
  city: string;
  region: string;
  atelierLabel: string;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <motion.button
      type="button"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      onClick={() => onOpen(id)}
      className={`group relative w-full overflow-hidden text-left border px-5 py-4 sm:px-6 sm:py-5 transition-all duration-300 cursor-pointer ${
        isActive
          ? "border-white/40 bg-white/[0.055]"
          : "border-white/10 bg-transparent hover:border-white/30 hover:bg-white/[0.03]"
      }`}
    >
      <span
        className={`absolute left-0 top-0 bottom-0 w-px transition-all duration-300 ${
          isActive ? "bg-white/70" : "bg-transparent group-hover:bg-white/25"
        }`}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-4 mb-3.5">
        <span className="font-body text-[10px] sm:text-[11px] tracking-[0.38em] text-white/40 uppercase">
          {String(index + 1).padStart(2, "0").split("").join(" ")}
        </span>
        <span className="relative mt-1 flex h-2 w-2 items-center justify-center" aria-hidden>
          <span
            className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
              isActive ? "bg-white/30 animate-ping opacity-100" : "opacity-0"
            }`}
          />
          <span
            className={`relative h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
              isActive ? "bg-white" : "bg-white/40 group-hover:bg-white/70"
            }`}
          />
        </span>
      </div>

      <div className="font-display text-xl sm:text-2xl md:text-[26px] tracking-[0.12em] uppercase text-white font-bold leading-none">
        {city}
      </div>
      <div className="mt-2 font-body text-[12px] sm:text-[13px] text-white/45 tracking-[0.02em]">
        {region}
      </div>

      <div className="mt-4 sm:mt-5 flex items-center gap-3 text-white/40 group-hover:text-white/70 transition-colors duration-300">
        <span className="shrink-0 font-body text-[10px] sm:text-[11px] uppercase tracking-[0.28em]">
          {atelierLabel}
        </span>
        <span className="h-px flex-1 bg-current opacity-45" aria-hidden />
        <span
          className="shrink-0 text-sm leading-none transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        >
          →
        </span>
      </div>
    </motion.button>
  );
});

const RepresentativesMapSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [hovered, setHovered] = useState<string | null>(null);

  const openRep = useCallback(
    (id: string) => navigate(`/representatives/${id}`),
    [navigate]
  );

  const activeCity = representatives.find((r) => r.id === hovered)?.city;

  return (
    <section className="relative overflow-hidden bg-black text-white">
      {/* Soft atmosphere behind the composition */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 20% 0%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(255,255,255,0.04), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full px-5 sm:px-8 lg:px-12 pt-14 sm:pt-16 md:pt-20 pb-14 sm:pb-16 md:pb-20">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <motion.p
            className="font-body text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-white/40 mb-4"
          >
            {t("representatives.eyebrow")}
          </motion.p>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="min-w-0 flex-1">
              <motion.div
                className="flex items-end gap-4 sm:gap-6"
              >
                <h2 className="font-display font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-[22px] sm:text-3xl md:text-[34px] text-white leading-tight">
                  {t("representatives.title")}
                </h2>
                <div className="mb-2 hidden min-w-[3rem] flex-1 sm:block h-px bg-gradient-to-r from-white/25 to-transparent" aria-hidden />
              </motion.div>
              <motion.p
                className="mt-4 max-w-2xl font-body text-sm sm:text-base text-white/55 leading-relaxed tracking-wide"
              >
                {t("representatives.subtitle")}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Map + Locations composition */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          {/* Map */}
          <motion.div
            className="relative lg:col-span-7 xl:col-span-8 lg:h-full"
          >
            <div className="relative flex h-full flex-col overflow-hidden border border-white/10 bg-neutral-950">
              {/* Corner marks */}
              <span className="pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 border-l border-t border-white/35" aria-hidden />
              <span className="pointer-events-none absolute right-3 top-3 z-10 h-4 w-4 border-r border-t border-white/35" aria-hidden />
              <span className="pointer-events-none absolute bottom-3 left-3 z-10 h-4 w-4 border-b border-l border-white/35" aria-hidden />
              <span className="pointer-events-none absolute bottom-3 right-3 z-10 h-4 w-4 border-b border-r border-white/35" aria-hidden />

              <div
                className="aspect-[16/11] sm:aspect-[21/11] lg:aspect-auto lg:h-full lg:min-h-[420px] xl:min-h-[450px] w-full flex-1 overscroll-contain"
                style={{ touchAction: "pan-y" }}
              >
                <ComposableMap
                  projection="geoEqualEarth"
                  width={800}
                  height={450}
                  /* Кадр держит сразу европейскую тройку и Энугу: от 48° с.ш.
                     до 6° с.ш. — сорок два градуса по широте. Прежние 2600 с
                     центром на Альпах оставляли Нигерию далеко за нижним краем
                     карты, а её точку — за пределами холста. На 390 с центром
                     [9.5, 26] обе группы стоят внутри поля с запасом около
                     семидесяти пикселей сверху и снизу. */
                  projectionConfig={{ scale: 390, center: [9.5, 26] }}
                  style={{ width: "100%", height: "100%", display: "block" }}
                >
                  <defs>
                    <radialGradient id="marker-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="hsl(0 0% 100%)" stopOpacity="0.6" />
                      <stop offset="55%" stopColor="hsl(0 0% 100%)" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <WorldGeographies />
                  <MapMarkers hovered={hovered} onHover={setHovered} onOpen={openRep} />
                </ComposableMap>
              </div>

              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)",
                }}
                aria-hidden
              />
              <MediaEdgeFade edges="bottom" />

              {/* Подсказка живёт внутри карты, а не в правом верхнем углу секции:
                  там она при прокрутке наезжала на язык и бургер закреплённой
                  шапки — две строки текста поверх друг друга. */}
              <div className="pointer-events-none absolute bottom-4 left-5 z-10 font-body text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/45 sm:bottom-5 sm:left-6">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeCity ?? "hint"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="inline-block"
                  >
                    {activeCity ? activeCity.toUpperCase() : t("representatives.mapHint")}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Locations */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
            <motion.div
              className="mb-5 sm:mb-6 flex items-center gap-4 sm:gap-5"
            >
              <h3 className="shrink-0 font-display font-bold uppercase tracking-[0.16em] text-sm sm:text-base text-white">
                {t("representatives.locations")}
              </h3>
              <div className="h-px flex-1 bg-white/20" aria-hidden />
              <span className="shrink-0 font-body text-[10px] tracking-[0.28em] text-white/30 uppercase">
                {String(representatives.length).padStart(2, "0")}
              </span>
            </motion.div>

            <div className="flex flex-1 flex-col gap-3 sm:gap-3.5">
              {representatives.map((rep, i) => (
                <LocationCard
                  key={rep.id}
                  id={rep.id}
                  index={i}
                  city={rep.city}
                  region={rep.region}
                  atelierLabel={t("representatives.atelier")}
                  isActive={hovered === rep.id}
                  onHover={setHovered}
                  onOpen={openRep}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RepresentativesMapSection;
