'use client';

import { useState, useEffect, useRef } from 'react';
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
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  // Simplified heatmap options for mobile performance
  const getHeatmapOptions = (zoom: number): HeatLayerOptions => {
    const baseRadius = isMobile ? 15 : 20;
    const baseBlur = isMobile ? 8 : 12;
    
    if (zoom <= 10) {
      return { radius: baseRadius + 10, blur: baseBlur + 5 };
    } else if (zoom <= 13) {
      return { radius: baseRadius, blur: baseBlur };
    } else {
      return { radius: baseRadius - 5, blur: baseBlur - 3 };
    }
  };

  // Throttled zoom handler to prevent excessive updates
  const throttledZoomHandler = useRef<NodeJS.Timeout>(null);
  
  useMapEvents({
    zoomend: () => {
      if (throttledZoomHandler.current) {
        clearTimeout(throttledZoomHandler.current);
      }
      
      throttledZoomHandler.current = setTimeout(() => {
        try {
          if (heatLayerRef.current && map) {
            const zoom = map.getZoom();
            const options = getHeatmapOptions(zoom);
            heatLayerRef.current.setOptions(options);
          }
        } catch (error) {
          console.warn('Error updating heatmap on zoom:', error);
        }
      }, 200); // 200ms throttle
    },
    
    resize: () => {
      setTimeout(() => {
        if (heatLayerRef.current) {
          try {
            heatLayerRef.current.redraw();
          } catch (error) {
            console.warn('Error redrawing heatmap on resize:', error);
          }
        }
      }, 100);
    },
  });

  useEffect(() => {
    if (!map || points.length === 0) return;

    try {
      // Remove existing layer
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      // Create new heatmap with optimized settings
      const zoom = map.getZoom();
      const options = getHeatmapOptions(zoom);
      
      const newHeatLayer = L.heatLayer(points, {
        ...options,
        maxZoom: 18,
        max: 1.0,
        minOpacity: isMobile ? 0.2 : 0.1,
      });

      map.addLayer(newHeatLayer);
      heatLayerRef.current = newHeatLayer;

    } catch (error) {
      console.error('Error creating heatmap:', error);
    }

    // Cleanup function
    return () => {
      try {
        if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
          map.removeLayer(heatLayerRef.current);
        }
        if (throttledZoomHandler.current) {
          clearTimeout(throttledZoomHandler.current);
        }
      } catch (error) {
        console.warn('Error cleaning up heatmap:', error);
      }
    };
  }, [map, points, isMobile]);

  return null;
};

export default Heatmap;