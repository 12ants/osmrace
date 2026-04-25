import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { GameStage } from "./components/GameStage";
import { Minimap } from "./components/Minimap";
import { fetchOSMData } from "./osm";
import { useStore } from "./store";

const PRESETS = [
  { name: "Stockholm (Söder)", lat: 59.3175, lon: 18.0586 },
  { name: "Tokyo (Shibuya)", lat: 35.6595, lon: 139.7001 },
  { name: "New York (Times Sq)", lat: 40.7580, lon: -73.9855 },
  { name: "Paris (Arc de Triomphe)", lat: 48.8738, lon: 2.2950 },
  { name: "London (Piccadilly)", lat: 51.5100, lon: -0.1339 },
  { name: "San Francisco (Lombard)", lat: 37.8021, lon: -122.4187 }
];
export default function App() {
  const { location, setLocation, mapData, setMapData, loading, setLoading, error, setError, selectedElement, setSelectedElement } = useStore();
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [radiusInput, setRadiusInput] = useState("400");

  const handleStart = async (lat: number, lon: number, name: string, radius: number = 400) => {
    setLocation(lat, lon, name);
    setLoading(true);
    try {
      const data = await fetchOSMData(lat, lon, radius);
      let startPos: [number, number, number] = [0, 2, 0];
      if (data.roads.length > 0 && data.roads[0].points.length > 0) {
        startPos = [data.roads[0].points[0][0], 2, data.roads[0].points[0][2]];
      }
      setMapData(data, startPos);
    } catch (err: any) {
      setError(err.message || "Failed to load map");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    const radius = parseFloat(radiusInput) || 400;
    if (!isNaN(lat) && !isNaN(lon)) {
      handleStart(lat, lon, `Custom (${lat.toFixed(2)}, ${lon.toFixed(2)})`, radius);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#02040a] text-white font-sans overflow-hidden relative">
      {/* Game View */}
      {mapData && (
        <div className="absolute inset-0">
          <GameStage />
          
          {/* Immersive Overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
          <div className="absolute inset-0 pointer-events-none border-[30px] border-black/20 mix-blend-multiply"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-t from-cyan-500/5 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

          {/* Top Level UI Layer */}
          <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none">
            {/* Left Block */}
            <div className="space-y-4 pointer-events-auto">
              {/* Location Header */}
              <div className="bg-black/60 backdrop-blur-md border-l-4 border-cyan-500 p-4 w-64 rounded-r-lg shadow-2xl">
                <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">Current Region</div>
                <h2 className="text-xl font-black italic truncate">{location?.name}</h2>
                <div className="text-[10px] text-gray-400 mt-1 font-mono uppercase">OST DATASET: {location?.lat?.toFixed(2)} {location?.lon?.toFixed(2)}</div>
              </div>
              
              {/* Controls & Actions */}
              <div className="flex gap-2">
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-lg border border-white/10 w-64 shadow-2xl">
                  <div className="text-[10px] uppercase text-gray-400 mb-3 border-b border-white/10 pb-2">Controls Overview</div>
                  <div className="text-xs text-white/80 space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <kbd className="bg-white/10 px-2 py-0.5 rounded font-mono text-cyan-400 shadow-sm border border-white/5">W</kbd> 
                      <span>Accelerate</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <kbd className="bg-white/10 px-2 py-0.5 rounded font-mono text-cyan-400 shadow-sm border border-white/5">S</kbd> 
                      <span>Brake / Reverse</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <kbd className="bg-white/10 px-2 py-0.5 rounded font-mono text-cyan-400 shadow-sm border border-white/5">A/D</kbd> 
                      <span>Steer</span>
                    </div>
                  </div>
                  <button 
                    className="w-full px-4 py-2.5 bg-red-600/90 hover:bg-red-500 border border-red-500/50 rounded text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                    onClick={() => useStore.setState({ mapData: null, location: null })}
                  >
                    Exit Mission
                  </button>
                </div>
              </div>
            </div>

            {/* Right Block - Simulated System Info */}
            <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-64 shadow-2xl">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4 border-b border-white/10 pb-2">System Status</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-bold">01</span>
                  <span className="flex-1 ml-3 text-sm font-medium">GPS LOCK</span>
                  <span className="text-xs font-mono text-green-400">ACTIVE</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 -mx-2 px-2 py-1 rounded">
                  <span className="text-white font-bold">02</span>
                  <span className="flex-1 ml-3 text-sm font-bold text-white">PHYSICS</span>
                  <span className="text-xs font-mono text-cyan-400">ONLINE</span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-white font-bold">03</span>
                  <span className="flex-1 ml-3 text-sm font-medium">TELEMETRY</span>
                  <span className="text-xs font-mono text-yellow-400">STANDBY</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-8 pointer-events-none">
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-4">
                {/* Selected Element Info Panel */}
                {selectedElement && (
                  <div className="w-64 bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/30 p-4 shadow-xl pointer-events-auto">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] uppercase font-bold text-cyan-400 border-b border-cyan-500/30 pb-1 flex-1">Scanned Target</div>
                      <button onClick={() => setSelectedElement(null)} className="text-gray-400 hover:text-white px-1 -mx-1 text-xs">&#x2715;</button>
                    </div>
                    {selectedElement.elementType === 'road' ? (
                      <div className="space-y-2 text-sm">
                        <div className="font-bold text-white truncate">{selectedElement.name}</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-400">
                          <div>Type: <span className="text-white">{selectedElement.type}</span></div>
                          <div>Width: <span className="text-white">{selectedElement.width}m</span></div>
                          <div>Surface: <span className="text-white">{selectedElement.surface}</span></div>
                          <div>Speed: <span className="text-white">{selectedElement.maxspeed}</span></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="font-bold text-white truncate">{selectedElement.name}</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-400">
                          <div>Amenity: <span className="text-white">{selectedElement.amenity}</span></div>
                          <div>Shop: <span className="text-white">{selectedElement.shop}</span></div>
                          <div>Height: <span className="text-white">{selectedElement.height.toFixed(1)}m</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Radar Mini Map Layer */}
                <div className="w-64 h-64 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl pointer-events-auto shrink-0">
                  <Minimap />
                  <div className="absolute inset-0 bg-[#111] opacity-50 pointer-events-none">
                     <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500/20 rotate-12" />
                     <div className="absolute top-0 left-1/3 w-[1px] h-full bg-cyan-500/20" />
                     <div className="absolute top-1/4 left-0 w-full h-[1px] bg-cyan-500/20 -rotate-6" />
                     <div className="absolute top-0 left-2/3 w-[1px] h-full bg-cyan-500/20 rotate-3" />
                  </div>
                  <div id="minimap-player-dot" className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-cyan-500/30 rounded-full animate-pulse pointer-events-none" />
                  <div className="absolute top-4 left-4 text-[10px] uppercase font-bold tracking-tighter bg-cyan-500 px-1 text-black z-20 pointer-events-none">GPS ACTIVE</div>
                </div>
              </div>

              {/* Simulated Speedometer Element */}
              <div className="flex flex-col items-end gap-6">
                <div className="relative w-64 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 border-b-8 border-r-8 border-cyan-500/20 rounded-br-[60px]" />
                  <div className="text-right">
                    <div id="speedOMeter" className="text-6xl font-black italic tracking-tighter leading-none w-24 tabular-nums">0</div>
                    <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase mt-1">KM/H</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Menu */}
      {!mapData && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-black z-10">
          <div className="bg-neutral-800/80 p-8 rounded-2xl shadow-2xl backdrop-blur max-w-md w-full border border-neutral-700">
            <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              OSM Racer
            </h1>
            <p className="text-neutral-400 mb-8">Drive anywhere in the world using OpenStreetMap 3D data.</p>
            
            {error && (
              <div className="bg-red-500/20 text-red-300 p-3 rounded mb-6 text-sm border border-red-500/30">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                <p className="text-neutral-300 font-medium">Downloading city data...</p>
                <p className="text-neutral-500 text-sm">Building 3D geometry from OSM...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Select a City</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleStart(preset.lat, preset.lon, preset.name, parseFloat(radiusInput) || 400)}
                        className="bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 hover:border-blue-400 text-left px-4 py-3 rounded-xl transition-all flex justify-between items-center group"
                      >
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">Drive â</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Map Options</h3>
                  <div className="flex items-center gap-4 bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                    <label className="text-sm font-medium text-neutral-300 whitespace-nowrap">Radius (meters):</label>
                    <input
                      type="number"
                      min="100"
                      max="2000"
                      step="100"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={radiusInput}
                      onChange={(e) => setRadiusInput(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Custom Coordinates</h3>
                  <form onSubmit={handleCustomSubmit} className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      value={lonInput}
                      onChange={(e) => setLonInput(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                      Load
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
