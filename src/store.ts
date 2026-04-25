import { create } from "zustand";

interface GameState {
  location: { lat: number; lon: number; name: string } | null;
  mapData: any;
  startPos: [number, number, number];
  teleportPos: [number, number, number] | null;
  selectedElement: any | null;
  loading: boolean;
  error: string | null;
  setLocation: (lat: number, lon: number, name: string) => void;
  setMapData: (data: any, startPos?: [number, number, number]) => void;
  setTeleportPos: (pos: [number, number, number] | null) => void;
  setSelectedElement: (element: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<GameState>((set) => ({
  location: null,
  mapData: null,
  startPos: [0, 2, 0],
  teleportPos: null,
  selectedElement: null,
  loading: false,
  error: null,
  setLocation: (lat, lon, name) => set({ location: { lat, lon, name }, mapData: null, error: null, selectedElement: null }),
  setMapData: (data, startPos) => set({ mapData: data, startPos: startPos || [0, 2, 0] }),
  setTeleportPos: (pos) => set({ teleportPos: pos }),
  setSelectedElement: (element) => set({ selectedElement: element }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
