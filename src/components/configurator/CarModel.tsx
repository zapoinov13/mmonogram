import { Component, Suspense, useEffect, type ReactNode } from "react";
import GClassModel from "./GClassModel";
import GClassGLTF from "./GClassGLTF";
import SceneLoader from "./SceneLoader";
import { BuildConfig } from "./config";
import { CARS, DEFAULT_CAR } from "./models";

/**
 * Точка подключения машины в сцену.
 *
 * Оцифрованная сборка — единственное, что видит посетитель. Процедурная
 * заглушка осталась ровно на один случай: GLB не загрузились вовсе.
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
    console.warn("3D-модели недоступны, показываю заглушку:", error.message);
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
  const car = CARS[config.model] ?? CARS[DEFAULT_CAR];
  /* Заглушка тоже сообщает о готовности: иначе при недоступных GLB заставка
     висела бы вечно поверх работающей сцены. */
  const broken = (
    <>
      <GClassModel config={config} doorsOpen={doorsOpen && !!car.supportsOpenings} />
      <ReadySignal onReady={onReady} />
    </>
  );

  return (
    <ModelBoundary fallback={broken}>
      <Suspense fallback={<SceneLoader night={config.night} />}>
        <GClassGLTF config={config} interiorVisible={doorsOpen} />
        <ReadySignal onReady={onReady} />
      </Suspense>
    </ModelBoundary>
  );
}
