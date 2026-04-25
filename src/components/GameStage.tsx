import { Physics, usePlane } from "@react-three/cannon";
import { Environment, Sky, FlyControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Car } from "./Car";
import { Map } from "./Map";
import { useStore } from "../store";

function Ground() {
  // Infinite collision plane slightly underneath the visual ground
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -0.05, 0] }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[0, 0]} />
    </mesh>
  );
}

function DynamicLighting({ sunX, sunY, timeAngle, isNight, shadows, sunColor }: { sunX: number, sunY: number, timeAngle: number, isNight: boolean, shadows: boolean, sunColor: string }) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();

  useFrame((state) => {
    if (dirLightRef.current) {
      // Animate the sun's position slightly to make shadows move dynamically
      const time = state.clock.getElapsedTime();
      const dynamicSunX = sunX + Math.sin(time * 0.1) * 10;
      const dynamicSunY = sunY + Math.cos(time * 0.15) * 10;
      
      // Make the light follow the camera to ensure shadows are always crisp around the player
      const offset = new THREE.Vector3(dynamicSunX, Math.max(10, dynamicSunY), 50).normalize().multiplyScalar(100);
      dirLightRef.current.position.copy(camera.position).add(offset);
      dirLightRef.current.target.position.copy(camera.position);
      dirLightRef.current.target.updateMatrixWorld();
      
      // Add subtle moving cloud simulation by animating light intensity slightly
      if (!isNight) {
         const cloudFlicker = Math.sin(time * 0.2) * 0.1 + Math.sin(time * 0.5) * 0.05 + Math.sin(time * 1.1) * 0.02;
         const baseIntensity = Math.max(0, Math.sin(timeAngle) * 1.5);
         dirLightRef.current.intensity = Math.max(0, baseIntensity + cloudFlicker);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={isNight ? 0.05 : 0.3} color={sunColor} />
      {!isNight && (
        <directionalLight 
          ref={dirLightRef}
          color={sunColor}
          castShadow={shadows}
          intensity={Math.max(0, Math.sin(timeAngle) * 1.5)} 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
          shadow-camera-near={0.5}
          shadow-camera-far={200}
          shadow-bias={-0.0005}
        />
      )}
    </>
  );
}

export function GameStage() {
  const freecam = useStore(s => s.freecam);
  const settings = useStore(s => s.settings);

  // Calculate sun position based on time of day (0-24)
  // At 6:00 angle is 0, at 18:00 angle is Math.PI
  const timeAngle = ((settings.timeOfDay - 6) / 12) * Math.PI;
  const sunY = Math.sin(timeAngle) * 100;
  const sunX = Math.cos(timeAngle) * 100;
  const isNight = settings.timeOfDay < 6 || settings.timeOfDay > 18;

  return (
    <Canvas shadows={settings.shadows} camera={{ position: [0, 10, 10], fov: 60 }}>
      {freecam && <FlyControls rollSpeed={0.5} movementSpeed={50} dragToLook={true} />}
      <Sky sunPosition={[sunX, sunY, 100]} turbidity={isNight ? 0.01 : 0.1} rayleigh={isNight ? 0.1 : 1} />
      {settings.fog && <fog attach="fog" args={[isNight ? "#050510" : "#1a221a", 10, 800]} />}
      
      <DynamicLighting sunX={sunX} sunY={sunY} timeAngle={timeAngle} isNight={isNight} shadows={settings.shadows} sunColor={settings.sunColor} />
      
      <Physics broadphase="SAP" gravity={[0, -9.81, 0]} defaultContactMaterial={{ friction: 0.3, restitution: 0.1 }}>
        <Ground />
        <Map />
        <Car />
      </Physics>
      <Environment preset={isNight ? "night" : "city"} />
    </Canvas>
  );
}
