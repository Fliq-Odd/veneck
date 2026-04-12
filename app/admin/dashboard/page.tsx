"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [eventName, setEventName] = useState('Hackathon Demo Event');
  const [eventId, setEventId] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<Record<string, { lat: number, lng: number, userId: string }>>({});
  
  // Create Event Handler
  const handleCreateEvent = async () => {
    const newEventId = `evt_${Math.random().toString(36).substr(2, 9)}`;
    
    // Attempt saving to Supabase if valid URL provided
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await supabase.from('events').insert([{ id: newEventId, name: eventName }]);
      } catch (e) {
        console.warn("Supabase not fully configured yet, continuing locally.");
      }
    }
    
    setEventId(newEventId);
    
    // Connect Socket
    const newSocket = io();
    newSocket.emit('join-event', newEventId);
    newSocket.on('location-updated', (data) => {
      setActiveUsers((prev) => ({
        ...prev,
        [data.userId]: { lat: data.lat, lng: data.lng, userId: data.userId }
      }));
    });
    setSocket(newSocket);
  };

  useEffect(() => {
    if (!eventId || typeof window === 'undefined') return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJja3o2bnYxeTMxbmpyMm9ueDA0cjN3ZnRmIn0.-bF8mGxzF9R-r1B_BqB0yw'; 
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [72.8258, 18.9389], // default to Wankhede stadium, Mumbai
      zoom: 16
    });

    let markers: Record<string, mapboxgl.Marker> = {};

    const updateMarkers = () => {
      Object.values(activeUsers).forEach(user => {
        if (!markers[user.userId]) {
          const el = document.createElement('div');
          el.className = 'w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-[0_0_10px_#22c55e]';
          markers[user.userId] = new mapboxgl.Marker(el)
            .setLngLat([user.lng, user.lat])
            .addTo(map);
        } else {
          markers[user.userId].setLngLat([user.lng, user.lat]);
        }
      });
    };

    updateMarkers();

    return () => {
      map.remove();
    };
  }, [eventId, activeUsers]);

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${eventId}` : '';

  return (
    <div className="min-h-screen bg-black text-slate-50 p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar Controls */}
        <div className="col-span-1 space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">VenueSync <span className="text-green-500">Admin</span></h1>
          
          <Card className="bg-slate-950 border-slate-800 text-slate-100">
            <CardHeader>
              <CardTitle>Event Management</CardTitle>
              <CardDescription className="text-slate-400">Initialize a live tracking event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!eventId ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input 
                      id="eventName" 
                      value={eventName} 
                      onChange={(e) => setEventName(e.target.value)} 
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <Button onClick={handleCreateEvent} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">Go Live</Button>
                </>
              ) : (
                <div className="space-y-4 flex flex-col items-center pt-2">
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG value={joinUrl} size={180} />
                  </div>
                  <div className="text-center w-full">
                    <p className="text-sm text-slate-400 mb-1">Scan to Join</p>
                    <Badge variant="outline" className="border-green-500 text-green-400 w-full justify-center text-xs break-all py-1">
                      {joinUrl}
                    </Badge>
                  </div>
                  <div className="w-full flex justify-between items-center bg-slate-900 p-3 rounded-md border border-slate-800">
                    <span className="text-sm font-medium">Active Connected</span>
                    <Badge className="bg-green-500 text-black font-semibold text-lg">{Object.keys(activeUsers).length}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mapbox Live Feed */}
        <div className="col-span-2 relative min-h-[600px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center">
          {!eventId ? (
            <div className="text-slate-500 flex flex-col items-center">
              <div className="w-16 h-16 mb-4 rounded-full border-4 border-slate-800 border-t-slate-500 animate-spin"></div>
              <p>Create an event to initialize the command center map...</p>
            </div>
          ) : (
            <div id="map" className="absolute inset-0 w-full h-full"></div>
          )}
        </div>
        
      </div>
    </div>
  );
}
