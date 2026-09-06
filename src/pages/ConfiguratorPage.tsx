import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Armchair,
  Camera,
  Car,
  Check,
  ClipboardList,
  DoorOpen,
  Disc3,
  Gem,
  Lightbulb,
  Maximize2,
  Package,
  Palette,
  RotateCcw,
  Save,
  Share2,
  SlidersHorizontal,
  Sparkles,
  SunMoon,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BuildConfig,
  DEFAULT_CONFIG,
  GRILLE_FINISHES,
  INTERIOR_FINISHES,
  KIT_PACKAGES,
  PAINTS,
  RIM_FINISHES,
  decodeConfig,
  encodeConfig,
  type CameraFocus,
} from "@/components/configurator/config";
import SceneErrorBoundary from "@/components/configurator/SceneErrorBoundary";
import { CARS, DEFAULT_CAR, selectableCarIds } from "@/components/configurator/models";

const ConfiguratorScene = lazy(() => import("@/components/configurator/Scene"));

/** Ракурсы, доступные в разделе «Салон». */
type InteriorView = Extract<CameraFocus, "interiorFront" | "interiorDriver" | "interiorRear">;

const FOCUS_VALUES: CameraFocus[] = [
  "default", "exterior", "wheels", "kit", "carbon", "lights", "env",
  "interiorFront", "interiorDriver", "interiorRear",
];

const PAINT_PREVIEWS = Object.values(
  import.meta.glob("@/assets/previews/paint-*.jpg", { eager: true, import: "default" })
) as string[];
const FINISH_PREVIEWS = Object.values(
  import.meta.glob("@/assets/previews/finish-*.jpg", { eager: true, import: "default" })
) as string[];

type StudioSection =
  | "model"
  | "exterior"
  | "wheels"
  | "kit"
  | "carbon"
  | "openings"
  | "lights"
  | "env"
  | "interior"
  | "overview";

/** Одна опция активного раздела: панель рисует их одинаково, что бы ни выбирали. */
type OptionItem = {
  key: string;
  title: string;
  subtitle?: string;
  preview: ReactNode;
  selected: boolean;
  onClick: () => void;
};

const SECTION_FOCUS: Partial<Record<StudioSection, CameraFocus>> = {
  exterior: "exterior",
  wheels: "wheels",
  kit: "kit",
  carbon: "carbon",
  openings: "kit",
  lights: "lights",
  env: "env",
};

function Swatch({ color, className = "" }: { color: string; className?: string }) {
  return (
    <span
      className={`block h-10 w-10 shrink-0 rounded-full ring-1 ring-white/20 ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  preview,
}: Omit<OptionItem, "key">) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full shrink-0 items-center gap-3 rounded-md border p-2.5 text-left transition-colors duration-150",
        selected
          ? "border-white/70 bg-white/[0.12]"
          : "border-white/10 bg-white/[0.035] hover:border-white/35 hover:bg-white/[0.08]"
      )}
    >
      <span className="flex h-12 w-[68px] shrink-0 items-center justify-center text-white/75">{preview}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-body text-[13px] text-white">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate font-body text-[10px] uppercase tracking-[0.14em] text-white/38">
            {subtitle}
          </span>
        )}
      </span>
      {selected && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-black">
          <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
      )}
    </button>
  );
}

function PreviewImage({ src, alt, fallback }: { src?: string; alt: string; fallback: string }) {
  if (!src) return <Swatch color={fallback} />;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-12 w-[82px] shrink-0 rounded-md object-cover ring-1 ring-white/15"
    />
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-md border border-white/12 bg-black/55 text-white/80 shadow-[0_12px_34px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-colors hover:border-white/36 hover:bg-white/12 hover:text-white"
    >
      {children}
    </button>
  );
}

const ConfiguratorPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [config, setConfig] = useState<BuildConfig>(() => decodeConfig(searchParams.get("c")));
  const [activeSection, setActiveSection] = useState<StudioSection>("exterior");
  const [tuningOpen, setTuningOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [focus, setFocus] = useState<CameraFocus>(() => {
    const v = searchParams.get("v");
    return v && (FOCUS_VALUES as string[]).includes(v) ? (v as CameraFocus) : "default";
  });

  /** Машины в публичном выборе; референсные — только с ?dev=1. */
  const carIds = useMemo(() => selectableCarIds(), []);
  const car = CARS[config.model] ?? CARS[DEFAULT_CAR];
  /* У оцифрованного кузова двери из одного меша не вынуть, и раздел
     «Openings» раньше подменял всю машину процедурной заглушкой. */
  const canOpen = !!car.supportsOpenings;

  /* Ракурс держим в адресе рядом со сборкой: страница его читает при загрузке,
     а до этого записывала только код сборки — присланная ссылка открывалась
     не с того вида, с которого её отправили. */
  const syncUrl = useCallback(
    (next: BuildConfig, nextFocus: CameraFocus) => {
      const params: Record<string, string> = { c: encodeConfig(next) };
      if (nextFocus !== "default") params.v = nextFocus;
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  /* Одна точка применения состояния: и сборка, и ракурс кладутся в адрес
     вместе. Раздельные обработчики читали config из замыкания, и «Сброс»,
     менявший то и другое за один тик, записывал в ссылку сборку, которую
     только что сбросил, — обновление страницы возвращало её обратно. */
  const apply = useCallback(
    (nextConfig: BuildConfig, nextFocus: CameraFocus) => {
      setConfig(nextConfig);
      setFocus(nextFocus);
      syncUrl(nextConfig, nextFocus);
    },
    [syncUrl]
  );

  const handleChange = useCallback((next: BuildConfig) => apply(next, focus), [apply, focus]);

  const changeFocus = useCallback((next: CameraFocus) => apply(config, next), [apply, config]);

  const set = useCallback((patch: Partial<BuildConfig>) => handleChange({ ...config, ...patch }), [config, handleChange]);

  const focusForSection = (section: StudioSection): CameraFocus =>
    section === "interior" ? "interiorDriver" : SECTION_FOCUS[section] ?? "default";

  const chooseSection = useCallback(
    (section: StudioSection) => {
      setActiveSection(section);
      changeFocus(focusForSection(section));
    },
    [changeFocus]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!tuningOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTuningOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tuningOpen]);

  /* Панель не размонтируем — она уезжает трансформом, чтобы открываться без
     пересборки списка. Закрытую надо убрать из фокуса и из дерева доступности,
     иначе табом можно уехать в невидимое меню. */
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (tuningOpen) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [tuningOpen]);

  const handleShare = useCallback(async () => {
    const params = new URLSearchParams({ c: encodeConfig(config) });
    if (focus !== "default") params.set("v", focus);
    const url = `${location.origin}/configurator?${params}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* Буфер обмена недоступен во встроенных контекстах и без https.
         Раньше кнопка всё равно показывала «скопировано», и посетитель
         вставлял в мессенджер то, что было в буфере до неё. */
      setShareUrl(url);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [config, focus]);

  const handleSave = useCallback(() => {
    /* Чужая запись под тем же ключом или приватный режим не должны ронять
       страницу: раньше JSON.parse на мусоре выбрасывал прямо из обработчика
       и «Сохранить» переставало работать до очистки хранилища. */
    let saved: Array<{ code: string; savedAt: string }> = [];
    try {
      const parsed = JSON.parse(localStorage.getItem("mmonogram-builds") ?? "[]");
      if (Array.isArray(parsed)) saved = parsed.filter((item) => item && typeof item.code === "string");
    } catch {
      saved = [];
    }
    const code = encodeConfig(config);
    const next = [{ code, savedAt: new Date().toISOString() }, ...saved.filter((item) => item.code !== code)].slice(0, 12);
    try {
      localStorage.setItem("mmonogram-builds", JSON.stringify(next));
    } catch {
      /* Квота или запрет хранилища — сборка всё равно живёт в ссылке. */
    }
    handleChange({ ...config, saved: true });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  }, [config, handleChange]);

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("#configurator-canvas canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `m-monogram-build-${encodeConfig(config)}.png`;
    a.click();
  }, [config]);

  const handleReset = useCallback(() => {
    setActiveSection("exterior");
    apply(DEFAULT_CONFIG, focusForSection("exterior"));
  }, [apply]);

  const handleFullscreen = useCallback(() => {
    const root = document.documentElement;
    if (!document.fullscreenElement) root.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const sections = useMemo(
    () => ([
      /* Раздел выбора машины прячем, когда выбирать не из чего: одна карточка
         с единственной моделью занимала место и выглядела недоделкой. */
      ...(carIds.length > 1
        ? [{ id: "model" as const, label: t("config.model"), value: car.name, icon: Car }]
        : []),
      { id: "exterior" as const, label: t("config.exterior"), value: PAINTS[config.paint].name, icon: Palette },
      { id: "wheels" as const, label: t("config.rims"), value: RIM_FINISHES[config.rimFinish].name, icon: Disc3 },
      { id: "kit" as const, label: t("config.kit"), value: KIT_PACKAGES[config.kitPackage].name, icon: Package },
      { id: "carbon" as const, label: t("config.carbon"), value: config.carbon ? t("config.carbonOn") : t("config.carbonOff"), icon: Gem },
      ...(canOpen
        ? [{ id: "openings" as const, label: t("config.openings"), value: [config.doors && t("config.doors"), config.hood && t("config.hood"), config.trunk && t("config.trunk")].filter(Boolean).join(" · ") || t("config.closed"), icon: DoorOpen }]
        : []),
      { id: "lights" as const, label: t("config.lights"), value: config.lights ? t("config.lightsOn") : t("config.lightsOff"), icon: Lightbulb },
      { id: "env" as const, label: t("config.environment"), value: config.night ? t("config.envNight") : t("config.envStudio"), icon: SunMoon },
      { id: "interior" as const, label: t("config.interior"), value: INTERIOR_FINISHES[config.interior].name, icon: Armchair },
      { id: "overview" as const, label: t("config.overview"), value: "", icon: ClipboardList },
    ]),
    [canOpen, car.name, carIds.length, config, t]
  );

  const overviewRows = [
    { label: t("config.model"), value: car.name },
    { label: t("config.exterior"), value: `${PAINTS[config.paint].name} · ${GRILLE_FINISHES[config.grille].name}` },
    { label: t("config.rims"), value: RIM_FINISHES[config.rimFinish].name },
    { label: t("config.kit"), value: KIT_PACKAGES[config.kitPackage].name },
    { label: t("config.carbon"), value: config.carbon ? t("config.carbonOn") : t("config.carbonOff") },
    { label: t("config.lights"), value: config.lights ? t("config.lightsOn") : t("config.lightsOff") },
    { label: t("config.environment"), value: config.night ? t("config.envNight") : t("config.envStudio") },
    { label: t("config.interior"), value: INTERIOR_FINISHES[config.interior].name },
    ...(canOpen
      ? [{ label: t("config.openings"), value: [config.doors && t("config.doors"), config.hood && t("config.hood"), config.trunk && t("config.trunk")].filter(Boolean).join(" · ") || t("config.closed") }]
      : []),
  ];

  const interiorViews: [InteriorView, string][] = [
    ["interiorFront", t("config.interiorFront")],
    ["interiorDriver", t("config.interiorDriver")],
    ["interiorRear", t("config.interiorRear")],
  ];

  /* Опции активного раздела одним списком. Раньше на каждый раздел был свой
     кусок JSX с одинаковыми карточками — десять почти одинаковых веток. */
  const options = useMemo<OptionItem[]>(() => {
    switch (activeSection) {
      case "model":
        return carIds.map((id) => ({
          key: id,
          selected: config.model === id,
          onClick: () => set({ model: id }),
          preview: <Car className="h-8 w-8" strokeWidth={1.4} />,
          title: CARS[id].name,
          subtitle: id === "base-basic-pbr" ? t("config.modelSourcePbr") : t("config.modelMain"),
        }));

      case "exterior":
        return [
          ...PAINTS.map((paint, index) => ({
            key: `paint-${paint.id}`,
            selected: config.paint === index,
            onClick: () => set({ paint: index }),
            preview: <PreviewImage src={PAINT_PREVIEWS[index]} alt={paint.name} fallback={paint.color} />,
            title: paint.name,
          })),
          ...GRILLE_FINISHES.map((finish, index) => ({
            key: `grille-${finish.id}`,
            selected: config.grille === index,
            onClick: () => set({ grille: index }),
            preview: <Swatch color={finish.color} />,
            title: finish.name,
            subtitle: t("config.grille"),
          })),
        ];

      /* Дизайны дисков (MG.1 Monoblock и прочие) отсюда убраны: колёса
         приходят одним мешем внутри body-kit-wheels.glb, поменять рисунок
         нечем — нажатие не меняло в сцене ничего. Осталась отделка, она
         красит материал колеса по-настоящему. */
      case "wheels":
        return RIM_FINISHES.map((finish, index) => ({
          key: `rim-finish-${finish.id}`,
          selected: config.rimFinish === index,
          onClick: () => set({ rimFinish: index }),
          preview: <PreviewImage src={FINISH_PREVIEWS[index]} alt={finish.name} fallback={finish.color} />,
          title: finish.name,
          subtitle: t("config.rimColor"),
        }));

      case "kit":
        return KIT_PACKAGES.map((pack, index) => ({
          key: pack.id,
          selected: config.kitPackage === index,
          onClick: () => set({ kitPackage: index, kit: index > 0 }),
          preview:
            index === 0 ? <Car className="h-8 w-8" strokeWidth={1.4} /> : <Sparkles className="h-8 w-8" strokeWidth={1.4} />,
          title: pack.name,
          subtitle: index === 0 ? t("config.kitWithout") : t("config.kitWith"),
        }));

      case "carbon":
        return [
          {
            key: "carbon-off",
            selected: !config.carbon,
            onClick: () => set({ carbon: false }),
            preview: <Swatch color={PAINTS[config.paint].color} />,
            title: t("config.carbonOff"),
          },
          {
            key: "carbon-on",
            selected: config.carbon,
            onClick: () => set({ carbon: true }),
            preview: <Swatch color="#15161a" />,
            title: t("config.carbonOn"),
          },
        ];

      case "openings":
        return canOpen
          ? [
              {
                key: "doors",
                selected: config.doors,
                onClick: () => set({ doors: !config.doors }),
                preview: <DoorOpen className="h-8 w-8" strokeWidth={1.35} />,
                title: "Open 4 Doors",
                subtitle: config.doors ? "Open" : "Closed",
              },
              {
                key: "hood",
                selected: config.hood,
                onClick: () => set({ hood: !config.hood }),
                preview: <Car className="h-8 w-8" strokeWidth={1.35} />,
                title: "Open Hood",
                subtitle: config.hood ? "Open" : "Closed",
              },
              {
                key: "trunk",
                selected: config.trunk,
                onClick: () => set({ trunk: !config.trunk }),
                preview: <Package className="h-8 w-8" strokeWidth={1.35} />,
                title: "Open Trunk",
                subtitle: config.trunk ? "Open" : "Closed",
              },
            ]
          : [];

      case "lights":
        return [
          {
            key: "lights-on",
            selected: config.lights,
            onClick: () => set({ lights: true }),
            preview: <Lightbulb className="h-8 w-8 text-white" strokeWidth={1.4} />,
            title: t("config.lightsOn"),
          },
          {
            key: "lights-off",
            selected: !config.lights,
            onClick: () => set({ lights: false }),
            preview: <Lightbulb className="h-8 w-8 text-white/42" strokeWidth={1.4} />,
            title: t("config.lightsOff"),
          },
        ];

      case "env":
        return [
          {
            key: "env-studio",
            selected: !config.night,
            onClick: () => set({ night: false }),
            preview: <Swatch color="#c7cbce" />,
            title: t("config.envStudio"),
          },
          {
            key: "env-night",
            selected: config.night,
            onClick: () => set({ night: true }),
            preview: <Swatch color="#0a0a0c" />,
            title: t("config.envNight"),
          },
        ];

      case "interior":
        return [
          ...INTERIOR_FINISHES.map((finish, index) => ({
            key: `interior-${finish.id}`,
            selected: config.interior === index,
            onClick: () => set({ interior: index }),
            preview: (
              <span className="flex">
                <Swatch color={finish.primary} className="relative z-10" />
                <Swatch color={finish.accent} className="-ml-4" />
              </span>
            ),
            title: finish.name,
          })),
          ...interiorViews.map(([view, label]) => ({
            key: view,
            selected: focus === view,
            onClick: () => changeFocus(view),
            preview: <Armchair className="h-8 w-8" strokeWidth={1.35} />,
            title: label,
            subtitle: "Camera",
          })),
        ];

      default:
        return [];
    }
    /* interiorViews пересобирается каждый рендер вместе с переводами — в
       зависимостях достаточно самого t. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, canOpen, carIds, changeFocus, config, focus, set, t]);

  const activeMeta = sections.find((item) => item.id === activeSection);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-premium-black">
      <SEOHead
        title="3D Studio - M-Monogram | Build Your G-Class"
        description="Configure your bespoke M-Monogram G-Class in real-time 3D: body colors, forged wheels, carbon packages and the M-Monogram body kit."
        path="/configurator"
      />
      <Header variant={config.night ? "dark" : "light"} />

      {/* Открытая панель забирает часть экрана, поэтому сцену уводим из-под неё:
          на десктопе влево на половину ширины панели, на телефоне вверх. Это
          трансформ, а не изменение размера канваса, — WebGL ничего не пересобирает. */}
      <div
        id="configurator-canvas"
        className={cn(
          "absolute inset-0 transition-transform duration-300 ease-out will-change-transform",
          tuningOpen ? "-translate-y-[7.5rem] md:translate-y-0 md:-translate-x-[12.5rem]" : "translate-y-0 md:translate-x-0"
        )}
      >
        <SceneErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <p className="font-display text-xs uppercase tracking-[0.3em] text-foreground/40 animate-pulse">
                  {t("hero.loading")}...
                </p>
              </div>
            }
          >
            <ConfiguratorScene config={config} focus={focus} />
          </Suspense>
        </SceneErrorBoundary>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[5.25rem] z-20 flex justify-center px-4 sm:top-[5.75rem]">
        <div className="pointer-events-auto flex items-center gap-2">
          <ToolbarButton label={copied ? t("config.shareCopied") : t("config.share")} onClick={handleShare}>
            {copied ? <Check className="h-[18px] w-[18px]" /> : <Share2 className="h-[18px] w-[18px]" />}
          </ToolbarButton>
          <ToolbarButton label={t("config.screenshot")} onClick={handleScreenshot}>
            <Camera className="h-[18px] w-[18px]" />
          </ToolbarButton>
          <ToolbarButton label={savedFlash || config.saved ? "Saved" : "Save car"} onClick={handleSave}>
            {savedFlash || config.saved ? <Check className="h-[18px] w-[18px]" /> : <Save className="h-[18px] w-[18px]" />}
          </ToolbarButton>
          <ToolbarButton label="Fullscreen" onClick={handleFullscreen}>
            <Maximize2 className="h-[18px] w-[18px]" />
          </ToolbarButton>
          <ToolbarButton label="Reset" onClick={handleReset}>
            <RotateCcw className="h-[18px] w-[18px]" />
          </ToolbarButton>
        </div>
      </div>

      {shareUrl && (
        <div className="absolute inset-x-0 top-[8.5rem] z-40 flex justify-center px-4">
          <div className="flex w-full max-w-lg items-center gap-2 rounded-md border border-white/15 bg-black/85 px-3 py-2 backdrop-blur-xl">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={t("config.share")}
              className="min-w-0 flex-1 bg-transparent font-body text-[11px] text-white/80 outline-none"
            />
            <button
              type="button"
              onClick={() => setShareUrl(null)}
              className="shrink-0 font-body text-[10px] uppercase tracking-[0.16em] text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Нижний HUD. Пока тюнинг закрыт, машину не перекрывает ничего, кроме
          одной строки подписи, цены и кнопки вызова меню. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[padding,opacity] duration-300 ease-out sm:px-5",
          tuningOpen && "opacity-0 md:pr-[26.25rem] md:opacity-100"
        )}
      >
        <p
          className={cn(
            "hidden font-body text-[10px] uppercase tracking-[0.14em] md:block",
            config.night ? "text-white/40" : "text-black/45"
          )}
        >
          {t("config.demoNote")} · {car.name}
        </p>

        <div className="pointer-events-auto flex w-full items-center gap-2 md:ml-auto md:w-auto">
          <button
            type="button"
            onClick={() => setTuningOpen(true)}
            aria-expanded={tuningOpen}
            aria-controls="tuning-panel"
            className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 font-body text-[12px] uppercase tracking-[0.18em] text-black shadow-[0_18px_44px_rgba(0,0,0,0.45)] transition-transform duration-150 hover:bg-white/90 active:scale-[0.98] md:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            Tuning
          </button>
        </div>
      </div>

      {/* Меню тюнинга: на десктопе выезжает панелью справа, на телефоне —
          шторкой снизу. Не размонтируется, поэтому открывается мгновенно. */}
      <aside
        id="tuning-panel"
        ref={panelRef}
        aria-label="Tuning"
        className={cn(
          "absolute z-40 flex flex-col border-white/10 bg-[rgba(8,8,9,0.93)] shadow-[0_-22px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-transform duration-300 ease-out will-change-transform",
          "inset-x-0 bottom-0 max-h-[74dvh] rounded-t-2xl border-t",
          /* На десктопе панель во всю высоту: сдвинутая сцена иначе оголяет
             полосу справа под шапкой. Шапка сайта лежит выше по z-index,
             поэтому её кнопки остаются кликабельными поверх панели. */
          "md:inset-x-auto md:bottom-0 md:right-0 md:top-0 md:max-h-none md:w-[25rem] md:rounded-none md:border-l md:border-t-0 md:pt-[4.5rem]",
          tuningOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.8} />
          <span className="font-display text-[12px] uppercase tracking-[0.22em] text-white">Tuning</span>
          <button
            type="button"
            onClick={() => setTuningOpen(false)}
            aria-label="Close tuning"
            className="-mr-1 ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav
            aria-label="Tuning sections"
            className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto border-b border-white/10 p-2 md:w-[6.75rem] md:flex-col md:overflow-x-visible md:overflow-y-auto md:border-b-0 md:border-r"
          >
            {sections.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseSection(item.id)}
                  aria-current={active}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 transition-colors duration-150 md:w-full md:min-h-[4rem] md:flex-col md:justify-center md:gap-1 md:px-1.5 md:py-2 md:text-center",
                    active
                      ? "border-white/70 bg-white text-black"
                      : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/30 hover:bg-white/[0.09]"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                  <span className="font-body text-[10px] uppercase tracking-[0.14em] md:text-[9px] md:leading-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex min-h-0 flex-1 flex-col">
            {activeMeta && (
              <div className="flex shrink-0 items-baseline gap-2 px-3 pt-3">
                <span className="shrink-0 font-body text-[11px] uppercase tracking-[0.18em] text-white/45">
                  {activeMeta.label}
                </span>
                {activeMeta.value && (
                  <span className="min-w-0 truncate font-body text-[11px] text-white/70">{activeMeta.value}</span>
                )}
              </div>
            )}

            <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
              {activeSection === "overview"
                ? overviewRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2 last:border-b-0"
                    >
                      <span className="shrink-0 font-body text-[10px] uppercase tracking-[0.16em] text-white/38">
                        {row.label}
                      </span>
                      <span className="text-right font-body text-[12px] text-white">{row.value}</span>
                    </div>
                  ))
                : options.map((option) => (
                    <OptionCard
                      key={option.key}
                      selected={option.selected}
                      onClick={option.onClick}
                      title={option.title}
                      subtitle={option.subtitle}
                      preview={option.preview}
                    />
                  ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => navigate(`/booking?build=${encodeConfig(config)}`)}
            className="flex h-11 flex-1 items-center justify-center rounded-md bg-white font-body text-[11px] uppercase tracking-[0.18em] text-black transition-colors hover:bg-white/90"
          >
            Request this build
          </button>
          <button
            type="button"
            onClick={handleSave}
            aria-label={config.saved ? "Saved car" : "Save car"}
            title={config.saved ? "Saved car" : "Save car"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] text-white/80 transition-colors hover:border-white/35 hover:bg-white/[0.09] hover:text-white"
          >
            {savedFlash || config.saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          </button>
        </div>
      </aside>

    </div>
  );
};

export default ConfiguratorPage;
