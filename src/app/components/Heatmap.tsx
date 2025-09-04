'use client';

import { useState, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import 'leaflet.heat';
import L from 'leaflet';

// Type definitions for leaflet.heat (unchanged)
interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
}

declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: HeatLayerOptions
  ): HeatLayer;

  interface HeatLayer extends Layer {
    setLatLngs(latlngs: [number, number, number][]): this;
    addLatLng(latlng: [number, number, number]): this;
    setOptions(options: HeatLayerOptions): this;
    redraw(): this;
  }
}

type HeatmapProps = {
  points: [number, number, number][];
};

const Heatmap = ({ points }: HeatmapProps) => {
  const map = useMap();
  
  // --- NEW: State to hold responsive radius and blur values ---
  const [heatmapOptions, setHeatmapOptions] = useState({
    radius: 25,
    blur: 15,
  });

  // --- NEW: Hook to listen for map events ---
  useMapEvents({
    zoomend: () => {
      const zoom = map.getZoom();
      // Adjust radius and blur based on the zoom level
      if (zoom <= 10) {
        setHeatmapOptions({ radius: 35, blur: 25 });
      } else if (zoom <= 13) {
        setHeatmapOptions({ radius: 25, blur: 15 });
      } else {
        setHeatmapOptions({ radius: 15, blur: 10 });
      }
    },
  });

  useEffect(() => {
    if (!map || points.length === 0) return;

    // --- UPDATED: Use the dynamic options from state ---
    const heatLayer = L.heatLayer(points, {
      ...heatmapOptions, // Spread the responsive options
      maxZoom: 18,
    });

    map.addLayer(heatLayer);

    return () => {
      map.removeLayer(heatLayer);
    };
    // Re-run this effect when the map, points, OR options change
  }, [map, points, heatmapOptions]); 

  return null;
};

export default Heatmap;