"use client";
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletUI = React.memo(function LeafletUI({ 
  activeUsers, 
  geofenceCenter = [18.9389, 72.8258], 
  geofenceRadiusKm = 0.5,
  userCount = 0
}: { 
  activeUsers: Record<string, any>,
  geofenceCenter?: [number, number],
  geofenceRadiusKm?: number,
  userCount?: number
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const geofenceOverlayRef = useRef<L.Circle | null>(null);
  const centerTextRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainer.current, {
      center: geofenceCenter,
      zoom: 16,
      zoomControl: false // Disable default zoom for a cleaner UI
    });

    // Use CARTO's Dark Matter tile layer for that cyberpunk aesthetic!
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

  // Render Center Label
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    if (centerTextRef.current) {
      map.removeLayer(centerTextRef.current);
    }
    const centerIcon = L.divIcon({
      className: 'custom-center-text',
      html: `<div class="flex items-center justify-center font-black text-4xl text-white/50" style="text-shadow: 0 0 20px rgba(204,190,177,0.7);">${userCount}</div>`,
      iconSize: [60, 60],
      iconAnchor: [30, 30]
    });
    centerTextRef.current = L.marker(geofenceCenter, { icon: centerIcon, interactive: false }).addTo(map);
  }, [geofenceCenter, userCount]);

  // Update Geofence overlays if Center or Radius changes
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    map.setView(geofenceCenter, 15);

    // Render Circle
    if (geofenceOverlayRef.current) {
      map.removeLayer(geofenceOverlayRef.current);
    }
    geofenceOverlayRef.current = L.circle(geofenceCenter, {
      radius: geofenceRadiusKm * 1000, 
      color: '#997E67',
      weight: 1,
      fillColor: '#664930',
      fillOpacity: 0.1,
      dashArray: '5, 10'
    }).addTo(map);

  }, [geofenceCenter, geofenceRadiusKm]);

  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    Object.values(activeUsers).forEach((user: any) => {
      if (!markersRef.current[user.userId]) {
        // Create custom HTML icon mimicking the green glowing dot
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: '<div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-[0_0_10px_#997E67]"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        markersRef.current[user.userId] = L.marker([user.lat, user.lng], { icon: customIcon })
          .addTo(map);
      } else {
        markersRef.current[user.userId].setLatLng([user.lat, user.lng]);
      }
    });

    // Cleanup disconnected users
    const activeIds = Object.keys(activeUsers);
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.includes(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

  }, [activeUsers]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-background" />;
})

export default LeafletUI;
