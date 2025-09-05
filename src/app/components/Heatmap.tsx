'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import 'leaflet.heat';
import L from 'leaflet';

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
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // This effect ensures the component is mounted on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getResponsiveOptions = useCallback((): HeatLayerOptions => {
    const zoom = map.getZoom();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (zoom <= 11) {
      return { radius: isMobile ? 25 : 35, blur: isMobile ? 15 : 25 };
    } else if (zoom <= 14) {
      return { radius: isMobile ? 15 : 25, blur: isMobile ? 10 : 15 };
    } else {
      return { radius: isMobile ? 10 : 15, blur: isMobile ? 8 : 12 };
    }
  }, [map]);

  // Effect to create and remove the layer
  useEffect(() => {
    if (!isMounted || !map) return;

    heatLayerRef.current = L.heatLayer(points, getResponsiveOptions()).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, isMounted, getResponsiveOptions]); // Note: Points removed to prevent re-creation

  // Effect to update the points when data changes
  useEffect(() => {
    if (isMounted && heatLayerRef.current) {
      heatLayerRef.current.setLatLngs(points);
    }
  }, [points, isMounted]);

  // Hook to update options dynamically on zoom
  useMapEvents({
    zoomend: () => {
      if (isMounted && heatLayerRef.current) {
        heatLayerRef.current.setOptions(getResponsiveOptions());
      }
    },
  });

  return null;
};

export default Heatmap;