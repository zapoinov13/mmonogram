#!/usr/bin/env node
/**
 * Проверка реестра машин конфигуратора.
 *
 * Зачем. Машину можно завести в src/components/configurator/models.ts, указав
 * один файл кузова, — и она молча попадёт в публичный список. Так уже было
 * дважды: «Stock Version» прятал файл обвеса, а вместе с ним колёса, арки и
 * бамперы, и в кадре оставался голый каркас с открытой подвеской; следом
 * ровно то же дала модель «G63 Iconic Source», добавленная без файла обвеса.
 * Оба раза это заметил не разработчик, а владелец сайта — на боевом домене.
 *
 * Ещё один класс той же беды — переключатель, которому не за что зацепиться.
 * Carbon Package менял материал, которым в выгрузке помечен ровно один
 * примитив из восьмидесяти восьми, а Lights управлял ролью, не назначенной ни
 * одной детали: фары не подходили ни под одно правило классификации. Кнопка
 * нажимается, в сцене не меняется ничего.
 *
 * Что делает. Читает реестр машин и сами GLB-файлы и падает, если:
 *   - файла, указанного у машины, нет на диске;
 *   - у машины нет файла обвеса (в нём лежат колёса — без него не машина);
 *   - в сборке машины не нашлось геометрии под роль «колесо» или «свет»;
 *   - в public/models лежит выгрузка, на которую никто не ссылается.
 *
 * Правила классификации берутся из самого models.ts, а не дублируются здесь:
 * поменяется правило для фар — проверка поедет за ним.
 *
 * Запуск: npm run check:configurator
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const OFF = "\x1b[0m";

const MODELS_TS = "src/components/configurator/models.ts";
const PUBLIC = "public";

const errors = [];
const warnings = [];

const src = readFileSync(MODELS_TS, "utf8");

/* ---- Реестр машин ---------------------------------------------------- */

const carsBlock = src.match(/export const CARS[^=]*=\s*\{([\s\S]*?)\n\};/);
if (!carsBlock) {
  console.error(`${RED}Не разобрать CARS в ${MODELS_TS} — изменился формат реестра.${OFF}`);
  process.exit(1);
}

/** Разбирает один блок «files: { ... }» в набор путей. */
function parseFiles(block) {
  const files = {};
  for (const f of block.matchAll(/(body|kit|interior|steering):\s*`\$\{MODEL_BASE\}([^`]+)`/g)) {
    files[f[1]] = f[2];
  }
  return files;
}

/* Наборов у машины может быть два: основной и тяжёлый под ?hq=1. Разбираем
   их порознь — иначе пути сливаются в один объект, последний затирает
   первый, и лёгкие выгрузки объявляются никому не нужными. */
const setOf = (body, key) => {
  const re = new RegExp(`${key}:\\s*\\{([\\s\\S]*?)\\n    \\}`);
  const m = body.match(re);
  return m ? parseFiles(m[1]) : null;
};

const cars = [];
for (const m of carsBlock[1].matchAll(/"([a-z0-9-]+)":\s*\{([\s\S]*?)\n  \},/g)) {
  const [, id, body] = m;
  cars.push({
    id,
    files: setOf(body, "files") ?? {},
    filesHq: setOf(body, "filesHq"),
    devOnly: /devOnly:\s*true/.test(body),
  });
}

if (!cars.length) {
  console.error(`${RED}В ${MODELS_TS} не найдено ни одной машины — изменился формат реестра.${OFF}`);
  process.exit(1);
}

const MODEL_BASE = src.match(/const MODEL_BASE\s*=\s*"([^"]+)"/)?.[1] ?? "/models";
const onDisk = (webPath) => join(PUBLIC, MODEL_BASE.replace(/^\//, ""), webPath.replace(/^\//, ""));

/* ---- Правила классификации из того же файла -------------------------- */

function rules(name) {
  const block = src.match(new RegExp(`${name}[^=]*=\\s*\\[([\\s\\S]*?)\\n\\];`));
  if (!block) {
    errors.push(`${MODELS_TS}: не разобрать ${name} — изменился формат правил`);
    return [];
  }
  return [...block[1].matchAll(/\{\s*test:\s*\/(.+?)\/([gimsuy]*)\s*,\s*role:\s*"(\w+)"\s*\}/g)].map(
    (m) => ({ test: new RegExp(m[1], m[2].replace("g", "")), role: m[3] })
  );
}

const materialRules = rules("MATERIAL_RULES");
const meshRules = rules("MESH_RULES");

/* ---- Чтение GLB ------------------------------------------------------ */

function readGlb(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("не GLB");
  return JSON.parse(buf.slice(20, 20 + buf.readUInt32LE(12)).toString("utf8"));
}

/**
 * Сколько примитивов приходится на каждую роль.
 *
 * Считаем именно количество, а не «нашлась ли роль». Наличие ничего не
 * доказывает: до починки роль «свет» в сборке была — её давали два диода за
 * решёткой радиатора, — а сами фары не подходили ни под одно правило, и
 * переключатель Lights на глаз не менял ничего. Ровно так же Carbon Package
 * управлял ролью, за которой стоял один примитив из восьмидесяти восьми.
 * Порог отсекает такие «формально есть, фактически нет».
 */
function roleCounts(json) {
  const counts = {};
  const add = (role, n) => {
    counts[role] = (counts[role] ?? 0) + n;
  };

  /* Имя меша важнее материала — так же, как в самом классификаторе: диски в
     файле обвеса покрашены тем же «Car Paint», что и кузов. */
  const byMeshRule = new Set();
  for (const node of json.nodes ?? []) {
    if (typeof node.mesh !== "number") continue;
    const rule = meshRules.find((r) => r.test.test(node.name ?? ""));
    if (!rule) continue;
    byMeshRule.add(node.mesh);
    add(rule.role, (json.meshes?.[node.mesh]?.primitives ?? []).length);
  }

  json.meshes?.forEach((mesh, index) => {
    if (byMeshRule.has(index)) return;
    for (const prim of mesh.primitives ?? []) {
      const name = json.materials?.[prim.material]?.name ?? "";
      const rule = materialRules.find((r) => r.test.test(name));
      if (rule) add(rule.role, 1);
    }
  });

  return counts;
}

/*
 * Потолок веса набора, который грузится по умолчанию.
 *
 * Появился не из головы: 29 августа в main приехали CAD-выгрузки, и
 * конфигуратор стал тянуть 66 МБ вместо 8.9. На телефоне это кончилось тем,
 * что страница перестала открываться вовсе — скачивание идёт минутами, а
 * буферы такой плотности кладут вкладку по памяти. Пять коммитов подряд
 * прошли проверку и деплой, потому что смотреть на вес было некому.
 */
const MAX_DEFAULT_MB = 20;

/* Ниже этого числа деталей роль считается ненаполненной: переключатель есть,
   менять нечего. Пороги подобраны по живой машине — у неё пять примитивов
   фар и по одному на каждое из четырёх колёс с покрышками. */
const MIN_PARTS = { wheel: 4, light: 3 };

/* ---- Проверки -------------------------------------------------------- */

const referenced = new Set();
for (const cadPreview of src.matchAll(/CAD_(?:BODY|GRILLE_KIT|INTERIOR|STEERING_CENTER|STEERING_CONTROLS)_URL\s*=\s*`\$\{MODEL_BASE\}([^`]+)`/g)) {
  const path = onDisk(cadPreview[1]);
  referenced.add(path);
  if (!existsSync(path)) errors.push(`CAD preview: missing ${path}`);
}

for (const car of cars) {
  const label = car.devOnly ? `${car.id} (только для разработки)` : car.id;

  if (!car.files.body) {
    errors.push(`${label}: не указан файл кузова`);
    continue;
  }

  const parts = {};
  let missing = false;

  /* Тяжёлый набор в индекс ссылок попадает, чтобы его файлы не считались
     брошенными, но на полноту и вес проверяется только основной. */
  for (const webPath of Object.values(car.filesHq ?? {})) referenced.add(onDisk(webPath));

  let totalBytes = 0;
  for (const [key, webPath] of Object.entries(car.files)) {
    const path = onDisk(webPath);
    referenced.add(path);
    if (!existsSync(path)) {
      errors.push(`${label}: файл «${key}» не найден на диске — ${relative(".", path)}`);
      missing = true;
      continue;
    }
    try {
      totalBytes += statSync(path).size;
      for (const [role, n] of Object.entries(roleCounts(readGlb(path)))) {
        parts[role] = (parts[role] ?? 0) + n;
      }
    } catch (e) {
      errors.push(`${label}: не прочитать ${relative(".", path)} — ${e.message}`);
      missing = true;
    }
  }

  if (missing) continue;

  const mb = totalBytes / 1024 / 1024;
  if (mb > MAX_DEFAULT_MB) {
    const message =
      `${label}: набор по умолчанию весит ${mb.toFixed(1)} МБ при потолке ${MAX_DEFAULT_MB}. ` +
      `Столько браузер телефона не вывозит — страница 3D-студии перестанет открываться. ` +
      `Тяжёлые выгрузки кладите в filesHq: они доступны по ?hq=1 и не мешают боевому сайту`;
    if (car.devOnly) warnings.push(message);
    else errors.push(message);
  }

  /* Обвес обязателен: колёса лежат в нём, а не в кузове. Машина без него
     рисуется голым каркасом — этим и был сломан «Stock Version». */
  if (!car.files.kit) {
    const message = `${label}: нет файла обвеса (files.kit) — в нём лежат колёса, без него машина рисуется без них`;
    if (car.devOnly) warnings.push(message);
    else errors.push(message);
  }

  for (const [role, what] of [
    ["wheel", "колёса"],
    ["light", "фары"],
  ]) {
    const have = parts[role] ?? 0;
    if (have >= MIN_PARTS[role]) continue;
    const message =
      `${label}: под роль «${role}» (${what}) размечено деталей: ${have}, ожидается от ${MIN_PARTS[role]}. ` +
      `Либо детали не размечены, либо правило классификации в ${MODELS_TS} их не ловит — ` +
      `переключатель в панели будет нажиматься, не меняя ничего`;
    if (car.devOnly) warnings.push(message);
    else errors.push(message);
  }

  console.log(
    `${DIM}  ${car.id}: ` +
      `${(totalBytes / 1024 / 1024).toFixed(1)} МБ · ` +
      Object.entries(parts)
        .sort((a, b) => b[1] - a[1])
        .map(([r, n]) => `${r} ${n}`)
        .join(", ") +
      OFF
  );
}

/* ---- Выгрузки, на которые никто не ссылается ------------------------- */

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.glb$/i.test(e.name) ? [p] : [];
  });
}

for (const path of walk(join(PUBLIC, MODEL_BASE.replace(/^\//, "")))) {
  if (referenced.has(path)) continue;
  const mb = (statSync(path).size / 1024 / 1024).toFixed(1);
  warnings.push(
    `${relative(".", path)}: ${mb} МБ, на файл никто не ссылается — ` +
      `папка public копируется в сборку целиком, значит он уезжает на домен мёртвым грузом`
  );
}

/* ---- Отчёт ----------------------------------------------------------- */

console.log(`\n${DIM}Проверено машин: ${cars.length}${OFF}`);

if (warnings.length) {
  console.log(`\n${YELLOW}Предупреждения (${warnings.length}):${OFF}`);
  for (const w of warnings) console.log(`  ${YELLOW}•${OFF} ${w}`);
}

if (errors.length) {
  console.log(`\n${RED}Ошибки (${errors.length}):${OFF}`);
  for (const e of errors) console.log(`  ${RED}x${OFF} ${e}`);
  console.log("");
  process.exit(1);
}

console.log(`\n${GREEN}OK — у каждой машины есть кузов, обвес, колёса и фары.${OFF}\n`);
