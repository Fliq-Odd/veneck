"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { ScanFace, Fingerprint, ChevronRight } from 'lucide-react';

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
    
    if (supabase) {
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
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden font-sans p-4">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/40 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700 ease-out">
         
         <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] mb-2 relative">
               <div className="absolute inset-0 rounded-2xl bg-emerald-400/5 blur-md"></div>
               <ScanFace className="w-10 h-10 text-emerald-400 relative z-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground dark:text-white">VeNeck <span className="text-emerald-500">Pass</span></h1>
            <p className="text-muted-foreground font-medium text-sm">Outer Perimeter Security Check</p>
         </div>

        <Card className="backdrop-blur-2xl bg-card/60 border border-border/50 text-foreground shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
          
          <CardHeader className="pt-8 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
               <Fingerprint className="w-5 h-5 text-emerald-500" />
               Entity Authorization
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">Provide credentials to initialize your secure tracking socket.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Verified Alias</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="John Doe"
                  className="bg-background/50 border-border text-foreground dark:text-white placeholder:text-slate-700 h-12 px-4 focus:border-emerald-500/50 transition-colors"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="seatNumber" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Assigned Sector/Seat</Label>
                <Input 
                  id="seatNumber" 
                  value={seatNumber} 
                  onChange={(e) => setSeatNumber(e.target.value)} 
                  placeholder="e.g., Gate A - Seat 42"
                  className="bg-background/50 border-border text-foreground dark:text-white placeholder:text-slate-700 h-12 px-4 focus:border-emerald-500/50 transition-colors"
                  required
                />
              </div>
              
              <div className="pt-4">
                 <Button 
                   type="submit" 
                   className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 group" 
                   disabled={loading}
                 >
                   {loading ? (
                      <span className="flex items-center gap-2">
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         Authenticating...
                      </span>
                   ) : (
                      <>
                         Enter Perimeter
                         <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                   )}
                 </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/80 font-mono">
           Connection secured via SSL/TLS
        </p>

      </div>
    </div>
  );
}
