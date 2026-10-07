# MineGuard AI

MineGuard AI is an AI-powered mining safety, risk, and compliance platform built as a full-stack application with a React + TypeScript frontend and an Express + TypeScript backend. The platform emphasizes prevention, operational intelligence, and emergency readiness for modern mining organizations.

## Features

- Executive dashboard with KPI cards and risk metrics
- Role-based authentication and authorization for admin, safety, mine, inspector, supervisor, worker, and viewer roles
- AI safety prediction with a transparent demo model
- Simulated camera person selection with per-detection PPE status and safety guidance, plus an optional authenticated Roboflow hosted PPE inference integration
- Mine, worker, equipment, incident, alert, and compliance management
- Predictive maintenance and risk monitoring
- Locally bundled, original synthetic map illustrations for each seeded mine, with selectable demo mine risk details
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

### Open MineGuard on a phone on the same Wi-Fi

Keep the API and Vite development server running on the computer. Vite is configured to listen on the local network and proxy `/api` requests to the backend, so the phone must use the computer's Wi-Fi/LAN IPv4 address rather than `localhost`.

On Windows, run `ipconfig` and find the active Wi-Fi adapter's IPv4 Address, then open `http://<computer-ip>:5173` on the phone (for example, `http://192.168.1.25:5173`). If Windows Firewall prompts, allow Node.js on the private network. Both devices must be on the same network. For a separately hosted production frontend/API, set `VITE_API_BASE_URL` to the API base URL when building the client and configure the server's `CLIENT_URL` to the frontend origin.

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

The dashboard uses original, locally bundled SVG illustrations under `client/public/maps/`, with a distinct synthetic site layout for each seeded mine. These are demo artworks, not maps or photos of real mines, and require no third-party map, tile, or image request. Selecting a mine updates its illustration and demo risk details. They are marked “DEMO MAP • NOT TO SCALE” and must not be used for navigation, surveying, or operational safety decisions.

For a production deployment, replace the illustration with surveyed operational GIS data in an access-controlled map layer. Prefer self-hosted tiles or a contracted map provider with appropriate privacy terms. Restrict map access by role, keep provider credentials server-side, and never send worker identities, camera positions, incident details, or exact restricted-zone geometry to a third-party map service. Retain required map-data attribution.

## Demo Interaction Scope

The prototype supports in-session mine and incident creation, incident workflow transitions, alert acknowledgements/status progression, corrective-action progression, simulated camera creation/disable, vision-event acknowledgement and incident conversion, and CSV export of incidents and alerts. Administrators can add employee profiles from the Workers page; this demo roster is held in server memory and resets when the API server restarts. Employee additions require an administrator JWT and begin with training, PPE, and safety status awaiting assessment. Other demo changes exist only in the active browser session and are not persisted to the API or database; reloading the dashboard restores the seeded demo data. Camera identities and safety guidance remain simulated demo data. The Main Entry camera uses an original locally bundled illustration of a mine access checkpoint; it is not a live feed or a photograph of a real mine. The optional Roboflow PPE scan sends an explicitly selected PNG/JPEG/WebP image (maximum 5 MB) from the authenticated server to the configured Roboflow hosted inference endpoint only after the user consents. Set `ROBOFLOW_INFERENCE_URL` to the HTTPS hosted model endpoint and `ROBOFLOW_API_KEY` in `server/.env`; never put the key in frontend code or commit it. The endpoint must be a Roboflow hosted inference URL and return object-detection predictions with PPE classes. Train/select a model whose labels include supported classes such as `helmet`, `safety_vest`, `respirator`, `safety_glasses`, `gloves`, and `boots`; unknown labels are still shown as raw model predictions. The API key stays server-side, inference requests are rate-limited, and this app does not retain the image. Roboflow receives the image for inference; check provider retention and privacy terms before use. An absent PPE detection is not proof that PPE is missing or unsafe; detections need supervisor verification. Without model configuration, live image analysis is disabled and there is no fake image-derived result.

The optional webcam preview requires browser camera permission and a secure context (HTTPS or localhost); video and captured frames stay in browser memory and are not uploaded or saved. Its demo scan output is not derived from the webcam frame, and camera tracks stop when the preview is stopped or the user leaves AI Vision. Do not use this prototype for real safety, employment, or emergency-response decisions. Camera guidance is a prototype aid only; approved mine procedures, emergency plans, and supervisor directions take precedence.

## Future Improvements

- Real MongoDB persistence and indexing
- Real OCR/document parsing integration
- Advanced model training with actual historical mine data
- Email/SMS notification service integration
- Role-aware UI navigation with per-page access control
- Better PDF and CSV reporting exports

## Note

The current implementation is intentionally a polished demo platform focused on reliability, realistic risk logic, and enterprise-style UX while remaining easy to run locally without external paid services.
