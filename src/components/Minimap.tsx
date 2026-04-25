import { useEffect, useRef } from "react";
import { useStore } from "../store";

export function Minimap() {
  const mapData = useStore(s => s.mapData);
  const setTeleportPos = useStore(s => s.setTeleportPos);
  const setSelectedElement = useStore(s => s.setSelectedElement);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!mapData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 256, 256);
    
    // Scale: map is ~800x800m. Minimap is 256x256. Center is 128,128.
    const sc = 256 / 800;
    
    const drawPoint = (p: [number, number, number]) => {
      const cx = 128 + p[0] * sc;
      const cy = 128 + p[2] * sc; // +z is down in canvas y
      return { cx, cy };
    }

    // Draw buildings
    ctx.fillStyle = "rgba(136, 136, 153, 0.4)"; // #888899 with opacity
    for (const bldg of mapData.buildings) {
      if (bldg.points.length < 3) continue;
      ctx.beginPath();
      const st = drawPoint(bldg.points[0]);
      ctx.moveTo(st.cx, st.cy);
      for (let i = 1; i < bldg.points.length; i++) {
        const pt = drawPoint(bldg.points[i]);
        ctx.lineTo(pt.cx, pt.cy);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Draw roads
    ctx.strokeStyle = "rgba(34, 211, 238, 0.4)"; // cyan-400
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const road of mapData.roads) {
      if (road.points.length < 2) continue;
      ctx.beginPath();
      const st = drawPoint(road.points[0]);
      ctx.moveTo(st.cx, st.cy);
      for (let i = 1; i < road.points.length; i++) {
        const pt = drawPoint(road.points[i]);
        ctx.lineTo(pt.cx, pt.cy);
      }
      ctx.stroke();
    }
  }, [mapData]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const sc = 800 / 256;
    const mapX = (x - 128) * sc;
    const mapZ = (y - 128) * sc;

    if (!mapData) return;

    let clickedElement = null;
    let minDist = Infinity;

    // Helper: point to line segment distance
    const distToSegmentSq = (p: {x: number, z: number}, v: {x: number, z: number}, w: {x: number, z: number}) => {
      const l2 = (w.x - v.x) ** 2 + (w.z - v.z) ** 2;
      if (l2 === 0) return (p.x - v.x) ** 2 + (p.z - v.z) ** 2;
      let t = ((p.x - v.x) * (w.x - v.x) + (p.z - v.z) * (w.z - v.z)) / l2;
      t = Math.max(0, Math.min(1, t));
      return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.z - (v.z + t * (w.z - v.z))) ** 2;
    };

    // Helper: point in polygon
    const pointInPolygon = (point: {x: number, z: number}, vs: [number, number, number][]) => {
      let inside = false;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], zi = vs[i][2];
        const xj = vs[j][0], zj = vs[j][2];
        const intersect = ((zi > point.z) !== (zj > point.z))
            && (point.x < (xj - xi) * (point.z - zi) / (zj - zi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const clickPoint = { x: mapX, z: mapZ };

    // Check roads
    for (const road of mapData.roads) {
      if (road.points.length < 2) continue;
      for (let i = 0; i < road.points.length - 1; i++) {
        const p1 = { x: road.points[i][0], z: road.points[i][2] };
        const p2 = { x: road.points[i+1][0], z: road.points[i+1][2] };
        const dSq = distToSegmentSq(clickPoint, p1, p2);
        const threshold = (road.width / 2 + 5); // 5m generous click radius
        if (dSq < threshold * threshold && dSq < minDist) {
          minDist = dSq;
          clickedElement = { ...road, elementType: 'road' };
        }
      }
    }

    // Check buildings
    for (const bldg of mapData.buildings) {
      if (bldg.points.length < 3) continue;
      if (pointInPolygon(clickPoint, bldg.points)) {
        // Prefer buildings over roads if clicked inside a building
        clickedElement = { ...bldg, elementType: 'building' };
        break; // Just pick the first building we hit
      }
    }

    setSelectedElement(clickedElement);
    setTeleportPos([mapX, 3, mapZ]); // spawn slightly above ground
  };

  return (
    <canvas 
      ref={canvasRef} 
      width={256} 
      height={256} 
      className="absolute inset-0 w-full h-full cursor-crosshair z-10" 
      onClick={handleClick} 
    />
  );
}
