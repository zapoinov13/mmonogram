import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BuildConfig, GRILLE_FINISHES, INTERIOR_FINISHES, PAINTS, RIM_FINISHES, decodeConfig } from "./config";
import { CAD_CONSOLE_URL, CAD_DASHBOARD_URL, CAD_INSTRUMENTS_URL, CAD_INTERIOR_URL, CAD_UPHOLSTERY_URL, CAD_STEERING_DETAILS_URL, CARS, DEFAULT_CAR, DRACO_PATH, MESH_RULES, ROLE_DEBUG_COLORS, assemblyAssets, modelAssetUrl, carFiles, type CarModel, type FileRole, type PartRole } from "./models";
import { createInstrumentTexture } from "./instrumentTexture";
import { createCabinMetalMaterials, createOriginalWheelMaterials } from "./finishMaterials";
import { createCabinSurfaceMaterials } from "./cabinMaterials";
import {
  cabinDashAtMax,
  classifyCabin,
  classifyPart,
  computeFit,
  describeMaterial,
  isDebris,
  type Fit,
} from "./fitModel";
import CabinDetails from "./CabinDetails";
import { goldCustomRole, goldSteeringRole } from "./goldInterior";
import GoldRearScreens from "./GoldRearScreens";
import { CAD_GRILLE_KIT_URL, CAD_WHEELS_URL, hideReplacedGrilleFrame } from "./models";
import { getHeadlightAppearance } from "./headlights";
import ForgedWheelSet from "./ForgedWheelSet";

/**
 * Оцифрованная сборка G63 вместо процедурной заглушки.
 *
 * Модели приходят из заводского CAD без разметки: один серый материал на всё,
 * имена мешей нечитаемые, единицы измерения и ориентация осей неизвестны.
 * Поэтому компонент сам приводит сборку к сцене — разворачивает по осям и
 * нормирует масштаб по длине кузова — и раздаёт материалы, определяя роль
 * каждой части по её месту в габаритах.
 *
 * Кузов задаёт общий трансформ. Все выбранные части используют одну
 * границу загрузки: первый кадр показывает целую сборку, а не её замену.
 */

/* Роль debris сюда не входит: такие меши прячутся, а не красятся, и
   материала для них не существует. */
type PaintedRole = Exclude<PartRole, "debris">;
type Materials = Record<PaintedRole, THREE.Material>;

const STEERING_WHEEL_SOURCE_BOX = new THREE.Box3(
  new THREE.Vector3(0.18, 0.94, -1.56),
  new THREE.Vector3(0.63, 1.39, -1.2),
);

const HEADLIGHT_Z = [-0.64, 0.64] as const;

function HeadlightRig({ enabled }: { enabled: boolean }) {
  const appearance = getHeadlightAppearance(enabled);
  const targets = useMemo(
    () => HEADLIGHT_Z.map((z) => {
      const target = new THREE.Object3D();
      target.position.set(7.8, 0.18, z);
      return target;
    }),
    [],
  );

  if (!enabled) return null;

  return (
    <group>
      {targets.map((target, index) => (
        <group key={HEADLIGHT_Z[index]}>
          <primitive object={target} />
          <spotLight
            position={[2.34, 0.88, HEADLIGHT_Z[index]]}
            target={target}
            angle={0.36}
            penumbra={0.78}
            intensity={appearance.beamIntensity}
            distance={12}
            decay={2}
            color="#dcecff"
          />
          <pointLight
            position={[2.38, 0.88, HEADLIGHT_Z[index]]}
            intensity={0.9}
            distance={1.25}
            decay={2}
            color="#e6f2ff"
          />
        </group>
      ))}
    </group>
  );
}

function fitSourceBox(box: THREE.Box3, fit: Fit) {
  return box.clone().applyMatrix4(
    new THREE.Matrix4().compose(
      fit.position,
      fit.quaternion,
      new THREE.Vector3(fit.scale, fit.scale, fit.scale),
    ),
  );
}

/** Один загруженный файл: клон сцены, общий трансформ, материалы по ролям. */
function Parts({
  url,
  fit: shared,
  kind,
  materials,
  sourceMaterials = false,
  visible = true,
  hideBox,
  onGround,
  onLoaded,
  hideWheels = false,
  hideGrilleFrame = false,
  goldTrim = false,
  goldSteering = false,
  replaceWheelFaces = false,
}: {
  url: string;
  fit?: Fit;
  kind: FileRole;
  materials: Materials;
  sourceMaterials?: boolean;
  visible?: boolean;
  /** Зона в уже посаженной сборке: ею заменяем дублирующуюся деталь. */
  hideBox?: THREE.Box3;
  /** Нижняя точка файла после посадки — по ней выставляется уровень пола. */
  onGround?: (url: string, minY: number) => void;
  onLoaded?: () => void;
  hideWheels?: boolean;
  hideGrilleFrame?: boolean;
  goldTrim?: boolean;
  goldSteering?: boolean;
  replaceWheelFaces?: boolean;
}) {
  const { scene } = useGLTF(modelAssetUrl(url), DRACO_PATH);

  const prepared = useMemo(() => {
    const root = scene.clone(true);
    const fit = shared ?? computeFit(root);

    root.quaternion.copy(fit.quaternion);
    root.scale.setScalar(fit.scale);
    root.position.copy(fit.position);
    root.updateMatrixWorld(true);

    const byRole: Record<PartRole, THREE.Mesh[]> = {
      body: [], wheel: [], wheelBlade: [], wheelAccent: [], tire: [], glass: [], roofGlass: [], taillight: [],
      light: [], brightwork: [], grilleMetal: [], carbon: [], cabinLeather: [], cabinAccent: [],
      cabinTrim: [], cabinDisplay: [], cabinClock: [], cabinClockGlass: [], cabinInstruments: [], cabinInfotainment: [], cabinScreenGlass: [], steeringBlack: [], steeringAccent: [], steeringMetal: [], steeringMarking: [], cabinMetal: [], cabinSpeaker: [], cabinFloor: [], cabinRoof: [], trim: [], debris: [],
    };

    /* Салон разбирается в два прохода: сначала собираем габариты всех
       деталей, потому что по ним же вычисляется, с какого торца кабины
       стоит торпедо, — а без этого руль красится как сиденье. */
    const kept: Array<{ mesh: THREE.Mesh; box: THREE.Box3 }> = [];
    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (sourceMaterials) return;

      if (hideReplacedGrilleFrame(url, mesh.name, hideGrilleFrame)) {
        mesh.visible = false;
        return;
      }

      // CAD export has explicit roles; spatial heuristics would misclassify
      // joined assemblies or discard legitimate thin panels as debris.
      if (url === CAD_INTERIOR_URL || url === CAD_UPHOLSTERY_URL || url === CAD_CONSOLE_URL || url === CAD_INSTRUMENTS_URL || url === CAD_WHEELS_URL || url === CAD_STEERING_DETAILS_URL) {
        const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const role = source.name as PartRole;
        if (Object.prototype.hasOwnProperty.call(byRole, role) && role !== "debris") {
          byRole[role].push(mesh);
        }
        return;
      }

      if (hideWheels && MESH_RULES.some((rule) => rule.role === "wheel" && rule.test.test(mesh.name))) {
        mesh.visible = false;
        return;
      }

      const box = new THREE.Box3().setFromObject(mesh);
      if (isDebris(mesh, box)) {
        mesh.visible = false;
        return;
      }
      if (hideBox?.containsPoint(box.getCenter(new THREE.Vector3()))) {
        mesh.visible = false;
        return;
      }
      kept.push({ mesh, box });
    });

    if (sourceMaterials) return { root, byRole, fit, minY: new THREE.Box3().setFromObject(root).min.y };

    if (kind === "interior") {
      const cabin = new THREE.Box3().setFromObject(root);
      const dashAtMax = cabinDashAtMax(kept.map((k) => k.box), cabin);
      for (const { mesh, box } of kept) {
        const role = goldSteering ? goldSteeringRole(mesh.name) : goldTrim ? goldCustomRole(mesh.name) : undefined;
        // The custom file also contains a second dashboard and console.
        // Only explicitly mapped upholstery belongs over the CAD assembly.
        const originalDashboardPart = /^(?:Куб\.?03[24]|Плоскость\.?(?:021|078|046|047|073)|чсы(?:\.?00[123])?)$/.test(mesh.name);
        if (goldTrim && (!role || (originalDashboardPart && url !== CAD_DASHBOARD_URL))) {
          mesh.visible = false;
          continue;
        }
        byRole[role ?? classifyCabin(box, cabin, dashAtMax)].push(mesh);
      }
    } else {
      for (const { mesh, box } of kept) {
        const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const role = classifyPart(describeMaterial(source), box, fit.carSize, mesh.name);
        const grille = url === CAD_GRILLE_KIT_URL && /chrome_V3|grill__|решетк/i.test(mesh.name);
        const finalRole = grille && role === "brightwork" ? "grilleMetal" : role;
        if (replaceWheelFaces && (finalRole === "wheel" || finalRole === "wheelAccent")) {
          mesh.visible = false;
        }
        byRole[finalRole].push(mesh);
      }
    }

    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("parts")) {
      for (const [role, meshes] of Object.entries(byRole)) {
        if (meshes.length) {
          console.info(
            `[${url.split("/").pop()}] ${role}:`,
            meshes.map((mesh) => {
              const box = new THREE.Box3().setFromObject(mesh);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              return `${mesh.name} @ ${center.toArray().map((value) => value.toFixed(2)).join("/")} [${size.toArray().map((value) => value.toFixed(2)).join("/")}]`;
            }).join(", "),
          );
        }
      }
    }

    return { root, byRole, fit, minY: new THREE.Box3().setFromObject(root).min.y };
  }, [scene, shared, kind, url, sourceMaterials, hideBox, hideWheels, hideGrilleFrame, goldTrim, goldSteering, replaceWheelFaces]);

  useLayoutEffect(() => {
    onGround?.(url, prepared.minY);
    onLoaded?.();
  }, [url, prepared, onGround, onLoaded]);

  useLayoutEffect(() => {
    if (sourceMaterials) return;
    for (const [role, meshes] of Object.entries(prepared.byRole)) {
      if (role === "debris") {
        for (const mesh of meshes) mesh.visible = false;
        continue;
      }
      for (const mesh of meshes) mesh.material = materials[role as PaintedRole];
    }
  }, [prepared, materials, sourceMaterials]);

  return <primitive object={prepared.root} visible={visible} />;
}

export default function GClassGLTF({
  config,
  interiorVisible = false,
}: {
  config: BuildConfig;
  interiorVisible?: boolean;
}) {
  const car: CarModel = CARS[config.model] ?? CARS[DEFAULT_CAR];
  /* Полная рабочая сборка; исходники доступны только в режиме сравнения. */
  const files = useMemo(() => carFiles(car), [car]);
  const cadInterior = files.interior === CAD_INTERIOR_URL;
  const body = useGLTF(modelAssetUrl(files.body), DRACO_PATH);
  const fit = useMemo(() => computeFit(body.scene.clone(true), car.length), [body.scene, car.length]);
  const [steeringReady, setSteeringReady] = useState(false);
  const reportSteeringReady = useCallback(() => setSteeringReady(true), []);
  const interiorSteeringMask = useMemo(
    () => (steeringReady && files.interior && files.steering ? fitSourceBox(STEERING_WHEEL_SOURCE_BOX, fit) : undefined),
    [steeringReady, files.interior, files.steering, fit],
  );

  const debugRoles = useMemo(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("parts"),
    [],
  );

  const instrumentMaps = useMemo(() => ({ driver: createInstrumentTexture("driver"), centre: createInstrumentTexture("centre") }), []);
  useLayoutEffect(() => () => Object.values(instrumentMaps).forEach((texture) => texture.dispose()), [instrumentMaps]);
  const materials = useMemo<Materials>(() => {
    if (debugRoles) {
      const debug = {} as Materials;
      for (const [role, color] of Object.entries(ROLE_DEBUG_COLORS)) {
        debug[role as PaintedRole] = new THREE.MeshBasicMaterial({ color });
      }
      return debug;
    }

    const paint = PAINTS[config.paint];
    const finish = RIM_FINISHES[config.rimFinish];
    const grille = GRILLE_FINISHES[config.grille];
    const interior = INTERIOR_FINISHES[config.interior] ?? INTERIOR_FINISHES[0];
    const headlight = getHeadlightAppearance(config.lights);
    return {
      body: new THREE.MeshPhysicalMaterial({
        color: paint.color,
        metalness: paint.metalness,
        roughness: paint.roughness,
        clearcoat: 0.7,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.7,
      }),
      ...createOriginalWheelMaterials(finish),
      tire: new THREE.MeshStandardMaterial({ color: cadInterior ? "#111314" : "#2a2d31", metalness: 0, roughness: 0.9 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: cadInterior ? "#30383a" : "#c6d0d2",
        metalness: 0,
        roughness: 0.08,
        envMapIntensity: cadInterior ? 0.25 : 1,
        transmission: 0,
        transparent: true,
        opacity: interiorVisible ? 0.12 : 0.24,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      roofGlass: new THREE.MeshPhysicalMaterial({
        color: "#11191b",
        metalness: 0,
        roughness: 0.24,
        envMapIntensity: 0.2,
        specularIntensity: 0.25,
        clearcoat: 0.15,
        clearcoatRoughness: 0.22,
        transparent: false,
        opacity: 1,
        depthWrite: true,
        side: THREE.DoubleSide,
      }),
      taillight: new THREE.MeshStandardMaterial({
        color: config.lights ? "#7d1014" : "#270609",
        emissive: config.lights ? "#d31d28" : "#000000",
        emissiveIntensity: config.lights ? 2.4 : 0,
        roughness: 0.3,
      }),
      light: new THREE.MeshStandardMaterial({
        color: headlight.lensColor,
        emissive: headlight.emissive,
        emissiveIntensity: headlight.emissiveIntensity,
        metalness: 0.08,
        roughness: config.lights ? 0.12 : 0.3,
        toneMapped: !config.lights,
      }),
      /* Решётка, кант по борту и вставки порогов идут одной отделкой. Золото
         по умолчанию: на g3-iconic-gold-front.jpg весь декоративный металл
         машины золотой, тёплая латунь, а не хром. */
      grilleMetal: new THREE.MeshStandardMaterial({
        color: grille.color,
        metalness: grille.metalness,
        roughness: Math.max(grille.roughness, 0.32),
        envMapIntensity: 0.65,
      }),
      brightwork: new THREE.MeshStandardMaterial({
        color: grille.color,
        metalness: grille.metalness,
        roughness: grille.roughness,
      }),
      // Выключенный карбон-пакет означает «в цвет кузова» — так и в панели
      carbon: config.carbon
        ? new THREE.MeshPhysicalMaterial({
            color: "#1a1b1f",
            metalness: 0.55,
            roughness: 0.4,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
          })
        : new THREE.MeshPhysicalMaterial({
            color: paint.color,
            metalness: paint.metalness,
            roughness: paint.roughness,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
          }),
      /* Рамки окон, рейлинги и водосток. На g3-iconic-gold-side они чёрные
         глянцевые заодно с кузовом, а не матовые: матовая серая полоса вдоль
         крыши рядом с глянцевым чёрным читалась как отдельная деталь. */
      trim: new THREE.MeshStandardMaterial({ color: "#0d0d0e", metalness: 0.3, roughness: 0.3 }),
      ...createCabinSurfaceMaterials(interior),
      cabinDisplay: new THREE.MeshPhysicalMaterial({
        color: "#050607",
        metalness: 0,
        roughness: 0.65,
        specularIntensity: 0.08,
        envMapIntensity: 0.03,
      }),
      cabinClock: new THREE.MeshStandardMaterial({ color: "#ece7dc", roughness: 0.5, metalness: 0.08 }),
      cabinInstruments: new THREE.MeshBasicMaterial({ map: instrumentMaps.driver, toneMapped: false }),
      cabinInfotainment: new THREE.MeshBasicMaterial({ map: instrumentMaps.centre, toneMapped: false }),
      cabinScreenGlass: new THREE.MeshPhysicalMaterial({
        color: "#ffffff", roughness: 0.12, metalness: 0,
        transparent: true, opacity: 0.04, depthWrite: false,
        envMapIntensity: 0.08, specularIntensity: 0.15,
      }),
      cabinClockGlass: new THREE.MeshPhysicalMaterial({
        color: "#ffffff", metalness: 0, roughness: 0.08,
        transparent: true, opacity: 0.08, depthWrite: false,
        envMapIntensity: 0.15, specularIntensity: 0.25,
      }),
      steeringBlack: new THREE.MeshPhysicalMaterial({
        color: "#101011", metalness: 0, roughness: 0.6, envMapIntensity: 0.08, specularIntensity: 0.3,
      }),
      steeringAccent: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(interior.accent).multiplyScalar(0.48),
        metalness: 0, roughness: 0.64, envMapIntensity: 0.07, specularIntensity: 0.25,
      }),
      ...createCabinMetalMaterials(),
      cabinSpeaker: new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide, color: "#40372b", metalness: 0.6, roughness: 0.5, envMapIntensity: 0.2,
      }),
      steeringMarking: new THREE.MeshStandardMaterial({
        color: "#e2dfd6", metalness: 0, roughness: 0.58, envMapIntensity: 0.06,
      }),
      cabinFloor: new THREE.MeshStandardMaterial({ color: "#0e0c0c", metalness: 0, roughness: 0.96, envMapIntensity: 0.05 }),
      cabinRoof: new THREE.MeshStandardMaterial({ color: "#141312", metalness: 0, roughness: 0.9, envMapIntensity: 0.05 }),
    };
  }, [instrumentMaps, debugRoles, interiorVisible, cadInterior, config.paint, config.rimFinish, config.grille, config.carbon, config.lights, config.interior]);

  useLayoutEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  /*
   * Пол считается по всей видимой сборке, а не по одному кузову: покрышки
   * лежат в файле обвеса и уходят на 15 см ниже низа кузова. Трансформ,
   * посаженный только по кузову, утапливал их под пол — колёса выглядели
   * срезанными.
   */
  const [grounds, setGrounds] = useState<Record<string, number>>({});
  const reportGround = useCallback((url: string, minY: number) => {
    setGrounds((prev) => (prev[url] === minY ? prev : { ...prev, [url]: minY }));
  }, []);

  // Prepare the complete cabin before revealing the assembly.
  const showInterior = true;

  const groundOffset = useMemo(() => {
    const active = Object.entries(grounds).filter(([url]) => {
      /* Только файлы текущей машины: замеры предыдущей остаются в Record,
         и без этой проверки пол считался по объединению двух сборок. */
      if (url !== files.body && url !== files.kit && url !== files.interior && url !== files.steering) return false;
      if (url === files.kit && !config.kit) return false;
      if ((url === files.interior || url === files.steering) && !showInterior) return false;
      return true;
    });
    return active.length ? -Math.min(...active.map(([, y]) => y)) : 0;
  }, [grounds, config.kit, showInterior, files.body, files.kit, files.interior, files.steering]);

  // frameloop="demand": без явного запроса сдвиг пола не попал бы в кадр
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => invalidate(), [groundOffset, invalidate]);

  return (
    <group position-y={groundOffset}>
      <HeadlightRig enabled={config.lights} />
      {config.kit && files.kit && config.rim !== 1 && (
        <ForgedWheelSet kitUrl={files.kit} fit={fit} design={config.rim} finish={config.rimFinish} caliper={config.caliper} />
      )}
      <group position={fit.position} quaternion={fit.quaternion} scale={fit.scale}>
        {!cadInterior && <CabinDetails night={config.night} interior={config.interior} />}
        {cadInterior && <GoldRearScreens />}
      </group>
      <Parts
        url={files.body}
        fit={fit}
        kind="exterior"
        materials={materials}
        sourceMaterials={car.sourceMaterials}
        hideWheels={config.kit && !!files.kit}
        hideGrilleFrame={config.kit && !!files.kit}
        onGround={reportGround}
      />

      {/* Share CarModel's Suspense boundary so the first frame includes tires and wheels. */}
      {files.kit && config.kit && (
            <Parts
              url={files.kit}
              fit={fit}
              kind="exterior"
              materials={materials}
              onGround={reportGround}
              replaceWheelFaces={cadInterior || config.rim !== 1}
            />
      )}

      {cadInterior && config.kit && config.rim === 1 && (
        <Parts url={CAD_WHEELS_URL} fit={fit} kind="exterior" materials={materials} />
      )}

      {showInterior && files.interior && (
        <Parts
          url={files.interior}
          fit={fit}
          kind="interior"
          materials={materials}
          hideBox={interiorSteeringMask}
        />
      )}

      {showInterior && cadInterior && (
        <Parts url={CAD_UPHOLSTERY_URL} fit={fit} kind="interior" materials={materials} />
      )}

      {showInterior && cadInterior && (
        <Parts url={CAD_CONSOLE_URL} fit={fit} kind="interior" materials={materials} />
      )}
      {showInterior && cadInterior && (
        <Parts url={CAD_INSTRUMENTS_URL} fit={fit} kind="interior" materials={materials} />
      )}

      {showInterior && cadInterior && (
        <Parts url={CAD_DASHBOARD_URL} fit={fit} kind="interior" materials={materials} goldTrim />
      )}

      {showInterior && cadInterior && (
        <Parts url={CAD_STEERING_DETAILS_URL} fit={fit} kind="interior" materials={materials} />
      )}

      {showInterior && files.steering && (
        <Parts url={files.steering} fit={fit} kind="interior" materials={materials} onLoaded={reportSteeringReady} goldSteering={cadInterior} />
      )}
    </group>
  );
}

/* Start the selected assembly together, before nested Parts can suspend. */
{
  const car = CARS[DEFAULT_CAR];
  const files = carFiles(car);
  const initial = decodeConfig(typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("c"));
  for (const url of assemblyAssets(files, initial.rim === 1)) {
    useGLTF.preload(modelAssetUrl(url), DRACO_PATH);
  }
}
