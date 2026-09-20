import { memo } from "react";
import logoMmonogram from "@/assets/logo-mmonogram.webp";

/**
 * Заставка 3D-студии.
 *
 * Модели весят под семь мегабайт, и всё это время посетитель смотрел на
 * пустой подиум: сцена уже собрана, света и пола хватает, а машины нет —
 * выглядит как поломка. Пока грузится, держим тот же тёмный экран с
 * монограммой, что и на входе на сайт, и открываем сцену только когда
 * машина уже стоит в кадре и камера пошла на неё.
 *
 * Экран не размонтируется мгновенно: он гаснет прозрачностью, чтобы
 * наезд камеры начинался ещё под ним и зритель попадал в уже живой кадр.
 *
 * z-индекс выше шапки сайта: та зафиксирована на z-100, и её переключатель
 * языка торчал поверх заставки.
 */
const StudioIntro = memo(({ done }: { done: boolean }) => (
  <div
    aria-hidden={done}
    className={`pointer-events-none absolute inset-0 z-[110] flex flex-col items-center justify-center bg-premium-black transition-opacity duration-700 ease-out ${
      done ? "opacity-0" : "opacity-100"
    }`}
  >
    <img
      src={logoMmonogram}
      alt="M-Monogram"
      width={900}
      height={212}
      loading="eager"
      decoding="sync"
      fetchpriority="high"
      className={`h-auto w-64 max-w-[78vw] object-contain opacity-95 sm:w-80 md:w-96 ${done ? "" : "animate-logo-pulse will-change-[opacity,transform]"}`}
    />
    {/* Тот же девиз, что и на входе в сайт: заставка студии — второй экран,
        где посетитель задерживается, и марка должна звучать одинаково. */}
    <p className="mt-6 font-display text-[9px] uppercase tracking-[0.42em] text-white/35 sm:mt-7 sm:text-[10px]">
      Beyond the Ordinary
    </p>
  </div>
));

StudioIntro.displayName = "StudioIntro";

export default StudioIntro;
