'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

// Type definitions for the leaflet.heat plugin
interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
}

declare module 'leaflet' {
  interface HeatLayer extends Layer {
    setLatLngs(latlngs: L.LatLngExpression[]): this;
    setOptions(options: HeatLayerOptions): this;
  }
  function heatLayer(
    latlngs: L.LatLngExpression[],
    options?: HeatLayerOptions
  ): HeatLayer;
}

type HeatmapProps = {
  points: [number, number, number][];
};

const Heatmap = ({ points }: HeatmapProps) => {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    setIsMounted(true);
  }, []);

  const getResponsiveOptions = useCallback((): HeatLayerOptions => {
    if (!map || !isClient) return { radius: 25, blur: 15 };

    try {
      const zoom = map.getZoom();
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      if (zoom <= 11) {
        return { 
          radius: isMobile ? 20 : 30, 
          blur: isMobile ? 12 : 20,
          minOpacity: 0.4
        };
      } else if (zoom <= 14) {
        return { 
          radius: isMobile ? 12 : 20, 
          blur: isMobile ? 8 : 12,
          minOpacity: 0.4
        };
      } else {
        return { 
          radius: isMobile ? 8 : 12, 
          blur: isMobile ? 6 : 10,
          minOpacity: 0.4
        };
      }
    } catch (error) {
      console.error('Error getting responsive options:', error);
      return { radius: 25, blur: 15, minOpacity: 0.4 };
    }
  }, [map, isClient]);

  // Effect to create and remove the layer
  useEffect(() => {
    if (!isMounted || !isClient || !map) return;

    const initializeHeatLayer = async () => {
      try {
        // Dynamic import to ensure leaflet.heat is available
        await import('leaflet.heat');
        const L = (window as any).L;
        
        if (!L || !L.heatLayer) {
          console.error('Leaflet heatLayer not available');
          return;
        }

        // Validate points data
        const validPoints = points.filter(point => 
          Array.isArray(point) && 
          point.length >= 2 && 
          typeof point[0] === 'number' && 
          typeof point[1] === 'number' &&
          !isNaN(point[0]) && 
          !isNaN(point[1])
        );

        const options = getResponsiveOptions();
        heatLayerRef.current = L.heatLayer(validPoints, options);
        
        if (map && heatLayerRef.current) {
          map.addLayer(heatLayerRef.current);
        }
      } catch (error) {
        console.error('Error initializing heat layer:', error);
      }
    };

    initializeHeatLayer();

    return () => {
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        } catch (error) {
          console.error('Error removing heat layer:', error);
        }
      }
    };
  }, [map, isMounted, isClient, getResponsiveOptions]);

  // Effect to update the points when data changes
  useEffect(() => {
    if (!isMounted || !isClient || !heatLayerRef.current || !points) return;

    try {
      // Ensure map container has proper dimensions
      const container = map.getContainer();
      if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
        return;
      }

      // Validate and filter points
      const validPoints = points.filter(point => 
        Array.isArray(point) && 
        point.length >= 2 && 
        typeof point[0] === 'number' && 
        typeof point[1] === 'number' &&
        !isNaN(point[0]) && 
        !isNaN(point[1]) &&
        point[0] >= -90 && point[0] <= 90 &&
        point[1] >= -180 && point[1] <= 180
      );

      if (heatLayerRef.current.setLatLngs) {
        // Small delay to ensure canvas is ready
        setTimeout(() => {
          if (heatLayerRef.current && heatLayerRef.current.setLatLngs) {
            heatLayerRef.current.setLatLngs(validPoints);
          }
        }, 50);
      }
    } catch (error) {
      console.error('Error updating heat layer points:', error);
    }
  }, [points, isMounted, isClient, map]);

  // Hook to update options dynamically on zoom (with error handling)
  useMapEvents({
    zoomend: () => {
      if (!isMounted || !isClient || !heatLayerRef.current) return;
      
      try {
        const newOptions = getResponsiveOptions();
        if (heatLayerRef.current.setOptions) {
          heatLayerRef.current.setOptions(newOptions);
        }
      } catch (error) {
        console.error('Error updating heat layer options on zoom:', error);
      }
    },
  });

  return null;
};

export default Heatmap;