# MineGuard AI

MineGuard AI is an AI-powered mining safety, risk, and compliance platform built as a full-stack application with a React + TypeScript frontend and an Express + TypeScript backend. The platform emphasizes prevention, operational intelligence, and emergency readiness for modern mining organizations.

## Features

- Executive dashboard with KPI cards and risk metrics
- Role-based authentication and authorization for admin, safety, mine, inspector, supervisor, worker, and viewer roles
- AI safety prediction with a transparent demo model
- Mine, worker, equipment, incident, alert, and compliance management
- Predictive maintenance and risk monitoring
- Locally bundled synthetic mine-map illustration with selectable demo mine risk details
- Emergency center and response workflow simulation
- Corrective actions and safety recommendations
- Analytics dashboards and executive reports
- Audit logs and notification center
- Demo seed data for realistic mining scenarios

## Tech Stack

Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Sonner

Backend
- Node.js
- Express.js
- TypeScript
- JWT
- bcryptjs
- Zod
- Mongoose-compatible schemas and demo fallback mode

## Project Structure

```text
.
├── client/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── .env.example
├── README.md
└── npm install commands run in each project separately
```

## Installation

1. From the root folder, install frontend dependencies:

```bash
cd client
npm install
```

2. Install backend dependencies:

```bash
cd ../server
npm install
```

## Environment Variables

Copy the root template and fill in the values you want to use:

```bash
cp .env.example .env
```

Example values:

```env
MONGODB_URI=
JWT_SECRET=change-this-secret
PORT=5001
CLIENT_URL=http://localhost:5173
```

If MongoDB is not configured, the backend runs in demo mode and uses seeded in-memory data so the platform still works locally.

## Start the App

Start the backend API:

```bash
cd server
npm run dev
```

Start the frontend app:

```bash
cd client
npm run dev -- --host 0.0.0.0
```

Open the frontend at:

```text
http://localhost:5173
```

## Demo Accounts

- Admin: admin@mineguard.ai / admin123
- Safety Manager: safety@mineguard.ai / safety123
- Mine Manager: mine@mineguard.ai / mine123
- Inspector: inspector@mineguard.ai / inspect123
- Supervisor: supervisor@mineguard.ai / super123
- Worker: worker@mineguard.ai / worker123
- Viewer: viewer@mineguard.ai / viewer123

## AI Prediction Approach

This project uses a transparent demo AI risk engine rather than a false claim of a trained machine-learning model. The engine combines operational signals such as:

- incident frequency
- equipment health
- compliance status
- open violations
- worker risk posture
- environmental readings
- maintenance backlog

The backend calculates a risk score and prediction window using these factors to generate a realistic risk forecast and recommendations without requiring an external AI API.

## Demo Map Privacy and Safe Deployment

The dashboard uses an original, locally bundled SVG illustration at `client/public/maps/mineguard-demo-map.svg`. It is synthetic demo artwork, not a map of any real mine, and requires no third-party map, tile, or image request. Selecting a mine updates its demo risk details; the illustration itself remains generic and is clearly marked “DEMO MAP • NOT TO SCALE.” It must not be used for navigation, surveying, or operational safety decisions.

For a production deployment, replace the illustration with surveyed operational GIS data in an access-controlled map layer. Prefer self-hosted tiles or a contracted map provider with appropriate privacy terms. Restrict map access by role, keep provider credentials server-side, and never send worker identities, camera positions, incident details, or exact restricted-zone geometry to a third-party map service. Retain required map-data attribution.

## Demo Interaction Scope

The prototype supports in-session mine and incident creation, incident workflow transitions, alert acknowledgements/status progression, corrective-action progression, simulated camera creation/disable, vision-event acknowledgement and incident conversion, and CSV export of incidents and alerts. These changes exist only in the active browser session and are not persisted to the API or database; reloading the dashboard restores the seeded demo data. The AI Vision feed and PPE results are simulated, and must not be used to make real safety, employment, or emergency-response decisions.

## Future Improvements

- Real MongoDB persistence and indexing
- Real OCR/document parsing integration
- Advanced model training with actual historical mine data
- Email/SMS notification service integration
- Role-aware UI navigation with per-page access control
- Better PDF and CSV reporting exports

## Note

The current implementation is intentionally a polished demo platform focused on reliability, realistic risk logic, and enterprise-style UX while remaining easy to run locally without external paid services.
