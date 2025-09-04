'use client';

import { useState, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import 'leaflet.heat';
import L from 'leaflet';

// Type definitions for leaflet.heat
interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  minOpacity?: number;
  gradient?: Record<string, string>;
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
  const [heatLayer, setHeatLayer] = useState<L.HeatLayer | null>(null);
  
  // State to hold responsive radius and blur values
  const [heatmapOptions, setHeatmapOptions] = useState({
    radius: 20,
    blur: 12,
  });

  // Hook to listen for map events with error handling
  useMapEvents({
    zoomend: () => {
      try {
        const zoom = map.getZoom();
        // Adjust radius and blur based on the zoom level
        if (zoom <= 10) {
          setHeatmapOptions({ radius: 30, blur: 20 });
        } else if (zoom <= 13) {
          setHeatmapOptions({ radius: 20, blur: 12 });
        } else {
          setHeatmapOptions({ radius: 12, blur: 8 });
        }
      } catch (error) {
        console.warn('Error handling zoom event:', error);
      }
    },
    resize: () => {
      try {
        // Redraw heatmap on resize
        if (heatLayer) {
          heatLayer.redraw();
        }
      } catch (error) {
        console.warn('Error handling resize event:', error);
      }
    },
  });

  useEffect(() => {
    if (!map || points.length === 0) return;

    try {
      // Remove existing layer if it exists
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }

      // Create new heatmap layer with responsive options
      const newHeatLayer = L.heatLayer(points, {
        ...heatmapOptions,
        maxZoom: 18,
        max: 1.0,
        minOpacity: 0.1,
      });

      map.addLayer(newHeatLayer);
      setHeatLayer(newHeatLayer);

      return () => {
        try {
          if (newHeatLayer && map.hasLayer(newHeatLayer)) {
            map.removeLayer(newHeatLayer);
          }
        } catch (error) {
          console.warn('Error removing heatmap layer:', error);
        }
      };
    } catch (error) {
      console.error('Error creating heatmap:', error);
    }
  }, [map, points, heatmapOptions]);

  return null;
};

export default Heatmap;