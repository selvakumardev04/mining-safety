import { type FormEvent, useEffect, useRef, useState } from 'react';
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

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
const DEMO_LOGIN = Object.freeze({
  email: import.meta.env.VITE_DEMO_EMAIL ?? '',
  password: import.meta.env.VITE_DEMO_PASSWORD ?? '',
});

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
    let errorMessage = errorText || 'Request failed';
    try {
      const payload = JSON.parse(errorText) as { message?: unknown };
      if (typeof payload.message === 'string') errorMessage = payload.message;
    } catch {
      // Keep the original response text when the server does not return JSON.
    }
    throw new Error(errorMessage);
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
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as Partial<UserSession>;
      return parsed.id && parsed.name && parsed.email && parsed.role
        ? {
            id: parsed.id,
            name: parsed.name,
            email: parsed.email,
            role: parsed.role,
            assignedMines: parsed.assignedMines ?? [],
          }
        : null;
    } catch {
      localStorage.removeItem('mineguard-user');
      return null;
    }
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('mineguard-token')));
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedDetectionId, setSelectedDetectionId] = useState('');
  const [selectedMapSite, setSelectedMapSite] = useState('Korba North');
  const [createDialog, setCreateDialog] = useState<'mine' | 'incident' | 'camera' | 'worker' | null>(null);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: DEMO_LOGIN.email, password: DEMO_LOGIN.password });
  const isAuthenticated = Boolean(token);

  const navigateToView = (view: string) => {
    setActiveView(view);
  };

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

  const handleCreateRecord = async (event: FormEvent<HTMLFormElement>) => {
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
    } else if (createDialog === 'worker') {
      if (session?.role !== 'ADMIN' || !token) {
        toast.error('Only administrators can add employees');
        return;
      }
      try {
        const response = await authFetch<{ worker: DashboardData['workers'][number] }>('/workers', token, {
          method: 'POST',
          body: JSON.stringify({
            name: String(formData.get('name') ?? '').trim(),
            role: String(formData.get('role') ?? '').trim(),
            mine: String(formData.get('mine') ?? ''),
            department: String(formData.get('department') ?? '').trim(),
            shift: String(formData.get('shift') ?? ''),
          }),
        });
        updateDashboard((current) => ({
          ...current,
          workers: [...current.workers, response.worker],
          summary: { ...current.summary, totalWorkers: current.workers.length + 1 },
          kpis: current.kpis.map((kpi) => kpi.label === 'Active Workers' ? { ...kpi, value: current.workers.length + 1 } : kpi),
          mines: current.mines.map((mine) => mine.id === response.worker.mine ? { ...mine, workerCount: mine.workerCount + 1 } : mine),
        }));
        toast.success(`${response.worker.name} added to the employee roster`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not add employee');
        return;
      }
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
              {showPasswordRecovery ? (
                <section aria-labelledby="password-recovery-heading" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Account recovery</p>
                  <h2 id="password-recovery-heading" className="mt-2 text-2xl font-semibold text-white">Forgot password?</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">Password-reset email is not configured for this demo, so no reset link can be sent and no account password will be changed here.</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">For this prototype, use the demo account credentials configured through VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in your deployment environment. For a real account, contact your MineGuard administrator to verify your identity and reset access securely.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginForm(DEMO_LOGIN);
                      setShowPasswordRecovery(false);
                    }}
                    className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-400"
                  >
                    Use demo admin credentials
                  </button>
                  <button type="button" onClick={() => setShowPasswordRecovery(false)} className="mt-3 w-full rounded-xl border border-slate-600 px-4 py-3 text-slate-200 transition hover:border-slate-500">Back to sign in</button>
                </section>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Welcome</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Sign in</h2>
                  </div>
                  <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                      <label className="mb-1 block text-sm text-slate-300">Email</label>
                      <input
                        type="email"
                        autoComplete="username"
                        required
                        value={loginForm.email}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-500"
                        placeholder="admin@mineguard.ai"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <label htmlFor="login-password" className="block text-sm text-slate-300">Password</label>
                        <button type="button" onClick={() => setShowPasswordRecovery(true)} className="text-xs font-medium text-emerald-300 hover:text-emerald-200 hover:underline">Forgot password?</button>
                      </div>
                      <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-500"
                        placeholder="••••••••"
                      />
                    </div>
                    <button type="submit" className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-400">Log in</button>
                    <button type="button" className="w-full rounded-xl border border-slate-600 px-4 py-3 text-slate-200 transition hover:border-slate-500" onClick={() => setLoginForm(DEMO_LOGIN)}>Use demo admin credentials</button>
                  </form>
                </>
              )}
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
              onClick={() => navigateToView(id)}
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
              <button key={id} type="button" onClick={() => navigateToView(id)} aria-current={activeView === id ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${activeView === id ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-300 hover:bg-slate-800'}`}>
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
            <>{renderContent(activeView, dashboard, selectedCameraId, setSelectedCameraId, selectedDetectionId, setSelectedDetectionId, selectedMapSite, setSelectedMapSite, setCreateDialog, navigateToView, updateDashboard, exportReport, session?.name ?? 'Current user', session?.role === 'ADMIN', token ?? '')}</>
          )}
        </div>
      </main>
      {createDialog && dashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateDialog(null); }}>
          <form onSubmit={handleCreateRecord} className="panel w-full max-w-lg p-5" aria-labelledby="create-record-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Demo session only</p>
                <h2 id="create-record-title" className="mt-1 text-xl font-semibold text-white">{createDialog === 'mine' ? 'Add mine' : createDialog === 'camera' ? 'Add simulated camera' : createDialog === 'worker' ? 'Add new employee' : 'Report incident'}</h2>
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
              ) : createDialog === 'worker' ? (
                <>
                  <label className="text-sm text-slate-300">Employee name<input name="name" required minLength={2} maxLength={100} autoComplete="name" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                  <label className="text-sm text-slate-300">Job title<input name="role" required maxLength={80} placeholder="e.g. Equipment Operator" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                  <label className="text-sm text-slate-300">Mine<select name="mine" required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">{dashboard.mines.map((mine) => <option key={mine.id} value={mine.id}>{mine.name}</option>)}</select></label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-slate-300">Department<input name="department" required maxLength={80} placeholder="e.g. Operations" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
                    <label className="text-sm text-slate-300">Shift<select name="shift" required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"><option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option></select></label>
                  </div>
                  <p className="text-xs text-amber-200">New employee starts with PPE and safety status marked for assessment. This demo roster is held in server memory and resets when the server restarts.</p>
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
            {createDialog !== 'worker' && <p className="mt-4 text-xs text-amber-200">Demo records are held in the current browser session and are not saved to the server.</p>}
            <button type="submit" className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 hover:bg-emerald-300">{createDialog === 'worker' ? 'Add employee' : 'Create demo record'}</button>
          </form>
        </div>
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}

function LiveWebcamDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestIdRef = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [capturedFrame, setCapturedFrame] = useState('');
  const [showDemoResult, setShowDemoResult] = useState(false);

  useEffect(() => () => {
    requestIdRef.current += 1;
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = stream;
    void video.play().catch(() => {
      setError('Could not start camera preview. Check camera permission and try again.');
    });
  }, [stream]);

  const startCamera = async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Live camera is unavailable here. Use localhost or HTTPS in a supported browser.');
      return;
    }
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      if (requestId !== requestIdRef.current) {
        cameraStream.getTracks().forEach((track) => track.stop());
        return;
      }
      setCapturedFrame('');
      setShowDemoResult(false);
      setStream(cameraStream);
    } catch (cameraError) {
      const message = cameraError instanceof DOMException && cameraError.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
        : cameraError instanceof DOMException && cameraError.name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : 'Could not access the camera. Check that it is connected and not being used by another app.';
      setError(message);
    }
  };

  const stopCamera = () => {
    requestIdRef.current += 1;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera preview is not ready yet. Wait for the video, then capture again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Could not capture a local camera frame in this browser.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedFrame(canvas.toDataURL('image/jpeg', 0.86));
    setShowDemoResult(false);
    setError('');
  };

  return (
    <section aria-labelledby="live-webcam-heading" className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Device camera</p>
          <h5 id="live-webcam-heading" className="mt-1 text-sm font-semibold text-white">Live webcam preview</h5>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${stream ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-slate-600 text-slate-300'}`}>{stream ? 'CAMERA ON • LOCAL PREVIEW' : 'CAMERA OFF'}</span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px]">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
          {stream ? (
            <video ref={videoRef} autoPlay muted playsInline aria-label="Local live webcam preview" className="h-full w-full object-cover" />
          ) : capturedFrame ? (
            <img src={capturedFrame} alt="Locally captured webcam frame" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-xs text-slate-400">Camera is off. Start preview to request access to this device’s camera.</div>
          )}
          {stream && <span className="absolute left-2 top-2 rounded bg-slate-950/80 px-2 py-1 text-[9px] font-semibold text-emerald-200">LIVE PREVIEW • NOT RECORDED</span>}
        </div>
        <div className="flex flex-col gap-2">
          {stream && capturedFrame && <img src={capturedFrame} alt="Captured frame from local webcam preview" className="h-20 w-full rounded-lg border border-slate-700 object-cover" />}
          <button type="button" onClick={stream ? stopCamera : startCamera} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${stream ? 'border border-rose-400/40 text-rose-200 hover:bg-rose-500/10' : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'}`}>{stream ? 'Stop camera' : 'Start camera'}</button>
          <button type="button" onClick={captureFrame} disabled={!stream} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">Capture frame</button>
          {capturedFrame && <button type="button" onClick={() => { setShowDemoResult(true); setError(''); }} className="rounded-lg border border-amber-300/40 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/10">Run demo scan</button>}
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/5 p-2.5 text-xs leading-5 text-rose-200">{error}</p>}
      {showDemoResult && capturedFrame && (
        <div aria-live="polite" className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/5 p-3">
          <p className="text-xs font-semibold text-amber-200">SIMULATED RESULT • Live frame was not analyzed</p>
          <p className="mt-2 text-xs leading-5 text-slate-200">Example PPE result: helmet detected, safety vest detected, respirator missing. This fixed demo result is not derived from the camera image.</p>
          <p className="mt-2 text-[10px] leading-4 text-slate-400">The preview and captured frame stay in this page’s browser memory and are not uploaded or saved. Stop the camera when finished. Use a trained supervisor and approved site procedures for real PPE checks.</p>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-4 text-slate-400">The browser will request camera permission. Video is previewed locally only; no recording, server upload, facial recognition, or real PPE model is active.</p>
    </section>
  );
}

interface RoboflowModelStatus {
  configured: boolean;
  message: string;
}

interface RoboflowScanResult {
  provider: string;
  mode: string;
  disclaimer: string;
  detections: Array<{ label: string; confidence: number }>;
  equipment: Array<{ name: string; status: 'DETECTED' | 'NO_DETECTION'; confidence: number | null }>;
}

function RoboflowImageScanner({ token }: { token: string }) {
  const [previewUrl, setPreviewUrl] = useState('/vision/demo-worker-portrait.svg');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('Illustrative demo worker portrait');
  const [modelStatus, setModelStatus] = useState<RoboflowModelStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [scanResult, setScanResult] = useState<RoboflowScanResult | null>(null);
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [imageConsent, setImageConsent] = useState(false);
  const [imageDimensions, setImageDimensions] = useState('');

  useEffect(() => {
    let active = true;
    void authFetch<RoboflowModelStatus>('/vision/model-status', token)
      .then((status) => {
        if (active) setModelStatus(status);
      })
      .catch((error: unknown) => {
        if (active) setStatusError(error instanceof Error ? error.message : 'Could not check AI model status.');
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectImage = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selectedFile.type)) {
      setScanError('Choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setScanError('Image must be 5 MB or smaller.');
      return;
    }
    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextUrl);
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setImageConsent(false);
    setScanResult(null);
    setScanError('');
    setImageDimensions('');
    const image = new Image();
    image.onload = () => {
      setImageDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
      if (image.naturalWidth < 320 || image.naturalHeight < 320) {
        setScanError('Image is small; results may be unreliable. Use a clear image at least 320 pixels wide and high where possible.');
      }
    };
    image.onerror = () => setScanError('The selected image could not be opened. Choose another image.');
    image.src = nextUrl;
  };

  const analyzeImage = async () => {
    if (!file || !imageConsent || !modelStatus?.configured || isScanning) return;
    setIsScanning(true);
    setScanError('');
    setScanResult(null);
    try {
      const result = await authFetch<RoboflowScanResult>('/vision/analyze', token, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      setScanResult(result);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'PPE model analysis failed.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <section aria-labelledby="person-image-scan-heading" className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">PPE model scan</p>
          <h5 id="person-image-scan-heading" className="mt-1 text-sm font-semibold text-white">Analyze a person image</h5>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${modelStatus?.configured ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/5 text-amber-200'}`}>
          {modelStatus ? (modelStatus.configured ? 'ROBOFLOW MODEL READY' : 'MODEL NOT CONFIGURED') : statusError ? 'STATUS UNAVAILABLE' : 'CHECKING MODEL'}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div className="h-32 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
          <img src={previewUrl} alt="Local preview of the selected image; default is an illustrative demo portrait" className="h-full w-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-col items-start justify-center">
          <label className="cursor-pointer rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-400">
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const selectedFile = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                selectImage(selectedFile);
              }}
            />
          </label>
          <p className="mt-2 max-w-full break-all text-xs font-medium text-white">{fileName}</p>
          {imageDimensions && <p className="mt-1 text-[10px] text-slate-400">Image size: {imageDimensions} • Maximum 5 MB</p>}
          <p className="mt-1 text-[10px] leading-4 text-slate-400">Use a clear, well-lit image with the whole person and PPE visible. The sample portrait cannot be scanned.</p>
        </div>
      </div>
      {modelStatus && !modelStatus.configured && <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-500/5 p-2.5 text-xs leading-5 text-amber-100">{modelStatus.message} Set both variables in the server `.env` and restart the API to enable real model requests.</p>}
      {statusError && <p role="alert" className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/5 p-2.5 text-xs leading-5 text-rose-200">{statusError}</p>}
      <label className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-slate-300">
        <input type="checkbox" checked={imageConsent} onChange={(event) => setImageConsent(event.target.checked)} className="mt-0.5 accent-emerald-400" />
        <span>I understand that running a live scan sends this image from the server to Roboflow for inference. Do not scan anyone without authorization and consent.</span>
      </label>
      <button type="button" onClick={() => void analyzeImage()} disabled={!file || !imageConsent || !modelStatus?.configured || isScanning} className="mt-3 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40">
        {isScanning ? 'Analyzing with Roboflow…' : 'Analyze with Roboflow'}
      </button>
      {scanError && <p role="alert" className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/5 p-2.5 text-xs leading-5 text-rose-200">{scanError}</p>}
      {scanResult && (
        <div aria-live="polite" className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-500/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-cyan-100">LIVE MODEL OUTPUT • {scanResult.provider}</p>
            <span className="rounded-full border border-cyan-300/30 px-2 py-1 text-[9px] text-cyan-100">{scanResult.detections.length} detections</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {scanResult.equipment.map((item) => (
              <div key={item.name} className={`rounded-lg border p-2 ${item.status === 'DETECTED' ? 'border-emerald-400/25 bg-emerald-500/5' : 'border-slate-600 bg-slate-900/70'}`}>
                <p className="text-[10px] capitalize text-slate-400">{item.name}</p>
                <p className={`mt-1 text-xs font-semibold ${item.status === 'DETECTED' ? 'text-emerald-200' : 'text-slate-200'}`}>{item.status === 'DETECTED' ? `Detected • ${item.confidence}%` : 'No detection • Verify manually'}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Model labels and confidence</p>
            {scanResult.detections.length ? (
              <ul className="mt-2 space-y-1">
                {scanResult.detections.map((item, index) => <li key={`${item.label}-${index}`} className="flex justify-between gap-2 text-xs text-slate-200"><span className="break-all">{item.label}</span><span className="shrink-0">{item.confidence}%</span></li>)}
              </ul>
            ) : <p className="mt-2 text-xs text-slate-300">No objects were detected above the model's configured confidence threshold.</p>}
          </div>
          <p className="mt-3 border-t border-slate-700 pt-2 text-[10px] leading-4 text-slate-400">{scanResult.disclaimer}</p>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-4 text-slate-400">A model prediction is not a compliance decision. Images go to the configured Roboflow endpoint and are not retained by this application. Verify results with a trained supervisor and approved site procedures.</p>
    </section>
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
  setCreateDialog: (dialog: 'mine' | 'incident' | 'camera' | 'worker' | null) => void,
  setActiveView: (view: string) => void,
  updateDashboard: (update: (current: DashboardData) => DashboardData) => void,
  exportReport: () => void,
  sessionName: string,
  isAdmin: boolean,
  apiToken: string,
) {
  const riskSummary = [
    { label: 'Low', value: dashboard.riskDistribution.low, color: '#22c55e' },
    { label: 'Medium', value: dashboard.riskDistribution.medium, color: '#facc15' },
    { label: 'High', value: dashboard.riskDistribution.high, color: '#f97316' },
    { label: 'Critical', value: dashboard.riskDistribution.critical, color: '#ef4444' },
  ];

  const mapCoordinates: Record<string, { x: number; y: number }> = {
    'mine-korba': { x: 25, y: 48 },
    'mine-singrauli': { x: 47, y: 57 },
    'mine-dhanbad': { x: 12, y: 49 },
    'mine-bokaro': { x: 69, y: 32 },
    'mine-talcher': { x: 71, y: 66 },
    'mine-neyveli': { x: 45, y: 83 },
  };
  const mineMapArtwork: Record<string, { src: string; description: string }> = {
    'mine-korba': { src: '/maps/mine-korba.svg', description: 'Terraced open pit, switchback haul roads, coal handling area and water reserve' },
    'mine-singrauli': { src: '/maps/mine-singrauli.svg', description: 'Two open cuts, coal stockyard, haul routes and settling pond' },
    'mine-dhanbad': { src: '/maps/mine-dhanbad.svg', description: 'Underground gallery network, mine shaft and ventilation facilities' },
    'mine-bokaro': { src: '/maps/mine-bokaro.svg', description: 'Stepped open-cast benches, loading yard and conveyor line' },
    'mine-talcher': { src: '/maps/mine-talcher.svg', description: 'Elongated strip-mining cut, coal handling and rail spur' },
    'mine-neyveli': { src: '/maps/mine-neyveli.svg', description: 'Lignite benches, reclamation plots, power station and cooling ponds' },
  };
  const mapSites = dashboard.mines.map((mine, index) => ({
    id: mine.id,
    name: mine.name,
    risk: mine.riskLevel,
    ...(mapCoordinates[mine.id] ?? {
      x: 15 + ((index * 17) % 70),
      y: 18 + ((index * 23) % 65),
    }),
  }));
  const activeCamera = dashboard.vision.cameras.find((camera) => camera.id === selectedCameraId) ?? dashboard.vision.cameras[0];
  const activeCameraDetections = dashboard.vision.detections.filter((detection) => detection.cameraId === activeCamera?.id);
  const activeDetection = activeCameraDetections.find((detection) => detection.id === selectedDetectionId) ?? activeCameraDetections[0];
  const activeMine = dashboard.mines.find((mine) => mine.name === selectedMapSite) ?? dashboard.mines[0];
  const activeMapSite = mapSites.find((site) => site.name === selectedMapSite) ?? mapSites[0];
  const activeMineMap = mineMapArtwork[activeMine?.id] ?? {
    src: '/maps/mineguard-demo-map.svg',
    description: `${activeMine?.type ?? 'Mine'} site layout with haul roads and operational areas`,
  };
  const mineWorkers = dashboard.workers.filter((worker) => worker.mine === activeMine?.id);
  const mineAlerts = dashboard.alerts.filter((alert) => alert.status !== 'RESOLVED' && (alert.mine === activeMine?.id || alert.mine === activeMine?.name));
  const mineIncidents = dashboard.incidents.filter((incident) => incident.mine === activeMine?.id || incident.mine === activeMine?.name);
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
  const missingPpe = ppeChecks
    .filter((check) => ['NO', 'MISSING', 'FALSE'].includes(String(check.value ?? '').toUpperCase()))
    .map((check) => check.label.toLowerCase());
  const safetyInstructions = !activeDetection
    ? []
    : activeDetection.unknownPerson
      ? [
          'Do not approach or confront the person alone; keep a safe distance.',
          'Notify mine control or site security and follow the approved access-verification process.',
          'Do not identify, discipline, or restrict anyone based only on this simulated face match.',
        ]
      : activeDetection.restrictedZone || activeDetection.status === 'RESTRICTED_ZONE'
        ? [
            'Do not proceed farther into the restricted area; use the marked safe exit only when it is safe to do so.',
            'Notify mine control and the zone supervisor, then wait for explicit clearance before re-entry.',
            'Keep clear of blasting or other active exclusion zones and follow the site emergency procedure.',
            ...(missingPpe.length > 0 ? [`Do not resume work until required PPE is available and fitted: ${missingPpe.join(', ')}.`] : []),
          ]
        : missingPpe.length > 0
          ? [
              `Pause the task before entering the work area; missing or unconfirmed PPE: ${missingPpe.join(', ')}.`,
              'Obtain the required correctly fitted PPE and have the supervisor verify it before work resumes.',
              'If the required equipment is unavailable or damaged, remain in the designated safe area and report it.',
            ]
          : activeDetection.risk === 'HIGH' || activeDetection.risk === 'CRITICAL'
            ? [
                'Pause the activity and check the active zone hazards and current work authorization.',
                'Move to the designated safe area only if the route is clear, then notify the supervisor.',
                'Resume only after required controls and site-specific clearance are confirmed.',
              ]
            : [
                'Keep the helmet and all task-required PPE correctly fitted while inside the operating area.',
                'Stay within the authorized route and follow the site briefing and supervisor instructions.',
                'Recheck PPE before starting a new task or entering a higher-risk zone.',
              ];
  const zoneSpecificInstruction = activeDetection?.zone.toLowerCase().includes('haul road')
    ? 'Haul road reminder: stay outside vehicle exclusion lines and make eye contact with operators before crossing.'
    : activeDetection?.zone.toLowerCase().includes('blasting')
      ? 'Blasting-area reminder: remain outside the exclusion boundary until the authorized all-clear is issued.'
      : null;

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
                {activeCamera?.id === 'CAM-001' ? (
                  <img className="absolute inset-0 h-full w-full object-cover" src="/vision/main-entry-camera.svg" alt="Synthetic demo illustration of the main mine entrance, access gate, guard cabin, haul truck, and workers; not a real camera image." />
                ) : (
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
                  <g transform="translate(322 214)">
                    <ellipse cx="118" cy="142" rx="137" ry="15" fill="#101713" opacity=".58" />
                    <path d="M13 43 42 6l132 14-13 83-148-13Z" fill="#e2a928" stroke="#513e20" strokeWidth="5" />
                    <path d="m24 43 25-28 112 12-9 61-121-11Z" fill="#bb7d20" stroke="#f8d05b" strokeWidth="3" />
                    <path d="m41 27 110 12m-120 2 120 12m-126 2 120 12" fill="none" stroke="#f3c64c" strokeWidth="3" opacity=".9" />
                    <path d="M42 6 174 20 168 39 30 25Z" fill="#f0c13d" stroke="#fff0a1" strokeWidth="2" />
                    <path d="m162 75 26 5 27 31-5 32h-42l-15-22Z" fill="#e8a624" stroke="#60471f" strokeWidth="4" />
                    <path d="m178 86 20 5 17 21-33-2Z" fill="#243c3c" stroke="#d6d1b3" strokeWidth="3" />
                    <path d="M187 91 197 94l10 13h-19Z" fill="#9fb2a5" opacity=".72" />
                    <path d="m213 111 13 4v23h-16Z" fill="#d77a19" stroke="#62421b" strokeWidth="3" />
                    <path d="M20 99h198v28H20z" fill="#414840" stroke="#252b26" strokeWidth="4" />
                    <path d="M24 105h185" stroke="#edb534" strokeWidth="5" />
                    <path d="M36 127h181" stroke="#202622" strokeWidth="7" />
                    <g fill="#171c19" stroke="#81877c" strokeWidth="5">
                      <circle cx="61" cy="131" r="25" /><circle cx="119" cy="131" r="25" /><circle cx="190" cy="131" r="25" />
                    </g>
                    <g fill="#c6c8b9" stroke="#4c534a" strokeWidth="3">
                      <circle cx="61" cy="131" r="9" /><circle cx="119" cy="131" r="9" /><circle cx="190" cy="131" r="9" />
                    </g>
                    <g fill="#f4c84d">
                      <circle cx="61" cy="131" r="3" /><circle cx="119" cy="131" r="3" /><circle cx="190" cy="131" r="3" />
                    </g>
                    <path d="M174 49v28m-8-3 25 5" stroke="#554529" strokeWidth="5" />
                    <path d="M174 48v25m-7-2 23 5" stroke="#f0bd38" strokeWidth="3" />
                    <rect x="202" y="117" width="10" height="7" rx="2" fill="#fff1a1" />
                    <path d="M8 93h20" stroke="#fff0ae" strokeWidth="5" />
                    <path d="m60 4 4-10h15l2 12" fill="#59635b" stroke="#29322c" strokeWidth="3" />
                  </g>
                  <g transform="translate(602 265)">
                    <circle cx="14" cy="7" r="7" fill="#d5b495" /><path d="M7 15h15l5 38H2z" fill="#d99028" /><path d="M8 18h12M5 30h18" stroke="#f2d26c" strokeWidth="4" /><path d="M7 52 4 73m12-21 5 21" stroke="#202622" strokeWidth="6" />
                    <path d="M5 5Q6-5 14-5T23 5l3 2H2z" fill="#f2c744" stroke="#9d6b1d" strokeWidth="1.5" /><path d="M4 5h20" stroke="#fff0a2" strokeWidth="2" /><path d="M14-4v8" stroke="#ffe68a" strokeWidth="1.5" /><path d="M4 7 7 14m17-7-3 7" fill="none" stroke="#e7dfc8" strokeWidth="1.2" /><path d="M8-1q6-5 12 0" fill="none" stroke="#fff4bf" strokeWidth="1" />
                  </g>
                  <g transform="translate(278 271) scale(.82)">
                    <circle cx="14" cy="7" r="7" fill="#c89f7d" /><path d="M7 15h15l5 38H2z" fill="#df8b26" /><path d="M7 52 4 73m12-21 5 21" stroke="#202622" strokeWidth="6" />
                    <path d="M5 5Q6-5 14-5T23 5l3 2H2z" fill="#f2c744" stroke="#9d6b1d" strokeWidth="1.5" /><path d="M4 5h20" stroke="#fff0a2" strokeWidth="2" /><path d="M14-4v8" stroke="#ffe68a" strokeWidth="1.5" /><path d="M4 7 7 14m17-7-3 7" fill="none" stroke="#e7dfc8" strokeWidth="1.2" /><path d="M8-1q6-5 12 0" fill="none" stroke="#fff4bf" strokeWidth="1" />
                  </g>
                  <g transform="translate(530 275) scale(.72)">
                    <circle cx="14" cy="7" r="7" fill="#d5b495" /><path d="M7 15h15l5 38H2z" fill="#c77822" /><path d="M7 52 4 73m12-21 5 21" stroke="#202622" strokeWidth="6" />
                    <path d="M5 5Q6-5 14-5T23 5l3 2H2z" fill="#f2c744" stroke="#9d6b1d" strokeWidth="1.5" /><path d="M4 5h20" stroke="#fff0a2" strokeWidth="2" /><path d="M14-4v8" stroke="#ffe68a" strokeWidth="1.5" /><path d="M4 7 7 14m17-7-3 7" fill="none" stroke="#e7dfc8" strokeWidth="1.2" /><path d="M8-1q6-5 12 0" fill="none" stroke="#fff4bf" strokeWidth="1" />
                  </g>
                  <g transform="translate(715 276) scale(.65)">
                    <circle cx="14" cy="7" r="7" fill="#bd9272" /><path d="M7 15h15l5 38H2z" fill="#d89028" /><path d="M7 52 4 73m12-21 5 21" stroke="#202622" strokeWidth="6" />
                    <path d="M5 5Q6-5 14-5T23 5l3 2H2z" fill="#f2c744" stroke="#9d6b1d" strokeWidth="1.5" /><path d="M4 5h20" stroke="#fff0a2" strokeWidth="2" /><path d="M14-4v8" stroke="#ffe68a" strokeWidth="1.5" /><path d="M4 7 7 14m17-7-3 7" fill="none" stroke="#e7dfc8" strokeWidth="1.2" /><path d="M8-1q6-5 12 0" fill="none" stroke="#fff4bf" strokeWidth="1" />
                  </g>
                  <rect width="960" height="420" fill="url(#cameraNoise)" opacity=".42" />
                  <path d="M0 0h960v420H0z" fill="none" stroke="#d4dfd4" strokeOpacity=".16" strokeWidth="18" />
                  <path d="M14 14h35M14 14v25M946 14h-35M946 14v25M14 406h35M14 406v-25M946 406h-35M946 406v-25" fill="none" stroke="#d9e4db" strokeOpacity=".65" strokeWidth="2" />
                </svg>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
                {activeCameraDetections.slice(0, 4).map((detection, index) => {
                  const positions = [
                    { left: '29%', top: '62%', height: '21%', width: '4%' },
                    { left: '55%', top: '62%', height: '21%', width: '4%' },
                    { left: '63%', top: '60%', height: '23%', width: '4%' },
                    { left: '75%', top: '61%', height: '22%', width: '4%' },
                  ];
                  const isSelected = activeDetection?.id === detection.id;
                  const isHighRisk = detection.risk === 'CRITICAL' || detection.risk === 'HIGH';
                  return <button
                    key={detection.id}
                    type="button"
                    aria-label={`Select ${detection.unknownPerson ? 'unknown person' : detection.workerName}, demo detected`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDetectionId(detection.id)}
                    style={positions[index]}
                    className={`absolute z-10 rounded-md border-2 bg-transparent transition ${isSelected ? 'border-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.7)]' : isHighRisk ? 'border-amber-400/90' : 'border-emerald-400/90'}`}
                  >
                    <span className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-1 text-[8px] font-semibold text-slate-950 ${isSelected ? 'bg-cyan-300' : isHighRisk ? 'bg-amber-400/90' : 'bg-emerald-400/90'}`}>{detection.unknownPerson ? 'UNKNOWN' : detection.workerId}</span>
                  </button>;
                })}
                {activeDetection && <div className="pointer-events-none absolute inset-x-0 top-[62%] h-0.5 animate-pulse bg-cyan-300/70 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />}
                <div className="absolute left-4 top-4 rounded-full border border-amber-300/40 bg-slate-950/75 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-200">SIMULATED CAMERA FEED</div>
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-300/30 bg-slate-950/75 px-2 py-1 text-[9px] font-medium text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />DEMO MODE</div>
                <div className="absolute left-4 top-14 rounded bg-slate-950/70 px-2 py-1 font-mono text-[9px] text-slate-200">{activeCamera?.id ?? 'CAM-001'} • {activeCamera?.zone ?? 'Zone A'} • {activeCameraDetections.length} DEMO PERSONS</div>
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
                  <p className="mt-1 text-[10px] text-cyan-200">Roboflow hosted model • only analyzed when configured and consented</p>
                </div>
                {activeDetection && <span className={`rounded-full border px-2 py-1 text-[10px] ${riskTone(activeDetection.risk)}`}>{activeDetection.risk} RISK</span>}
              </div>
              <RoboflowImageScanner token={apiToken} />
              <LiveWebcamDemo />
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
                          const unknown = ['UNKNOWN', 'NOT RECORDED', 'N/A'].includes(String(check.value ?? '').toUpperCase());
                          return <div key={check.label} className={`rounded-lg border px-2.5 py-2 ${detected ? 'border-emerald-500/25 bg-emerald-500/5' : unknown ? 'border-slate-600 bg-slate-800/40' : 'border-rose-500/25 bg-rose-500/5'}`}>
                            <p className="text-[10px] text-slate-400">{check.label}</p>
                            <p className={`mt-0.5 text-xs font-semibold ${detected ? 'text-emerald-300' : unknown ? 'text-slate-300' : 'text-rose-300'}`}>{detected ? '✓ Detected' : unknown ? '— Unknown / not assessed' : check.value ? '✕ Missing' : '— Not recorded'}</p>
                          </div>;
                        })}
                      </div>
                      <section aria-live="polite" aria-labelledby="person-safety-instructions" className={`mt-4 rounded-xl border p-3 ${activeDetection.unknownPerson || activeDetection.restrictedZone || missingPpe.length > 0 || activeDetection.risk === 'HIGH' || activeDetection.risk === 'CRITICAL' ? 'border-amber-400/30 bg-amber-500/5' : 'border-emerald-400/25 bg-emerald-500/5'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Selected person safety plan</p>
                            <h5 id="person-safety-instructions" className="mt-1 text-sm font-semibold text-white">{activeDetection.unknownPerson ? 'Access verification required' : activeDetection.restrictedZone ? 'Restricted-zone response' : missingPpe.length > 0 ? 'PPE corrective steps' : activeDetection.risk === 'HIGH' || activeDetection.risk === 'CRITICAL' ? 'High-risk response' : 'Safe-work reminders'}</h5>
                          </div>
                          <span className="rounded-full border border-amber-300/30 bg-slate-950/50 px-2 py-1 text-[9px] font-semibold tracking-wide text-amber-200">SIMULATED GUIDANCE</span>
                        </div>
                        <ol className="mt-3 space-y-2">
                          {safetyInstructions.map((instruction, index) => (
                            <li key={instruction} className="flex gap-2 text-xs leading-5 text-slate-200">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-emerald-200">{index + 1}</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                          {zoneSpecificInstruction && (
                            <li className="rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-xs leading-5 text-slate-200">{zoneSpecificInstruction}</li>
                          )}
                        </ol>
                        <p className="mt-3 border-t border-slate-700 pt-2 text-[10px] leading-4 text-slate-400">Demo-only recommendation based on simulated detection data. Follow approved mine SOPs, emergency procedures, and supervisor direction; camera output is not a disciplinary or emergency decision.</p>
                      </section>
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
                  <h3 className="mt-1 text-lg font-semibold text-white">Individual mine map illustrations</h3>
                </div>
                <label className="text-xs text-slate-400">
                  Select mine location
                  <select value={selectedMapSite} onChange={(event) => setSelectedMapSite(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white sm:min-w-52">
                    {mapSites.map((site) => <option key={site.id} value={site.name}>{site.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="relative mt-4 aspect-[2/1] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                <img key={activeMineMap.src} src={activeMineMap.src} alt={`Synthetic demo map for ${activeMine?.name ?? 'selected mine'}: ${activeMineMap.description}. Not to scale.`} className="absolute inset-0 h-full w-full object-fill transition-opacity duration-300" />
                {mapSites.map((site, index) => (
                  <button
                    key={site.id}
                    type="button"
                    title={`Select ${site.name} — ${site.risk} risk`}
                    aria-label={`Select ${site.name}, ${site.risk} risk`}
                    aria-pressed={selectedMapSite === site.name}
                    onClick={() => setSelectedMapSite(site.name)}
                    style={{ left: `${site.x}%`, top: `${site.y}%` }}
                    className={`absolute z-10 flex h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 px-1.5 text-[10px] font-bold shadow-lg transition hover:z-20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 ${selectedMapSite === site.name ? 'scale-110 border-white bg-emerald-400 text-slate-950 ring-2 ring-emerald-300/60' : `${site.risk === 'CRITICAL' ? 'border-red-100 bg-red-500 text-white' : site.risk === 'HIGH' ? 'border-orange-100 bg-orange-500 text-white' : site.risk === 'MEDIUM' ? 'border-yellow-100 bg-yellow-400 text-slate-950' : 'border-emerald-100 bg-emerald-500 text-slate-950'}`}`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </button>
                ))}
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 shadow-lg backdrop-blur-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${activeMapSite?.risk === 'CRITICAL' ? 'bg-red-400' : activeMapSite?.risk === 'HIGH' ? 'bg-orange-400' : activeMapSite?.risk === 'MEDIUM' ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                  <span className="text-xs font-semibold text-white">{activeMine?.name ?? selectedMapSite}</span>
                </div>
                <span className="absolute right-3 top-3 rounded-lg border border-amber-200/30 bg-slate-950/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100 shadow-lg backdrop-blur-sm">DEMO MAP • NOT TO SCALE</span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent p-3 pt-12 sm:p-4 sm:pt-14">
                  <div>
                    <p className="text-sm font-semibold text-white">{activeMine?.name ?? 'Mine'} • {activeMineMap.description}</p>
                    <p className="mt-1 text-[10px] text-slate-200 sm:text-xs">Original synthetic local artwork • no external map requests</p>
                  </div>
                  <div className="hidden rounded-lg border border-white/15 bg-slate-950/75 px-3 py-2 text-[10px] text-slate-200 sm:block">
                    <p><span className="text-amber-200">—</span> Haul road</p>
                    <p className="mt-1"><span className="text-teal-200">≈</span> Water reserve</p>
                  </div>
                </div>
              </div>
              <div aria-live="polite" className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Selected mine • {activeMine?.mineId ?? '—'}</p>
                    <p className="mt-1 font-semibold text-white">{activeMine?.name ?? 'Select a mine'} <span className="font-normal text-slate-400">• {activeMine?.location ?? 'Location unavailable'}</span></p>
                    <p className="mt-1 text-xs text-slate-400">{activeMine?.type ?? 'Mine'} • {activeMine?.status ?? 'Status unavailable'}</p>
                  </div>
                  <button type="button" onClick={() => setActiveView('mines')} className="rounded-lg border border-emerald-400/40 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/10">View mine portfolio</button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3"><p className="text-[10px] uppercase text-slate-400">Risk score</p><p className="mt-1 font-semibold text-white">{activeMine?.riskScore ?? '—'} <span className="text-xs text-slate-400">/100</span></p><span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] ${riskTone(activeMine?.riskLevel ?? 'LOW')}`}>{activeMine?.riskLevel ?? '—'}</span></div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3"><p className="text-[10px] uppercase text-slate-400">Workers</p><p className="mt-1 font-semibold text-white">{mineWorkers.length}<span className="ml-1 text-xs font-normal text-slate-400">tracked</span></p><p className="mt-1 text-[10px] text-slate-400">{activeMine?.workerCount ?? 0} assigned at mine</p></div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3"><p className="text-[10px] uppercase text-slate-400">Open alerts</p><p className="mt-1 font-semibold text-white">{mineAlerts.length}</p><p className="mt-1 text-[10px] text-slate-400">Requiring attention</p></div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3"><p className="text-[10px] uppercase text-slate-400">Compliance</p><p className="mt-1 font-semibold text-white">{activeMine?.compliance ?? '—'}%</p><p className="mt-1 text-[10px] text-slate-400">{mineIncidents.length} incident records</p></div>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-slate-400">Select a numbered marker, mine button, or dropdown to switch this mine's illustration and site snapshot. Every illustration is synthetic, not to scale, and not a surveyed operational map.</p>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Worker Safety</p>
              <p className="mt-1 text-xs text-slate-400">{dashboard.workers.length} employees in the roster</p>
            </div>
            {isAdmin && <button type="button" onClick={() => setCreateDialog('worker')} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400">Add Employee</button>}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700 text-slate-300"><tr><th className="px-3 py-3">Worker</th><th className="px-3 py-3">Mine</th><th className="px-3 py-3">Zone</th><th className="px-3 py-3">PPE</th><th className="px-3 py-3">Status</th></tr></thead>
              <tbody>
                {dashboard.workers.map((worker) => (
                  <tr key={worker.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-3 py-3 text-white">{worker.name}<span className="mt-1 block text-xs text-slate-400">{worker.workerId} • {worker.role} • {worker.department}</span></td>
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
