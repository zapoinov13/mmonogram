import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./ConfiguratorTuning.css";
import {
  Armchair,
  Camera,
  Car,
  Check,
  ClipboardList,
  DoorOpen,
  Disc3,
  Gauge,
  Lightbulb,
  Package,
  Palette,
  PanelTop,
  RotateCcw,
  Save,
  Share2,
  SlidersHorizontal,
  Sofa,
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
  SIGNATURE_BUILDS,
  decodeConfig,
  encodeConfig,
  matchSignatureBuild,
  type CameraFocus,
} from "@/components/configurator/config";
import SceneErrorBoundary from "@/components/configurator/SceneErrorBoundary";
import StudioAudio from "@/components/configurator/StudioAudio";
import StudioIntro from "@/components/configurator/StudioIntro";
import { CARS, DEFAULT_CAR } from "@/components/configurator/models";

const ConfiguratorScene = lazy(() => import("@/components/configurator/Scene"));

/** Ракурсы, доступные в разделе «Салон». */
type InteriorView = Extract<CameraFocus, "interiorFront" | "interiorDriver" | "interiorRear">;

const FOCUS_VALUES: CameraFocus[] = [
  "default", "exterior", "wheels", "kit", "carbon", "lights", "env",
  "interiorFront", "interiorDriver", "interiorRear",
];

type SavedBuild = { code: string; savedAt: string; price?: number };

function readSavedBuilds(): SavedBuild[] {
  try {
    const raw = localStorage.getItem("mmonogram-builds");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is SavedBuild => {
        return (
          item &&
          typeof item.code === "string" &&
          typeof item.savedAt === "string" &&
          (typeof item.price === "number" || typeof item.price === "undefined")
        );
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}

function estimateBuildPrice(c: BuildConfig): number {
  const interiorPrices = [0, 12000, 18000, 22000];
  const car = CARS[c.model] ?? CARS[DEFAULT_CAR];
  const hasKit = Boolean(car.files.kit);
  const hasInterior = Boolean(car.files.interior);
  return (
    349000 +
    (hasKit && c.kitPackage === 0 ? -42000 : 0) +
    (c.paint > 0 ? 6500 : 0) +
    c.rimFinish * 1200 +
    (c.carbon ? 18500 : 0) +
    (c.grille > 0 ? 2500 : 0) +
    (hasInterior ? interiorPrices[c.interior] ?? 0 : 0)
  );
}

type StudioSection =
  | "signature"
  | "exterior"
  | "wheels"
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
  control?: "camera";
};

/** Свой знак на каждый ракурс салона. */
const INTERIOR_VIEW_ICONS = {
  interiorFront: PanelTop,
  interiorDriver: Gauge,
  interiorRear: Sofa,
} as const;

const SECTION_FOCUS: Partial<Record<StudioSection, CameraFocus>> = {
  /* Готовый пакет показываем с общего ракурса: меняется вся машина сразу,
     а не одна деталь, и подъезжать к колесу тут незачем. */
  signature: "default",
  exterior: "exterior",
  wheels: "wheels",
  openings: "kit",
  lights: "lights",
  env: "env",
};

const TILE = "h-12 w-[76px] shrink-0 rounded-[3px] ring-1 ring-white/15";

/**
 * Выкраска в той же плитке, что и фотография.
 *
 * Фотографии есть только у шести красок из десяти и у трёх отделок дисков из
 * пяти — дорисовать остальные нечем, рендеров нет. Поэтому у цвета без снимка
 * своя честная подача: не «недостающая картинка», а образец краски. Блик
 * сверху и затемнение снизу дают ту же кривизну, что видна на кузове, и в
 * ряду с фотографиями чип не выглядит заплаткой.
 */
function PaintChip({ color }: { color: string }) {
  return (
    <span className={`relative block overflow-hidden ${TILE}`} style={{ backgroundColor: color }}>
      <span className="absolute inset-0 bg-gradient-to-b from-white/22 via-transparent to-black/35" />
      <span className="absolute inset-x-0 top-[18%] h-[14%] bg-white/12 blur-[2px]" />
    </span>
  );
}

/**
 * Отделка салона: основной тон плашкой, акцент полосой снизу — как на
 * карточке кожи у обивщика. Габарит тот же, что у остальных плиток, иначе
 * столбец предпросмотра в списке гуляет.
 */
function LeatherChip({ primary, accent }: { primary: string; accent: string }) {
  return (
    <span className={`relative block overflow-hidden ${TILE}`} style={{ backgroundColor: primary }}>
      <span className="absolute inset-x-0 bottom-0 h-[22%]" style={{ backgroundColor: accent }} />
      <span className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/25" />
    </span>
  );
}

/**
 * Плитка фар: две круглые фары, зажжённые или потухшие.
 *
 * Первый вариант рисовал ещё решётку и бампер, но плитка всего 76 пикселей
 * шириной — вся эта мелочь сливалась в пятно. Осталось только то, что
 * читается в таком размере: два круглых блока с хромированным ободком, свет
 * из них и лучи в стороны. Сразу видно, о чём строка.
 */
function LightChip({ on }: { on: boolean }) {
  const lamp = (cx: number) => (
    <g key={cx}>
      {on && <circle cx={cx} cy="24" r="17" fill="url(#mm-glow)" />}
      <circle cx={cx} cy="24" r="10" fill={on ? "#0f1216" : "#131619"} stroke="#5a6169" strokeWidth="1.6" />
      <circle cx={cx} cy="24" r="7" fill={on ? "#f6faff" : "#20242a"} />
      {on && <circle cx={cx - 2} cy="21" r="2.4" fill="#ffffff" />}
    </g>
  );
  return (
    <span className={`relative block overflow-hidden ${TILE}`} style={{ backgroundColor: "#0a0c0f" }}>
      <svg viewBox="0 0 76 48" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="mm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2edff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e2edff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Лучи наружу — по ним строка читается как «фары светят» */}
        {on &&
          [
            [3, 24, 9, 24],
            [5, 15, 10, 18],
            [5, 33, 10, 30],
            [73, 24, 67, 24],
            [71, 15, 66, 18],
            [71, 33, 66, 30],
          ].map(([x1, y1, x2, y2]) => (
            <line
              key={`${x1}-${y1}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#dce9ff"
              strokeOpacity="0.75"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ))}
        {[24, 52].map(lamp)}
      </svg>
    </span>
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
      className="tuning-option"
    >
      <span className="tuning-option-preview">{preview}</span>
      <span className="tuning-option-copy">
        <span className="tuning-option-title">{title}</span>
        {subtitle && (
          <span className="tuning-option-detail">
            {subtitle}
          </span>
        )}
      </span>
      {selected && (
        <span className="tuning-option-check">
          <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
      )}
    </button>
  );
}


const ConfiguratorPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [config, setConfig] = useState<BuildConfig>(() => decodeConfig(searchParams.get("c")));
  /* Панель открывается на готовых пакетах, а не на палитре красок: первым
     делом человек должен увидеть то, что ателье продаёт, и уже потом
     править под себя. */
  const [activeSection, setActiveSection] = useState<StudioSection>("signature");
  const [tuningOpen, setTuningOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { optionsRef.current?.scrollTo({ top: 0 }); }, [activeSection]);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() => readSavedBuilds());
  const [focus, setFocus] = useState<CameraFocus>(() => {
    const v = searchParams.get("v");
    return v && (FOCUS_VALUES as string[]).includes(v) ? (v as CameraFocus) : "default";
  });

  /** Машины в публичном выборе; референсные — только с ?dev=1. */
  const car = CARS[config.model] ?? CARS[DEFAULT_CAR];
  /* У оцифрованного кузова двери из одного меша не вынуть, и раздел
     «Openings» раньше подменял всю машину процедурной заглушкой. */
  const canOpen = !!car.supportsOpenings;
  const hasKit = Boolean(car.files.kit);
  const hasInterior = Boolean(car.files.interior);

  /* Ракурс держим в адресе рядом со сборкой: страница его читает при загрузке,
     а до этого записывала только код сборки — присланная ссылка открывалась
     не с того вида, с которого её отправили. */
  const syncUrl = useCallback(
    (next: BuildConfig, nextFocus: CameraFocus) => {
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous);
        params.set("c", encodeConfig(next));
        if (nextFocus !== "default") params.set("v", nextFocus);
        else params.delete("v");
        return params;
      }, { replace: true });
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

  /* Какому фирменному пакету отвечает текущая сборка (или null, если человек
     ушёл в свою). Нужен и разделу Signature, и подписи в списке разделов. */
  const signature = matchSignatureBuild(config);

  const focusForSection = (section: StudioSection): CameraFocus =>
    /* Салон открывается видом на передние кресла, а не с места водителя:
       оттуда в кадре почти один руль, а показать надо кожу. Место водителя
       осталось отдельным ракурсом в списке. */
    section === "interior" ? "interiorFront" : SECTION_FOCUS[section] ?? "default";

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

  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  const currentBuildUrl = useCallback(() => {
    const params = new URLSearchParams({ c: encodeConfig(config) });
    if (focus !== "default") params.set("v", focus);
    return `${location.origin}/configurator?${params}`;
  }, [config, focus]);

  const copyBuildUrl = useCallback(async (url: string) => {
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
  }, []);

  const handleShare = useCallback(async () => {
    const url = currentBuildUrl();
    const shareData = {
      title: "M-Monogram G-Class build",
      text: "M-Monogram 3D configurator build",
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyBuildUrl(url);
  }, [copyBuildUrl, currentBuildUrl]);

  const price = estimateBuildPrice(config);
  const formatPrice = useCallback(
    (value: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value),
    []
  );

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
    const next = [{ code, savedAt: new Date().toISOString(), price }, ...saved.filter((item) => item.code !== code)].slice(0, 12);
    try {
      localStorage.setItem("mmonogram-builds", JSON.stringify(next));
      setSavedBuilds(next);
    } catch {
      /* Квота или запрет хранилища — сборка всё равно живёт в ссылке. */
    }
    handleChange({ ...config, saved: true });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  }, [config, handleChange, price]);

  const handleScreenshot = useCallback(async () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#configurator-canvas canvas");
    if (!canvas) return;
    setScreenshotError(false);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.96));
      if (!blob) throw new Error("Empty screenshot");
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `m-monogram-build-${encodeConfig(config)}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setScreenshotFlash(true);
      window.setTimeout(() => setScreenshotFlash(false), 1800);
    } catch {
      setScreenshotError(true);
      window.setTimeout(() => setScreenshotError(false), 2400);
    }
  }, [config]);

  const handleReset = useCallback(() => {
    setActiveSection("signature");
    apply(DEFAULT_CONFIG, focusForSection("signature"));
  }, [apply]);

  const loadSavedBuild = useCallback(
    (code: string) => {
      const next = decodeConfig(code);
      setActiveSection("overview");
      apply(next, "default");
    },
    [apply]
  );

  const clearSavedBuilds = useCallback(() => {
    try {
      localStorage.removeItem("mmonogram-builds");
    } catch {
      /* Хранилище может быть запрещено, но интерфейс всё равно должен жить. */
    }
    setSavedBuilds([]);
    handleChange({ ...config, saved: false });
  }, [config, handleChange]);

  const sections = useMemo(
    () => ([
      /* Раздел выбора машины прячем, когда выбирать не из чего: одна карточка
         с единственной моделью занимала место и выглядела недоделкой. */
      { id: "signature" as const, label: "Signature", value: signature?.name ?? "Custom", icon: Sparkles },
      { id: "exterior" as const, label: t("config.exterior"), value: PAINTS[config.paint].name, icon: Palette },
      { id: "wheels" as const, label: t("config.rims"), value: RIM_FINISHES[config.rimFinish].name, icon: Disc3 },
      /* Раздела «Body Kit» в списке нет: пакет остался один, и вкладка с
         единственной несменяемой строкой — то же самое, что вкладка выбора
         машины при одной машине. Обвес показан в Overview. */
      /* Раздела «Carbon Package» в списке нет. В выгрузке кузова карбоном
         помечен ровно один примитив из восьмидесяти восьми — переключатель
         менял материал, которого на машине почти нет, и посетитель жал
         кнопку, не видя разницы. Вернём, когда в модели появятся размеченные
         карбоновые детали: капот, зеркала, накладки порогов. */
      ...(canOpen
        ? [{ id: "openings" as const, label: t("config.openings"), value: [config.doors && t("config.doors"), config.hood && t("config.hood"), config.trunk && t("config.trunk")].filter(Boolean).join(" · ") || t("config.closed"), icon: DoorOpen }]
        : []),
      { id: "lights" as const, label: t("config.lights"), value: config.lights ? t("config.lightsOn") : t("config.lightsOff"), icon: Lightbulb },
      { id: "env" as const, label: t("config.environment"), value: config.night ? t("config.envNight") : t("config.envStudio"), icon: SunMoon },
      ...(hasInterior
        ? [{ id: "interior" as const, label: t("config.interior"), value: INTERIOR_FINISHES[config.interior].name, icon: Armchair }]
        : []),
      { id: "overview" as const, label: t("config.overview"), value: "", icon: ClipboardList },
    ]),
    [canOpen, config, hasInterior, signature?.name, t]
  );

  const overviewRows = [
    { label: t("config.model"), value: car.name },
    { label: t("config.exterior"), value: `${PAINTS[config.paint].name} · ${GRILLE_FINISHES[config.grille].name}` },
    { label: t("config.rims"), value: RIM_FINISHES[config.rimFinish].name },
    ...(hasKit ? [{ label: t("config.kit"), value: KIT_PACKAGES[config.kitPackage].name }] : []),
    { label: t("config.carbon"), value: config.carbon ? t("config.carbonOn") : t("config.carbonOff") },
    { label: t("config.lights"), value: config.lights ? t("config.lightsOn") : t("config.lightsOff") },
    { label: t("config.environment"), value: config.night ? t("config.envNight") : t("config.envStudio") },
    ...(hasInterior ? [{ label: t("config.interior"), value: INTERIOR_FINISHES[config.interior].name }] : []),
    ...(canOpen
      ? [{ label: t("config.openings"), value: [config.doors && t("config.doors"), config.hood && t("config.hood"), config.trunk && t("config.trunk")].filter(Boolean).join(" · ") || t("config.closed") }]
      : []),
    { label: "Price", value: formatPrice(price) },
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
      case "signature":
        return SIGNATURE_BUILDS.map((build) => ({
          key: `signature-${build.id}`,
          selected: signature?.id === build.id,
          onClick: () => apply({ ...build.config, saved: config.saved }, "default"),
          preview: <PaintChip color={GRILLE_FINISHES[build.config.grille].color} />,
          title: build.name,
          subtitle: build.tagline,
        }));

      /*
       * Только выкраски. Фотографии отсюда убраны: снимок делался на чёрной
       * машине, и Emerald с Oxblood на нём выходили почти чёрными — цвет по
       * ним не читался вовсе, а половина списка всё равно шла плашками, и
       * столбец выглядел собранным из двух разных списков.
       *
       * Отделка решётки переехала в Signature: там она и есть содержание
       * пакета, и держать её вторым списком здесь значило дублировать.
       */
      case "exterior":
        return PAINTS.map((paint, index) => ({
          key: `paint-${paint.id}`,
          selected: config.paint === index,
          onClick: () => set({ paint: index }),
          preview: <PaintChip color={paint.color} />,
          title: paint.name,
        }));

      case "wheels":
        return RIM_FINISHES.map((finish, index) => ({
          key: `rim-finish-${finish.id}`,
          selected: config.rimFinish === index,
          onClick: () => set({ rimFinish: index }),
          preview: <PaintChip color={finish.color} />,
          title: finish.name,
          subtitle: t("config.rimColor"),
        }));

      case "openings":
        return canOpen
          ? [
              {
                key: "showcase-open",
                selected: config.doors && config.hood && config.trunk,
                onClick: () => set({ doors: true, hood: true, trunk: true }),
                preview: <Sparkles className="h-8 w-8" strokeWidth={1.35} />,
                title: "Showcase Open",
                subtitle: "All panels",
              },
              {
                key: "close-all",
                selected: !config.doors && !config.hood && !config.trunk,
                onClick: () => set({ doors: false, hood: false, trunk: false }),
                preview: <Car className="h-8 w-8" strokeWidth={1.35} />,
                title: "Close All",
                subtitle: "Clean silhouette",
              },
              {
                key: "doors",
                selected: config.doors,
                onClick: () => set({ doors: !config.doors }),
                preview: <DoorOpen className="h-8 w-8" strokeWidth={1.35} />,
                title: t("config.doors"),
                subtitle: config.doors ? t("config.open") : t("config.closed"),
              },
              {
                key: "hood",
                selected: config.hood,
                onClick: () => set({ hood: !config.hood }),
                preview: <Car className="h-8 w-8" strokeWidth={1.35} />,
                title: t("config.hood"),
                subtitle: config.hood ? t("config.open") : t("config.closed"),
              },
              {
                key: "trunk",
                selected: config.trunk,
                onClick: () => set({ trunk: !config.trunk }),
                preview: <Package className="h-8 w-8" strokeWidth={1.35} />,
                title: t("config.trunk"),
                subtitle: config.trunk ? t("config.open") : t("config.closed"),
              },
            ]
          : [];

      case "lights":
        return [
          {
            key: "lights-on",
            selected: config.lights,
            onClick: () => set({ lights: true }),
            preview: <LightChip on />,
            title: t("config.lightsOn"),
            subtitle: "Headlamps and tail lamps lit",
          },
          {
            key: "lights-off",
            selected: !config.lights,
            onClick: () => set({ lights: false }),
            preview: <LightChip on={false} />,
            title: t("config.lightsOff"),
            subtitle: "Parked, lamps dark",
          },
        ];

      case "env":
        return [
          {
            key: "env-studio",
            selected: !config.night,
            onClick: () => set({ night: false }),
            preview: <PaintChip color="#c7cbce" />,
            title: t("config.envStudio"),
          },
          {
            key: "env-night",
            selected: config.night,
            onClick: () => set({ night: true }),
            preview: <PaintChip color="#0a0a0c" />,
            title: t("config.envNight"),
          },
        ];

      case "interior":
        return [
          ...INTERIOR_FINISHES.map((finish, index) => ({
            key: `interior-${finish.id}`,
            selected: config.interior === index,
            onClick: () => set({ interior: index }),
            preview: <LeatherChip primary={finish.primary} accent={finish.accent} />,
            title: finish.name,
            subtitle: index === 0 ? "Atelier standard" : "Bespoke order",
          })),
          ...interiorViews.map(([view, label]) => {
            const Icon = INTERIOR_VIEW_ICONS[view];
            return {
              key: view,
              selected: focus === view,
              onClick: () => changeFocus(view),
              /* У каждого ракурса своя иконка: три одинаковых кресла подряд
                 не давали понять, чем строки отличаются. */
              preview: <Icon className="h-7 w-7" strokeWidth={1.35} />,
              title: label,
              control: "camera" as const,
            };
          }),
        ];

      default:
        return [];
    }
    /* interiorViews пересобирается каждый рендер вместе с переводами — в
       зависимостях достаточно самого t. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, apply, canOpen, changeFocus, config, focus, set, t]);

  const activeMeta = sections.find((item) => item.id === activeSection);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-premium-black">
      <SEOHead
        title="3D Studio - M-Monogram | Build Your G-Class"
        description="Configure your bespoke M-Monogram G-Class in real-time 3D: body colors, forged wheels, carbon packages and the M-Monogram body kit."
        path="/configurator"
      />
      {/* Шапка всегда светлая, даже при дневном свете студии: чёрный логотип
          на сером фоне циклорамы читался как выцветший, а под ним теперь
          лежит затемнение сверху — белый держится на любом свете. */}
      {/* Единственный заголовок страницы. Визуально его нет — весь экран
          занимает сцена, — но без h1 страница оставалась безымянной и для
          поисковика, и для скринридера. */}
      <h1 className="sr-only">3D G-Class Configurator — M Monogram Dubai</h1>
      <Header variant="dark" />

      {/* Открытая панель забирает часть экрана, поэтому сцену уводим из-под неё:
          на десктопе влево на половину ширины панели, на телефоне вверх. Это
          трансформ, а не изменение размера канваса, — WebGL ничего не пересобирает. */}
      <div
        id="configurator-canvas"
        className={cn(
          "absolute inset-0 transition-transform duration-300 ease-out will-change-transform",
          tuningOpen ? "-translate-y-[11rem] drawer:translate-y-0 drawer:-translate-x-[11rem] md:-translate-x-[12.5rem]" : "translate-y-0 drawer:translate-x-0"
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
            <ConfiguratorScene config={config} focus={focus} onReady={handleSceneReady} />
          </Suspense>
        </SceneErrorBoundary>
      </div>

      <StudioIntro done={sceneReady} />
      {/* Затемнение кадра. Верхняя и нижняя полосы дают шапке, подписи и кнопке
          тюнинга опору на любом фоне; радиальная — уводит углы в тень, и центр
          с машиной читается как подсвеченное пятно, а не как ровная заливка.
          Только CSS поверх канваса: WebGL ничего лишнего не считает. */}
      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black/75 via-black/28 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/24 to-transparent" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(118% 84% at 50% 46%, transparent 44%, rgba(0,0,0,0.44) 100%)" }}
        />
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
              onClick={() => void copyBuildUrl(shareUrl)}
              className="shrink-0 font-body text-[10px] uppercase tracking-[0.16em] text-white/65 transition-colors hover:text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
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
          tuningOpen && "opacity-0 drawer:pr-[23.25rem] drawer:opacity-100 md:pr-[26.25rem]"
        )}
      >
        {/* Левый нижний угол — единственное место, где названа машина. Одной
            серой строкой она терялась, поэтому приписка отдельно и мелко,
            а имя модели — крупно и светлым. */}
        <div className="hidden drawer:block">
          <p className="font-body text-[9px] uppercase tracking-[0.26em] text-white/35">
            {t("config.demoNote")}
          </p>
          <p className="mt-1 font-display text-[15px] uppercase tracking-[0.2em] text-white/85">
            {car.name}
          </p>
        </div>

        <div
          className={cn(
            "pointer-events-auto flex w-full items-center gap-2 transition-opacity duration-200 drawer:ml-auto drawer:w-auto",
            tuningOpen && "drawer:pointer-events-none drawer:opacity-0"
          )}
        >
          <button
            type="button"
            onClick={() => setTuningOpen(true)}
            aria-expanded={tuningOpen}
            aria-controls="tuning-panel"
            tabIndex={tuningOpen ? -1 : undefined}
            className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 font-body text-[12px] uppercase tracking-[0.18em] text-black shadow-[0_18px_44px_rgba(0,0,0,0.45)] transition-transform duration-150 hover:bg-white/90 active:scale-[0.98] drawer:w-auto"
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
          "tuning-panel absolute z-40 flex flex-col border-white/10 bg-[#101011] shadow-[0_-22px_70px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out will-change-transform",
          "inset-x-0 bottom-0 h-[54dvh] rounded-t-lg border-t",
          /* На десктопе панель во всю высоту: сдвинутая сцена иначе оголяет
             полосу справа под шапкой. Шапка сайта лежит выше по z-index,
             поэтому её кнопки остаются кликабельными поверх панели. */
          "drawer:inset-x-auto drawer:bottom-0 drawer:right-0 drawer:top-0 drawer:h-auto drawer:max-h-none drawer:w-[22rem] drawer:rounded-none md:w-[25rem] drawer:border-l drawer:border-t-0 drawer:pt-[4.5rem]",
          tuningOpen ? "translate-y-0 drawer:translate-x-0" : "translate-y-full drawer:translate-y-0 drawer:translate-x-full"
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-2 drawer:py-3">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.8} />
          <span className="font-display text-[12px] uppercase tracking-[0.22em] text-white">Tuning</span>
          {/* Музыка и сброс жили на плашке поверх машины — единственном месте
              кадра, которое должно быть пустым. Здесь они рядом с опциями,
              которых и касаются. */}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <StudioAudio />
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset build"
              title="Reset build"
              className="flex h-10 w-10 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/10 hover:text-white md:h-8 md:w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTuningOpen(false)}
              aria-label="Close tuning"
              className="-mr-1 flex h-10 w-10 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white md:h-8 md:w-8"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <nav
            aria-label="Tuning sections"
            className="tuning-sections"
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
                  aria-label={item.label}
                  title={item.label}
                  className="tuning-section"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                  <span aria-hidden="true">
                    {{ signature: "Series", exterior: "Paint", wheels: "Wheels", openings: "Doors", lights: "Lights", env: "Studio", interior: "Cabin", overview: "Build" }[item.id]}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex min-h-0 flex-1 flex-col">
            {activeMeta && (
              <div className="tuning-active-heading">
                <span>
                  {activeMeta.label}
                </span>
                {activeMeta.value && (
                  <span className="tuning-active-value">{activeMeta.value}</span>
                )}
              </div>
            )}

            <div ref={optionsRef} className="tuning-options-scroll">
              {activeSection === "overview" ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/booking?build=${encodeConfig(config)}`)}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-md bg-white px-3.5 py-3 text-left text-black transition-colors hover:bg-white/90"
                  >
                    <span className="font-body text-[11px] uppercase tracking-[0.18em]">Request this build</span>
                    <span className="shrink-0 font-body text-[11px] text-black/48">{formatPrice(price)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-white/12 bg-white/[0.04] px-3.5 py-3 text-left text-white transition-colors hover:border-white/35 hover:bg-white/[0.09]"
                  >
                    <span className="font-body text-[11px] uppercase tracking-[0.18em]">
                      {config.saved ? "Saved car" : "Save car"}
                    </span>
                    <span className="font-body text-[10px] uppercase tracking-[0.12em] text-white/42">Local garage</span>
                  </button>
                  {/* Поделиться и снимок — здесь, а не на плашке над машиной:
                      человек доходит до Overview, когда сборка готова, и это
                      ровно тот момент, когда её показывают другим. */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/12 bg-white/[0.04] px-2 py-3 font-body text-[9px] uppercase tracking-[0.1em] text-white/80 transition-colors hover:border-white/35 hover:bg-white/[0.09] hover:text-white"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      {copied ? t("config.shareCopied") : t("config.share")}
                    </button>
                    <button
                      type="button"
                      onClick={handleScreenshot}
                      className="flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/12 bg-white/[0.04] px-2 py-3 font-body text-[9px] uppercase tracking-[0.1em] text-white/80 transition-colors hover:border-white/35 hover:bg-white/[0.09] hover:text-white"
                    >
                      {screenshotFlash ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                      {screenshotError ? "Unavailable" : screenshotFlash ? "Saved" : t("config.screenshot")}
                    </button>
                  </div>
                  {savedBuilds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSavedBuilds}
                      className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-white/12 bg-white/[0.04] px-3.5 py-3 text-left text-white transition-colors hover:border-white/35 hover:bg-white/[0.09]"
                    >
                      <span className="font-body text-[11px] uppercase tracking-[0.18em]">Clear saved</span>
                      <span className="font-body text-[10px] uppercase tracking-[0.12em] text-white/42">
                        {savedBuilds.length} builds
                      </span>
                    </button>
                  )}
                  {savedBuilds.map((item, index) => {
                    const savedConfig = decodeConfig(item.code);
                    const savedCar = CARS[savedConfig.model] ?? CARS[DEFAULT_CAR];
                    const savedPrice = formatPrice(item.price ?? estimateBuildPrice(savedConfig));

                    return (
                      <button
                        key={`${item.code}-${index}`}
                        type="button"
                        onClick={() => loadSavedBuild(item.code)}
                        className="flex min-h-16 flex-col gap-1 rounded-md border border-white/12 bg-white/[0.04] px-3.5 py-3 text-left text-white transition-colors hover:border-white/35 hover:bg-white/[0.09]"
                      >
                        <span className="font-body text-[10px] uppercase tracking-[0.16em] text-white/38">
                          Saved build {index + 1}
                        </span>
                        <span className="font-body text-[12px] leading-snug text-white">
                          {savedCar.name} · {PAINTS[savedConfig.paint].name}
                        </span>
                        <span className="font-body text-[10px] uppercase tracking-[0.12em] text-white/42">
                          {savedPrice}
                        </span>
                      </button>
                    );
                  })}
                  {overviewRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2 last:border-b-0"
                    >
                      <span className="shrink-0 font-body text-[10px] uppercase tracking-[0.16em] text-white/38">
                        {row.label}
                      </span>
                      <span className="text-right font-body text-[12px] text-white">{row.value}</span>
                    </div>
                  ))}
                </>
              ) : activeSection === "lights" ? (
                <div className="tuning-light-row">
                  <Lightbulb size={22} />
                  <span>{t("config.lights")}<small>{config.lights ? t("config.lightsOn") : t("config.lightsOff")}</small></span>
                  <button type="button" role="switch" aria-checked={config.lights} aria-label={t("config.lights")}
                    className="tuning-switch" onClick={() => set({ lights: !config.lights })}><span /></button>
                </div>
              ) : (
                <>
                  {activeSection === "interior" && (
                    <div className="tuning-camera-views" aria-label="Interior camera">
                      {options.filter(option => option.control === "camera").map(option => (
                        <button type="button" key={option.key} aria-pressed={option.selected} onClick={option.onClick}>
                          {option.preview}<span>{option.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={cn("tuning-option-grid", activeSection === "signature" && "tuning-packages")}>
                    {options.filter(option => option.control !== "camera").map(option => (
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
                </>
              )}
            </div>
          </div>
        </div>

        <div className="tuning-footer">
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
