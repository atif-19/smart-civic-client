'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet.heat'; // This imports the leaflet.heat library
import L from 'leaflet';

// Define the type for the points prop
type HeatmapProps = {
  points: [number, number, number][];
};

const Heatmap = ({ points }: HeatmapProps) => {
  const map = useMap(); // Get the map instance from the parent MapContainer

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Create the heat layer with the points
    // The 'any' type is used here because the leaflet.heat types are not perfectly integrated
    const heatLayer = (L as any).heatLayer(points, {
      radius: 40,
      blur: 25,
      maxZoom: 18,
    });

    // Add the layer to the map
    map.addLayer(heatLayer);

    // This is a cleanup function that React runs when the component is removed
    // It ensures that when we update the data, the old layer is removed first.
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]); // Re-run this effect if the map or points change

  return null; // This component does not render any visible HTML itself
};

export default Heatmap;