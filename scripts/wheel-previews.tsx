import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ForgedWheel } from "../src/components/configurator/ForgedWheelSet";
import { RIM_DESIGNS, RIM_FINISHES } from "../src/components/configurator/config";
import { CAD_WHEELS_URL } from "../src/components/configurator/models";

function OriginalWheel({ finishIndex }: { finishIndex: number }) {
  const { scene } = useGLTF(CAD_WHEELS_URL, "/draco/");
  const wheel = useMemo(() => {
    const group = new THREE.Group();
    scene.updateMatrixWorld(true);
    scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || !node.name.startsWith("3F_")) return;
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      const p = geometry.attributes.position;
      const indices = geometry.index!;
      const selected: number[] = [];
      // The CAD nodes contain a mirrored pair. Isolate the right-front face.
      for (let i = 0; i < indices.count; i += 3) {
        const a = indices.getX(i), b = indices.getX(i + 1), c = indices.getX(i + 2);
        if (p.getX(a) > 0 && p.getX(b) > 0 && p.getX(c) > 0) selected.push(a, b, c);
      }
      geometry.setIndex(selected);
      // Discard unreferenced vertices so Center measures the selected wheel only.
      const isolated = geometry.toNonIndexed();
      geometry.dispose();
      const finish = RIM_FINISHES[finishIndex];
      const material = (node.material as THREE.Material).name === "wheelAccent"
        ? new THREE.MeshStandardMaterial({ color: finish.color, metalness: finish.metalness, roughness: finish.roughness })
        : new THREE.MeshPhysicalMaterial({ color: "#0a0a0b", metalness: 0.6, roughness: 0.3, envMapIntensity: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.2 });
      group.add(new THREE.Mesh(isolated, material));
    });
    group.rotation.y = Math.PI / 2;
    return group;
  }, [scene, finishIndex]);
  useEffect(() => () => {
    wheel.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      }
    });
  }, [wheel]);
  return <primitive object={wheel} />;
}

function Capture({ design, finish, onDone }: { design: number; finish: number; onDone: (error?: string) => void }) {
  const frames = useRef(0);
  useFrame(({ gl, scene, camera }) => {
    if (++frames.current !== 12) return;
    gl.render(scene, camera);
    gl.domElement.toBlob(async (blob) => {
      try {
        if (!blob) throw new Error("Empty render");
        const response = await fetch(`/__wheel-preview?design=${RIM_DESIGNS[design].id}&finish=${RIM_FINISHES[finish].id}`, { method: "POST", body: blob });
        if (!response.ok) throw new Error("Could not write preview");
        onDone();
      } catch (error) {
        onDone(String(error));
      }
    }, "image/png");
  });
  return null;
}

function PreviewRenderer() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const design = Math.floor(Math.min(step, 24) / 5);
  const finish = Math.min(step, 24) % 5;
  return <>
    <p>{error || (step === 25 ? "Done: 25 wheel previews" : `${RIM_DESIGNS[design].name} / ${RIM_FINISHES[finish].name}`)}</p>
    <div style={{ width: 384, height: 384 }}>
      <Canvas dpr={1} camera={{ position: [0.12, 0.06, -1.7], fov: 29 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <color attach="background" args={["#161618"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[-2, 3, -4]} intensity={3} />
        <Environment resolution={256} frames={1}>
          <Lightformer position={[0, 0, -4]} scale={[5, 5, 1]} intensity={1.4} />
          <Lightformer position={[-2, 3, -3]} scale={[4, 2, 1]} intensity={4} />
          <Lightformer position={[3, 1, -2]} scale={[2, 5, 1]} intensity={3} />
          <Lightformer position={[0, -3, -2]} scale={[3, 1, 1]} intensity={2} />
        </Environment>
        <Suspense fallback={null}>
          <Center key={`wheel-${step}`}>
            {design === 1 ? <OriginalWheel finishIndex={finish} /> : <ForgedWheel position={[0, 0, 0]} design={design} finishIndex={finish} caliperIndex={1} />}
          </Center>
          {step < 25 && !error && <Capture key={`capture-${step}`} design={design} finish={finish} onDone={(failure) => failure ? setError(failure) : setStep(step + 1)} />}
        </Suspense>
      </Canvas>
    </div>
  </>;
}

createRoot(document.getElementById("root")!).render(<PreviewRenderer />);
