'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Heatmap from './Heatmap';

// Fix for default marker icon bug
interface IconDefault extends L.Icon.Default {
  _getIconUrl?: () => string;
}
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Interface definitions
interface Report {
  _id: string;
  category: string;
  description: string;
  location: { lat: number; lng: number };
  imageUrl: string;
  status?: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved';
  createdAt?: string;
}

interface MapProps {
  reports: Report[];
}

export default function Map({ reports }: MapProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true);
    
    const checkIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    checkIsMobile();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkIsMobile);
      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, []);

  // Don't render the map until we're on the client
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-300">
        <div className="text-gray-600">Loading Map...</div>
      </div>
    );
  }

  const initialPosition: [number, number] = reports.length > 0 
    ? [reports[0].location.lat, reports[0].location.lng] 
    : [23.0225, 72.5714];

  const heatmapPoints: [number, number, number][] = reports.map(report => [
    report.location.lat,
    report.location.lng,
    1,
  ]);
  
  const initialZoom = isMobile ? 12 : 13;

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={initialPosition} 
        zoom={initialZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={!isMobile}
        scrollWheelZoom={!isMobile}
        doubleClickZoom={true}
        touchZoom={isMobile}
        dragging={true}
        attributionControl={!isMobile}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution={isMobile ? '' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          maxZoom={18}
          tileSize={256}
        />
        
        {heatmapPoints.length > 0 && <Heatmap points={heatmapPoints} />}

        {reports.map((report) => {
          // Construct image URL properly
          const imageUrl = report.imageUrl.startsWith('http') 
            ? report.imageUrl 
            : `${process.env.NEXT_PUBLIC_API_URL || ''}/${report.imageUrl.replace(/\\/g, '/')}`;
            
          return (
            <Marker key={report._id} position={[report.location.lat, report.location.lng]}>
              <Popup
                maxWidth={isMobile ? 200 : 300}
                minWidth={isMobile ? 150 : 200}
                closeButton={true}
                autoClose={true}
              >
                <div className="font-sans">
                  <h3 className={`font-bold mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {report.category}
                  </h3>
                  <p className={`mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {report.description}
                  </p>
                  <img 
                    src={imageUrl} 
                    alt={report.category} 
                    className="w-full h-auto rounded max-h-32 object-cover"
                    onError={(e) => {
                      // Hide broken images
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}