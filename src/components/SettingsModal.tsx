import React from 'react';
import { useStore } from '../store';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Graphics Settings */}
          <div>
            <h3 className="text-sm tracking-widest text-emerald-500 font-bold uppercase mb-4">Graphics</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-gray-200 group-hover:text-white transition-colors">Shadows</span>
                <input 
                  type="checkbox" 
                  checked={settings.shadows}
                  onChange={(e) => updateSettings({ shadows: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-gray-200 group-hover:text-white transition-colors">Atmospheric Fog</span>
                <input 
                  type="checkbox" 
                  checked={settings.fog}
                  onChange={(e) => updateSettings({ fog: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-200">Time of Day</span>
                  <span className="text-gray-400 text-sm">{Math.floor(settings.timeOfDay)}:00</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="24" step="0.5"
                  value={settings.timeOfDay}
                  onChange={(e) => updateSettings({ timeOfDay: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Map Layers */}
          <div>
            <h3 className="text-sm tracking-widest text-emerald-500 font-bold uppercase mb-4">Map Layers</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-gray-200 group-hover:text-white transition-colors">Show Buildings</span>
                <input 
                  type="checkbox" 
                  checked={settings.showBuildings}
                  onChange={(e) => updateSettings({ showBuildings: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-gray-200 group-hover:text-white transition-colors">Show Trees</span>
                <input 
                  type="checkbox" 
                  checked={settings.showTrees}
                  onChange={(e) => updateSettings({ showTrees: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-gray-200 group-hover:text-white transition-colors">Show Water & Parks</span>
                <input 
                  type="checkbox" 
                  checked={settings.showAreas}
                  onChange={(e) => updateSettings({ showAreas: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-gray-200 group-hover:text-white transition-colors">Show Roads</span>
                <input 
                  type="checkbox" 
                  checked={settings.showRoads}
                  onChange={(e) => updateSettings({ showRoads: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-gray-200 group-hover:text-white transition-colors">Show Map Ground</span>
                <input 
                  type="checkbox" 
                  checked={settings.showGround}
                  onChange={(e) => updateSettings({ showGround: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Map Customization */}
          <div>
            <h3 className="text-sm tracking-widest text-emerald-500 font-bold uppercase mb-4">Map Customization</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-200">Building Height Scale</span>
                  <span className="text-gray-400 text-sm">{settings.buildingHeightScale.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="5" step="0.1"
                  value={settings.buildingHeightScale}
                  onChange={(e) => updateSettings({ buildingHeightScale: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-200">Terrain Height</span>
                  <span className="text-gray-400 text-sm">{settings.terrainHeight?.toFixed(1) || '0.1'}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="2" step="0.1"
                  value={settings.terrainHeight ?? 0.1}
                  onChange={(e) => updateSettings({ terrainHeight: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-200">Tree Density</span>
                  <span className="text-gray-400 text-sm">{settings.treeDensity.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="3" step="0.1"
                  value={settings.treeDensity}
                  onChange={(e) => updateSettings({ treeDensity: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-gray-200 text-sm block">Ground Color</span>
                  <input type="color" value={settings.groundColor} onChange={e => updateSettings({groundColor: e.target.value})} className="w-full h-8 rounded border-none bg-transparent cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <span className="text-gray-200 text-sm block">Road Color</span>
                  <input type="color" value={settings.roadColor} onChange={e => updateSettings({roadColor: e.target.value})} className="w-full h-8 rounded border-none bg-transparent cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <span className="text-gray-200 text-sm block">Building Color</span>
                  <input type="color" value={settings.buildingColor} onChange={e => updateSettings({buildingColor: e.target.value})} className="w-full h-8 rounded border-none bg-transparent cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <span className="text-gray-200 text-sm block">Water Color</span>
                  <input type="color" value={settings.waterColor} onChange={e => updateSettings({waterColor: e.target.value})} className="w-full h-8 rounded border-none bg-transparent cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <span className="text-gray-200 text-sm block">Park Color</span>
                  <input type="color" value={settings.parkColor} onChange={e => updateSettings({parkColor: e.target.value})} className="w-full h-8 rounded border-none bg-transparent cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <span className="text-gray-200 text-sm block">Sun Color</span>
                  <input type="color" value={settings.sunColor} onChange={e => updateSettings({sunColor: e.target.value})} className="w-full h-8 rounded border-none bg-transparent cursor-pointer" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-gray-200 group-hover:text-white transition-colors">Randomize Building Colors</span>
                  <input 
                    type="checkbox" 
                    checked={settings.randomizeBuildingColors}
                    onChange={(e) => updateSettings({ randomizeBuildingColors: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-gray-200 group-hover:text-white transition-colors">Roof Decorations</span>
                  <input 
                    type="checkbox" 
                    checked={settings.buildingDecorations}
                    onChange={(e) => updateSettings({ buildingDecorations: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
                <div className={`space-y-2 pt-2 ${!settings.buildingDecorations ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-200">Decoration Density</span>
                    <span className="text-gray-400 text-sm">{settings.decorationDensity?.toFixed(1) || '1.0'}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="3" step="0.1"
                    value={settings.decorationDensity ?? 1.0}
                    onChange={(e) => updateSettings({ decorationDensity: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-gray-200 group-hover:text-white transition-colors">Windows emit light (Night)</span>
                  <input 
                    type="checkbox" 
                    checked={settings.buildingWindows}
                    onChange={(e) => updateSettings({ buildingWindows: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-gray-200 group-hover:text-white transition-colors">Wireframe Buildings</span>
                  <input 
                    type="checkbox" 
                    checked={settings.buildingWireframe}
                    onChange={(e) => updateSettings({ buildingWireframe: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-200">Building Opacity</span>
                    <span className="text-gray-400 text-sm">{Math.round(settings.buildingOpacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    value={settings.buildingOpacity}
                    onChange={(e) => updateSettings({ buildingOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Gameplay Settings */}
          <div>
            <h3 className="text-sm tracking-widest text-emerald-500 font-bold uppercase mb-4">Gameplay</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-200">Max Speed</span>
                  <span className="text-gray-400 text-sm">{settings.maxSpeed} km/h</span>
                </div>
                <input 
                  type="range" 
                  min="40" max="300" step="10"
                  value={settings.maxSpeed}
                  onChange={(e) => updateSettings({ maxSpeed: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-200">Steering Sensitivity</span>
                  <span className="text-gray-400 text-sm">{settings.steeringSensitivity.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="10" step="0.5"
                  value={settings.steeringSensitivity}
                  onChange={(e) => updateSettings({ steeringSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-zinc-800/50">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
