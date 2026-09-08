import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * Фотография в трёх размерах и двух современных форматах.
 *
 * Варианты готовит vite-plugin-responsive-images.ts при сборке: рядом с
 * assets/foo-HASH.jpg появляются foo-HASH-480.avif, -960.avif, -1440.avif и
 * то же в webp. Имена выводятся из имени оригинала однозначно, поэтому здесь
 * достаточно строковой операции — ни манифеста, ни запроса за ним.
 *
 * Браузер выбирает первый формат, который понимает: AVIF, иначе WebP, иначе
 * исходник как есть. Внутри формата ширину он выбирает сам по sizes и
 * плотности экрана, так что телефон скачивает 15–30 КБ там, где раньше
 * тянул все 200.
 *
 * На картинках из базы (обложки проектов, добавленных через админку) вариантов
 * нет — они не проходят через сборку. Такой адрес компонент узнаёт и рисует
 * обычный <img>, без ломаного srcset.
 */

export interface PictureProps {
  src: string;
  alt: string;
  className?: string;
  /**
   * Сколько места картинка займёт на экране. От этого зависит, какой файл
   * скачает браузер, поэтому значение по умолчанию намеренно осторожное:
   * на телефоне во всю ширину, дальше — половина и треть окна.
   */
  sizes?: string;
  /** Первый экран: грузим сразу и с высоким приоритетом. */
  priority?: boolean;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  draggable?: boolean;
}

const WIDTHS = [480, 960, 1440];

/** Собранные Vite картинки лежат в /assets и имеют хеш в имени. */
const BUILT = /^(.*\/assets\/[^/]+)\.(jpe?g|png|webp)$/i;

const buildSrcSet = (base: string, ext: "avif" | "webp") =>
  WIDTHS.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");

const Picture = memo(function Picture({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  width,
  height,
  style,
  onLoad,
  onError,
  draggable,
}: PictureProps) {
  const img = (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      width={width}
      height={height}
      style={style}
      onLoad={onLoad}
      onError={onError}
      draggable={draggable}
      className={cn(className)}
    />
  );

  const match = import.meta.env.PROD ? src.match(BUILT) : null;
  if (!match) return img;

  const base = match[1];
  return (
    <picture>
      <source type="image/avif" srcSet={buildSrcSet(base, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={buildSrcSet(base, "webp")} sizes={sizes} />
      {img}
    </picture>
  );
});

export default Picture;
