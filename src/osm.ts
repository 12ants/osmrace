import { latLonToMeters } from "./utils";

export async function fetchOSMData(lat: number, lon: number, radius = 500) {
  // Query to get ways that are highways, buildings, parks, or natural features within the radius
  const query = `
    [out:json];
    (
      way["highway"](around:${radius}, ${lat}, ${lon});
      way["building"](around:${radius}, ${lat}, ${lon});
      way["landuse"="grass"](around:${radius}, ${lat}, ${lon});
      way["leisure"="park"](around:${radius}, ${lat}, ${lon});
      way["natural"="water"](around:${radius}, ${lat}, ${lon});
      way["natural"="scrub"](around:${radius}, ${lat}, ${lon});
      way["waterway"](around:${radius}, ${lat}, ${lon});
      node["natural"="tree"](around:${radius}, ${lat}, ${lon});
    );
    (._;>;);
    out;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch OSM data. Overpass API might be busy.");
  const data = await response.json();
  
  return parseOSMData(data, lat, lon);
}

function parseOSMData(data: any, centerLat: number, centerLon: number) {
  const nodes = new Map<number, [number, number, number]>();
  const roads: Array<{ id: number; points: [number, number, number][]; type: string; width: number; name: string; surface: string; lanes: string; maxspeed: string }> = [];
  const buildings: Array<{ id: number; points: [number, number, number][]; height: number; name: string; amenity: string; shop: string }> = [];
  const areas: Array<{ id: number; points: [number, number, number][]; type: string; name: string }> = [];
  const trees: Array<{ id: number; position: [number, number, number] }> = [];

  // First pass: collect nodes
  for (const element of data.elements) {
    if (element.type === "node") {
      const pos = latLonToMeters(element.lat, element.lon, centerLat, centerLon);
      nodes.set(element.id, pos);
      if (element.tags?.natural === "tree") {
        trees.push({ id: element.id, position: pos });
      }
    }
  }

  // Second pass: collect ways
  for (const element of data.elements) {
    if (element.type === "way") {
      const wayNodes = element.nodes.map((id: number) => nodes.get(id)).filter(Boolean) as [number, number, number][];
      if (wayNodes.length < 2) continue;

      if (element.tags?.highway) {
        let width = 6;
        const hwType = element.tags.highway;
        if (["motorway", "trunk"].includes(hwType)) width = 12;
        else if (["primary", "secondary"].includes(hwType)) width = 10;
        else if (["tertiary", "unclassified", "residential"].includes(hwType)) width = 6;
        else if (["pedestrian", "footway", "path", "cycleway", "service"].includes(hwType)) width = 3.5;
        else width = 5;

        roads.push({ 
          id: element.id, 
          points: wayNodes, 
          type: hwType, 
          width,
          name: element.tags.name || "Unknown Road",
          surface: element.tags.surface || "Unknown",
          lanes: element.tags.lanes || "Unknown",
          maxspeed: element.tags.maxspeed || "Unknown"
        });
      } else if (element.tags?.building) {
        let height = 10;
        if (element.tags.height) height = parseFloat(element.tags.height) || 10;
        else if (element.tags["building:levels"]) height = (parseFloat(element.tags["building:levels"]) || 2) * 3 + 2;
        else height = 8 + Math.random() * 15;

        buildings.push({ 
          id: element.id, 
          points: wayNodes, 
          height,
          name: element.tags.name || "Unknown Building",
          amenity: element.tags.amenity || "None",
          shop: element.tags.shop || "None",
        });
      } else if (element.tags?.landuse === "grass" || element.tags?.leisure === "park" || element.tags?.natural === "scrub") {
        areas.push({
          id: element.id,
          points: wayNodes,
          type: "grass",
          name: element.tags.name || "Park"
        });
      } else if (element.tags?.natural === "water" || element.tags?.waterway) {
        areas.push({
          id: element.id,
          points: wayNodes,
          type: "water",
          name: element.tags.name || "Water"
        });
      }
    }
  }

  return { roads, buildings, areas, trees };
}
