import { describe, it, expect } from 'vitest';
import * as turf from '@turf/turf';

describe('Geospatial Core Intelligence', () => {
  it('accurately calculates telemetry distance between valid WGS84 coordinates', () => {
    // Exact center vs physical outer gate
    const centerPoint = turf.point([72.8258, 18.9389]); 
    const attendeePing = turf.point([72.8260, 18.9390]);
    
    const distanceKm = turf.distance(centerPoint, attendeePing, { units: 'kilometers' });
    
    expect(distanceKm).toBeGreaterThan(0);
    expect(distanceKm).toBeLessThan(0.05); // Standard tight interior geofence
  });

  it('aggressively rejects rogue coordinates out of bounds', () => {
    const centerPoint = turf.point([72.8258, 18.9389]); 
    const roguePing = turf.point([73.0, 19.0]); // 30km spoofed distance
    
    const distanceKm = turf.distance(centerPoint, roguePing, { units: 'kilometers' });
    expect(distanceKm).toBeGreaterThan(5); // Breaches authorization immediately
  });
});
