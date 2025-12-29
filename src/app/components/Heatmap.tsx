"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import * as L from "leaflet";

// ========================================================================================
// Type Definitions
// ========================================================================================

interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
}

interface ExtendedHeatLayer {
  setLatLngs(latlngs: L.LatLngExpression[]): this;
  setOptions(options: HeatLayerOptions): this;
  _map?: L.Map;
  _canvas?: HTMLCanvasElement;
}

declare module "leaflet" {
  function heatLayer(
    latlngs: L.LatLngExpression[],
    options?: HeatLayerOptions
  ): ExtendedHeatLayer;
}

interface HeatmapProps {
  points: [number, number, number][];
}

// ========================================================================================
// Constants
// ========================================================================================

const MOBILE_BREAKPOINT = 768;
const INIT_DELAY = 50;
const UPDATE_DELAY = 50;
const CONTAINER_CHECK_RETRY_DELAY = 100;

const DEFAULT_OPTIONS: HeatLayerOptions = {
  radius: 25,
  blur: 15,
  minOpacity: 0.4,
};

// ========================================================================================
// Helper Functions
// ========================================================================================

const isMobileDevice = (): boolean => {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
};

const isValidPoint = (point: unknown): point is [number, number, number] => {
  if (!Array.isArray(point) || point.length < 2) return false;
  
  const [lat, lng] = point;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const filterValidPoints = (points: [number, number, number][]): [number, number, number][] => {
  return points.filter(isValidPoint);
};

const hasValidMapContainer = (map: L.Map): boolean => {
  const container = map.getContainer();
  return !!(
    container &&
    container.offsetWidth > 0 &&
    container.offsetHeight > 0
  );
};

// ========================================================================================
// Main Component
// ========================================================================================

const Heatmap = ({ points }: HeatmapProps) => {
  // --------------------------------------------------------------------------------------
  // Hooks & State
  // --------------------------------------------------------------------------------------
  
  const map = useMap();
  const heatLayerRef = useRef<ExtendedHeatLayer | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // --------------------------------------------------------------------------------------
  // Effects - Initialization
  // --------------------------------------------------------------------------------------
  
  useEffect(() => {
    setIsClient(true);
    setIsMounted(true);
  }, []);

  // --------------------------------------------------------------------------------------
  // Responsive Options Calculator
  // --------------------------------------------------------------------------------------
  
  const getResponsiveOptions = useCallback((): HeatLayerOptions => {
    if (!map || !isClient) return DEFAULT_OPTIONS;

    try {
      const zoom = map.getZoom();
      const isMobile = isMobileDevice();

      // Low zoom level (zoomed out)
      if (zoom <= 11) {
        return {
          radius: isMobile ? 20 : 30,
          blur: isMobile ? 12 : 20,
          minOpacity: 0.4,
        };
      }
      
      // Medium zoom level
      if (zoom <= 14) {
        return {
          radius: isMobile ? 12 : 20,
          blur: isMobile ? 8 : 12,
          minOpacity: 0.4,
        };
      }
      
      // High zoom level (zoomed in)
      return {
        radius: isMobile ? 8 : 12,
        blur: isMobile ? 6 : 10,
        minOpacity: 0.4,
      };
    } catch (error) {
      console.error("Error getting responsive options:", error);
      return DEFAULT_OPTIONS;
    }
  }, [map, isClient]);

  // --------------------------------------------------------------------------------------
  // Heat Layer Initialization & Cleanup
  // --------------------------------------------------------------------------------------
  
  useEffect(() => {
    if (!isMounted || !isClient || !map) return;

    const initializeHeatLayer = async (): Promise<void> => {
      try {
        // Dynamic import to ensure leaflet.heat is available
        await import("leaflet.heat");
        const LeafletLib = (window as { L?: typeof L }).L;

        if (!LeafletLib?.heatLayer) {
          console.error("Leaflet heatLayer not available");
          return;
        }

        // Ensure map container has proper dimensions before proceeding
        const checkMapSize = (): void => {
          if (hasValidMapContainer(map)) {
            const validPoints = filterValidPoints(points);
            const options = getResponsiveOptions();
            
            heatLayerRef.current = LeafletLib.heatLayer(validPoints, options);

            if (map && heatLayerRef.current) {
              map.addLayer(heatLayerRef.current as unknown as L.Layer);
            }
          } else {
            // Retry after container is ready
            setTimeout(checkMapSize, CONTAINER_CHECK_RETRY_DELAY);
          }
        };

        // Small delay to ensure map is fully rendered
        setTimeout(checkMapSize, INIT_DELAY);
      } catch (error) {
        console.error("Error initializing heat layer:", error);
      }
    };

    initializeHeatLayer();

    // Cleanup function
    return () => {
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current as unknown as L.Layer);
          heatLayerRef.current = null;
        } catch (error) {
          console.error("Error removing heat layer:", error);
        }
      }
    };
  }, [map, isMounted, isClient, getResponsiveOptions, points]);

  // --------------------------------------------------------------------------------------
  // Points Update Handler
  // --------------------------------------------------------------------------------------
  
  useEffect(() => {
    if (!isMounted || !isClient || !heatLayerRef.current || !points) return;

    try {
      // Ensure map container has proper dimensions
      if (!hasValidMapContainer(map)) return;

      const validPoints = filterValidPoints(points);

      if (heatLayerRef.current.setLatLngs) {
        // Small delay to ensure canvas is ready
        setTimeout(() => {
          if (heatLayerRef.current?.setLatLngs) {
            heatLayerRef.current.setLatLngs(validPoints);
          }
        }, UPDATE_DELAY);
      }
    } catch (error) {
      console.error("Error updating heat layer points:", error);
    }
  }, [points, isMounted, isClient, map]);

  // --------------------------------------------------------------------------------------
  // Zoom Event Handler
  // --------------------------------------------------------------------------------------
  
  useMapEvents({
    zoomend: () => {
      if (!isMounted || !isClient || !heatLayerRef.current) return;

      try {
        const newOptions = getResponsiveOptions();
        if (heatLayerRef.current.setOptions) {
          heatLayerRef.current.setOptions(newOptions);
        }
      } catch (error) {
        console.error("Error updating heat layer options on zoom:", error);
      }
    },
  });

  // Component renders nothing (purely functional)
  return null;
};

export default Heatmap;