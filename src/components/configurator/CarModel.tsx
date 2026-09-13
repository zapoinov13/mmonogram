import { Component, Suspense, useEffect, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import { RotateCcw } from "lucide-react";
import GClassGLTF from "./GClassGLTF";
import SceneLoader from "./SceneLoader";
import { BuildConfig } from "./config";

/**
 * Точка подключения машины в сцену.
 *
 * Оцифрованная сборка — единственное, что видит посетитель. Ошибка GLB
 * показывает повторную загрузку, а не другую машину или неполный салон.
 *
 * Во время загрузки её больше не показываем. Посетитель видел сначала грубую
 * процедурную машину, а секунды через три она подменялась настоящей — со
 * стороны это читалось как «сначала показали старую модель». Теперь на её
 * месте индикатор с процентом, и машина появляется сразу в правильном виде.
 *
 * Раньше заглушка подменяла сборку ещё и в рабочих режимах — при взгляде из
 * салона и при открытых дверях. На экране это выглядело как поломка: вместо
 * фотореалистичного G63 появлялась грубая коробка, а оцифрованный салон
 * (custom-interior.glb) не показывался никогда, хотя грузился всегда.
 * Открывание дверей у оцифрованного кузова невозможно — он идёт одним мешем,
 * — поэтому раздел «Openings» теперь просто не показывается для таких машин
 * (см. CarModel.supportsOpenings), а не подменяет всю машину.
 */

class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Configurator model failed to load:", error.message);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* Сигнал «машина в кадре»: монтируется только после того, как Suspense
   отпустил, то есть кузов, обвес и колёса уже собраны. По нему страница убирает
   заставку, а камера начинает интро-наезд — до этого наезжать не на что. */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

export default function CarModel({
  config,
  doorsOpen = false,
  onReady,
}: {
  config: BuildConfig;
  doorsOpen?: boolean;
  onReady?: () => void;
}) {
  /* Reveal the error state instead of leaving the intro over the retry action. */
  const broken = (
    <>
      <Html fullscreen>
        <div className="flex h-full items-center justify-center bg-black/90 px-6 text-center text-white">
          <div role="alert" className="flex max-w-sm flex-col items-center gap-5">
            <p className="font-display text-base">3D model could not be loaded</p>
            <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center gap-2 border border-white/30 px-5 py-3 text-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reload model
            </button>
          </div>
        </div>
      </Html>
      <ReadySignal onReady={onReady} />
    </>
  );

  return (
    <ModelBoundary key={config.model} fallback={broken}>
      <Suspense fallback={<SceneLoader night={config.night} />}>
        <GClassGLTF config={config} interiorVisible={doorsOpen} />
        <ReadySignal onReady={onReady} />
      </Suspense>
    </ModelBoundary>
  );
}
