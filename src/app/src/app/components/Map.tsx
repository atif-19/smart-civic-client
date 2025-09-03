'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Heatmap from './Heatmap';

interface IconDefault extends L.Icon.Default {
  _getIconUrl?: () => string;
}
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Report {
  _id: string;
  category: string;
  description: string;
  location: { lat: number; lng: number };
  imageUrl: string;
}

interface MapProps {
  reports: Report[];
}

export default function Map({ reports }: MapProps) {
  const initialPosition: [number, number] = reports.length > 0 
    ? [reports[0].location.lat, reports[0].location.lng] 
    : [23.0225, 72.5714];

  const heatmapPoints: [number, number, number][] = reports.map(report => [
    report.location.lat,
    report.location.lng,
    1,
  ]);

  return (
    <MapContainer center={initialPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {heatmapPoints.length > 0 && <Heatmap points={heatmapPoints} />}

      {reports.map((report) => (
        <Marker key={report._id} position={[report.location.lat, report.location.lng]}>
          <Popup>
            <div className="font-sans">
              <h3 className="font-bold text-base mb-1">{report.category}</h3>
              <p className="text-sm mb-2">{report.description}</p>
              <img 
                src={`${process.env.NEXT_PUBLIC_API_URL}/${report.imageUrl.replace(/\\/g, '/')}`} 
                alt={report.category} 
                className="w-full h-auto rounded"
              />
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}