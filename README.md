<div align="center">
  <h1>VeNeck</h1>
  <p><strong>Real-Time Crowd Intelligence & Geofence Management System</strong></p>
</div>

---

## Overview

**VeNeck** is a high-performance, real-time command center application built for large-scale event management. Whether it's an Indian Premier League final at the Narendra Modi Stadium or a localized tech hackathon, VeNeck allows security and event managers to continuously track, geofence, and communicate with active attendees via an advanced WebSockets engine.

Designed with absolute user privacy in mind, VeNeck utilizes **dynamic geofencing algorithms**—automatically severing tracking feeds the moment an attendee steps outside the targeted parameter of the stadium.

## Features

- **Dedicated Node + Socket.IO Server:** A state-of-the-art custom backend bypassing standard serverless limitations for permanent, low-latency WebSocket connections.
- **Dynamic Geofencing:** Leveraging `Turf.js`, event creators specify exact ground boundaries (via preset Indian stadiums or custom latitude/longitude radiuses). Attendees outside the circle are instantly "Out of Bounds" and untracked.
- **Instant SOS Subsystem:** Attendees can trigger a localized SOS sending their exact coordinates to the live command center dashboard.
- **Modular Access Control:** Secured by **Supabase Auth**. Includes an interactive 2-step onboarding dashboard for configuring the event manager's organizational profile and custom branding.
- **Elite Command Center UI:** Designed with Cyberpunk/Command Center aesthetics via Tailwind CSS, `next-themes` (Dark/Light mode native), and shadcn/ui.
- **One-Click Attendee Join:** Event managers instantly generate unique QR Codes and Links for their specific event's parameter block.

## Tech Stack

| Domain | Technology |
|---|---|
| **Frontend Framework** | [Next.js 14+ (App Router)](https://nextjs.org/) |
| **Backend WebSocket Engine** | Node.js, Express, [Socket.IO](https://socket.io/) |
| **Authentication & Storage** | [Supabase](https://supabase.com/) |
| **Geospatial Processing** | [Turf.js](https://turfjs.org/) |
| **Styling & Components** | [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| **Global State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Mapping Engine** | Leaflet.js |

## Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed. You will also need a free [Supabase](https://supabase.com) account.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/veneck.git
cd veneck
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a file named `.env.local` in the root of the project and add your Supabase details:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Database Setup
Run the following inside your Supabase **SQL Editor** to format your tables:
```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  username TEXT UNIQUE,
  org_name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  custom_org_type TEXT,
  description TEXT NOT NULL,
  use_case TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table 
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  venue TEXT,
  lat FLOAT DEFAULT 0,
  lng FLOAT DEFAULT 0,
  radius_km FLOAT DEFAULT 1.0,
  date TEXT,
  status TEXT DEFAULT 'upcoming',
  attendee_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Remember to create a "Public" Storage Bucket named 'logos' in your Supabase dashboard!
```

### 5. Start the Development Server
```bash
# This commands triggers the custom node server.js which integrates Next.js automatically
npm run dev
```

App will be live locally at `http://localhost:3000`.

## Contributing
Contributions, issues and feature requests are always welcome! Feel free to check the issues page if you want to contribute.

---
*Built with passion for superior crowd intelligence.*
