'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

// Type definitions for leaflet.heat
interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
}

declare module 'leaflet' {
  interface HeatLayer extends Layer {
    setLatLngs(latlngs: L.LatLngExpression[]): this;
  }
  // FIX: Replaced 'any' with the specific 'HeatLayerOptions' type
  function heatLayer(
    latlngs: L.LatLngExpression[],
    options?: HeatLayerOptions
  ): HeatLayer;
}

interface Report {
  _id: string;
  category: string;
  description: string;
  imageUrl: string;
  location: { lat: number; lng: number; };
  upvoteCount: number;
}

interface MapProps {
  reports: Report[];
}

const customMarkerIcon = L.divIcon({
  html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3B82F6"/></svg>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const DashboardMap = ({ reports }: MapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([23.0225, 72.5714], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      mapInstanceRef.current = map;

      heatLayerRef.current = L.heatLayer([], {
        radius: 25,
        blur: 15,
        maxZoom: 18,
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (heatLayerRef.current) {
      const points = reports.map(r => [r.location.lat, r.location.lng, r.upvoteCount || 1] as [number, number, number]);
      heatLayerRef.current.setLatLngs(points);
    }
    
    if (markerLayerRef.current) {
      markerLayerRef.current.clearLayers();
      
      reports.forEach(report => {
        const marker = L.marker([report.location.lat, report.location.lng], { icon: customMarkerIcon });
        
        const popupContent = `
          <div style="font-family: sans-serif; max-width: 200px;">
            <h3 style="font-size: 1rem; font-weight: bold; margin: 0 0 4px;">${report.category}</h3>
            <p style="font-size: 0.875rem; margin: 0 0 8px;">${report.description}</p>
            <img src="${report.imageUrl}" alt="${report.category}" style="width: 100%; height: auto; border-radius: 4px;" />
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markerLayerRef.current?.addLayer(marker);
      });
    }
  }, [reports]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default DashboardMap;