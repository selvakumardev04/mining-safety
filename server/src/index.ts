import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from './config/env';
import { initializeDatabase } from './config/db';
import { buildDashboard } from './services/dashboardService';
import { authorize, protect, AuthenticatedRequest } from './middleware/auth';
import { demoUsers } from './data/demoData';

const app = express();
const port = env.port;

const authUsers = demoUsers.map((user) => ({
  ...user,
  passwordHash: bcrypt.hashSync(user.password, 10),
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'INSPECTOR', 'SUPERVISOR', 'WORKER', 'VIEWER']).default('VIEWER'),
});

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MineGuard AI API', mode: 'demo' });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid credentials format.', errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = authUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name, assignedMines: user.assignedMines },
    env.jwtSecret,
    { expiresIn: '8h' },
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedMines: user.assignedMines,
    },
  });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid registration payload.', errors: parsed.error.flatten() });
  }

  const { name, email, password, role } = parsed.data;

  if (authUsers.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'A user with this email already exists.' });
  }

  const user = {
    id: `u-${Date.now()}`,
    name,
    email,
    password,
    role,
    assignedMines: [],
  };

  authUsers.push({ ...user, passwordHash: bcrypt.hashSync(password, 10) });

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, name: user.name }, env.jwtSecret, { expiresIn: '8h' });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedMines: [],
    },
  });
});

app.get('/api/me', protect, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

app.get('/api/dashboard', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard());
});

app.get('/api/mines', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().mines);
});

app.get('/api/workers', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().workers);
});

app.get('/api/equipment', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().equipment);
});

app.get('/api/incidents', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().incidents);
});

app.get('/api/alerts', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().alerts);
});

app.get('/api/compliance', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().compliance);
});

app.get('/api/actions', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().actions);
});

app.get('/api/predictions', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().predictions);
});

app.get('/api/recommendations', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().aiRecommendations);
});

app.get('/api/emergency', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().emergency);
});

app.get('/api/audit-logs', protect, authorize('ADMIN', 'SAFETY_MANAGER'), (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().auditLogs);
});

app.get('/api/notifications', protect, (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().notifications);
});

app.get('/api/vision/cameras', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'SUPERVISOR'), (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().vision.cameras);
});

app.post('/api/vision/cameras', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body ?? {};
  const newCamera = {
    id: payload.id ?? `CAM-${Date.now()}`,
    name: payload.name ?? 'New Camera',
    mine: payload.mine ?? 'mine-korba',
    zone: payload.zone ?? 'Zone A - Main Entry',
    status: payload.status ?? 'DEMO MODE',
    lastActive: payload.lastActive ?? new Date().toISOString(),
    detectionMode: payload.detectionMode ?? 'AI Vision Demo / Simulated Camera',
    cameraFeedLabel: 'SIMULATED CAMERA FEED',
  };
  res.status(201).json({ message: 'Camera added successfully.', camera: newCamera });
});

app.get('/api/vision/detections', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'SUPERVISOR'), (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().vision.detections);
});

app.post('/api/vision/detections', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'SUPERVISOR'), (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body ?? {};
  const newDetection = {
    id: payload.id ?? `VIS-${Date.now()}`,
    camera: payload.camera ?? 'Main Entry Camera',
    mine: payload.mine ?? 'mine-korba',
    zone: payload.zone ?? 'Zone A - Main Entry',
    workerId: payload.workerId ?? 'W-NEW',
    workerName: payload.workerName ?? 'Demo Worker',
    faceMatch: 'Demo Face Detection',
    identificationConfidence: payload.identificationConfidence ?? 91,
    risk: payload.risk ?? 'HIGH',
    status: payload.status ?? 'PPE_VIOLATION',
    detectedAt: payload.detectedAt ?? new Date().toISOString(),
    violationType: payload.violationType ?? 'PPE_VIOLATION',
    violation: payload.violation ?? 'Required PPE missing',
    unknownPerson: Boolean(payload.unknownPerson),
  };
  res.status(201).json({ message: 'Detection recorded.', detection: newDetection });
});

app.get('/api/vision/workers/:id', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'SUPERVISOR'), (req: AuthenticatedRequest, res: Response) => {
  const worker = buildDashboard().workers.find((item) => item.workerId === req.params.id || item.id === req.params.id);
  if (!worker) {
    return res.status(404).json({ message: 'Vision worker not found.' });
  }
  return res.json({
    workerId: worker.workerId,
    name: worker.name,
    faceDetectionStatus: 'Demo Face Detection',
    identificationConfidence: 94,
    mine: worker.mine,
    zone: worker.zone,
    shift: worker.shift,
    safetyStatus: worker.safetyStatus,
    ppeStatus: worker.ppeStatus,
    lastDetectedTime: new Date().toISOString(),
  });
});

app.get('/api/vision/events', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'SUPERVISOR'), (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().vision.events);
});

app.post('/api/vision/events/:id/acknowledge', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'SUPERVISOR'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const event = buildDashboard().vision.events.find((item) => item.id === id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }
  return res.json({ message: 'Event acknowledged.', event: { ...event, status: 'ACKNOWLEDGED' } });
});

app.post('/api/vision/events/:id/incident', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const event = buildDashboard().vision.events.find((item) => item.id === id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  return res.status(201).json({
    message: 'Incident created from vision event.',
    incident: {
      id: `inc-${Date.now()}`,
      title: event.eventType,
      mine: event.mine,
      zone: event.zone,
      type: 'AI Vision',
      severity: event.risk,
      status: 'REPORTED',
      sourceEventId: id,
    },
  });
});

app.get('/api/vision/statistics', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'SUPERVISOR'), (_req: AuthenticatedRequest, res: Response) => {
  res.json(buildDashboard().vision.statistics);
});

app.get('/api/users', protect, authorize('ADMIN'), (_req: AuthenticatedRequest, res: Response) => {
  res.json(authUsers.map(({ id, name, email, role, assignedMines }) => ({ id, name, email, role, assignedMines })));
});

app.put('/api/alerts/:id', protect, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const dashboard = buildDashboard();
  const alerts = dashboard.alerts.map((alert) => {
    if (alert.id === id) {
      return { ...alert, status: status ?? alert.status, assignedUser: req.user?.name ?? alert.assignedUser };
    }
    return alert;
  });

  return res.json({ message: 'Alert updated successfully.', alert: alerts.find((alert) => alert.id === id) });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

async function startServer(): Promise<void> {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`MineGuard AI API is running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Server failed to boot:', error);
  process.exit(1);
});
