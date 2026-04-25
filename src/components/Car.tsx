import { useBox } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useControls } from "../hooks/useControls";
import { useStore } from "../store";

export function Car() {
  const controls = useControls();
  const { camera } = useThree();
  const startPos = useStore((s) => s.startPos);
  const teleportPos = useStore((s) => s.teleportPos);
  
  const lastSpeed = useRef(0);
  const bodyRoll = useRef(0);
  const bodyPitch = useRef(0);
  const chassisRef = useRef<THREE.Group>(null);

  const [ref, api] = useBox(() => ({
    mass: 1600,
    position: startPos,
    args: [1.8, 1.0, 3.6], 
    angularDamping: 0.6,
    linearDamping: 0.1,
    allowSleep: false,
  }));

  const velocity = useRef([0, 0, 0]);
  const position = useRef([0, 0, 0]);
  const rotation = useRef([0, 0, 0]);
  const angularVelocity = useRef([0, 0, 0]);
  
  // Wheel refs for visual rotation
  const wheelRotation = useRef(0);
  const steeringAngle = useRef(0);
  const flWheel = useRef<THREE.Group>(null);
  const frWheel = useRef<THREE.Group>(null);
  const blWheel = useRef<THREE.Group>(null);
  const brWheel = useRef<THREE.Group>(null);

  useEffect(() => {
    const unsubVel = api.velocity.subscribe((v) => (velocity.current = v));
    const unsubPos = api.position.subscribe((v) => (position.current = v));
    const unsubRot = api.rotation.subscribe((v) => (rotation.current = v));
    const unsubAngVel = api.angularVelocity.subscribe((v) => (angularVelocity.current = v));
    return () => {
      unsubVel();
      unsubPos();
      unsubRot();
      unsubAngVel();
    };
  }, [api]);

  useEffect(() => {
    if (teleportPos) {
      api.position.set(teleportPos[0], teleportPos[1], teleportPos[2]);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      api.rotation.set(0, 0, 0);
      useStore.setState({ teleportPos: null });
    }
  }, [teleportPos, api]);

  useFrame((state, delta) => {
    const currentVel = new THREE.Vector3(...velocity.current);
    const speed = currentVel.length();
    const currentAngVel = angularVelocity.current;
    
    // Create local coordinate basis
    const euler = new THREE.Euler(...rotation.current);
    const quaternion = new THREE.Quaternion().setFromEuler(euler);
    const localZ = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);

    const forwardSpeed = currentVel.dot(localZ);
    const maxSpeed = 120; 
    
    // Acceleration calculation for weight transfer
    const accel = (speed - lastSpeed.current) / delta;
    lastSpeed.current = speed;

    // Aerodynamic Drag
    const dragCoefficient = 0.05;
    const dragForce = currentVel.clone().multiplyScalar(-speed * dragCoefficient);
    api.applyForce([dragForce.x, dragForce.y, dragForce.z], [0, 0, 0]);

    // Rolling Resistance
    const rollingResistance = 0.01;
    const rollForce = localZ.clone().multiplyScalar(-Math.sign(forwardSpeed) * rollingResistance * 1500 * 9.81);
    api.applyForce([rollForce.x, rollForce.y, rollForce.z], [0, 0, 0]);

    // Engine & Brakes
    if (controls.forward && forwardSpeed < maxSpeed) {
      const engineForce = 250000 * Math.max(0.1, 1 - (forwardSpeed / maxSpeed));
      api.applyLocalForce([0, 0, -engineForce], [0, 0, 0]); 
    }
    
    if (controls.backward) {
      const reverseForce = forwardSpeed > 0 ? -100000 : -60000;
      api.applyLocalForce([0, 0, -reverseForce], [0, 0, 0]);
    }

    if (controls.brake) {
      const brakeForce = currentVel.clone().normalize().multiplyScalar(-150000);
      api.applyForce([brakeForce.x, 0, brakeForce.z], [0, 0, 0]);
    }

    // Steering logic
    const isReversing = forwardSpeed < -0.1;
    const steerMultiplier = isReversing ? -1 : 1;
    
    // Tighter steering at low speed, more stable at high speed
    let turnRate = 4.5 / (1.0 + (Math.abs(forwardSpeed) / 10));
    if (speed < 0.5 && !controls.forward && !controls.backward) turnRate = 0;

    let steerDir = 0;
    if (controls.left) steerDir = 1;
    if (controls.right) steerDir = -1;

    // Visual Steering and Wheel Rotation
    const targetSteerAngle = steerDir * 0.5;
    steeringAngle.current = THREE.MathUtils.lerp(steeringAngle.current, targetSteerAngle, 0.1);
    wheelRotation.current += forwardSpeed * delta * 5;

    if (flWheel.current && frWheel.current) {
        flWheel.current.rotation.y = steeringAngle.current;
        frWheel.current.rotation.y = steeringAngle.current;
        const flWheelMesh = flWheel.current.children[0] as THREE.Mesh;
        const frWheelMesh = frWheel.current.children[0] as THREE.Mesh;
        if (flWheelMesh && frWheelMesh) {
          flWheelMesh.rotation.x = wheelRotation.current;
          frWheelMesh.rotation.x = wheelRotation.current;
        }
    }
    if (blWheel.current && brWheel.current) {
        const blWheelMesh = blWheel.current.children[0] as THREE.Mesh;
        const brWheelMesh = brWheel.current.children[0] as THREE.Mesh;
        if (blWheelMesh && brWheelMesh) {
          blWheelMesh.rotation.x = wheelRotation.current;
          brWheelMesh.rotation.x = wheelRotation.current;
        }
    }

    // Lateral Grip Calculation (Non-linear)
    const lateralVel = currentVel.clone().sub(localZ.clone().multiplyScalar(forwardSpeed));
    const lateralSpeed = lateralVel.length();
    
    // Slip angle simulation - grip drops off if lateral speed is too high
    const maxGripSpeed = 12;
    const gripFactor = controls.brake ? 0.3 : (lateralSpeed > maxGripSpeed ? 0.5 : 1.0);
    const baseGrip = 35000;
    const appliedGrip = baseGrip * gripFactor;
    
    api.applyForce([-lateralVel.x * appliedGrip, 0, -lateralVel.z * appliedGrip], [0, 0, 0]);

    // Apply angular velocity for steering with more realistic transition
    if (steerDir !== 0) {
      const targetAngVelY = steerDir * turnRate * steerMultiplier;
      api.angularVelocity.set(
        currentAngVel[0],
        THREE.MathUtils.lerp(currentAngVel[1], targetAngVelY, delta * 15),
        currentAngVel[2]
      );
    } else {
      // Self-centering effect
      api.angularVelocity.set(currentAngVel[0], currentAngVel[1] * 0.92, currentAngVel[2]);
    }

    // Self-righting torque
    const upVector = new THREE.Vector3(0, 1, 0).applyEuler(euler);
    if (upVector.y < 0.8) {
      const rightVector = new THREE.Vector3(1, 0, 0).applyEuler(euler);
      const pitchError = localZ.y;
      const rollError = rightVector.y;
      api.applyTorque([rollError * 20000, 0, -pitchError * 20000]);
    }

    if (position.current[1] < -10) {
      api.position.set(0, 5, 0);
      api.velocity.set(0, 0, 0);
    }

    // Keep camera behind car smoothly
    const carPos = new THREE.Vector3(...position.current);
    // Adjust camera properties dynamically based on speed
    const camDist = 9 + (speed / maxSpeed) * 6;
    const camOffset = new THREE.Vector3(0, 3.5 + (speed / maxSpeed) * 1.5, camDist);
    camOffset.applyEuler(euler);
    const targetCamPos = carPos.clone().add(camOffset);
    
    camera.position.lerp(targetCamPos, 0.1);
    
    // Look slightly ahead of the car based on velocity
    const lookAhead = carPos.clone().add(currentVel.clone().multiplyScalar(0.2));
    camera.lookAt(lookAhead);

    // Update real DOM minimap dot
    const dot = document.getElementById('minimap-player-dot');
    if (dot) {
      const px = 128 + position.current[0] * (256 / 800);
      const pz = 128 + position.current[2] * (256 / 800);
      dot.style.left = `${px}px`;
      dot.style.top = `${pz}px`;
    }

    // Update speedometer
    const speedEl = document.getElementById('speedOMeter');
    if (speedEl) {
      speedEl.innerText = Math.round(speed * 3.6).toString().padStart(3, '0');
    }

    // Suspension Visuals: Body Roll and Pitch
    const lateralG = (angularVelocity.current[1] * forwardSpeed) / 9.81;
    const longitudinalG = accel / 9.81;

    bodyRoll.current = THREE.MathUtils.lerp(bodyRoll.current, lateralG * 0.12, 0.1);
    bodyPitch.current = THREE.MathUtils.lerp(bodyPitch.current, longitudinalG * 0.08, 0.1);

    if (chassisRef.current) {
      chassisRef.current.rotation.x = bodyPitch.current;
      chassisRef.current.rotation.z = -bodyRoll.current;
      // Slight vertical compression under load
      chassisRef.current.position.y = -Math.abs(bodyRoll.current) * 0.1 - Math.abs(bodyPitch.current) * 0.05;
    }
  });

  const Wheel = ({ wheelRef }: { wheelRef: any }) => (
    <group ref={wheelRef}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      {/* Hubcap */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.42, 8]} />
        <meshStandardMaterial color="#555" roughness={0.4} />
      </mesh>
    </group>
  );

  return (
    <group ref={ref as any}>
      <group ref={chassisRef}>
        {/* Main Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.0, 3.6]} />
          <meshStandardMaterial color="#4b5320" metalness={0.2} roughness={0.8} />
        </mesh>
        
        {/* Cabin */}
        <mesh position={[0, 0.9, 0.2]} castShadow>
          <boxGeometry args={[1.7, 0.8, 1.8]} />
          <meshStandardMaterial color="#3f471b" metalness={0.1} roughness={0.9} />
        </mesh>

        {/* Windows */}
        <mesh position={[0, 0.9, 0.2]} castShadow>
          <boxGeometry args={[1.72, 0.6, 1.7]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} opacity={0.8} transparent />
        </mesh>
  
        {/* Grille */}
        <mesh position={[0, 0.1, -1.81]} castShadow>
          <boxGeometry args={[1.0, 0.4, 0.1]} />
          <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
        </mesh>
  
        {/* Headlights */}
        <mesh position={[0.6, 0.1, -1.81]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.6, 0.1, -1.81]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} />
        </mesh>
  
        {/* Taillights */}
        <mesh position={[0.7, 0.1, 1.81]}>
          <boxGeometry args={[0.2, 0.2, 0.1]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
        </mesh>
        <mesh position={[-0.7, 0.1, 1.81]}>
          <boxGeometry args={[0.2, 0.2, 0.1]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
        </mesh>

        {/* Spare Tire */}
        <mesh position={[0, 0.3, 1.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.3, 16]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.3, 1.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.3, 8]} />
          <meshStandardMaterial color="#555" roughness={0.4} />
        </mesh>
      </group>

      {/* Wheels */}
      {/* Front Wheels */}
      <group position={[-1.0, -0.4, -1.2]}>
        <Wheel wheelRef={flWheel} />
      </group>
      <group position={[1.0, -0.4, -1.2]}>
        <Wheel wheelRef={frWheel} />
      </group>
      {/* Back Wheels */}
      <group position={[-1.0, -0.4, 1.2]}>
        <Wheel wheelRef={blWheel} />
      </group>
      <group position={[1.0, -0.4, 1.2]}>
        <Wheel wheelRef={brWheel} />
      </group>
    </group>
  );
}
