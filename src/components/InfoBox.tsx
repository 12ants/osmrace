import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

export function InfoBox() {
  const { location, settings, freecam } = useStore();
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const calculateFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(calculateFps);
    };

    animationFrameId = requestAnimationFrame(calculateFps);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="absolute top-4 left-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl z-40 text-xs text-gray-300 min-w-[200px] pointer-events-none">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
        <span className="font-bold text-emerald-500 uppercase tracking-widest text-[10px]">Telemetry</span>
        <span className="font-mono font-bold text-white">{fps} FPS</span>
      </div>
      <div className="space-y-1 font-mono">
        <div className="flex justify-between py-0.5">
          <span className="text-gray-500">Mode</span>
          <span className={`text-right font-bold ${freecam ? 'text-amber-400' : 'text-emerald-400'}`}>
            {freecam ? "FREECAM" : "DRIVE"}
          </span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-gray-500">Location</span>
          <span className="text-right text-white max-w-[120px] truncate" title={location?.name}>{location?.name || "None"}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-gray-500">LAT</span>
          <span className="text-white">{location?.lat.toFixed(6) || "---"}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-gray-500">LON</span>
          <span className="text-white">{location?.lon.toFixed(6) || "---"}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-gray-500">World Time</span>
          <span className="text-white">
            {Math.floor(settings.timeOfDay).toString().padStart(2, '0')}:
            {Math.floor((settings.timeOfDay % 1) * 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
