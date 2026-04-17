import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────
export interface OrgProfile {
  id?: string;
  user_id: string;
  username: string;
  org_name: string;
  org_type: string;
  custom_org_type?: string;
  description: string;
  use_case: string;
  logo_url?: string;
  created_at?: string;
}

export interface VenueEvent {
  id: string;
  name: string;
  venue: string;
  lat: number;
  lng: number;
  radius_km: number;
  date: string;
  status: 'live' | 'ended' | 'upcoming';
  attendee_count: number;
  created_at: string;
  owner_id: string;
}

export interface SOSAlert {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  timestamp: string;
  eventId: string;
}

export interface ActiveUser {
  userId: string;
  lat: number;
  lng: number;
  name?: string;
  seat?: string;
}

// ─── Store ───────────────────────────────────────────────
interface VeNeckState {
  // Auth
  user: any | null;
  setUser: (user: any | null) => void;

  // Profile
  profile: OrgProfile | null;
  setProfile: (profile: OrgProfile | null) => void;

  // Events
  events: VenueEvent[];
  setEvents: (events: VenueEvent[]) => void;
  addEvent: (event: VenueEvent) => void;

  // Live tracking
  activeUsers: Record<string, ActiveUser>;
  setActiveUsers: (users: Record<string, ActiveUser>) => void;
  updateUserLocation: (userId: string, data: ActiveUser) => void;
  removeUser: (userId: string) => void;

  // SOS Alerts
  alerts: SOSAlert[];
  addAlert: (alert: SOSAlert) => void;
  clearAlerts: () => void;
}

export const useVeNeckStore = create<VeNeckState>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Profile
  profile: null,
  setProfile: (profile) => set({ profile }),

  // Events
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),

  // Live tracking
  activeUsers: {},
  setActiveUsers: (users) => set({ activeUsers: users }),
  updateUserLocation: (userId, data) =>
    set((state) => ({
      activeUsers: { ...state.activeUsers, [userId]: data }
    })),
  removeUser: (userId) =>
    set((state) => {
      const next = { ...state.activeUsers };
      delete next[userId];
      return { activeUsers: next };
    }),

  // SOS Alerts
  alerts: [],
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  clearAlerts: () => set({ alerts: [] }),
}));
