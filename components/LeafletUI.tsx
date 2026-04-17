"use client";
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LeafletUI({ activeUsers }: { activeUsers: Record<string, any> }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainer.current, {
      center: [18.9389, 72.8258], // Wankhede stadium, Mumbai
      zoom: 16,
      zoomControl: false // Disable default zoom for a cleaner UI
    });

    // Use CARTO's Dark Matter tile layer for that cyberpunk aesthetic! No API keys required.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    Object.values(activeUsers).forEach((user: any) => {
      if (!markersRef.current[user.userId]) {
        // Create custom HTML icon mimicking the green glowing dot from the previous Mapbox implementation
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: '<div class="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_10px_#10b981]"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        markersRef.current[user.userId] = L.marker([user.lat, user.lng], { icon: customIcon })
          .addTo(map);
      } else {
        markersRef.current[user.userId].setLatLng([user.lat, user.lng]);
      }
    });

    // Optionally cleanup disconnected users here by checking the current activeUsers against markersRef
    const activeIds = Object.keys(activeUsers);
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.includes(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

  }, [activeUsers]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-slate-950" />;
}
