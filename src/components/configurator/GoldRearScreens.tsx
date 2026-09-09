import { RoundedBox } from "@react-three/drei";

// Source coordinates: rear-facing displays shown in Gold Package cabin photos.
export default function GoldRearScreens() {
  return (
    <group>
      {[-0.395, 0.395].map((x) => (
        <group key={x} position={[x, 1.255, -2.19]}>
          <RoundedBox args={[0.37, 0.218, 0.010]} radius={0.009} smoothness={3}>
            <meshStandardMaterial color="#b6a076" metalness={0.85} roughness={0.28} />
          </RoundedBox>
          <RoundedBox position={[0, 0, -0.006]} args={[0.368, 0.216, 0.004]} radius={0.007} smoothness={3}>
            <meshPhysicalMaterial color="#060708" metalness={0.15} roughness={0.12} clearcoat={0.8} envMapIntensity={0.25} />
          </RoundedBox>
          <mesh position={[0, -0.13, 0.008]}>
            <boxGeometry args={[0.035, 0.05, 0.02]} />
            <meshStandardMaterial color="#161515" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
