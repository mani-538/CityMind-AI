'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapMarkerItem } from './CityMap';

interface LeafletInnerMapProps {
  markers: MapMarkerItem[];
  onSelectMarker?: (marker: MapMarkerItem) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectable?: boolean;
}

// Custom Leaflet Pin Icon generator based on Priority
const createPriorityIcon = (priority: string) => {
  let color = '#38bdf8'; // Medium blue
  if (priority === 'Critical') color = '#ef4444'; // Red
  else if (priority === 'High') color = '#f97316'; // Orange
  else if (priority === 'Low') color = '#10b981'; // Green

  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32 border-2 border-white" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svgMarker,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function LocationPicker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createPriorityIcon('High')}>
      <Popup>
        <div className="text-xs font-mono font-semibold text-slate-900">
          Selected Pin Location<br />
          Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
        </div>
      </Popup>
    </Marker>
  );
}

export default function LeafletInnerMap({
  markers,
  onSelectMarker,
  onLocationSelect,
  selectable = false,
}: LeafletInnerMapProps) {
  // Ashmora Metropolis Default Center
  const defaultCenter: [number, number] = [40.7128, -74.0060];

  return (
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 relative z-0 shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {selectable && <LocationPicker onLocationSelect={onLocationSelect} />}

        {markers.map((item) => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={createPriorityIcon(item.priority)}
            eventHandlers={{
              click: () => onSelectMarker && onSelectMarker(item),
            }}
          >
            <Popup>
              <div className="p-1 max-w-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-400">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.priority === 'Critical'
                        ? 'bg-rose-600 text-white'
                        : item.priority === 'High'
                        ? 'bg-orange-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{item.title}</h4>
                <p className="text-xs text-slate-600 mb-2 line-clamp-2">{item.description}</p>
                <div className="text-[10px] text-slate-500 font-mono">Status: {item.status}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
