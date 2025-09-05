'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

// Map resize handler component
function MapResizer() {
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && map) {
      const handleResize = () => {
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      // Initial resize after component mounts
      setTimeout(() => {
        map.invalidateSize();
      }, 500);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, [map]);

  return null;
}

export default function Map({ reports }: MapProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
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

  const handleMapReady = useCallback((map: L.Map) => {
    setMapInstance(map);
    
    // Force map to resize after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Add touch handling for mobile
    if (isMobile) {
      map.on('touchstart', () => {
        map.dragging.disable();
      });
      
      map.on('touchend', () => {
        setTimeout(() => {
          map.dragging.enable();
        }, 100);
      });
    }
  }, [isMobile]);

  // Don't render until client-side
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
  
  const initialZoom = isMobile ? 11 : 13;

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        key={`${isMobile}-${reports.length}`} // Force re-render on mobile/data changes
        center={initialPosition} 
        zoom={initialZoom} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={!isMobile}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
        attributionControl={false}
        preferCanvas={isMobile}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={18}
          minZoom={8}
          tileSize={256}
          zoomOffset={0}
          updateWhenIdle={isMobile}
          keepBuffer={isMobile ? 1 : 2}
          updateWhenZooming={!isMobile}
        />
        
        {heatmapPoints.length > 0 && <Heatmap points={heatmapPoints} />}

        {reports.map((report) => {
          const imageUrl = report.imageUrl.startsWith('http') 
            ? report.imageUrl 
            : `${process.env.NEXT_PUBLIC_API_URL || ''}/${report.imageUrl.replace(/\\/g, '/')}`;
            
          return (
            <Marker key={report._id} position={[report.location.lat, report.location.lng]}>
              <Popup
                maxWidth={isMobile ? 250 : 300}
                minWidth={isMobile ? 200 : 250}
                closeButton={true}
                autoClose={false}
                closeOnClick={false}
                className={isMobile ? 'mobile-popup' : ''}
              >
                <div className="font-sans">
                  <h3 className={`font-bold mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {report.category}
                  </h3>
                  <p className={`mb-2 ${isMobile ? 'text-xs' : 'text-sm'} line-clamp-3`}>
                    {report.description}
                  </p>
                  <img 
                    src={imageUrl} 
                    alt={report.category} 
                    className="w-full h-auto rounded max-h-32 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Custom zoom controls for mobile */}
      {isMobile && mapInstance && (
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          <button
            onClick={() => mapInstance.zoomIn()}
            className="bg-white shadow-lg rounded p-2 text-lg font-bold hover:bg-gray-100"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => mapInstance.zoomOut()}
            className="bg-white shadow-lg rounded p-2 text-lg font-bold hover:bg-gray-100"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
}