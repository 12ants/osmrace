import { Physics, usePlane } from "@react-three/cannon";
import { Environment, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Car } from "./Car";
import { Map } from "./Map";

function Ground() {
  // Infinite collision plane slightly underneath the visual ground
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -0.05, 0] }));
  return (
    <mesh ref={ref as any}>
      <planeGeometry args={[0, 0]} />
    </mesh>
  );
}

export function GameStage() {
  return (
    <Canvas shadows camera={{ position: [0, 10, 10], fov: 60 }}>
      <Sky sunPosition={[100, 10, 100]} />
      <fog attach="fog" args={["#1a221a", 10, 800]} />
      <ambientLight intensity={0.5} />
      <directionalLight 
        castShadow 
        position={[50, 100, 50]} 
        intensity={1.5} 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      <Physics broadphase="SAP" gravity={[0, -9.81, 0]} defaultContactMaterial={{ friction: 0.3, restitution: 0.1 }}>
        <Ground />
        <Map />
        <Car />
      </Physics>
      <Environment preset="city" />
    </Canvas>
  );
}
