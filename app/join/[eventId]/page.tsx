"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';

export default function JoinEvent() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  
  const [name, setName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Generate a unique user ID
    const userId = `usr_${Math.random().toString(36).substr(2, 9)}`;
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await supabase.from('participants').insert([
          { id: userId, event_id: eventId, name, seat_number: seatNumber }
        ]);
      } catch (err) {
        console.error('Supabase insert failed, proceeding locally:', err);
      }
    }
    
    // Redirect to tracking page
    router.push(`/track/${eventId}?user=${userId}`);
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-center text-white mb-8">VenueSync <span className="text-green-500">FastPass</span></h1>

        <Card className="bg-slate-950 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle>Enter Stadium</CardTitle>
            <CardDescription className="text-slate-400">Please provide your ticket details to proceed to the live tracking portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seatNumber">Seat Number (e.g., A-12)</Label>
                <Input 
                  id="seatNumber" 
                  value={seatNumber} 
                  onChange={(e) => setSeatNumber(e.target.value)} 
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" disabled={loading}>
                {loading ? 'Processing...' : 'Enter Event'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
