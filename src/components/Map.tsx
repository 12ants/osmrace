import { useBox, useTrimesh } from "@react-three/cannon";
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useStore } from "../store";

function Roads({ roads }: { roads: any[] }) {
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
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={minorMeshRef} args={[null as any, null as any, minorSegments.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={serviceMeshRef} args={[null as any, null as any, serviceSegments.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4a4444" roughness={0.9} />
      </instancedMesh>
      {/* Invisible physics mesh */}
      <mesh ref={physicsRef} visible={false}>
        <bufferGeometry />
      </mesh>
    </group>
  );
}

function Building({ points, height, amenity, shop }: { points: [number, number, number][]; height: number, amenity?: string, shop?: string }) {
  const color = useMemo(() => {
    if (amenity && amenity !== "None") return "#a8a29e";
    if (shop && shop !== "None") return "#78716c";
    return "#888899";
  }, [amenity, shop]);

  const geometry = useMemo(() => {
    if (points.length < 3) return null;
    const shape = new THREE.Shape();
    points.forEach((p, i) => {
      // Create 2D shape (X and Z coordinates)
      if (i === 0) shape.moveTo(p[0], p[2]);
      else shape.lineTo(p[0], p[2]);
    });
    
    return new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });
  }, [points, height]);

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

  if (!geometry) return null;

  return (
    <group>
      {/* Visual mesh */}
      <mesh ref={ref} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Trees({ trees }: { trees: any[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = trees.length;

  useEffect(() => {
    if (!meshRef.current || !count) return;
    const dummy = new THREE.Object3D();
    trees.forEach((tree, i) => {
      dummy.position.set(tree.position[0], 0, tree.position[2]);
      const s = 1.0 + Math.random() * 2.5;
      dummy.scale.set(s, s, s);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [trees, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]} castShadow>
      <coneGeometry args={[0.5, 3, 6]} />
      <meshStandardMaterial color="#14532d" />
    </instancedMesh>
  );
}

function Area({ points, type }: { points: [number, number, number][]; type: string }) {
  const geometry = useMemo(() => {
    if (points.length < 3) return null;
    const shape = new THREE.Shape();
    points.forEach((p, i) => {
      if (i === 0) shape.moveTo(p[0], p[2]);
      else shape.lineTo(p[0], p[2]);
    });
    return new THREE.ShapeGeometry(shape);
  }, [points]);

  if (!geometry) return null;

  const color = type === "grass" ? "#3f6212" : "#1d4ed8";
  const y = type === "grass" ? -0.05 : -0.08;

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

export function Map() {
  const mapData = useStore((s) => s.mapData);

  if (!mapData) return null;

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial color="#1a221a" />
      </mesh>

      <Roads roads={mapData.roads} />
      
      {mapData.areas?.map((area: any) => (
        <Area key={`area-${area.id}`} points={area.points} type={area.type} />
      ))}

      {mapData.buildings.map((bldg: any) => (
        <Building 
          key={`bldg-${bldg.id}`} 
          points={bldg.points} 
          height={bldg.height} 
          amenity={bldg.amenity}
          shop={bldg.shop}
        />
      ))}

      <Trees trees={mapData.trees || []} />
    </group>
  );
}
