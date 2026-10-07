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
import { demoMines, demoUsers, demoWorkers, WorkerRecord } from './data/demoData';

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

const createWorkerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(80),
  mine: z.string().min(1),
  department: z.string().trim().min(2).max(80),
  shift: z.enum(['A', 'B', 'C']),
});

function getRoboflowInferenceUrl(): URL | null {
  if (!env.roboflowInferenceUrl || !env.roboflowApiKey) return null;
  try {
    const url = new URL(env.roboflowInferenceUrl);
    if (url.protocol !== 'https:' || !['serverless.roboflow.com', 'detect.roboflow.com'].includes(url.hostname) || url.username || url.password || url.search || url.hash) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS policy.'));
    },
    credentials: true,
  }),
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  '/api/vision/analyze',
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp'],
    limit: '5mb',
  }),
);
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

app.post('/api/workers', protect, authorize('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const parsed = createWorkerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid employee details.', errors: parsed.error.flatten() });
  }

  const assignedMine = demoMines.find((mine) => mine.id === parsed.data.mine);
  if (!assignedMine) {
    return res.status(400).json({ message: 'Select a valid mine for this employee.' });
  }

  const nextWorkerNumber = demoWorkers.reduce((highest, worker) => {
    const match = /^W-(\d+)$/.exec(worker.workerId);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0) + 1;
  const worker: WorkerRecord = {
    id: `w-${nextWorkerNumber}`,
    workerId: `W-${nextWorkerNumber}`,
    name: parsed.data.name,
    role: parsed.data.role,
    mine: assignedMine.id,
    department: parsed.data.department,
    shift: parsed.data.shift,
    trainingStatus: 'Pending',
    ppeStatus: 'Not assessed',
    zone: 'Unassigned',
    safetyStatus: 'WARNING',
  };

  demoWorkers.push(worker);
  assignedMine.workerCount += 1;
  return res.status(201).json({ message: 'Employee added successfully.', worker });
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

const visionAnalyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Scan limit reached. Wait one minute before trying again.' },
});

app.get('/api/vision/model-status', protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'INSPECTOR', 'SUPERVISOR'), (_req: AuthenticatedRequest, res: Response) => {
  const configured = Boolean(getRoboflowInferenceUrl());
  res.json({
    provider: 'Roboflow',
    configured,
    mode: configured ? 'LIVE_MODEL_CONFIGURED' : 'MODEL_NOT_CONFIGURED',
    message: configured
      ? 'Roboflow inference is configured. Image contents are sent to the configured provider for analysis.'
      : 'A valid HTTPS Roboflow hosted-model endpoint and server API key must be configured.',
  });
});

app.post('/api/vision/analyze', visionAnalyzeLimiter, protect, authorize('ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'INSPECTOR', 'SUPERVISOR'), async (req: AuthenticatedRequest, res: Response) => {
  const image = req.body;
  const contentType = req.headers['content-type']?.toLowerCase();

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType ?? '')) {
    return res.status(415).json({ message: 'Only JPEG, PNG, and WebP images are supported.' });
  }
  if (!Buffer.isBuffer(image) || image.length === 0) {
    return res.status(400).json({ message: 'Provide one JPEG, PNG, or WebP image to analyze.' });
  }
  const imageSignatureIsValid = contentType === 'image/jpeg'
    ? image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff
    : contentType === 'image/png'
      ? image.length >= 8 && image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : image.length >= 12 && image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP';
  if (!imageSignatureIsValid) {
    return res.status(400).json({ message: 'The selected file content does not match its declared image type.' });
  }
  const inferenceUrl = getRoboflowInferenceUrl();
  if (!inferenceUrl) {
    return res.status(503).json({ message: 'Live PPE scan is unavailable: configure ROBOFLOW_INFERENCE_URL and ROBOFLOW_API_KEY on the server, then restart it.' });
  }

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(image)], { type: contentType }), 'ppe-image');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const providerResponse = await fetch(inferenceUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.roboflowApiKey}` },
      body: form,
      signal: controller.signal,
    });
    if (!providerResponse.ok) {
      console.error(`Roboflow inference returned HTTP ${providerResponse.status}.`);
      return res.status(502).json({ message: providerResponse.status === 401 || providerResponse.status === 403
        ? 'Roboflow rejected the configured credentials or model access. Check server configuration.'
        : 'Roboflow inference failed. Check the model endpoint and provider status.' });
    }

    const providerResult: unknown = await providerResponse.json();
    if (!providerResult || typeof providerResult !== 'object' || !Array.isArray((providerResult as { predictions?: unknown }).predictions)) {
      console.error('Roboflow inference returned an unexpected response shape.');
      return res.status(502).json({ message: 'Roboflow returned an unsupported response. Check that the endpoint serves an object-detection PPE model.' });
    }

    const predictions = (providerResult as { predictions: unknown[] }).predictions.flatMap((prediction) => {
      if (!prediction || typeof prediction !== 'object') return [];
      const item = prediction as { class?: unknown; confidence?: unknown; x?: unknown; y?: unknown; width?: unknown; height?: unknown };
      if (typeof item.class !== 'string' || typeof item.confidence !== 'number' || !Number.isFinite(item.confidence)) return [];
      const confidence = item.confidence > 1 && item.confidence <= 100 ? item.confidence / 100 : item.confidence;
      if (confidence < 0 || confidence > 1) return [];
      return [{
        label: item.class.slice(0, 80),
        confidence: Math.round(confidence * 1000) / 10,
        box: {
          x: typeof item.x === 'number' ? item.x : null,
          y: typeof item.y === 'number' ? item.y : null,
          width: typeof item.width === 'number' ? item.width : null,
          height: typeof item.height === 'number' ? item.height : null,
        },
      }];
    });

    const equipmentLabels: Record<string, string[]> = {
      helmet: ['helmet', 'hardhat', 'hard_hat', 'safety_helmet'],
      vest: ['vest', 'safety_vest', 'high_visibility_vest', 'hi_vis_vest'],
      respirator: ['respirator', 'mask', 'face_mask'],
      glasses: ['glasses', 'safety_glasses', 'goggles'],
      gloves: ['gloves', 'safety_gloves'],
      boots: ['boots', 'safety_boots'],
    };
    const equipment = Object.entries(equipmentLabels).map(([name, labels]) => {
      const match = predictions
        .filter((prediction) => labels.includes(prediction.label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')))
        .sort((left, right) => right.confidence - left.confidence)[0];
      return { name, status: match ? 'DETECTED' : 'NO_DETECTION', confidence: match?.confidence ?? null };
    });

    return res.json({
      provider: 'Roboflow',
      mode: 'LIVE_MODEL',
      disclaimer: 'Object detections are model predictions, not proof of PPE compliance. Undetected PPE may be occluded or outside the frame; have a supervisor verify before work.',
      detections: predictions,
      equipment,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({ message: 'Roboflow inference timed out. Try a smaller or clearer image.' });
    }
    console.error('Roboflow inference request failed.', error instanceof Error ? error.message : 'Unknown network error');
    return res.status(502).json({ message: 'Could not reach the configured Roboflow inference endpoint.' });
  } finally {
    clearTimeout(timeout);
  }
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

app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.statusCode ?? err.status ?? 500;
  res.status(status >= 400 && status < 600 ? status : 500).json({
    message: status === 413 ? 'Image request exceeds the 5 MB limit.' : status === 415 ? 'Only JPEG, PNG, and WebP images are supported.' : 'Internal server error.',
  });
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
