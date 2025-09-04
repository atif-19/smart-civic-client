"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet.heat";
import L from "leaflet";

// Type definitions for leaflet.heat
interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  minOpacity?: number;
  gradient?: Record<string, string>;
}

// Extend the Leaflet namespace to include heatLayer
declare module "leaflet" {
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

  useEffect(() => {
    if (!map || points.length === 0) return;

    const heatLayer: L.HeatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 18,
    });

    map.addLayer(heatLayer);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

export default Heatmap;
