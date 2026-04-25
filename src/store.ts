import { create } from "zustand";

interface Settings {
  shadows: boolean;
  timeOfDay: number;
  fog: boolean;
  maxSpeed: number;
  steeringSensitivity: number;
  showBuildings: boolean;
  showTrees: boolean;
  showAreas: boolean;
  showRoads: boolean;
  showGround: boolean;
  groundColor: string;
  roadColor: string;
  buildingColor: string;
  waterColor: string;
  parkColor: string;
  buildingHeightScale: number;
  treeDensity: number;
  randomizeBuildingColors: boolean;
  buildingWindows: boolean;
  buildingWireframe: boolean;
  buildingOpacity: number;
  buildingDecorations: boolean;
  decorationDensity: number;
  sunColor: string;
  terrainHeight: number;
}

interface GameState {
  location: { lat: number; lon: number; name: string } | null;
  mapData: any;
  startPos: [number, number, number];
  teleportPos: [number, number, number] | null;
  selectedElement: any | null;
  loading: boolean;
  error: string | null;
  freecam: boolean;
  settings: Settings;
  setLocation: (lat: number, lon: number, name: string) => void;
  setMapData: (data: any, startPos?: [number, number, number]) => void;
  setTeleportPos: (pos: [number, number, number] | null) => void;
  setSelectedElement: (element: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFreecam: (freecam: boolean) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

export const useStore = create<GameState>((set) => ({
  location: null,
  mapData: null,
  startPos: [0, 2, 0],
  teleportPos: null,
  selectedElement: null,
  loading: false,
  error: null,
  freecam: false,
  settings: {
    shadows: true,
    timeOfDay: 12,
    fog: true,
    maxSpeed: 120,
    steeringSensitivity: 4.5,
    showBuildings: true,
    showTrees: true,
    showAreas: true,
    showRoads: true,
    showGround: true,
    groundColor: "#1a221a",
    roadColor: "#2a2a2a",
    buildingColor: "#a8a29e",
    waterColor: "#1d4ed8",
    parkColor: "#3f6212",
    buildingHeightScale: 1.0,
    treeDensity: 1.0,
    randomizeBuildingColors: false,
    buildingWindows: true,
    buildingWireframe: false,
    buildingOpacity: 1.0,
    buildingDecorations: true,
    decorationDensity: 1.0,
    sunColor: "#ffffff",
    terrainHeight: 0.1,
  },
  setLocation: (lat, lon, name) => set({ location: { lat, lon, name }, mapData: null, error: null, selectedElement: null }),
  setMapData: (data, startPos) => set({ mapData: data, startPos: startPos || [0, 2, 0] }),
  setTeleportPos: (pos) => set({ teleportPos: pos }),
  setSelectedElement: (element) => set({ selectedElement: element }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setFreecam: (freecam) => set({ freecam }),
  updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));
