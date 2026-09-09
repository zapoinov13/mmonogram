import { Component, Suspense, useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BuildConfig, GRILLE_FINISHES, INTERIOR_FINISHES, PAINTS, RIM_FINISHES } from "./config";
import { CAD_INTERIOR_URL, CAD_STEERING_CENTER_URL, CARS, DEFAULT_CAR, DRACO_PATH, MESH_RULES, ROLE_DEBUG_COLORS, carFiles, type CarModel, type FileRole, type PartRole } from "./models";
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

/**
 * Оцифрованная сборка G63 вместо процедурной заглушки.
 *
 * Модели приходят из заводского CAD без разметки: один серый материал на всё,
 * имена мешей нечитаемые, единицы измерения и ориентация осей неизвестны.
 * Поэтому компонент сам приводит сборку к сцене — разворачивает по осям и
 * нормирует масштаб по длине кузова — и раздаёт материалы, определяя роль
 * каждой части по её месту в габаритах.
 *
 * Кузов обязателен: по нему считается общий трансформ, к которому
 * притягиваются остальные файлы. Обвес, интерьер и руль необязательны —
 * каждый грузится под своей границей ошибок, чтобы отсутствие интерьера не
 * уносило с собой уже загруженный кузов.
 */

/* Роль debris сюда не входит: такие меши прячутся, а не красятся, и
   материала для них не существует. */
type PaintedRole = Exclude<PartRole, "debris">;
type Materials = Record<PaintedRole, THREE.Material>;

const STEERING_WHEEL_SOURCE_BOX = new THREE.Box3(
  new THREE.Vector3(0.18, 0.94, -1.56),
  new THREE.Vector3(0.63, 1.39, -1.2),
);

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
}) {
  const { scene } = useGLTF(url, DRACO_PATH);

  const prepared = useMemo(() => {
    const root = scene.clone(true);
    const fit = shared ?? computeFit(root);

    root.quaternion.copy(fit.quaternion);
    root.scale.setScalar(fit.scale);
    root.position.copy(fit.position);
    root.updateMatrixWorld(true);

    const byRole: Record<PartRole, THREE.Mesh[]> = {
      body: [], wheel: [], wheelAccent: [], tire: [], glass: [], taillight: [],
      light: [], brightwork: [], carbon: [], cabinLeather: [], cabinAccent: [],
      cabinTrim: [], cabinMetal: [], cabinFloor: [], cabinRoof: [], trim: [], debris: [],
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

      // CAD export has explicit roles; spatial heuristics would misclassify
      // joined assemblies or discard legitimate thin panels as debris.
      if (url === CAD_INTERIOR_URL || url === CAD_STEERING_CENTER_URL) {
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
      for (const { mesh, box } of kept) byRole[classifyCabin(box, cabin, dashAtMax)].push(mesh);
    } else {
      for (const { mesh, box } of kept) {
        const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        byRole[classifyPart(describeMaterial(source), box, fit.carSize, mesh.name)].push(mesh);
      }
    }

    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("parts")) {
      for (const [role, meshes] of Object.entries(byRole)) {
        if (meshes.length) {
          console.info(`[${url.split("/").pop()}] ${role}:`, meshes.map((m) => m.name).join(", "));
        }
      }
    }

    return { root, byRole, fit, minY: new THREE.Box3().setFromObject(root).min.y };
  }, [scene, shared, kind, url, sourceMaterials, hideBox, hideWheels]);

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

/** Файл, отсутствие которого не должно ломать остальную сборку. */
class OptionalBoundary extends Component<{ children: ReactNode; label: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn(`Модель «${this.props.label}» не загрузилась:`, error.message);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function GClassGLTF({
  config,
  interiorVisible = false,
}: {
  config: BuildConfig;
  interiorVisible?: boolean;
}) {
  const car: CarModel = CARS[config.model] ?? CARS[DEFAULT_CAR];
  /* Лёгкий набор по умолчанию, CAD — по ?hq=1. См. carFiles() в models.ts. */
  const files = useMemo(() => carFiles(car), [car]);
  const cadInterior = files.interior === CAD_INTERIOR_URL;
  const body = useGLTF(files.body, DRACO_PATH);
  const fit = useMemo(() => computeFit(body.scene.clone(true), car.length), [body.scene, car.length]);
  const [steeringReady, setSteeringReady] = useState(false);
  const [kitReady, setKitReady] = useState(false);
  const reportKitReady = useCallback(() => setKitReady(true), []);
  const reportSteeringReady = useCallback(() => setSteeringReady(true), []);
  const interiorSteeringMask = useMemo(
    () => (steeringReady && files.interior && files.steering ? fitSourceBox(STEERING_WHEEL_SOURCE_BOX, fit) : undefined),
    [steeringReady, files.interior, files.steering, fit],
  );

  const debugRoles = useMemo(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("parts"),
    [],
  );

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
    return {
      body: new THREE.MeshPhysicalMaterial({
        color: paint.color,
        metalness: paint.metalness,
        roughness: paint.roughness,
        clearcoat: 0.7,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.7,
      }),
      // Поле диска у G63 Iconic глянцево-чёрное, отделкой красятся спицы
      wheel: new THREE.MeshPhysicalMaterial({
        color: "#0a0a0b",
        metalness: 0.6,
        roughness: 0.14,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      }),
      wheelAccent: new THREE.MeshStandardMaterial({
        color: finish.color,
        metalness: finish.metalness,
        roughness: finish.roughness,
      }),
      tire: new THREE.MeshStandardMaterial({ color: "#2a2d31", metalness: 0, roughness: 0.9 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#c6d0d2",
        metalness: 0,
        roughness: 0.08,
        transmission: 0,
        transparent: true,
        opacity: interiorVisible ? 0.12 : 0.24,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      taillight: new THREE.MeshStandardMaterial({
        color: "#2a0707",
        emissive: "#a11212",
        emissiveIntensity: config.lights ? 1.4 : 0.2,
      }),
      light: new THREE.MeshStandardMaterial({
        color: "#f2f4f6",
        emissive: "#dfe8ff",
        emissiveIntensity: config.lights ? 1.6 : 0.05,
      }),
      /* Решётка, кант по борту и вставки порогов идут одной отделкой. Золото
         по умолчанию: на g3-iconic-gold-front.jpg весь декоративный металл
         машины золотой, тёплая латунь, а не хром. */
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
      /* Палитра салона снята с фотографий проекта (g3-iconic-gold-rearseats):
         чёрная кожа #241f1e, бордо сидений #4a231c, тёмный потолок #0f0c0d.

         Окружение кабина берёт еле-еле. Отрезать его совсем, как было
         раньше, оказалось перебором: в three.js окружение ничем не
         загораживается, и на полной силе закрытый салон светился как под
         открытым небом — бордо уходило в лососевый, а результат зависел от
         видеокарты. Но при нуле кожа осталась вовсе без отражений и стала
         похожа на пластилин. Доля в 0.12 даёт коже блеск, а до лососевого
         на тёмной базе не дотягивает.
         Clearcoat не возвращаю: лаковый слой зеркалит окружение белым
         бликом поверх базы, а кожа лаком не покрыта. */
      cabinLeather: new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: interior.primary,
        metalness: 0,
        roughness: 0.78,
        envMapIntensity: 0.12,
      }),
      cabinAccent: new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: interior.accent,
        metalness: 0,
        // Матовая кожа: при меньшей шероховатости плафоны кладут широкий
        // белёсый блик, и бордо серело до пыльно-розового
        roughness: 0.74,
        envMapIntensity: 0.12,
      }),
      /* Накладки передней панели — рояльный лак. Салону нужен хоть один
         зеркальный материал: рядом с ним кожа читается как кожа. */
      cabinTrim: new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: "#0b0b0c",
        metalness: cadInterior ? 0.15 : 0.5,
        roughness: cadInterior ? 0.4 : 0.14,
        envMapIntensity: cadInterior ? 0.15 : 0.4,
      }),
      /* Сетки динамиков, часы, клавиши и дефлекторы — в отделку решётки,
         но сатиновую: полированное золото вблизи выбивается в белое. */
      cabinMetal: new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: grille.color,
        metalness: 1,
        roughness: Math.max(grille.roughness, 0.3),
        envMapIntensity: 0.55,
      }),
      cabinFloor: new THREE.MeshStandardMaterial({ color: "#0e0c0c", metalness: 0, roughness: 0.96, envMapIntensity: 0.05 }),
      cabinRoof: new THREE.MeshStandardMaterial({ color: "#141312", metalness: 0, roughness: 0.9, envMapIntensity: 0.05 }),
    };
  }, [debugRoles, interiorVisible, cadInterior, config.paint, config.rimFinish, config.grille, config.carbon, config.lights, config.interior]);

  useLayoutEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  /*
   * Пол считается по всей видимой сборке, а не по одному кузову: покрышки
   * лежат в файле обвеса и уходят на 15 см ниже низа кузова. Трансформ,
   * посаженный только по кузову, утапливал их под пол — колёса выглядели
   * срезанными.
   */
  const [grounds, setGrounds] = useState<Record<string, number>>({});
  const reportGround = useCallback((url: string, minY: number) => {
    window.setTimeout(() => {
      setGrounds((prev) => (prev[url] === minY ? prev : { ...prev, [url]: minY }));
    }, 0);
  }, []);

  // Load the exterior first unless the current view is already inside the cabin.
  const exteriorLoaded = !files.kit || !config.kit || grounds[files.kit] !== undefined;
  const showInterior = interiorVisible || exteriorLoaded;

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
      <group position={fit.position} quaternion={fit.quaternion} scale={fit.scale}>
        <CabinDetails night={config.night} interior={config.interior} instrumentsOnly={files.interior === CAD_INTERIOR_URL} />
      </group>
      <Parts
        url={files.body}
        fit={fit}
        kind="exterior"
        materials={materials}
        sourceMaterials={car.sourceMaterials}
        hideWheels={config.kit && kitReady}
        onGround={reportGround}
      />

      {/* Обвес и салон у машины может не быть — тогда собирается из того, что есть.
          CAD-файлы тяжёлые, поэтому кузов не ждёт дополнительные части: сцена
          становится интерактивной раньше, а детали догружаются без блокировки. */}
      {files.kit && config.kit && (
        <OptionalBoundary label="обвес и колёса">
          <Suspense fallback={null}>
            <Parts
              url={files.kit}
              fit={fit}
              kind="exterior"
              materials={materials}
              onGround={reportGround}
              onLoaded={reportKitReady}
            />
          </Suspense>
        </OptionalBoundary>
      )}

      {showInterior && files.interior && (
        <OptionalBoundary label="интерьер">
          <Suspense fallback={null}>
            <Parts
              url={files.interior}
              fit={fit}
              kind="interior"
              materials={materials}
              hideBox={interiorSteeringMask}
            />
          </Suspense>
        </OptionalBoundary>
      )}

      {showInterior && cadInterior && car.files.interior && (
        <OptionalBoundary label="отделка CAD-салона">
          <Suspense fallback={null}>
            <Parts url={car.files.interior} fit={fit} kind="interior" materials={materials} hideBox={interiorSteeringMask} />
          </Suspense>
        </OptionalBoundary>
      )}

      {showInterior && cadInterior && (
        <OptionalBoundary label="центральная часть руля">
          <Suspense fallback={null}>
            <Parts url={CAD_STEERING_CENTER_URL} fit={fit} kind="interior" materials={materials} />
          </Suspense>
        </OptionalBoundary>
      )}

      {showInterior && files.steering && (
        <OptionalBoundary label="руль">
          <Suspense fallback={null}>
            <Parts url={files.steering} fit={fit} kind="interior" materials={materials} onLoaded={reportSteeringReady} />
          </Suspense>
        </OptionalBoundary>
      )}
    </group>
  );
}

/* Предзагружаем только машину по умолчанию: остальные — по факту выбора.
   Раньше цикл шёл по всем CARS и тянул referenсe-модель, которой нет в
   публичном списке, — лишние 1.9 МБ на каждом заходе. */
{
  const files = carFiles(CARS[DEFAULT_CAR]);
  useGLTF.preload(files.body, DRACO_PATH);
}
