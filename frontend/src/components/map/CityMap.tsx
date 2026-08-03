'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, AlertTriangle, Layers, Filter } from 'lucide-react';

export interface MapMarkerItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface CityMapProps {
  markers: MapMarkerItem[];
  onSelectMarker?: (marker: MapMarkerItem) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectable?: boolean;
}

// Dynamically import Leaflet with SSR disabled
const LeafletContainer = dynamic(
  () => import('./LeafletInnerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-slate-900 animate-pulse rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2 border border-slate-800">
        <MapPin className="w-8 h-8 animate-bounce text-cyan-500" />
        <span className="text-xs font-mono">Initializing Ashmora GIS Map Engine...</span>
      </div>
    ),
  }
);

export const CityMap: React.FC<CityMapProps> = (props) => {
  return <LeafletContainer {...props} />;
};
