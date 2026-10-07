import { type FormEvent, useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  Factory,
  FileText,
  Gauge,
  LogOut,
  ShieldCheck,
  ShieldOff,
  Siren,
  Users,
  Wrench,
} from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedMines: string[];
}

interface DashboardData {
  summary: Record<string, number | string>;
  riskDistribution: Record<string, number>;
  kpis: Array<{ label: string; value: string | number; trend: string; description: string; icon: string }>;
  aiPrediction: any;
  aiRecommendations: any[];
  mines: any[];
  workers: any[];
  equipment: any[];
  incidents: any[];
  alerts: any[];
  compliance: any[];
  actions: any[];
  notifications: any[];
  auditLogs: any[];
  emergency: any[];
  predictions: any[];
  vision: {
    cameras: any[];
    detections: any[];
    events: any[];
    statistics: any;
  };
  riskTrend: any[];
  incidentTrend: any[];
  complianceTrend: any[];
  safetyBreakdown: Array<{ name: string; value: number }>;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'vision', label: 'AI Vision', icon: ShieldCheck },
  { id: 'mines', label: 'Mines', icon: Building2 },
  { id: 'workers', label: 'Workers', icon: Users },
  { id: 'equipment', label: 'Equipment', icon: Wrench },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'actions', label: 'Corrective Actions', icon: ClipboardList },
  { id: 'emergency', label: 'Emergency Center', icon: Siren },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { id: 'analytics', label: 'Analytics', icon: FileText },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
  { id: 'management', label: 'Users', icon: ShieldOff },
];

const dateFmt = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const riskTone = (level: string) => {
  switch (level) {
    case 'CRITICAL':
      return 'bg-red-500/15 text-red-300 border-red-400/30';
    case 'HIGH':
      return 'bg-orange-500/15 text-orange-300 border-orange-400/30';
    case 'MEDIUM':
      return 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30';
    default:
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
  }
};

async function authFetch<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  return response.json() as Promise<T>;
}

function downloadSafetyReport(dashboard: DashboardData): void {
  const rows = [
    ['MineGuard AI demo safety report', new Date().toLocaleString()],
    [],
    ['Incidents'],
    ['ID', 'Title', 'Mine', 'Zone', 'Severity', 'Status', 'Description'],
    ...dashboard.incidents.map((incident) => [
      incident.incidentId,
      incident.title,
      incident.mine,
      incident.zone,
      incident.severity,
      incident.status,
      incident.description,
    ]),
    [],
    ['Alerts'],
    ['ID', 'Type', 'Mine', 'Severity', 'Status', 'Description'],
    ...dashboard.alerts.map((alert) => [
      alert.alertId,
      alert.type,
      alert.mine,
      alert.severity,
      alert.status,
      alert.description,
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `mineguard-demo-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mineguard-token'));
  const [session, setSession] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem('mineguard-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('mineguard-token')));
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedDetectionId, setSelectedDetectionId] = useState('');
  const [selectedMapSite, setSelectedMapSite] = useState('Korba North');
  const [createDialog, setCreateDialog] = useState<'mine' | 'incident' | 'camera' | null>(null);

  const [loginForm, setLoginForm] = useState({ email: 'admin@mineguard.ai', password: 'admin123' });
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void authFetch<DashboardData>('/dashboard', token)
      .then((data) => {
        if (active) {
          setDashboard(data);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : 'Dashboard load failed');
        localStorage.removeItem('mineguard-token');
        localStorage.removeItem('mineguard-user');
        setToken(null);
        setSession(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await authFetch<{ token: string; user: UserSession }>('/auth/login', undefined, {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });
      localStorage.setItem('mineguard-token', response.token);
      localStorage.setItem('mineguard-user', JSON.stringify(response.user));
      setLoading(true);
      setToken(response.token);
      setSession(response.user);
      toast.success('Logged in successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mineguard-token');
    localStorage.removeItem('mineguard-user');
    setToken(null);
    setSession(null);
    setDashboard(null);
    setLoading(false);
    toast.success('Logged out');
  };

  const updateDashboard = (update: (current: DashboardData) => DashboardData) => {
    setDashboard((current) => current ? update(current) : current);
  };

  const handleCreateRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const now = new Date().toISOString();

    if (createDialog === 'mine') {
      const name = String(formData.get('name') ?? '').trim();
      const location = String(formData.get('location') ?? '').trim();
      if (!name || !location) return;
      updateDashboard((current) => ({
        ...current,
        mines: [...current.mines, {
          id: `mine-demo-${Date.now()}`,
          mineId: `M-${Date.now().toString().slice(-4)}`,
          name,
          location,
          type: String(formData.get('type') ?? 'Coal'),
          manager: session?.name ?? 'Demo Manager',
          workerCount: 0,
          riskScore: 0,
          safetyScore: 100,
          compliance: 100,
          equipmentCount: 0,
          lastInspection: now.slice(0, 10),
          nextInspection: now.slice(0, 10),
          riskLevel: 'LOW',
          status: 'ACTIVE',
        }],
      }));
      toast.success('Mine added to this demo session');
    } else if (createDialog === 'incident') {
      const title = String(formData.get('title') ?? '').trim();
      const mine = String(formData.get('mine') ?? '');
      if (!title || !mine) return;
      updateDashboard((current) => ({
        ...current,
        incidents: [{
          id: `incident-demo-${Date.now()}`,
          incidentId: `INC-${Date.now().toString().slice(-5)}`,
          title,
          mine,
          zone: String(formData.get('zone') ?? 'Unspecified'),
          type: String(formData.get('type') ?? 'Safety Observation'),
          severity: String(formData.get('severity') ?? 'MEDIUM'),
          date: now,
          description: String(formData.get('description') ?? ''),
          peopleAffected: 0,
          investigator: session?.name ?? 'Unassigned',
          rootCause: 'Pending investigation',
          correctiveAction: 'To be determined',
          status: 'REPORTED',
        }, ...current.incidents],
      }));
      toast.success('Incident added to this demo session');
    } else if (createDialog === 'camera') {
      const name = String(formData.get('name') ?? '').trim();
      const mine = String(formData.get('mine') ?? '');
      const zone = String(formData.get('zone') ?? '').trim();
      if (!name || !mine || !zone) return;
      const cameraId = `CAM-DEMO-${Date.now().toString().slice(-5)}`;
      updateDashboard((current) => ({
        ...current,
        vision: {
          ...current.vision,
          cameras: [...current.vision.cameras, {
            id: cameraId,
            name,
            mine,
            zone,
            status: 'DEMO MODE',
            lastActive: now,
            detectionMode: 'AI Vision Demo / Simulated Camera',
            cameraFeedLabel: 'SIMULATED CAMERA FEED',
          }],
        },
      }));
      setSelectedCameraId(cameraId);
      toast.success('Simulated camera added to this demo session');
    }
    setCreateDialog(null);
  };

  const exportReport = () => {
    if (!dashboard) return;
    downloadSafetyReport(dashboard);
    toast.success('Demo report downloaded');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/90 shadow-soft">
          <div className="grid md:grid-cols-2">
            <div className="bg-slate-950 p-8 md:p-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">MineGuard AI</p>
                  <h1 className="mt-1 text-2xl font-semibold text-white">AI-Powered Mining Safety</h1>
                </div>
              </div>
              <p className="mb-5 text-slate-300">Real-time risk intelligence, predictive maintenance, emergency readiness, and compliance controls for modern mining operations.</p>
              <div className="space-y-4 text-sm text-slate-300">
                <div className="panel-soft p-4"><strong className="text-white">Demo accounts:</strong> admin@mineguard.ai / admin123</div>
                <div className="panel-soft p-4"><strong className="text-white">Coverage:</strong> Mines, worker safety, equipment health, compliance, emergency center, AI recommendations.</div>
                <div className="panel-soft p-4"><strong className="text-white">AI mode:</strong> Predictive Demo Model - transparent simulation of risk calculation.</div>
              </div>
            </div>
            <div className="p-8 md:p-10">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Welcome</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Sign in</h2>
              </div>
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-500"
                    placeholder="admin@mineguard.ai"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-400">Log in</button>
                <button type="button" className="w-full rounded-xl border border-slate-600 px-4 py-3 text-slate-200 transition hover:border-slate-500" onClick={() => setLoginForm({ email: 'admin@mineguard.ai', password: 'admin123' })}>Use demo admin credentials</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-72 border-r border-slate-800 bg-slate-900/80 lg:block">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">MineGuard</p>
              <h2 className="text-lg font-semibold text-white">AI Command Center</h2>
            </div>
          </div>
        </div>

        <nav className="space-y-2 p-4">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeView === id ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-800 bg-slate-900/70 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI-Powered Mining Safety & Risk Intelligence</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">MineGuard AI</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-medium text-amber-200">DEMO • browser session only</div>
              <div className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300">{session?.role}</div>
              <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-500"><LogOut className="h-4 w-4" /> Logout</button>
            </div>
          </div>
        </header>

        <nav aria-label="Main navigation" className="border-b border-slate-800 bg-slate-900/80 px-3 py-2 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveView(id)} aria-current={activeView === id ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${activeView === id ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 sm:p-6">
          {loading && !dashboard ? (
            <div className="panel p-8 text-slate-300">Loading dashboard data…</div>
          ) : !dashboard ? (
            <div className="panel p-8 text-slate-300">No dashboard data available.</div>
          ) : (
            <>{renderContent(activeView, dashboard, selectedCameraId, setSelectedCameraId, selectedDetectionId, setSelectedDetectionId, selectedMapSite, setSelectedMapSite, setCreateDialog, setActiveView, updateDashboard, exportReport, session?.name ?? 'Current user')}</>
          )}
        </div>
      </main>
      {createDialog && dashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateDialog(null); }}>
          <form onSubmit={handleCreateRecord} className="panel w-full max-w-lg p-5" aria-labelledby="create-record-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Demo session only</p>
                <h2 id="create-record-title" className="mt-1 text-xl font-semibold text-white">{createDialog === 'mine' ? 'Add mine' : createDialog === 'camera' ? 'Add simulated camera' : 'Report incident'}</h2>
              </div>
              <button type="button" onClick={() => setCreateDialog(null)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">Close</button>
            </div>
            <div className="mt-5 grid gap-4">
              {createDialog === 'mine' ? (
                <>
                  <label className="text-sm text-slate-300">Mine name<input name="name" required maxLength={80} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                  <label className="text-sm text-slate-300">Location<input name="location" required maxLength={120} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                  <label className="text-sm text-slate-300">Mine type<select name="type" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"><option>Coal</option><option>Metal</option><option>Lignite</option><option>Other</option></select></label>
                </>
              ) : createDialog === 'camera' ? (
                <>
                  <label className="text-sm text-slate-300">Camera name<input name="name" required maxLength={80} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                  <label className="text-sm text-slate-300">Mine<select name="mine" required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">{dashboard.mines.map((mine) => <option key={mine.id} value={mine.id}>{mine.name}</option>)}</select></label>
                  <label className="text-sm text-slate-300">Zone<input name="zone" required maxLength={80} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                  <p className="text-xs text-amber-200">This creates a simulated camera card only; it does not connect to a camera stream.</p>
                </>
              ) : (
                <>
                  <label className="text-sm text-slate-300">Incident title<input name="title" required maxLength={120} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                  <label className="text-sm text-slate-300">Mine<select name="mine" required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">{dashboard.mines.map((mine) => <option key={mine.id} value={mine.name}>{mine.name}</option>)}</select></label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-slate-300">Zone<input name="zone" maxLength={80} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                    <label className="text-sm text-slate-300">Severity<select name="severity" defaultValue="MEDIUM" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
                  </div>
                  <label className="text-sm text-slate-300">Description<textarea name="description" rows={3} maxLength={1000} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-amber-200">Demo records are held in the current browser session and are not saved to the server.</p>
            <button type="submit" className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 hover:bg-emerald-300">Create demo record</button>
          </form>
        </div>
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}

function renderContent(
  activeView: string,
  dashboard: DashboardData,
  selectedCameraId: string,
  setSelectedCameraId: (id: string) => void,
  selectedDetectionId: string,
  setSelectedDetectionId: (id: string) => void,
  selectedMapSite: string,
  setSelectedMapSite: (name: string) => void,
  setCreateDialog: (dialog: 'mine' | 'incident' | 'camera' | null) => void,
  setActiveView: (view: string) => void,
  updateDashboard: (update: (current: DashboardData) => DashboardData) => void,
  exportReport: () => void,
  sessionName: string,
) {
  const riskSummary = [
    { label: 'Low', value: dashboard.riskDistribution.low, color: '#22c55e' },
    { label: 'Medium', value: dashboard.riskDistribution.medium, color: '#facc15' },
    { label: 'High', value: dashboard.riskDistribution.high, color: '#f97316' },
    { label: 'Critical', value: dashboard.riskDistribution.critical, color: '#ef4444' },
  ];

  const mapSites = [
    { name: 'Korba North', id: 'mine-korba', risk: 'CRITICAL' },
    { name: 'Singrauli Central', id: 'mine-singrauli', risk: 'HIGH' },
    { name: 'Dhanbad East', id: 'mine-dhanbad', risk: 'MEDIUM' },
    { name: 'Bokaro Open Cast', id: 'mine-bokaro', risk: 'HIGH' },
    { name: 'Talcher South', id: 'mine-talcher', risk: 'LOW' },
    { name: 'Neyveli West', id: 'mine-neyveli', risk: 'LOW' },
  ];
  const activeCamera = dashboard.vision.cameras.find((camera) => camera.id === selectedCameraId) ?? dashboard.vision.cameras[0];
  const activeCameraDetections = dashboard.vision.detections.filter((detection) => detection.cameraId === activeCamera?.id);
  const activeDetection = activeCameraDetections.find((detection) => detection.id === selectedDetectionId) ?? activeCameraDetections[0];
  const activeMine = dashboard.mines.find((mine) => mine.name === selectedMapSite) ?? dashboard.mines[0];
  const activeMapSite = mapSites.find((site) => site.name === selectedMapSite) ?? mapSites[0];
  const ppeChecks = activeDetection
    ? [
        { label: 'Safety helmet', value: activeDetection.helmet },
        { label: 'High-visibility vest', value: activeDetection.vest },
        { label: 'Respirator', value: activeDetection.respirator },
        { label: 'Safety glasses', value: activeDetection.glasses },
        { label: 'Protective gloves', value: activeDetection.gloves },
        { label: 'Safety boots', value: activeDetection.boots },
      ]
    : [];

  switch (activeView) {
    case 'vision':
      return (
        <div className="space-y-6">
          <div className="panel p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI Vision Safety Monitor</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">AI Vision Demo / Simulated Camera</h3>
              </div>
              <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">Status: ONLINE / DEMO MODE</div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="panel-soft p-4"><p className="text-xs uppercase text-slate-400">Workers Detected</p><p className="mt-2 text-3xl font-semibold text-white">{dashboard.vision.statistics.workersDetected}</p></div>
              <div className="panel-soft p-4"><p className="text-xs uppercase text-slate-400">Known Workers</p><p className="mt-2 text-3xl font-semibold text-white">{dashboard.vision.statistics.knownWorkers}</p></div>
              <div className="panel-soft p-4"><p className="text-xs uppercase text-slate-400">Unknown Persons</p><p className="mt-2 text-3xl font-semibold text-white">{dashboard.vision.statistics.unknownPersons}</p></div>
              <div className="panel-soft p-4"><p className="text-xs uppercase text-slate-400">Safety Violations</p><p className="mt-2 text-3xl font-semibold text-white">{dashboard.vision.statistics.safetyViolations}</p></div>
              <div className="panel-soft p-4"><p className="text-xs uppercase text-slate-400">High-Risk Detections</p><p className="mt-2 text-3xl font-semibold text-white">{dashboard.vision.statistics.highRiskDetections}</p></div>
            </div>
          </div>

          <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="panel min-w-0 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Camera Feed</p>
                  <h4 className="mt-2 text-xl font-semibold text-white">Camera: {activeCamera?.name ?? 'No camera selected'}</h4>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300">SIMULATED CAMERA FEED</span>
              </div>
              <div className="relative isolate mt-4 h-80 overflow-hidden rounded-2xl border border-slate-700 bg-[#29352e] shadow-inner shadow-slate-950/80">
                <svg className="absolute inset-0 h-full w-full overflow-hidden" viewBox="0 0 960 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Simulated mine camera view at ${activeCamera?.zone ?? 'mine site'}`}>
                  <defs>
                    <linearGradient id="cameraSky" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#71827b" /><stop offset="1" stopColor="#34443d" /></linearGradient>
                    <linearGradient id="cameraGround" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#5a5b4a" /><stop offset="1" stopColor="#272e2a" /></linearGradient>
                    <linearGradient id="cameraRoad" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#88826d" /><stop offset="1" stopColor="#46483f" /></linearGradient>
                    <pattern id="cameraNoise" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 4.5h1M3 1h1" stroke="#fff" strokeOpacity=".12" strokeWidth=".6" /></pattern>
                  </defs>
                  <rect width="960" height="420" fill="url(#cameraSky)" />
                  <path d="M0 170 80 123l62 28 95-78 82 74 74-45 99 69 84-61 96 61 89-82 83 57 116-69v156H0Z" fill="#52665a" />
                  <path d="m0 193 105-64 81 56 93-79 80 74 95-50 104 73 110-79 88 72 82-46 122 50v113H0Z" fill="#3e5147" />
                  <path d="M0 225q150-36 268 8t233 3q115-30 230-3t229-1v188H0Z" fill="url(#cameraGround)" />
                  <path d="M352 420 431 224h104l108 196Z" fill="url(#cameraRoad)" />
                  <path d="m469 420 31-196h16l38 196Z" fill="#b8a77c" opacity=".72" />
                  <path d="M0 292 960 276M0 306 960 290" stroke="#d1c7a0" strokeOpacity=".26" strokeWidth="2" />
                  <path d="M0 255 960 242M0 268 960 256" stroke="#90a18d" strokeOpacity=".35" strokeWidth="2" />
                  <g fill="#26362f" opacity=".9">
                    <path d="M75 226h96v-48h67v48h57v60H75z" /><path d="M96 178h38v-28h18v28h37v12H96z" />
                    <path d="M731 220h145v-35h40v95H731z" /><path d="M761 185h59v-24h15v24h41v13H761z" />
                    <path d="M42 244h20v-42h11v42h21v39H42zM887 236h16v-39h12v39h25v44h-53z" />
                  </g>
                  <g stroke="#d2bd78" strokeWidth="3" opacity=".8"><path d="M20 265h160M215 265h115M652 265h104M818 265h122" /></g>
                  <g fill="#d2bd78"><path d="m178 260 10 5-10 5zM320 260l10 5-10 5zM746 260l10 5-10 5z" /></g>
                  <g transform="translate(407 258)">
                    <rect x="0" y="34" width="78" height="35" rx="6" fill="#c48b32" /><rect x="46" y="16" width="38" height="29" rx="5" fill="#e0a640" /><path d="M9 35 22 9h26l12 26z" fill="#e7b54b" /><rect x="53" y="21" width="21" height="14" fill="#293c3c" /><circle cx="19" cy="70" r="11" fill="#202522" /><circle cx="64" cy="70" r="11" fill="#202522" /><circle cx="19" cy="70" r="5" fill="#90958c" /><circle cx="64" cy="70" r="5" fill="#90958c" />
                  </g>
                  <g transform="translate(602 265)">
                    <circle cx="14" cy="7" r="7" fill="#d5b495" /><path d="M7 15h15l5 38H2z" fill="#d99028" /><path d="M8 18h12M5 30h18" stroke="#f2d26c" strokeWidth="4" /><path d="M7 52 4 73m12-21 5 21" stroke="#202622" strokeWidth="6" /><path d="M6 3h16l-3-6H9z" fill="#ebbc40" />
                  </g>
                  <rect width="960" height="420" fill="url(#cameraNoise)" opacity=".42" />
                  <path d="M0 0h960v420H0z" fill="none" stroke="#d4dfd4" strokeOpacity=".16" strokeWidth="18" />
                  <path d="M14 14h35M14 14v25M946 14h-35M946 14v25M14 406h35M14 406v-25M946 406h-35M946 406v-25" fill="none" stroke="#d9e4db" strokeOpacity=".65" strokeWidth="2" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
                {activeDetection && <div className={`absolute left-[61%] top-[53%] h-[28%] w-[6%] rounded-md border-2 ${activeDetection.risk === 'CRITICAL' || activeDetection.risk === 'HIGH' ? 'border-amber-400/90' : 'border-emerald-400/90'}`}>
                  <span className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-1 text-[9px] font-semibold text-slate-950 ${activeDetection.risk === 'CRITICAL' || activeDetection.risk === 'HIGH' ? 'bg-amber-400/90' : 'bg-emerald-400/90'}`}>{activeDetection.unknownPerson ? 'UNKNOWN PERSON' : `${activeDetection.workerId} • DEMO SCAN`}</span>
                </div>}
                {activeDetection && <div className="pointer-events-none absolute inset-x-0 top-[62%] h-0.5 animate-pulse bg-cyan-300/80 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />}
                <div className="absolute left-4 top-4 rounded-full border border-amber-300/40 bg-slate-950/75 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-200">SIMULATED CAMERA FEED</div>
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-300/30 bg-slate-950/75 px-2 py-1 text-[9px] font-medium text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />DEMO MODE</div>
                <div className="absolute left-4 top-14 rounded bg-slate-950/60 px-2 py-1 font-mono text-[9px] text-slate-200">{activeCamera?.id ?? 'CAM-001'} • {activeCamera?.zone ?? 'Zone A'}</div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-xs text-slate-200 backdrop-blur-sm">
                    <p className="font-medium text-white">{activeCamera?.zone ?? 'Zone A - Main Entry'}</p>
                    <p className="mt-1">{activeCamera?.name ?? 'Main Entry Camera'} • {activeCamera?.status ?? 'DEMO MODE'}</p>
                    <p>{activeDetection ? `Scanning ${activeDetection.workerId} • ${activeDetection.identificationConfidence}% demo confidence` : 'No person selected for scan'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-xs text-slate-200 backdrop-blur-sm">
                    <p className="font-medium text-white">CAMERA DETAILS</p>
                    <p className="mt-1 text-emerald-300">Mine: {activeCamera?.mine ?? 'mine-korba'}</p>
                    <p>Mode: Simulated</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel min-w-0 p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Person PPE Scan</p>
                  <p className="mt-1 text-[10px] text-amber-300">DEMO RESULTS • Not a live camera or AI scan</p>
                </div>
                {activeDetection && <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(activeDetection.risk)}`}>{activeDetection.risk} RISK</span>}
              </div>
              {activeCameraDetections.length ? (
                <>
                  <div className="mt-3 space-y-2">
                    {activeCameraDetections.slice(0, 4).map((detection) => (
                      <button key={detection.id} type="button" aria-pressed={activeDetection?.id === detection.id} onClick={() => setSelectedDetectionId(detection.id)} className={`w-full rounded-xl border p-3 text-left transition ${activeDetection?.id === detection.id ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-slate-700 bg-slate-800/70 hover:border-slate-500'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-white">{detection.unknownPerson ? 'Unknown person' : detection.workerName} <span className="text-slate-400">({detection.workerId})</span></span>
                          <span className="text-[10px] text-slate-300">{detection.identificationConfidence}%</span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">{detection.faceMatch} • {detection.zone}</p>
                      </button>
                    ))}
                  </div>
                  {activeDetection && (
                    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{activeDetection.unknownPerson ? 'Unknown person' : activeDetection.workerName}</p>
                        <span className="text-[10px] text-slate-400">{activeDetection.workerId}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">Demo Face Detection • {activeDetection.identificationConfidence}% confidence • {activeDetection.zone}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {ppeChecks.map((check) => {
                          const detected = ['YES', 'DETECTED', 'COMPLIANT'].includes(String(check.value ?? '').toUpperCase());
                          return <div key={check.label} className={`rounded-lg border px-2.5 py-2 ${detected ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-rose-500/25 bg-rose-500/5'}`}>
                            <p className="text-[10px] text-slate-400">{check.label}</p>
                            <p className={`mt-0.5 text-xs font-semibold ${detected ? 'text-emerald-300' : 'text-rose-300'}`}>{detected ? '✓ Detected' : check.value ? '✕ Missing' : '— Not recorded'}</p>
                          </div>;
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : <div className="panel-soft mt-4 p-4 text-sm text-slate-400">No demo detections are currently recorded for this camera.</div>}
            </div>
          </section>

          <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="panel min-w-0 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Detection Event History</p>
              <div className="mt-4 min-w-0 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-700 text-slate-300"><tr><th className="px-3 py-3">Event</th><th className="px-3 py-3">Zone</th><th className="px-3 py-3">Risk</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr></thead>
                  <tbody>
                    {dashboard.vision.events.map((event) => (
                      <tr key={event.id} className="border-b border-slate-800 last:border-0">
                        <td className="px-3 py-3 text-white">{event.eventType}</td>
                        <td className="px-3 py-3 text-slate-300">{event.zone}</td>
                        <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(event.risk)}`}>{event.risk}</span></td>
                        <td className="px-3 py-3 text-slate-300">{event.status}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            {!['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'].includes(event.status) && <button type="button" onClick={() => {
                              updateDashboard((current) => ({ ...current, vision: { ...current.vision, events: current.vision.events.map((item) => item.id === event.id ? { ...item, status: 'ACKNOWLEDGED' } : item) } }));
                              toast.success('Detection event acknowledged');
                            }} className="whitespace-nowrap rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-200 hover:border-emerald-400">Acknowledge</button>}
                            <button type="button" onClick={() => {
                              const mineName = dashboard.mines.find((mine) => mine.id === event.mine)?.name ?? event.mine;
                              updateDashboard((current) => ({ ...current, incidents: [{
                                id: `incident-vision-${Date.now()}`,
                                incidentId: `INC-${Date.now().toString().slice(-5)}`,
                                sourceEventId: event.id,
                                title: `AI Vision: ${event.eventType}`,
                                mine: mineName,
                                zone: event.zone,
                                type: 'AI Vision',
                                severity: event.risk,
                                date: new Date().toISOString(),
                                description: `Created from demo detection event ${event.id}.`,
                                peopleAffected: 0,
                                investigator: sessionName,
                                rootCause: 'Pending investigation',
                                correctiveAction: 'To be determined',
                                status: 'REPORTED',
                              }, ...current.incidents] }));
                              setActiveView('incidents');
                              toast.success('Incident created from demo detection');
                            }} disabled={dashboard.incidents.some((incident) => incident.sourceEventId === event.id)} className="whitespace-nowrap rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-200 hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">{dashboard.incidents.some((incident) => incident.sourceEventId === event.id) ? 'Incident created' : 'Create incident'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel min-w-0 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Camera Management</p>
                <button type="button" onClick={() => setCreateDialog('camera')} className="rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs text-emerald-200 hover:border-emerald-400">Add camera</button>
              </div>
              <div className="mt-4 space-y-3">
                {dashboard.vision.cameras.map((camera) => (
                  <div key={camera.id} className="space-y-2">
                  <button type="button" aria-pressed={activeCamera?.id === camera.id} onClick={() => setSelectedCameraId(camera.id)} className={`panel-soft w-full p-3.5 text-left transition hover:border-emerald-500/40 ${activeCamera?.id === camera.id ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20' : ''}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${camera.status === 'ONLINE' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]' : camera.status === 'WARNING' ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]' : 'bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.7)]'}`} />
                        <p className="text-sm font-medium text-white">{camera.name}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] ${camera.status === 'ONLINE' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : camera.status === 'WARNING' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300' : 'border-slate-500/40 bg-slate-500/10 text-slate-300'}`}>{camera.status}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                      <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2"><span className="block text-slate-400">ID</span>{camera.id}</div>
                      <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2"><span className="block text-slate-400">Mode</span>{camera.detectionMode}</div>
                      <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2 col-span-2"><span className="block text-slate-400">Zone</span>{camera.zone} • {camera.mine}</div>
                    </div>
                  </button>
                  <button type="button" onClick={() => {
                    const nextStatus = camera.status === 'OFFLINE' ? 'DEMO MODE' : 'OFFLINE';
                    updateDashboard((current) => ({ ...current, vision: { ...current.vision, cameras: current.vision.cameras.map((item) => item.id === camera.id ? { ...item, status: nextStatus } : item) } }));
                    toast.success(`${camera.name} set ${nextStatus.toLowerCase()}`);
                  }} className="ml-2 rounded-lg px-2 py-1 text-[10px] text-slate-400 hover:text-white">{camera.status === 'OFFLINE' ? 'Enable demo camera' : 'Disable camera'}</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      );

    case 'dashboard':
      return (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboard.kpis.slice(0, 8).map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="panel p-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-slate-800 p-2 text-emerald-300"><Factory className="h-5 w-5" /></div>
                  <span className="text-xs text-emerald-300">{stat.trend}</span>
                </div>
                <p className="mt-5 text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{stat.label}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI Safety Prediction</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Mine: {dashboard.aiPrediction?.mine || 'Korba North'}</h3>
                </div>
                <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-300">{dashboard.aiPrediction?.riskLevel || 'CRITICAL'}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="panel-soft p-4"><p className="text-xs uppercase text-slate-400">Current Risk</p><p className="mt-2 text-3xl font-semibold text-white">{dashboard.aiPrediction?.currentRisk}/100</p></div>
                <div className="panel-soft p-4"><p className="text-xs uppercase text-slate-400">Predicted Risk</p><p className="mt-2 text-3xl font-semibold text-white">{dashboard.aiPrediction?.predictedRisk}/100</p></div>
                <div className="panel-soft p-4"><p className="text-xs uppercase text-slate-400">AI Confidence</p><p className="mt-2 text-3xl font-semibold text-white">{dashboard.aiPrediction?.confidence || 94}%</p></div>
              </div>
              <div className="mt-5 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard.riskTrend}>
                    <defs>
                      <linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Area type="monotone" dataKey="risk" stroke="#34d399" fill="url(#riskFill)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI Vision Safety Monitor</p>
              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Camera</p>
                    <p className="mt-1 text-lg font-semibold text-white">{dashboard.vision.cameras[0]?.name || 'Main Entry Camera'}</p>
                  </div>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">ONLINE / DEMO MODE</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="panel-soft p-3"><p className="text-[10px] uppercase text-slate-400">Workers Detected</p><p className="mt-2 text-2xl font-semibold text-white">{dashboard.vision.statistics.workersDetected}</p></div>
                  <div className="panel-soft p-3"><p className="text-[10px] uppercase text-slate-400">Known Workers</p><p className="mt-2 text-2xl font-semibold text-white">{dashboard.vision.statistics.knownWorkers}</p></div>
                  <div className="panel-soft p-3"><p className="text-[10px] uppercase text-slate-400">Unknown</p><p className="mt-2 text-2xl font-semibold text-white">{dashboard.vision.statistics.unknownPersons}</p></div>
                  <div className="panel-soft p-3"><p className="text-[10px] uppercase text-slate-400">PPE Violations</p><p className="mt-2 text-2xl font-semibold text-white">{dashboard.vision.statistics.safetyViolations}</p></div>
                </div>
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  1 Restricted Zone Alert • Demo Face Detection active
                </div>
              </div>
            </div>

            <div className="panel p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk Distribution</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskSummary} dataKey="value" nameKey="label" innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {riskSummary.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {riskSummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm text-slate-200">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: String(item.color) }} />{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div className="panel min-w-0 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mine Site Map</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">Illustrative demo map</h3>
                </div>
                <label className="text-xs text-slate-400">
                  Select mine location
                  <select value={selectedMapSite} onChange={(event) => setSelectedMapSite(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white sm:min-w-52">
                    {mapSites.map((site) => <option key={site.id} value={site.name}>{site.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="relative mt-4 h-64 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 sm:h-[22rem]">
                <img src="/maps/mineguard-demo-map.svg" alt="Illustrative, synthetic open-pit mine map with haul roads, processing plant, water reserve and terrain contours" className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 shadow-lg backdrop-blur-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${activeMapSite?.risk === 'CRITICAL' ? 'bg-red-400' : activeMapSite?.risk === 'HIGH' ? 'bg-orange-400' : activeMapSite?.risk === 'MEDIUM' ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                  <span className="text-xs font-semibold text-white">{activeMine?.name ?? selectedMapSite}</span>
                </div>
                <span className="absolute right-3 top-3 rounded-lg border border-amber-200/30 bg-slate-950/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100 shadow-lg backdrop-blur-sm">DEMO MAP • NOT TO SCALE</span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent p-3 pt-12 sm:p-4 sm:pt-14">
                  <div>
                    <p className="text-sm font-semibold text-white">Illustrative open-pit mine layout</p>
                    <p className="mt-1 text-[10px] text-slate-200 sm:text-xs">Original local artwork • no external map requests</p>
                  </div>
                  <div className="hidden rounded-lg border border-white/15 bg-slate-950/75 px-3 py-2 text-[10px] text-slate-200 sm:block">
                    <p><span className="text-amber-200">—</span> Haul road</p>
                    <p className="mt-1"><span className="text-teal-200">≈</span> Water reserve</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">{activeMine?.name ?? 'Selected mine'} • {activeMine?.location ?? 'Location unavailable'}</p>
                  <p className="mt-1">Risk {activeMine?.riskScore ?? '—'}/100 • {activeMine?.riskLevel ?? '—'} • {activeMine?.workerCount ?? '—'} workers</p>
                </div>
                <p className="max-w-sm text-slate-400">This synthetic illustration is not a real mine map, surveyed boundary, navigation tool, or operational safety source.</p>
              </div>
              <div className="mt-3 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
                {mapSites.map((site) => (
                  <button key={site.id} type="button" aria-pressed={selectedMapSite === site.name} onClick={() => setSelectedMapSite(site.name)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition ${selectedMapSite === site.name ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500'}`}>
                    <span className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${site.risk === 'CRITICAL' ? 'bg-red-400' : site.risk === 'HIGH' ? 'bg-orange-400' : site.risk === 'MEDIUM' ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                    {site.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel min-w-0 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Alerts</p>
              <div className="mt-4 space-y-3">
                {dashboard.alerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="panel-soft p-3">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(alert.severity)}`}>{alert.severity}</span>
                      <span className="text-[10px] text-slate-400">{alert.status}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{alert.type}</p>
                    <p className="mt-1 text-xs text-slate-300">{alert.description}</p>
                    <p className="mt-2 text-[10px] text-slate-400">{alert.mine} • {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Corrective Actions</p>
                <button type="button" onClick={() => setActiveView('actions')} className="flex items-center gap-1 text-xs text-emerald-300">View all <ChevronRight className="h-3 w-3" /></button>
              </div>
              <div className="space-y-3">
                {dashboard.actions.slice(0, 4).map((action: any) => (
                  <div key={action.id} className="panel-soft p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{action.issue}</p>
                      <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(action.priority)}`}>{action.priority}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Assigned to {action.assignedUser} • Due {dateFmt(action.dueDate)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Equipment Health</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.equipment.slice(0, 6)}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} interval={0} angle={-10} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="healthScore" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent Incidents</p>
              <div className="mt-4 space-y-3">
                {dashboard.incidents.slice(0, 5).map((incident: any) => (
                  <div key={incident.id} className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3 last:border-none last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-white">{incident.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{incident.mine} • {incident.zone}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(incident.severity)}`}>{incident.severity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI Recommendations</p>
              <div className="mt-4 space-y-3">
                {dashboard.aiRecommendations.slice(0, 4).map((item: any) => (
                  <div key={item.id} className="panel-soft p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(item.priority)}`}>{item.priority}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      );
    case 'mines':
      return (
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mine Management</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Operations Overview</h3>
            </div>
            <button type="button" onClick={() => setCreateDialog('mine')} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950">Add Mine</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700 text-slate-300">
                <tr>
                  <th className="px-3 py-3">Mine</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Risk</th><th className="px-3 py-3">Safety</th><th className="px-3 py-3">Compliance</th><th className="px-3 py-3">Next Inspection</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.mines.map((mine) => (
                  <tr key={mine.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-3 py-3 text-white">{mine.name}</td>
                    <td className="px-3 py-3 text-slate-300">{mine.location}</td>
                    <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(mine.riskLevel)}`}>{mine.riskLevel}</span></td>
                    <td className="px-3 py-3 text-slate-300">{mine.safetyScore}/100</td>
                    <td className="px-3 py-3 text-slate-300">{mine.compliance}%</td>
                    <td className="px-3 py-3 text-slate-300">{dateFmt(mine.nextInspection)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case 'workers':
      return (
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Worker Safety</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700 text-slate-300"><tr><th className="px-3 py-3">Worker</th><th className="px-3 py-3">Mine</th><th className="px-3 py-3">Zone</th><th className="px-3 py-3">PPE</th><th className="px-3 py-3">Status</th></tr></thead>
              <tbody>
                {dashboard.workers.map((worker) => (
                  <tr key={worker.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-3 py-3 text-white">{worker.name}</td>
                    <td className="px-3 py-3 text-slate-300">{dashboard.mines.find((mine) => mine.id === worker.mine)?.name || worker.mine}</td>
                    <td className="px-3 py-3 text-slate-300">{worker.zone}</td>
                    <td className="px-3 py-3 text-slate-300">{worker.ppeStatus}</td>
                    <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(worker.safetyStatus === 'SAFE' ? 'LOW' : worker.safetyStatus === 'WARNING' ? 'MEDIUM' : 'HIGH')}`}>{worker.safetyStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case 'equipment':
      return (
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Equipment Management</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700 text-slate-300"><tr><th className="px-3 py-3">Equipment</th><th className="px-3 py-3">Mine</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Health</th><th className="px-3 py-3">Failure Probability</th></tr></thead>
              <tbody>
                {dashboard.equipment.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-3 py-3 text-white">{item.name}</td>
                    <td className="px-3 py-3 text-slate-300">{dashboard.mines.find((mine) => mine.id === item.mine)?.name || item.mine}</td>
                    <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(item.status === 'CRITICAL' ? 'CRITICAL' : item.status === 'WARNING' || item.status === 'MAINTENANCE' ? 'MEDIUM' : 'LOW')}`}>{item.status}</span></td>
                    <td className="px-3 py-3 text-slate-300">{item.healthScore}%</td>
                    <td className="px-3 py-3 text-slate-300">{item.failureProbability}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case 'incidents':
      return (
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Incident Management</p><p className="mt-1 text-xs text-slate-400">Demo workflows can be advanced through their investigation stages.</p></div>
            <button type="button" onClick={() => setCreateDialog('incident')} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950">Report incident</button>
          </div>
          <div className="mt-4 space-y-3">
            {dashboard.incidents.map((incident) => (
              <div key={incident.id} className="panel-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{incident.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{incident.mine} • {incident.zone} • {incident.type}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(incident.severity)}`}>{incident.severity}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{incident.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 pt-3">
                  <span className="text-xs text-slate-400">Workflow: {incident.status ?? 'REPORTED'}</span>
                  <button type="button" onClick={() => {
                    const stages = ['REPORTED', 'INVESTIGATING', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED'];
                    const current = stages.indexOf(incident.status ?? 'REPORTED');
                    const nextStatus = stages[Math.min(current + 1, stages.length - 1)];
                    updateDashboard((currentData) => ({ ...currentData, incidents: currentData.incidents.map((item) => item.id === incident.id ? { ...item, status: nextStatus } : item) }));
                    toast.success(`Incident workflow updated: ${nextStatus}`);
                  }} disabled={incident.status === 'CLOSED'} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">{incident.status === 'CLOSED' ? 'Closed' : 'Advance workflow'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'alerts':
      return (
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Alert Center</p>
          <div className="mt-4 space-y-3">
            {dashboard.alerts.map((alert) => (
              <div key={alert.id} className="panel-soft p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{alert.type}</p>
                  <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(alert.severity)}`}>{alert.severity}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{alert.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                  <span>{alert.mine} • {alert.assignedUser ?? 'Unassigned'}</span>
                  <div className="flex items-center gap-2">
                    <span>{alert.status}</span>
                    {alert.status !== 'RESOLVED' && <button type="button" onClick={() => {
                      const stages = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];
                      const nextStatus = stages[Math.min(stages.indexOf(alert.status), stages.length - 2) + 1];
                      updateDashboard((currentData) => ({ ...currentData, alerts: currentData.alerts.map((item) => item.id === alert.id ? { ...item, status: nextStatus, assignedUser: sessionName } : item) }));
                      toast.success(`Alert ${nextStatus.toLowerCase().replace('_', ' ')}`);
                    }} className="rounded-lg border border-slate-600 px-2.5 py-1.5 text-[10px] font-medium text-slate-200 hover:border-emerald-400">{alert.status === 'NEW' ? 'Acknowledge' : alert.status === 'ACKNOWLEDGED' ? 'Start response' : 'Resolve'}</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'actions':
      return (
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Corrective Actions</p><p className="mt-1 text-xs text-slate-400">Track assignments from open work through verification.</p></div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{dashboard.actions.filter((action) => !['COMPLETED', 'VERIFIED'].includes(action.status)).length} open</span>
          </div>
          <div className="mt-4 grid gap-3">
            {dashboard.actions.map((action) => {
              const stages = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'];
              const currentStage = stages.includes(action.status) ? action.status : 'OPEN';
              const nextStatus = stages[Math.min(stages.indexOf(currentStage) + 1, stages.length - 1)];
              return <div key={action.id} className="panel-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-medium text-white">{action.issue}</p><p className="mt-1 text-xs text-slate-400">{action.mine} • Assigned to {action.assignedUser} • Due {dateFmt(action.dueDate)}</p></div>
                  <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(action.priority === 'URGENT' ? 'CRITICAL' : action.priority)}`}>{action.priority}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 pt-3">
                  <span className="text-xs text-slate-300">Status: {action.status}</span>
                  {currentStage !== 'VERIFIED' && <button type="button" onClick={() => {
                    updateDashboard((currentData) => ({ ...currentData, actions: currentData.actions.map((item) => item.id === action.id ? { ...item, status: nextStatus, completionDate: nextStatus === 'COMPLETED' ? new Date().toISOString() : item.completionDate } : item) }));
                    toast.success(`Corrective action moved to ${nextStatus}`);
                  }} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-400">Move to {nextStatus}</button>}
                </div>
              </div>;
            })}
          </div>
        </div>
      );
    case 'emergency':
      return (
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Emergency Response Center</p>
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-red-300" />
              <h3 className="text-2xl font-semibold text-white">EMERGENCY MODE</h3>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dashboard.emergency.map((item) => (
                <div key={item.id} className="space-y-2 text-sm text-slate-200">
                  <p><strong className="text-white">Incident:</strong> {item.incident}</p>
                  <p><strong className="text-white">Mine:</strong> {item.mine}</p>
                  <p><strong className="text-white">Zone:</strong> {item.zone}</p>
                  <p><strong className="text-white">Severity:</strong> {item.severity}</p>
                  <p><strong className="text-white">People Affected:</strong> {item.peopleAffected}</p>
                  <p><strong className="text-white">Evacuation:</strong> {item.evacuationStatus}</p>
                  <p><strong className="text-white">Response Team:</strong> {item.responseTeam}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'compliance':
      return (
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Compliance Center</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700 text-slate-300"><tr><th className="px-3 py-3">Type</th><th className="px-3 py-3">Mine</th><th className="px-3 py-3">Expiry</th><th className="px-3 py-3">Status</th></tr></thead>
              <tbody>
                {dashboard.compliance.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-3 py-3 text-white">{item.type}</td>
                    <td className="px-3 py-3 text-slate-300">{item.mine}</td>
                    <td className="px-3 py-3 text-slate-300">{dateFmt(item.expiryDate)}</td>
                    <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(item.status === 'EXPIRED' ? 'CRITICAL' : item.status === 'EXPIRING_SOON' ? 'MEDIUM' : 'LOW')}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case 'analytics':
      return (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="panel p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk Trend</p><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboard.riskTrend}><CartesianGrid stroke="#334155" /><XAxis dataKey="day" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Area dataKey="risk" fill="#34d399" stroke="#34d399" /></AreaChart></ResponsiveContainer></div></div>
          <div className="panel p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Incident Trend</p><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={dashboard.incidentTrend}><CartesianGrid stroke="#334155" /><XAxis dataKey="day" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Bar dataKey="incidents" fill="#f97316" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></div>
          <div className="panel p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Compliance Trend</p><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboard.complianceTrend}><CartesianGrid stroke="#334155" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Area dataKey="compliance" fill="#60a5fa" stroke="#60a5fa" /></AreaChart></ResponsiveContainer></div></div>
          <div className="panel p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Safety Breakdown</p><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={dashboard.safetyBreakdown}><CartesianGrid stroke="#334155" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Bar dataKey="value" fill="#22c55e" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></div>
        </div>
      );
    case 'reports':
      return (
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI Safety Report</p><p className="mt-1 text-xs text-slate-400">Summary based on the current demo data and local session updates.</p></div>
            <button type="button" onClick={exportReport} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950">Download CSV</button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="panel-soft p-4">
              <p className="text-sm font-medium text-white">Executive Summary</p>
              <p className="mt-2 text-sm text-slate-300">Risk remains elevated in Korba North due to methane anomalies, overdue calibration, and elevated equipment failure probability. Immediate corrective actions are required in the next 24 hours.</p>
            </div>
            <div className="panel-soft p-4">
              <p className="text-sm font-medium text-white">AI Prediction</p>
              <p className="mt-2 text-sm text-slate-300">Predicted escalation risk for Korba North: {dashboard.aiPrediction?.predictedRisk}/100 within {dashboard.aiPrediction?.timeWindow.toLowerCase() || '24 hours'}.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {dashboard.aiRecommendations.map((item) => (
              <div key={item.id} className="panel-soft p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(item.priority)}`}>{item.priority}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.suggestedAction}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'management':
      return (
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">User Management</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {['admin@mineguard.ai', 'safety@mineguard.ai', 'mine@mineguard.ai', 'viewer@mineguard.ai'].map((email) => (
              <div key={email} className="panel-soft p-4">
                <p className="text-sm font-medium text-white">{email}</p>
                <p className="mt-1 text-xs text-slate-400">Role: {email.includes('admin') ? 'ADMIN' : email.includes('safety') ? 'SAFETY_MANAGER' : email.includes('mine') ? 'MINE_MANAGER' : 'VIEWER'}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-300"><span>Status Active</span><span>Last login 2h ago</span></div>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return <div className="panel p-5 text-slate-300">Section not yet implemented.</div>;
  }
}

export default App;
