import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp, { type Sharp } from "sharp";
import type { Plugin } from "vite";

/**
 * Готовит по три уменьшенных копии каждой фотографии в AVIF и WebP.
 *
 * Зачем. Исходники лежат в 1280–1920 пикселей по стороне, и телефон скачивал
 * их целиком: 208 КБ на снимок, который показывается в колонке шириной 390.
 * Байты уходили на пиксели, которые физически некуда положить.
 *
 * Что даёт. Замер на g-1.jpg (1920×1920, 208 КБ):
 *
 *     ширина   avif   webp   jpeg
 *      480px    15K    26K    28K
 *      800px    32K    56K    66K
 *     1200px    57K    97K   125K
 *     1600px    81K   140K   190K
 *
 * То есть телефон получает 15–32 КБ вместо 208 — и при этом картинку лучшего
 * качества: AVIF на q60 держит примерно то же, что JPEG на q85. Экономия идёт
 * не в ущерб виду, а наоборот, освобождает место под более высокое качество.
 *
 * Как называются файлы. Рядом с dist/assets/foo-HASH.jpg кладутся
 * foo-HASH-480.avif, foo-HASH-480.webp и так далее. Имена выводятся из имени
 * оригинала однозначно, поэтому компоненту Picture не нужен ни манифест, ни
 * запрос за ним — он собирает srcset строкой.
 *
 * Про ступень шире исходника. Если снимок уже 1280, файл -1440 всё равно
 * создаётся, но в своей настоящей ширине — 1280. Дескриптор в srcset при этом
 * слегка завышен. Сделано намеренно: так все три файла существуют всегда, и
 * браузер не может выбрать несуществующий адрес. Промах бывает только на очень
 * широких экранах и стоит растяжения на десяток процентов; отсутствующий файл
 * стоил бы битой картинки, потому что на сетевую ошибку внутри выбранного
 * <source> браузер к следующему формату не переходит.
 */

const WIDTHS = [480, 960, 1440] as const;

/* AVIF на q60 примерно равен JPEG q85 по виду и втрое легче. WebP держим выше:
   он менее эффективен, и на низком качестве на глянце кузова лезут полосы. */
const AVIF = { quality: 60, effort: 2 } as const;
const WEBP = { quality: 84 } as const;

/* Кэш переживает пересборки: имя файла в dist содержит хеш содержимого,
   поэтому совпадение имени означает совпадение картинки, и перекодировать
   её второй раз незачем. Первая сборка платит около минуты, следующие — ноль. */
const CACHE = "node_modules/.cache/mm-responsive";

/** Картинки уже меньшего размера обходим: делить 400 пикселей не на что. */
const MIN_SOURCE_WIDTH = 640;

/** Одновременно столько кодировок: sharp считает вне основного потока. */
const CONCURRENCY = 6;

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

export default function responsiveImagesPlugin(): Plugin {
  let outDir = "dist";

  return {
    name: "mmonogram-responsive-images",
    apply: "build",

    configResolved(config) {
      outDir = config.build.outDir;
    },

    async closeBundle() {
      const dir = join(outDir, "assets");
      if (!existsSync(dir)) return;
      mkdirSync(CACHE, { recursive: true });

      const sources = readdirSync(dir).filter(
        (f) => /\.(jpe?g|png|webp)$/i.test(f) && !/-\d+\.(avif|webp)$/i.test(f)
      );

      const started = Date.now();
      let written = 0;
      let cached = 0;
      let skipped = 0;
      let saved = 0;

      await pool(sources, CONCURRENCY, async (file) => {
        const input = join(dir, file);
        let width: number | undefined;
        try {
          width = (await sharp(input).metadata()).width;
        } catch {
          return;
        }
        if (!width || width < MIN_SOURCE_WIDTH) {
          skipped++;
          return;
        }

        const base = file.replace(/\.[^.]+$/, "");
        const original = statSync(input).size;

        for (const target of WIDTHS) {
          for (const [ext, encode] of [
            ["avif", (p: Sharp) => p.avif(AVIF)],
            ["webp", (p: Sharp) => p.webp(WEBP)],
          ] as const) {
            const name = `${base}-${target}.${ext}`;
            const out = join(dir, name);
            const cache = join(CACHE, name);

            if (existsSync(cache)) {
              copyFileSync(cache, out);
              cached++;
            } else {
              /* withoutEnlargement: файл шире исходника не выдумываем — он
                 выходит в своей настоящей ширине. */
              await encode(sharp(input).resize({ width: target, withoutEnlargement: true })).toFile(
                out
              );
              copyFileSync(out, cache);
              written++;
            }
            if (target === WIDTHS[0] && ext === "avif") {
              saved += original - statSync(out).size;
            }
          }
        }
      });

      console.log(
        `[картинки] ${sources.length - skipped} фото: закодировано ${written}, из кэша ${cached}, ` +
          `мелких пропущено ${skipped}, ` +
          `телефон получит на ${(saved / 1024 / 1024).toFixed(1)} МБ меньше, ` +
          `${((Date.now() - started) / 1000).toFixed(0)} с`
      );
    },
  };
}
