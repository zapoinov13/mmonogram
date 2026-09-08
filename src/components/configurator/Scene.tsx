import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO } from "@react-three/postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import CarModel from "./CarModel";
import { CABIN_MID_X, CABIN_ROOF_Y } from "./cabin";
import { anchorCabinCamera } from "./cabinCamera";
import Showroom from "./Showroom";
import { BuildConfig, isInteriorFocus, type CameraFocus } from "./config";

export type { CameraFocus };



/**
 * Пресеты камер, привязанные к разделам панели — как orbit-пресеты у Mansory:
 * открыл «Диски» — камера сама подлетела к переднему колесу.
 * azimuth — угол от оси +X (перед машины) к +Z, в градусах; polar — от зенита.
 */
interface CameraPreset {
  /** Явная позиция камеры. В тесном салоне сферические углы неудобны —
      проще задать точку глаза прямо в координатах кабины. */
  eye?: [number, number, number];
  azimuth?: number;
  polar?: number;
  distance?: number;
  target: [number, number, number];
  /** Угол обзора для этого ракурса. В салоне «уличные» 38° слишком узкие:
      руль занимает полкадра, торпедо в кадр не помещается. */
  fov?: number;
}

/* Базовый и «салонный» угол обзора: в кабине нужен широкоугольник */
const BASE_FOV = 38;
const BASE_FOV_MOBILE = 54;
const INTERIOR_FOV_MOBILE = 92;

const PRESETS: Record<CameraFocus, { desktop: CameraPreset; mobile: CameraPreset }> = {
  default: {
    desktop: { azimuth: 50, polar: 76, distance: 8.2, target: [0, 0.9, 0] },
    mobile: { azimuth: 24, polar: 80, distance: 9.6, target: [0, 1.0, 0] },
  },
  exterior: {
    desktop: { azimuth: 78, polar: 80, distance: 7.0, target: [0, 0.85, 0] },
    mobile: { azimuth: 30, polar: 81, distance: 11.0, target: [0, 1.0, 0] },
  },
  wheels: {
    desktop: { azimuth: 52, polar: 83, distance: 3.6, target: [1.45, 0.55, 0.4] },
    mobile: { azimuth: 50, polar: 82, distance: 4.0, target: [1.45, 0.5, 0.35] },
  },
  kit: {
    desktop: { azimuth: 148, polar: 77, distance: 7.4, target: [-0.4, 0.85, 0] },
    mobile: { azimuth: 156, polar: 80, distance: 10.8, target: [-0.3, 1.0, 0] },
  },
  carbon: {
    desktop: { azimuth: 26, polar: 55, distance: 5.6, target: [1.1, 1.05, 0] },
    mobile: { azimuth: 22, polar: 58, distance: 8.0, target: [1.0, 1.0, 0] },
  },
  lights: {
    desktop: { azimuth: 8, polar: 79, distance: 5.8, target: [1.6, 0.85, 0] },
    mobile: { azimuth: 6, polar: 80, distance: 7.5, target: [1.5, 0.8, 0] },
  },
  env: {
    desktop: { azimuth: 60, polar: 70, distance: 9.0, target: [0, 0.9, 0] },
    mobile: { azimuth: 28, polar: 74, distance: 11.0, target: [0, 1.05, 0] },
  },
  /* Салон. Точки глаза стоят в проходе между рядами — там, где нет мебели:
     пол колодца 0.86, передние кресла x=-0.02 (z=±0.42), диван x=-1.28,
     торпедо x=0.62, руль (0.3, 1.18, 0.38).
     Мобильные позиции ближе к цели: fov там 54° против 38° на десктопе.

     Высота глаза 1.52 — не выше. Потолок кабины не 1.80: панель крыши
     (Group.006 в стоковом кузове) висит на 1.62…1.70, и камера на 1.64
     оказывалась внутри неё. В кадре это была глухая плита в левом верхнем
     углу — я принял её за артефакт прореживания и полдня искал обломок,
     которого там не было. */
  interiorFront: {
    desktop: { eye: [-0.65, 1.48, 0], target: [0.62, 1.15, 0], fov: 68 },
    mobile: { eye: [-0.78, 1.42, 0.01], target: [0.52, 1.12, 0.05], fov: INTERIOR_FOV_MOBILE },
  },
  /* С места водителя: точка глаза чуть впереди подголовника, взгляд поверх
     руля на приборку. Из прохода за креслами руль закрывала спинка.

     Место водителя у оцифрованной машины на -Z, а не на +Z: пресет стоял
     зеркально и показывал торпедо с пассажирского кресла — руль в кадр не
     попадал вовсе, зато в правой половине было видно наружное зеркало. */
  interiorDriver: {
    /* Угол шире, чем у остальных ракурсов. Отодвинуть точку глаза нельзя —
       сзади её закрывает спинка кресла (см. выше), — поэтому кадр расширяется
       не отъездом, а объективом: на 62° в кадре был почти один руль, на 74°
       рядом с ним помещаются торпедо, дверная карта и край кресла. */
    desktop: { eye: [-0.14, 1.40, -0.42], target: [0.70, 1.20, -0.38], fov: 74 },
    mobile: { eye: [-0.06, 1.40, -0.42], target: [0.70, 1.20, -0.38], fov: INTERIOR_FOV_MOBILE },
  },
  /* Из прохода между передними креслами назад на диван */
  interiorRear: {
    desktop: { eye: [0.2, 1.43, 0], target: [-1.45, 1.14, 0], fov: 60 },
    mobile: { eye: [0.35, 1.43, 0], target: [-1.3, 1.1, 0], fov: INTERIOR_FOV_MOBILE },
  },
};

/* Внутри салона своя дистанция орбиты и свой предел по высоте.
   Максимум 2.1 м — дальше камера вылезла бы за кузов сквозь стекло. */
const INTERIOR_MIN_DISTANCE = 0.35;
const INTERIOR_MAX_DISTANCE = 2.1;

function useSceneQuality() {
  const read = () => {
    if (typeof window === "undefined") {
      return { isMobile: false, reducedMotion: false };
    }
    return {
      isMobile: window.matchMedia("(max-width: 767px), (pointer: coarse)").matches,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  };

  const [quality, setQuality] = useState(read);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setQuality(read());
    mobile.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  return quality;
}

function presetToPosition(p: CameraPreset): THREE.Vector3 {
  if (p.eye) return new THREE.Vector3(...p.eye);
  const azimuth = THREE.MathUtils.degToRad(p.azimuth ?? 50);
  const polar = THREE.MathUtils.degToRad(p.polar ?? 76);
  const distance = p.distance ?? 8;
  return new THREE.Vector3(
    p.target[0] + distance * Math.sin(polar) * Math.cos(azimuth),
    p.target[1] + distance * Math.cos(polar),
    p.target[2] + distance * Math.sin(polar) * Math.sin(azimuth)
  );
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface FlightState {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromFov: number;
  toFov: number;
  start: number;
  duration: number;
}

/**
 * Перелёты камеры к пресетам (0.9 с, ease-in-out) + интро-облёт при загрузке.
 * Работает при frameloop="demand": пока летим — invalidate() каждый кадр,
 * долетели — цикл рендера останавливается и GPU простаивает.
 */
function CameraRig({
  focus,
  isMobile,
  controlsRef,
  flightRef,
  ready,
  reducedMotion,
}: {
  focus: CameraFocus;
  isMobile: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  flightRef: React.MutableRefObject<FlightState | null>;
  /** Машина собрана и стоит в кадре. */
  ready: boolean;
  reducedMotion: boolean;
}) {
  const { camera, invalidate } = useThree();
  const introDone = useRef(false);

  useEffect(() => {
    /* Пока машины нет, камера никуда не летит: раньше интро отрабатывало на
       монтировании, за пару секунд до того, как догружался кузов, — посетитель
       заставал уже приехавшую камеру и пустой подиум, а машина потом просто
       возникала на месте. */
    if (!ready) return;
    const controls = controlsRef.current;
    const preset = (PRESETS[focus] ?? PRESETS.default)[isMobile ? "mobile" : "desktop"];
    const toPos = presetToPosition(preset);
    const toTarget = new THREE.Vector3(...preset.target);
    const cam = camera as THREE.PerspectiveCamera;
    const toFov = preset.fov ?? (isMobile ? BASE_FOV_MOBILE : BASE_FOV);

    if (reducedMotion) {
      introDone.current = true;
      flightRef.current = null;
      camera.position.copy(toPos);
      controls?.target.copy(toTarget);
      cam.fov = toFov;
      cam.updateProjectionMatrix();
      controls?.update();
      invalidate();
      return;
    }

    if (!introDone.current) {
      /* Интро — аккуратный наезд: камера стоит чуть дальше, выше и левее и
         спокойно подходит к дефолтному ракурсу. Прежний вариант уходил на
         55° в сторону и вдвое дальше — получался облёт вокруг машины, а не
         подача. */
      introDone.current = true;
      const introPreset: CameraPreset = {
        target: preset.target,
        azimuth: (preset.azimuth ?? 50) - 16,
        polar: Math.max((preset.polar ?? 76) - 9, 40),
        distance: (preset.distance ?? 8.2) * 1.52,
      };
      camera.position.copy(presetToPosition(introPreset));
      flightRef.current = {
        fromPos: camera.position.clone(),
        toPos,
        fromTarget: toTarget.clone(),
        toTarget,
        fromFov: cam.fov,
        toFov,
        start: performance.now(),
        duration: 2400,
      };
    } else {
      flightRef.current = {
        fromPos: camera.position.clone(),
        toPos,
        fromTarget: controls ? controls.target.clone() : toTarget.clone(),
        toTarget,
        fromFov: cam.fov,
        toFov,
        start: performance.now(),
        duration: 900,
      };
    }
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, isMobile, ready, reducedMotion]);

  useFrame(() => {
    const flight = flightRef.current;
    const controls = controlsRef.current;
    if (!flight || !controls) return;
    const t = Math.min(1, (performance.now() - flight.start) / flight.duration);
    const e = easeInOutCubic(t);
    camera.position.lerpVectors(flight.fromPos, flight.toPos, e);
    controls.target.lerpVectors(flight.fromTarget, flight.toTarget, e);
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera && flight.fromFov !== flight.toFov) {
      cam.fov = THREE.MathUtils.lerp(flight.fromFov, flight.toFov, e);
      cam.updateProjectionMatrix();
    }
    controls.update();
    if (t >= 1) {
      flightRef.current = null;
    } else {
      invalidate();
    }
  });

  return null;
}

/**
 * Камера физически не должна выходить за стены и потолок помещения.
 * Предел по высоте зависит от текущей дистанции, поэтому minPolarAngle
 * пересчитывается каждый кадр: вблизи можно смотреть почти сверху,
 * издалека — только с уровня зала.
 */
function ConfineCamera({
  night,
  controlsRef,
  interior,
  flightRef,
  seat,
}: {
  night: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  interior: boolean;
  flightRef: React.MutableRefObject<FlightState | null>;
  seat: THREE.Vector3 | null;
}) {
  const { camera } = useThree();
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    /* Пределы дистанции нужно выставлять и во время перелёта: OrbitControls.update()
       зажимает радиус по min/maxDistance, поэтому оставленные от прошлого режима
       границы (снаружи — минимум 3 м) выталкивали камеру обратно из салона.
       На время перелёта границы расширяем до объединения обоих режимов, иначе
       вход в салон обрезался бы скачком вместо плавного залёта. */
    const minDist = interior ? INTERIOR_MIN_DISTANCE : 3.0;
    const maxDist = interior ? INTERIOR_MAX_DISTANCE : night ? 11.5 : 12.5;
    if (flightRef.current) {
      controls.minDistance = Math.min(minDist, INTERIOR_MIN_DISTANCE);
      controls.maxDistance = Math.max(maxDist, 12.5);
      // углы во время перелёта тоже не режем — траектория задана пресетом
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI;
      return;
    }
    controls.minDistance = minDist;
    controls.maxDistance = maxDist;
    if (interior) {
      if (seat) anchorCabinCamera(camera.position, controls.target, seat);
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = Math.PI - 0.35;
      return;
    }
    const ceiling = night ? 5.6 : 10.5; // потолок гаража / высота циклорамы
    const distance = camera.position.distanceTo(controls.target);
    const headroom = ceiling - controls.target.y;
    const minPolar = distance > headroom ? Math.acos(Math.min(1, headroom / distance)) : 0.12;
    controls.minPolarAngle = Math.max(0.12, minPolar);
    // и не опускаться ниже пола
    const floorGap = 0.55 - controls.target.y;
    const maxPolar = distance > Math.abs(floorGap) ? Math.acos(Math.max(-1, floorGap / distance)) : Math.PI / 2.05;
    controls.maxPolarAngle = Math.min(Math.PI / 2.02, maxPolar);
  });
  return null;
}

/* Любое изменение конфигурации должно перерисовать кадр в demand-режиме */
function InvalidateOnConfig({ config }: { config: BuildConfig }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [config, invalidate]);
  return null;
}

/**
 * Прогрев demand-режима: текстуры, кубкарта окружения и буфер отражений
 * готовы не в первом кадре. Без этого сцена может остаться пустой до первого
 * действия пользователя, поэтому пару секунд после монтирования просим кадры.
 */
function WarmUpFrames({ reducedMotion }: { reducedMotion: boolean }) {
  const { invalidate } = useThree();
  useEffect(() => {
    let raf = 0;
    const started = performance.now();
    const duration = reducedMotion ? 450 : 1100;
    const tick = () => {
      invalidate();
      if (performance.now() - started < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, reducedMotion]);
  return null;
}

function useRadialShadowTexture() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    /* Ядро держим плотным и коротким: на светлом полу растянутый на девять
       метров полупрозрачный круг не читался тенью вовсе — машина висела в
       воздухе. Тень должна лежать под кузовом, а не заливать площадку. */
    const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
    g.addColorStop(0, "rgba(0,0,0,0.78)");
    g.addColorStop(0.26, "rgba(0,0,0,0.52)");
    g.addColorStop(0.58, "rgba(0,0,0,0.16)");
    g.addColorStop(0.84, "rgba(0,0,0,0.03)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  // Текстура тени жила в видеопамяти до перезагрузки страницы
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function SoftGroundShadow({ night, interior }: { night: boolean; interior: boolean }) {
  const shadow = useRadialShadowTexture();
  if (interior) return null;
  return (
    /* Сжимаем круг по ширине: машина вчетверо длиннее, чем широка, и круглая
       тень выпирала из-под порогов как блин. */
    <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]} renderOrder={-1}>
      <circleGeometry args={[3.9, 96]} />
      <meshBasicMaterial
        map={shadow}
        transparent
        opacity={night ? 0.58 : 0.5}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Окружение рендерится в кубкарту локально — без загрузки HDRI с внешних CDN.
 * Studio: большой верхний софтбокс и боковые панели.
 * Showroom: три продольные потолочные панели, повторяющие LED-полосы гаража,
 * чтобы отражения в лаке совпадали с тем, что видно в помещении.
 */
function SceneEnvironment({ night, isMobile }: { night: boolean; isMobile: boolean }) {
  return (
    <Environment resolution={isMobile ? 256 : 512} frames={1}>
      {/* Фон кубкарты — то, что отражается в лаке. Он намеренно светлее самого
          павильона: на тёмно-сером борта чёрной машины оставались без
          отражений и кузов читался плоским силуэтом. */}
      <color attach="background" args={[night ? "#08090a" : "#5c6165"]} />
      {night ? (
        <>
          {[-5.4, 0, 5.4].map((z) => (
            <Lightformer
              key={z}
              form="rect"
              intensity={7}
              position={[0, 6.3, z]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[19, 0.8, 1]}
            />
          ))}
          {/* Боковые панели: рисуют борт и отделяют чёрный кузов от тёмного фона */}
          <Lightformer intensity={2.4} position={[-9, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[12, 2.2, 1]} />
          <Lightformer intensity={2.4} position={[9, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[12, 2.2, 1]} />
          {/* Низкие полосы на высоте колёс: без них диски сливаются с покрышкой */}
          <Lightformer intensity={1.8} position={[-6, 0.7, 0]} rotation={[0, Math.PI / 2, 0]} scale={[10, 0.5, 1]} />
          <Lightformer intensity={1.8} position={[6, 0.7, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 0.5, 1]} />
        </>
      ) : (
        <>
          <Lightformer intensity={7} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 6, 1]} />
          <Lightformer intensity={2.5} position={[-6, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 1.2, 1]} />
          <Lightformer intensity={2.5} position={[6, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 1.2, 1]} />
          <Lightformer intensity={1.8} position={[0, 2, 7]} rotation={[0, Math.PI, 0]} scale={[7, 1.5, 1]} />
          <Lightformer intensity={1.4} position={[0, 2, -7]} scale={[7, 1.5, 1]} />
        </>
      )}
    </Environment>
  );
}

export default function ConfiguratorScene({
  config,
  focus = "default",
  onReady,
}: {
  config: BuildConfig;
  focus?: CameraFocus;
  /** Дёргается, когда машина собрана: по нему страница убирает заставку. */
  onReady?: () => void;
}) {
  const { isMobile, reducedMotion } = useSceneQuality();
  const [carReady, setCarReady] = useState(false);
  const handleReady = useCallback(() => {
    setCarReady(true);
    onReady?.();
  }, [onReady]);
  const safeFocus = PRESETS[focus] ? focus : "default";
  const interior = isInteriorFocus(safeFocus);
  const seat = useMemo(() => {
    const eye = PRESETS[safeFocus][isMobile ? "mobile" : "desktop"].eye;
    return eye ? new THREE.Vector3(...eye) : null;
  }, [safeFocus, isMobile]);
  const controls = useRef<OrbitControlsImpl>(null);
  const flightRef = useRef<FlightState | null>(null);
  const bg = config.night ? "#08090a" : "#111315";
  const enablePostEffects = !isMobile && !reducedMotion && !interior;

  return (
    <Canvas
      shadows={!isMobile}
      frameloop="demand"
      dpr={[1, 2]}
      performance={{ min: 0.7 }}
      gl={{
        antialias: true,
        alpha: false,
        stencil: false,
        depth: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      camera={{ position: isMobile ? [8.6, 2.9, 4.6] : [5.4, 2.1, 5.2], fov: isMobile ? BASE_FOV_MOBILE : BASE_FOV, near: 0.05 }}
      className="touch-none"
    >
      <color attach="background" args={[bg]} />

      <InvalidateOnConfig config={config} />
      <ConfineCamera night={config.night} controlsRef={controls} interior={interior} flightRef={flightRef} seat={seat} />
      <CameraRig focus={safeFocus} isMobile={isMobile} controlsRef={controls} flightRef={flightRef} ready={carReady} reducedMotion={reducedMotion} />

      <Suspense fallback={null}>
        <SceneEnvironment night={config.night} isMobile={isMobile} />

        <ambientLight intensity={0.45} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={config.night ? 0.82 : 0.95}
          castShadow={!isMobile}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <CarModel config={config} doorsOpen={interior} onReady={handleReady} />

        {/* Свет салона. Материалы кабины не берут свет окружения вовсе, так
            что кроме рассеянного её освещают только эти два плафона — зато
            предсказуемо, одинаково на любой видеокарте.
            Спад квадратичный: интерьерная камера подходит к подголовникам на
            десятки сантиметров, и без него ближняя кожа выбивается в серое. */}
        <pointLight
          position={[CABIN_MID_X + 0.5, CABIN_ROOF_Y - 0.12, 0]}
          intensity={1.15}
          distance={3.4}
          decay={2}
          color="#fff3e8"
        />
        <pointLight
          position={[CABIN_MID_X - 0.9, CABIN_ROOF_Y - 0.12, 0]}
          intensity={1.2}
          distance={3.0}
          decay={2}
          color="#fff1e4"
        />

        <Showroom
          key={config.night ? "night" : "day"}
          night={config.night}
          /* Отражения только ночью и только не на телефоне. Днём пол
             нарисован градиентом и намеренно не освещается: под отражающим
             материалом, который свет всё-таки красит, софтбокс силой 7 съедал
             световое пятно под машиной и обнажал шов на стыке пола с
             циклорамой. Ночью пол и так освещается сценой — там отражение
             ложится ровно и даёт ту самую студийную картинку. */
          reflections={!isMobile && config.night}
        />
        <WarmUpFrames reducedMotion={reducedMotion} />
        <SoftGroundShadow night={config.night} interior={interior} />

        {/* «Дорогая картинка» по пресету MANSORY — Quality: SAO в стыках,
            аккуратный bloom только на бликах, лёгкая студийная десатурация.
            На мобильных AO в половинном разрешении (ТЗ 6.9). */}
        {enablePostEffects && <EffectComposer multisampling={4}>
          {/* В салоне радиус AO меньше: с «уличными» 0.5 м вся кабина попадает
              в затенение и уходит в чёрное. */}
          <N8AO
            aoRadius={interior ? 0.14 : 0.5}
            intensity={interior ? 1.35 : 2.8}
            distanceFalloff={1}
            quality={isMobile ? "medium" : "high"}
            halfRes
          />
          <Bloom intensity={0.11} luminanceThreshold={1.05} luminanceSmoothing={0.25} mipmapBlur />
          <BrightnessContrast contrast={-0.01} />
          <HueSaturation saturation={-0.05} />
        </EffectComposer>}
      </Suspense>

      <OrbitControls
        ref={controls}
        enablePan={false}
        enableZoom={!interior}
        target={[0, isMobile ? 1.0 : 0.9, 0]}
        enableDamping
        dampingFactor={0.08}
        onStart={() => {
          /* пользователь взялся за орбиту — прерываем перелёт */
          flightRef.current = null;
        }}
      />
    </Canvas>
  );
}
