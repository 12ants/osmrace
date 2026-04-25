import { useBox, useTrimesh } from "@react-three/cannon";
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useStore } from "../store";
import { setupRoadMaterial } from "./RoadMaterial";
import { setupBuildingMaterial } from "./BuildingMaterial";

function Roads({ roads, color }: { roads: any[], color: string }) {
  const majorRoads = useMemo(() => roads.filter(r => ["motorway", "trunk", "primary", "secondary"].includes(r.type)), [roads]);
  const minorRoads = useMemo(() => roads.filter(r => ["tertiary", "unclassified", "residential"].includes(r.type)), [roads]);
  const serviceRoads = useMemo(() => roads.filter(r => ["service", "pedestrian", "footway", "path", "cycleway"].includes(r.type)), [roads]);

  const majorMeshRef = useRef<THREE.InstancedMesh>(null);
  const minorMeshRef = useRef<THREE.InstancedMesh>(null);
  const serviceMeshRef = useRef<THREE.InstancedMesh>(null);

  const majorSegments = useMemo(() => {
    const segs: any[] = [];
    majorRoads.forEach(road => {
      for (let i = 0; i < road.points.length - 1; i++) {
        segs.push({
          p1: new THREE.Vector3(road.points[i][0], 0, road.points[i][2]),
          p2: new THREE.Vector3(road.points[i+1][0], 0, road.points[i+1][2]),
          width: road.width
        });
      }
    });
    return segs;
  }, [majorRoads]);

  const minorSegments = useMemo(() => {
    const segs: any[] = [];
    minorRoads.forEach(road => {
      for (let i = 0; i < road.points.length - 1; i++) {
        segs.push({
          p1: new THREE.Vector3(road.points[i][0], 0, road.points[i][2]),
          p2: new THREE.Vector3(road.points[i+1][0], 0, road.points[i+1][2]),
          width: road.width
        });
      }
    });
    return segs;
  }, [minorRoads]);

  const serviceSegments = useMemo(() => {
    const segs: any[] = [];
    serviceRoads.forEach(road => {
      for (let i = 0; i < road.points.length - 1; i++) {
        segs.push({
          p1: new THREE.Vector3(road.points[i][0], 0, road.points[i][2]),
          p2: new THREE.Vector3(road.points[i+1][0], 0, road.points[i+1][2]),
          width: road.width
        });
      }
    });
    return segs;
  }, [serviceRoads]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    
    if (majorMeshRef.current) {
      majorSegments.forEach((seg, i) => {
        const length = seg.p1.distanceTo(seg.p2);
        const center = seg.p1.clone().add(seg.p2).multiplyScalar(0.5);
        dummy.position.copy(center);
        dummy.position.y = 0.01;
        dummy.scale.set(seg.width, 0.1, length + 0.1); 
        dummy.lookAt(seg.p2);
        dummy.updateMatrix();
        majorMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      majorMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (minorMeshRef.current) {
      minorSegments.forEach((seg, i) => {
        const length = seg.p1.distanceTo(seg.p2);
        const center = seg.p1.clone().add(seg.p2).multiplyScalar(0.5);
        dummy.position.copy(center);
        dummy.position.y = 0.005;
        dummy.scale.set(seg.width, 0.1, length + 0.1);
        dummy.lookAt(seg.p2);
        dummy.updateMatrix();
        minorMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      minorMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (serviceMeshRef.current) {
      serviceSegments.forEach((seg, i) => {
        const length = seg.p1.distanceTo(seg.p2);
        const center = seg.p1.clone().add(seg.p2).multiplyScalar(0.5);
        dummy.position.copy(center);
        dummy.position.y = 0.003;
        dummy.scale.set(seg.width, 0.1, length + 0.1);
        dummy.lookAt(seg.p2);
        dummy.updateMatrix();
        serviceMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      serviceMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [majorSegments, minorSegments, serviceSegments]);

  // Combined physics mesh for ALL roads
  const allRoadsGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];
    roads.forEach(road => {
      if (road.points.length < 2) return;
      const vectors = road.points.map((p: any) => new THREE.Vector3(p[0], 0, p[2]));
      const curve = new THREE.CatmullRomCurve3(vectors, false, "chordal");
      const shape = new THREE.Shape();
      shape.moveTo(-road.width / 2, 0);
      shape.lineTo(road.width / 2, 0);
      shape.lineTo(road.width / 2, 0.1);
      shape.lineTo(-road.width / 2, 0.1);
      shape.lineTo(-road.width / 2, 0);
      const geo = new THREE.ExtrudeGeometry(shape, {
        steps: Math.max(10, road.points.length * 2),
        bevelEnabled: false,
        extrudePath: curve,
      });
      geometries.push(geo);
    });
    
    if (geometries.length === 0) return null;
    
    // Manual merge to avoid external library dependency for now
    const totalVertices = geometries.reduce((acc, g) => acc + g.attributes.position.count, 0);
    const positions = new Float32Array(totalVertices * 3);
    let offset = 0;
    geometries.forEach(g => {
      positions.set(g.attributes.position.array, offset);
      offset += g.attributes.position.array.length;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [roads]);

  const [physicsRef] = useTrimesh(() => {
    let vertices = new Float32Array();
    let indices = new Uint32Array();
    if (allRoadsGeometry) {
      vertices = allRoadsGeometry.attributes.position.array as Float32Array;
      indices = new Uint32Array(vertices.length / 3);
      for (let i = 0; i < indices.length; i++) indices[i] = i;
    }
    return {
      type: "Static",
      args: [vertices as any, indices as any],
    };
  }, useRef<any>(null), [allRoadsGeometry]);

  return (
    <group>
      <instancedMesh ref={majorMeshRef} args={[null as any, null as any, majorSegments.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.7} 
          onBeforeCompile={(shader) => setupRoadMaterial(shader, 'major')} 
          customProgramCacheKey={() => "majorRoad"}
        />
      </instancedMesh>
      <instancedMesh ref={minorMeshRef} args={[null as any, null as any, minorSegments.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.8} 
          onBeforeCompile={(shader) => setupRoadMaterial(shader, 'minor')} 
          customProgramCacheKey={() => "minorRoad"}
        />
      </instancedMesh>
      <instancedMesh ref={serviceMeshRef} args={[null as any, null as any, serviceSegments.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.9} 
          onBeforeCompile={(shader) => setupRoadMaterial(shader, 'service')} 
          customProgramCacheKey={() => "serviceRoad"}
        />
      </instancedMesh>
      {/* Invisible physics mesh */}
      <mesh ref={physicsRef} visible={false}>
        <bufferGeometry />
      </mesh>
    </group>
  );
}

function Building({ points, height, amenity, shop, baseColor, heightScale, randomizeBuildingColors, buildingWindows, buildingWireframe, buildingOpacity, isNight, buildingDecorations, decorationDensity }: { points: [number, number, number][]; height: number, amenity?: string, shop?: string, baseColor: string, heightScale: number, randomizeBuildingColors: boolean, buildingWindows: boolean, buildingWireframe: boolean, buildingOpacity: number, isNight: boolean, buildingDecorations: boolean, decorationDensity: number }) {
  const color = useMemo(() => {
    let finalColor = new THREE.Color(baseColor);
    
    // If it's a specific type of building, slightly tint the base color
    if (amenity || shop) {
      finalColor.lerp(new THREE.Color("#4ade80"), 0.1);
    }

    if (randomizeBuildingColors) {
      // Randomize lightness/saturation slightly based on points hash
      const hash = points.reduce((acc, p) => acc + p[0] + p[2], 0);
      const rand1 = (Math.sin(hash) + 1) / 2; // 0 to 1
      const rand2 = (Math.cos(hash) + 1) / 2; // 0 to 1
      
      const hsl = { h: 0, s: 0, l: 0 };
      finalColor.getHSL(hsl);
      
      finalColor.setHSL(
        hsl.h + (rand1 - 0.5) * 0.1, 
        hsl.s + (rand2 - 0.5) * 0.2, 
        hsl.l + (rand1 - 0.5) * 0.2
      );
    }
    return finalColor;
  }, [baseColor, amenity, shop, randomizeBuildingColors, points]);

  const scaledHeight = height * heightScale;

  const geometry = useMemo(() => {
    if (points.length < 3) return null;
    const shape = new THREE.Shape();
    points.forEach((p, i) => {
      // Create 2D shape (X and Z coordinates)
      if (i === 0) shape.moveTo(p[0], p[2]);
      else shape.lineTo(p[0], p[2]);
    });
    
    return new THREE.ExtrudeGeometry(shape, {
      depth: scaledHeight,
      bevelEnabled: false,
    });
  }, [points, scaledHeight]);

  const [ref] = useTrimesh(() => {
    let vertices = new Float32Array();
    let indices = new Uint32Array();
    if (geometry) {
      vertices = geometry.attributes.position.array as Float32Array;
      if (geometry.index) {
        indices = geometry.index.array as any;
      } else {
        indices = new Uint32Array(vertices.length / 3);
        for (let i = 0; i < indices.length; i++) indices[i] = i;
      }
    }
    return {
      type: "Static",
      args: [vertices as any, indices as any],
      rotation: [-Math.PI / 2, 0, 0],
    };
  }, useRef<any>(null), [geometry]);

  const hasWindows = useMemo(() => {
    // Generate a consistent pseudo-random value based on points to avoid flickering during renders
    const hash = points.reduce((acc, p) => acc + p[0] + p[2], 0);
    return (Math.sin(hash) * 10000 % 1) > 0.5;
  }, [points]);

  const decorations = useMemo(() => {
    if (!buildingDecorations || points.length < 3) return [];
    
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let sumX = 0, sumZ = 0;
    for (const p of points) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[2] < minZ) minZ = p[2];
      if (p[2] > maxZ) maxZ = p[2];
      sumX += p[0];
      sumZ += p[2];
    }
    const cx = sumX / points.length;
    const cz = sumZ / points.length;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const area = width * depth;

    const hash = points.reduce((acc, p) => acc + p[0] + p[2], 0);
    const rand = (n: number) => {
        const val = Math.sin(hash * n + n) * 10000;
        return val - Math.floor(val);
    };

    const decs = [];
    if (decorationDensity <= 0) return decs;

    // AC units on medium/large roofs
    if (area > 50 && area < 500) {
      const numAc = Math.floor((Math.floor(rand(1) * 3) + 1) * decorationDensity);
      for (let i = 0; i < numAc; i++) {
        decs.push({
          type: 'ac',
          key: `ac-${i}`,
          pos: [
            cx + (rand(10 + i) - 0.5) * (width * 0.4), 
            scaledHeight + 0.5, 
            cz + (rand(20 + i) - 0.5) * (depth * 0.4)
          ] as [number, number, number],
          size: [1 + rand(30 + i), 1, 1 + rand(40 + i)] as [number, number, number],
          rot: rand(50 + i) * Math.PI,
        });
      }
    }

    // Antennas on tall buildings
    if (scaledHeight > 30 && rand(2) > 0.4 / decorationDensity) {
      decs.push({
        type: 'antenna',
        key: `ant`,
        pos: [
          cx + (rand(60) - 0.5) * (width * 0.2), 
          scaledHeight + 5, 
          cz + (rand(70) - 0.5) * (depth * 0.2)
        ] as [number, number, number],
        size: [0.2, 10 + rand(80) * 10, 0.2] as [number, number, number],
        rot: 0,
      });
    }

    // Edge-based details
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dx = p2[0] - p1[0];
      const dz = p2[2] - p1[2];
      const edgeLen = Math.sqrt(dx * dx + dz * dz);
      
      if (edgeLen < 1) continue;

      const midX = p1[0] + dx * 0.5;
      const midZ = p1[2] + dz * 0.5;
      const angle = Math.atan2(dx, dz);

      // Only door on first long enough edge
      if (i === 0 && scaledHeight >= 3 && edgeLen > 2 && decorationDensity > 0.5) {
        const doorWidth = Math.min(2, edgeLen * 0.5);
        const doorHeight = 2.2;
        decs.push({
          type: 'door',
          key: 'door',
          pos: [midX, doorHeight / 2, midZ] as [number, number, number],
          size: [0.4, doorHeight, doorWidth] as [number, number, number],
          rot: angle,
        });
      }

      // Billboard
      if (i === 1 && scaledHeight > 10 && area > 100 && (shop || rand(4) * decorationDensity > 0.8) && edgeLen > 5) {
        const boardWidth = Math.min(8, edgeLen * 0.8);
        const boardHeight = 3 + rand(5) * 3;
        decs.push({
          type: 'billboard',
          key: 'billboard',
          pos: [midX, scaledHeight + boardHeight / 2 - 1, midZ] as [number, number, number],
          size: [0.6, boardHeight, boardWidth] as [number, number, number],
          rot: angle,
        });
      }
      
      // Procedural ledges/balconies/window-frames
      if (scaledHeight >= 6 && edgeLen > 3 && rand(20 + i) * decorationDensity > 0.3) {
        const numFloors = Math.floor(scaledHeight / 3);
        const detailTypeRand = rand(30 + i);
        const detailType = detailTypeRand > 0.66 ? 'ledge' : detailTypeRand > 0.33 ? 'balcony' : 'windowFrame';
        
        for (let floor = 1; floor < numFloors; floor++) {
          const floorY = floor * 3;
          if (detailType === 'ledge') {
            decs.push({
              type: 'ledge',
              key: `ledge-${i}-${floor}`,
              pos: [midX, floorY, midZ] as [number, number, number],
              size: [0.4, 0.3, edgeLen - 0.2] as [number, number, number],
              rot: angle,
            });
          } else if (detailType === 'windowFrame') {
            const numWindows = Math.floor((edgeLen / 2) * decorationDensity);
            for (let w = 0; w < numWindows; w++) {
               const wOffset = (w - numWindows / 2 + 0.5) * 2;
               const wX = midX + Math.sin(angle) * wOffset;
               const wZ = midZ + Math.cos(angle) * wOffset;
               decs.push({
                 type: 'windowFrame',
                 key: `windowFrame-${i}-${floor}-${w}`,
                 pos: [wX, floorY + 1.0, wZ] as [number, number, number],
                 size: [0.3, 1.8, 1.2] as [number, number, number],
                 rot: angle,
               });
            }
          } else if (edgeLen >= 4) {
            // Balconies
            const balconyWidth = 2;
            const numBalconies = Math.floor((edgeLen / 3) * decorationDensity);
            for (let b = 0; b < numBalconies; b++) {
               const bOffset = (b - numBalconies / 2 + 0.5) * 3;
               const bX = midX + Math.sin(angle) * bOffset;
               const bZ = midZ + Math.cos(angle) * bOffset;
               decs.push({
                 type: 'balcony',
                 key: `balcony-${i}-${floor}-${b}`,
                 pos: [bX, floorY + 0.5, bZ] as [number, number, number],
                 size: [0.8, 1.2, balconyWidth] as [number, number, number],
                 rot: angle,
               });
            }
          }
        }
      }

      // Ground floor awnings for commercial buildings
      if (i === 0 && (shop || amenity) && edgeLen > 3 && scaledHeight >= 4 && decorationDensity > 0.5) {
         decs.push({
            type: 'awning',
            key: `awning-${i}`,
            pos: [midX, 2.5, midZ] as [number, number, number],
            size: [1.5, 0.2, edgeLen - 0.5] as [number, number, number],
            rot: angle,
            tiltX: 0.2, // slope the awning down
         });
      }
    }

    // Solar panels on medium roofs
    if (area > 40 && rand(8) * decorationDensity > 0.6 && scaledHeight < 40) {
      const numPanels = Math.floor((Math.floor(rand(9) * 4) + 2) * decorationDensity);
      for (let i = 0; i < numPanels; i++) {
        decs.push({
          type: 'solar',
          key: `solar-${i}`,
          pos: [
             cx + (rand(100 + i) - 0.5) * (width * 0.5),
             scaledHeight + 0.3,
             cz + (rand(110 + i) - 0.5) * (depth * 0.5)
          ] as [number, number, number],
          size: [1.5, 0.1, 2.5] as [number, number, number],
          rot: rand(120 + i) > 0.5 ? 0 : Math.PI / 2,
          tiltX: 0.3 // slight tilt not handled by standard rotation yet, so we'll pass to rot array later
        });
      }
    }

    // Chimneys on small buildings
    if (scaledHeight < 15 && area < 150 && rand(6) * decorationDensity > 0.3) {
       decs.push({
         type: 'chimney',
         key: 'chimney',
         pos: [
            cx + (rand(1) - 0.5) * (width * 0.4),
            scaledHeight + 1,
            cz + (rand(2) - 0.5) * (depth * 0.4)
         ] as [number, number, number],
         size: [0.6 + rand(3) * 0.4, 2 + rand(4), 0.6 + rand(5) * 0.4] as [number, number, number],
         rot: 0
       });
    }

    // Water storage tanks on medium residential/commercial
    if (scaledHeight > 15 && scaledHeight < 50 && area > 100 && rand(7) * decorationDensity > 0.6) {
       decs.push({
         type: 'watertower',
         key: 'watertower',
         shape: 'cylinder',
         args: [1.5 + rand(1), 1.5 + rand(2), 3 + rand(3) * 2, 16], 
         pos: [
            cx + (rand(3) - 0.5) * (width * 0.3),
            scaledHeight + 1.5,
            cz + (rand(4) - 0.5) * (depth * 0.3)
         ] as [number, number, number],
         rot: 0
       });
    }

    return decs;
  }, [buildingDecorations, decorationDensity, points, scaledHeight]);

  if (!geometry) return null;

  return (
    <group>
      {/* Visual mesh */}
      <mesh ref={ref} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          wireframe={buildingWireframe}
          transparent={buildingOpacity < 1.0}
          opacity={buildingOpacity}
          emissive={isNight && buildingWindows ? new THREE.Color("#fbbf24") : new THREE.Color(0x000000)}
          emissiveIntensity={isNight && buildingWindows ? (hasWindows ? 0.3 : 0.0) : 0} // simple glow effect
          onBeforeCompile={(shader) => setupBuildingMaterial(shader, hasWindows, !!shop)}
          customProgramCacheKey={() => `building-${hasWindows}-${!!shop}`}
        />
      </mesh>
      
      {/* Roof decorations */}
      {buildingDecorations && decorations.map(dec => {
        const rotation: [number, number, number] = dec.tiltX 
          ? [dec.tiltX as number, dec.rot as number, 0] 
          : [0, dec.rot as number, 0];
          
        return (
          <mesh 
            key={dec.key} 
            position={dec.pos} 
            rotation={rotation} 
            castShadow 
            receiveShadow
          >
            {dec.shape === 'cylinder' ? <cylinderGeometry args={dec.args as any} /> : <boxGeometry args={dec.size} />}
            {dec.type === 'ac' ? (
              <meshStandardMaterial color="#888" roughness={0.8} />
            ) : dec.type === 'door' ? (
              <meshStandardMaterial color="#442211" roughness={0.9} />
            ) : dec.type === 'billboard' ? (
              <meshStandardMaterial color={isNight ? "#ffffff" : "#cccccc"} emissive={isNight ? new THREE.Color("#ffffff") : new THREE.Color(0x000000)} emissiveIntensity={isNight ? 0.8 : 0} roughness={0.2} metalness={0.8} />
            ) : dec.type === 'solar' ? (
              <meshStandardMaterial color="#112244" roughness={0.2} metalness={0.8} />
            ) : dec.type === 'chimney' ? (
              <meshStandardMaterial color="#663333" roughness={0.9} />
            ) : dec.type === 'watertower' ? (
              <meshStandardMaterial color="#a0522d" roughness={0.6} />
            ) : dec.type === 'ledge' ? (
              <meshStandardMaterial color="#7a7a7a" roughness={0.8} />
            ) : dec.type === 'balcony' ? (
              <meshStandardMaterial color="#445566" roughness={0.7} metalness={0.3} />
            ) : dec.type === 'windowFrame' ? (
              <meshStandardMaterial color="#8899aa" roughness={0.3} metalness={0.6} />
            ) : dec.type === 'awning' ? (
              <meshStandardMaterial color="#b91c1c" roughness={0.9} />
            ) : (
              <meshStandardMaterial color="#333" roughness={0.5} metalness={0.5} />
            )}
          </mesh>
        );
      })}
    </group>
  );
}

function Trees({ trees, density }: { trees: any[], density: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Calculate how many trees to display based on density. Max 3x.
  const displayedTrees = useMemo(() => {
    if (density === 1.0) return trees;
    if (density <= 0) return [];
    if (density < 1.0) {
      // Return a subset
      return trees.slice(0, Math.floor(trees.length * density));
    }
    
    // Density > 1.0: duplicate existing trees with an offset
    const result = [...trees];
    const extraCount = Math.floor(trees.length * (density - 1.0));
    for (let i = 0; i < extraCount; i++) {
      const source = trees[i % trees.length];
      result.push({
        ...source,
        position: [
          source.position[0] + (Math.random() - 0.5) * 10,
          source.position[1],
          source.position[2] + (Math.random() - 0.5) * 10
        ]
      });
    }
    return result;
  }, [trees, density]);

  const count = displayedTrees.length;

  useEffect(() => {
    if (!meshRef.current || !count) return;
    const dummy = new THREE.Object3D();
    displayedTrees.forEach((tree, i) => {
      dummy.position.set(tree.position[0], 0, tree.position[2]);
      const s = 1.0 + Math.random() * 2.5;
      dummy.scale.set(s, s, s);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [displayedTrees, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]} castShadow receiveShadow>
      <coneGeometry args={[0.5, 3, 6]} />
      <meshStandardMaterial color="#14532d" />
    </instancedMesh>
  );
}

function Area({ points, type, waterColor, parkColor, terrainHeight }: { points: [number, number, number][]; type: string, waterColor: string, parkColor: string, terrainHeight: number }) {
  const geometry = useMemo(() => {
    if (points.length < 3) return null;
    const shape = new THREE.Shape();
    points.forEach((p, i) => {
      if (i === 0) shape.moveTo(p[0], p[2]);
      else shape.lineTo(p[0], p[2]);
    });
    
    if (terrainHeight > 0) {
      return new THREE.ExtrudeGeometry(shape, {
        depth: type === 'grass' ? terrainHeight : Math.max(0.01, terrainHeight * 0.5),
        bevelEnabled: false,
      });
    }
    return new THREE.ShapeGeometry(shape);
  }, [points, terrainHeight, type]);

  if (!geometry) return null;

  const color = type === "grass" ? parkColor : waterColor;
  // If extruded, we place it lower so the top is at y (or a bit higher)
  const baseDepth = type === 'grass' ? terrainHeight : Math.max(0.01, terrainHeight * 0.5);
  const extrudeOffset = terrainHeight > 0 ? baseDepth : 0;
  // Note: Extrude geometry builds along +Z in 2D space, which after -PI/2 rotation on X becomes +Y
  // wait no, standard rotation is [-Math.PI / 2, 0, 0], which means Z becomes -Y
  // So depth goes downwards. If we want it to go upwards, we just leave it or shift it
  const y = type === "grass" ? -0.05 : -0.1;

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, terrainHeight > 0 ? y + baseDepth : y, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={type === 'water' ? 0.1 : 1} metalness={type === 'water' ? 0.8 : 0} />
    </mesh>
  );
}

export function Map() {
  const mapData = useStore((s) => s.mapData);
  const settings = useStore((s) => s.settings);

  if (!mapData) return null;

  const isNight = settings.timeOfDay < 6 || settings.timeOfDay > 18;

  return (
    <group>
      {/* Ground plane */}
      {settings.showGround && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
          <planeGeometry args={[5000, 5000]} />
          <meshStandardMaterial color={settings.groundColor} />
        </mesh>
      )}

      {settings.showRoads && <Roads roads={mapData.roads} color={settings.roadColor} />}
      
      {settings.showAreas && mapData.areas?.map((area: any) => (
        <Area key={`area-${area.id}`} points={area.points} type={area.type} waterColor={settings.waterColor} parkColor={settings.parkColor} terrainHeight={settings.terrainHeight} />
      ))}

      {settings.showBuildings && mapData.buildings.map((bldg: any) => (
        <Building 
          key={`bldg-${bldg.id}`} 
          points={bldg.points} 
          height={bldg.height} 
          amenity={bldg.amenity}
          shop={bldg.shop}
          baseColor={settings.buildingColor}
          heightScale={settings.buildingHeightScale}
          randomizeBuildingColors={settings.randomizeBuildingColors}
          buildingWindows={settings.buildingWindows}
          buildingWireframe={settings.buildingWireframe}
          buildingOpacity={settings.buildingOpacity}
          buildingDecorations={settings.buildingDecorations}
          decorationDensity={settings.decorationDensity}
          isNight={isNight}
        />
      ))}

      {settings.showTrees && <Trees trees={mapData.trees || []} density={settings.treeDensity} />}
    </group>
  );
}
