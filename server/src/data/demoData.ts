export type Role =
  | 'ADMIN'
  | 'SAFETY_MANAGER'
  | 'MINE_MANAGER'
  | 'INSPECTOR'
  | 'SUPERVISOR'
  | 'WORKER'
  | 'VIEWER';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  assignedMines: string[];
}

export interface MineRecord {
  id: string;
  mineId: string;
  name: string;
  location: string;
  type: string;
  manager: string;
  workerCount: number;
  riskScore: number;
  safetyScore: number;
  compliance: number;
  equipmentCount: number;
  lastInspection: string;
  nextInspection: string;
  riskLevel: RiskLevel;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface WorkerRecord {
  id: string;
  workerId: string;
  name: string;
  role: string;
  mine: string;
  department: string;
  shift: string;
  trainingStatus: string;
  ppeStatus: string;
  zone: string;
  safetyStatus: 'SAFE' | 'WARNING' | 'HIGH_RISK';
}

export interface EquipmentRecord {
  id: string;
  equipmentId: string;
  name: string;
  type: string;
  mine: string;
  status: 'OPERATIONAL' | 'WARNING' | 'MAINTENANCE' | 'CRITICAL' | 'OFFLINE';
  healthScore: number;
  temperature: number;
  vibration: number;
  lastMaintenance: string;
  nextMaintenance: string;
  failureProbability: number;
}

export interface IncidentRecord {
  id: string;
  incidentId: string;
  title: string;
  mine: string;
  zone: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  date: string;
  description: string;
  peopleAffected: number;
  investigator: string;
  rootCause: string;
  correctiveAction: string;
  status: 'REPORTED' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';
}

export interface AlertRecord {
  id: string;
  alertId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO';
  mine: string;
  description: string;
  time: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  assignedUser: string;
}

export interface ComplianceRecord {
  id: string;
  documentId: string;
  type: string;
  number: string;
  mine: string;
  responsiblePerson: string;
  expiryDate: string;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';
  daysRemaining: number;
}

export interface ActionRecord {
  id: string;
  actionId: string;
  issue: string;
  mine: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedUser: string;
  dueDate: string;
  status: 'OPEN' | 'URGENT' | 'IN_PROGRESS' | 'OVERDUE' | 'COMPLETED' | 'VERIFIED';
  evidence: string;
  completionDate: string | null;
  verification: string;
}

export interface PredictionRecord {
  id: string;
  predictionId: string;
  mine: string;
  currentRisk: number;
  predictedRisk: number;
  riskLevel: RiskLevel;
  confidence: number;
  timeWindow: string;
  factors: string[];
}

export interface NotificationRecord {
  id: string;
  notificationId: string;
  title: string;
  message: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
  relatedEntity: string;
}

export interface AuditLogRecord {
  id: string;
  user: string;
  action: string;
  entity: string;
  time: string;
  previousValue: string;
  newValue: string;
}

export interface EmergencyRecord {
  id: string;
  emergencyId: string;
  incident: string;
  mine: string;
  zone: string;
  time: string;
  severity: 'HIGH' | 'CRITICAL';
  peopleAffected: number;
  evacuationStatus: string;
  responseTeam: string;
  incidentCommander: string;
  safeZones: string[];
  assemblyPoint: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
}

export interface RecommendationRecord {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  suggestedAction: string;
  expectedImpact: string;
}

export const demoUsers: UserRecord[] = [
  { id: 'u-admin', name: 'Alicia Morgan', email: 'admin@mineguard.ai', password: 'admin123', role: 'ADMIN', assignedMines: ['mine-korba', 'mine-singrauli'] },
  { id: 'u-safety', name: 'Rohit Nair', email: 'safety@mineguard.ai', password: 'safety123', role: 'SAFETY_MANAGER', assignedMines: ['mine-korba', 'mine-bokaro'] },
  { id: 'u-mine', name: 'Suresh Patel', email: 'mine@mineguard.ai', password: 'mine123', role: 'MINE_MANAGER', assignedMines: ['mine-korba'] },
  { id: 'u-inspector', name: 'Anita Rao', email: 'inspector@mineguard.ai', password: 'inspect123', role: 'INSPECTOR', assignedMines: ['mine-dhanbad', 'mine-talcher'] },
  { id: 'u-supervisor', name: 'Shivam Das', email: 'supervisor@mineguard.ai', password: 'super123', role: 'SUPERVISOR', assignedMines: ['mine-singrauli'] },
  { id: 'u-worker', name: 'Naveen Yadav', email: 'worker@mineguard.ai', password: 'worker123', role: 'WORKER', assignedMines: ['mine-korba'] },
  { id: 'u-viewer', name: 'Meera Singh', email: 'viewer@mineguard.ai', password: 'viewer123', role: 'VIEWER', assignedMines: ['mine-dhanbad'] },
];

export const demoMines: MineRecord[] = [
  { id: 'mine-korba', mineId: 'M-101', name: 'Korba North', location: 'Korba, Chhattisgarh', type: 'Coal', manager: 'Rakesh Verma', workerCount: 126, riskScore: 82, safetyScore: 74, compliance: 86, equipmentCount: 18, lastInspection: '2026-09-18', nextInspection: '2026-10-18', riskLevel: 'CRITICAL', status: 'ACTIVE' },
  { id: 'mine-singrauli', mineId: 'M-102', name: 'Singrauli Central', location: 'Singrauli, MP', type: 'Coal', manager: 'Karthik Iyer', workerCount: 118, riskScore: 71, safetyScore: 79, compliance: 89, equipmentCount: 17, lastInspection: '2026-09-20', nextInspection: '2026-10-20', riskLevel: 'HIGH', status: 'ACTIVE' },
  { id: 'mine-dhanbad', mineId: 'M-103', name: 'Dhanbad East', location: 'Dhanbad, Jharkhand', type: 'Metal', manager: 'Punit Saha', workerCount: 94, riskScore: 58, safetyScore: 82, compliance: 91, equipmentCount: 15, lastInspection: '2026-09-15', nextInspection: '2026-10-15', riskLevel: 'MEDIUM', status: 'ACTIVE' },
  { id: 'mine-bokaro', mineId: 'M-104', name: 'Bokaro Open Cast', location: 'Bokaro, Jharkhand', type: 'Coal', manager: 'Amit Choudhury', workerCount: 102, riskScore: 65, safetyScore: 77, compliance: 84, equipmentCount: 16, lastInspection: '2026-09-17', nextInspection: '2026-10-17', riskLevel: 'HIGH', status: 'ACTIVE' },
  { id: 'mine-talcher', mineId: 'M-105', name: 'Talcher South', location: 'Talcher, Odisha', type: 'Coal', manager: 'Sunil Mohanty', workerCount: 88, riskScore: 42, safetyScore: 88, compliance: 95, equipmentCount: 13, lastInspection: '2026-09-10', nextInspection: '2026-10-10', riskLevel: 'LOW', status: 'ACTIVE' },
  { id: 'mine-neyveli', mineId: 'M-106', name: 'Neyveli West', location: 'Neyveli, Tamil Nadu', type: 'Lignite', manager: 'Vikram Reddy', workerCount: 79, riskScore: 48, safetyScore: 86, compliance: 92, equipmentCount: 12, lastInspection: '2026-09-08', nextInspection: '2026-10-08', riskLevel: 'LOW', status: 'ACTIVE' },
];

export const demoWorkers: WorkerRecord[] = [
  { id: 'w-101', workerId: 'W-101', name: 'Akhil Prasad', role: 'Driller', mine: 'mine-korba', department: 'Operations', shift: 'A', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Haul Road', safetyStatus: 'HIGH_RISK' },
  { id: 'w-102', workerId: 'W-102', name: 'Neha Kumar', role: 'Safety Officer', mine: 'mine-korba', department: 'Safety', shift: 'B', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Control Room', safetyStatus: 'SAFE' },
  { id: 'w-103', workerId: 'W-103', name: 'Sanjay Devi', role: 'Loader Operator', mine: 'mine-korba', department: 'Operations', shift: 'A', trainingStatus: 'Expired', ppeStatus: 'Missing Respirator', zone: 'Pit 3', safetyStatus: 'HIGH_RISK' },
  { id: 'w-104', workerId: 'W-104', name: 'Ritu Sharma', role: 'Inspector', mine: 'mine-singrauli', department: 'Inspection', shift: 'C', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Ventilation', safetyStatus: 'WARNING' },
  { id: 'w-105', workerId: 'W-105', name: 'Kunal Sen', role: 'Vehicle Operator', mine: 'mine-singrauli', department: 'Transport', shift: 'B', trainingStatus: 'Valid', ppeStatus: 'Helmet only', zone: 'Haul Road', safetyStatus: 'WARNING' },
  { id: 'w-106', workerId: 'W-106', name: 'Priya Naik', role: 'Surveyor', mine: 'mine-dhanbad', department: 'Engineering', shift: 'A', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Tunnel 2', safetyStatus: 'SAFE' },
  { id: 'w-107', workerId: 'W-107', name: 'Dinesh Jha', role: 'Mechanic', mine: 'mine-bokaro', department: 'Maintenance', shift: 'C', trainingStatus: 'Valid', ppeStatus: 'Incomplete', zone: 'Workshop', safetyStatus: 'WARNING' },
  { id: 'w-108', workerId: 'W-108', name: 'Mansi Sahu', role: 'Environmental Technician', mine: 'mine-talcher', department: 'Environment', shift: 'B', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Monitoring Station', safetyStatus: 'SAFE' },
  { id: 'w-109', workerId: 'W-109', name: 'Abhishek Rao', role: 'Electrician', mine: 'mine-neyveli', department: 'Electrical', shift: 'A', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Substation', safetyStatus: 'SAFE' },
  { id: 'w-110', workerId: 'W-110', name: 'Tania Roy', role: 'Shift Supervisor', mine: 'mine-korba', department: 'Operations', shift: 'A', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Pit 2', safetyStatus: 'SAFE' },
  { id: 'w-111', workerId: 'W-111', name: 'Bharat Nanda', role: 'Driller', mine: 'mine-korba', department: 'Operations', shift: 'C', trainingStatus: 'Expired', ppeStatus: 'Missing Hearing Protection', zone: 'Drill Zone', safetyStatus: 'HIGH_RISK' },
  { id: 'w-112', workerId: 'W-112', name: 'Roshni Bose', role: 'HSE Analyst', mine: 'mine-singrauli', department: 'Safety', shift: 'B', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Monitoring Cell', safetyStatus: 'SAFE' },
  { id: 'w-113', workerId: 'W-113', name: 'Piyush Das', role: 'Excavator Operator', mine: 'mine-bokaro', department: 'Operations', shift: 'A', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Open Pit', safetyStatus: 'SAFE' },
  { id: 'w-114', workerId: 'W-114', name: 'Vinod Mishra', role: 'Foreman', mine: 'mine-dhanbad', department: 'Operations', shift: 'B', trainingStatus: 'Valid', ppeStatus: 'Helmet only', zone: 'Stop 5', safetyStatus: 'WARNING' },
  { id: 'w-115', workerId: 'W-115', name: 'Shweta Ghosh', role: 'Geologist', mine: 'mine-talcher', department: 'Engineering', shift: 'A', trainingStatus: 'Valid', ppeStatus: 'Complete', zone: 'Sampling Unit', safetyStatus: 'SAFE' },
  { id: 'w-116', workerId: 'W-116', name: 'Rahul Sethi', role: 'Maintenance Tech', mine: 'mine-neyveli', department: 'Maintenance', shift: 'C', trainingStatus: 'Expired', ppeStatus: 'Incomplete', zone: 'Workshop', safetyStatus: 'HIGH_RISK' },
];

export const demoEquipment: EquipmentRecord[] = [
  { id: 'eq-101', equipmentId: 'EQ-101', name: 'Excavator EX-102', type: 'Excavator', mine: 'mine-korba', status: 'CRITICAL', healthScore: 62, temperature: 96, vibration: 7.4, lastMaintenance: '2026-08-12', nextMaintenance: '2026-10-07', failureProbability: 78 },
  { id: 'eq-102', equipmentId: 'EQ-102', name: 'Haul Truck HT-11', type: 'Truck', mine: 'mine-korba', status: 'WARNING', healthScore: 71, temperature: 88, vibration: 6.2, lastMaintenance: '2026-08-19', nextMaintenance: '2026-10-08', failureProbability: 46 },
  { id: 'eq-103', equipmentId: 'EQ-103', name: 'Drill D-04', type: 'Drill', mine: 'mine-korba', status: 'MAINTENANCE', healthScore: 58, temperature: 81, vibration: 5.8, lastMaintenance: '2026-07-29', nextMaintenance: '2026-10-02', failureProbability: 59 },
  { id: 'eq-104', equipmentId: 'EQ-104', name: 'Ventilator V-02', type: 'Ventilation', mine: 'mine-singrauli', status: 'WARNING', healthScore: 66, temperature: 76, vibration: 4.3, lastMaintenance: '2026-08-08', nextMaintenance: '2026-10-05', failureProbability: 44 },
  { id: 'eq-105', equipmentId: 'EQ-105', name: 'Crusher C-07', type: 'Crusher', mine: 'mine-singrauli', status: 'OPERATIONAL', healthScore: 84, temperature: 72, vibration: 3.9, lastMaintenance: '2026-09-01', nextMaintenance: '2026-10-22', failureProbability: 17 },
  { id: 'eq-106', equipmentId: 'EQ-106', name: 'Shovel SH-02', type: 'Shovel', mine: 'mine-dhanbad', status: 'WARNING', healthScore: 73, temperature: 85, vibration: 6.1, lastMaintenance: '2026-08-31', nextMaintenance: '2026-10-13', failureProbability: 36 },
  { id: 'eq-107', equipmentId: 'EQ-107', name: 'Conveyor CV-03', type: 'Conveyor', mine: 'mine-bokaro', status: 'MAINTENANCE', healthScore: 61, temperature: 79, vibration: 5.9, lastMaintenance: '2026-07-12', nextMaintenance: '2026-10-06', failureProbability: 51 },
  { id: 'eq-108', equipmentId: 'EQ-108', name: 'Pump P-18', type: 'Water Pump', mine: 'mine-bokaro', status: 'OPERATIONAL', healthScore: 88, temperature: 69, vibration: 3.5, lastMaintenance: '2026-08-27', nextMaintenance: '2026-10-30', failureProbability: 11 },
  { id: 'eq-109', equipmentId: 'EQ-109', name: 'Generator G-02', type: 'Generator', mine: 'mine-talcher', status: 'OPERATIONAL', healthScore: 91, temperature: 65, vibration: 3.8, lastMaintenance: '2026-09-05', nextMaintenance: '2026-10-26', failureProbability: 9 },
  { id: 'eq-110', equipmentId: 'EQ-110', name: 'Dust Suppressor DS-07', type: 'Dust Control', mine: 'mine-neyveli', status: 'WARNING', healthScore: 69, temperature: 74, vibration: 4.2, lastMaintenance: '2026-08-18', nextMaintenance: '2026-10-09', failureProbability: 31 },
  { id: 'eq-111', equipmentId: 'EQ-111', name: 'Excavator EX-118', type: 'Excavator', mine: 'mine-singrauli', status: 'CRITICAL', healthScore: 57, temperature: 94, vibration: 7.8, lastMaintenance: '2026-08-15', nextMaintenance: '2026-10-04', failureProbability: 74 },
  { id: 'eq-112', equipmentId: 'EQ-112', name: 'Loader L-08', type: 'Loader', mine: 'mine-dhanbad', status: 'OFFLINE', healthScore: 40, temperature: 71, vibration: 4.8, lastMaintenance: '2026-07-08', nextMaintenance: '2026-10-11', failureProbability: 68 },
  { id: 'eq-113', equipmentId: 'EQ-113', name: 'Fan System F-05', type: 'Fan', mine: 'mine-neyveli', status: 'OPERATIONAL', healthScore: 82, temperature: 70, vibration: 3.7, lastMaintenance: '2026-09-11', nextMaintenance: '2026-10-25', failureProbability: 14 },
  { id: 'eq-114', equipmentId: 'EQ-114', name: 'Compressor C-14', type: 'Compressor', mine: 'mine-talcher', status: 'WARNING', healthScore: 68, temperature: 81, vibration: 5.1, lastMaintenance: '2026-08-09', nextMaintenance: '2026-10-18', failureProbability: 42 },
  { id: 'eq-115', equipmentId: 'EQ-115', name: 'Drill D-09', type: 'Drill', mine: 'mine-korba', status: 'OPERATIONAL', healthScore: 86, temperature: 73, vibration: 4.5, lastMaintenance: '2026-09-02', nextMaintenance: '2026-10-20', failureProbability: 18 },
  { id: 'eq-116', equipmentId: 'EQ-116', name: 'Safety Scanner S-11', type: 'Sensor', mine: 'mine-korba', status: 'MAINTENANCE', healthScore: 60, temperature: 75, vibration: 3.0, lastMaintenance: '2026-08-06', nextMaintenance: '2026-10-03', failureProbability: 39 },
];

export const demoIncidents: IncidentRecord[] = [
  { id: 'inc-101', incidentId: 'INC-101', title: 'Methane concentration spike', mine: 'mine-korba', zone: 'Coal seam 4', type: 'Gas', severity: 'CRITICAL', date: '2026-10-05', description: 'Methane exceeded safe threshold in the north corridor.', peopleAffected: 7, investigator: 'Anita Rao', rootCause: 'Gas detector calibration overdue and ventilation drop', correctiveAction: 'Restrict affected zone and recalibrate sensors', status: 'ACTION_REQUIRED' },
  { id: 'inc-102', incidentId: 'INC-102', title: 'Haul truck brake failure', mine: 'mine-singrauli', zone: 'Haul Road', type: 'Equipment', severity: 'HIGH', date: '2026-10-04', description: 'Truck lost braking performance during descent.', peopleAffected: 2, investigator: 'Rohit Nair', rootCause: 'Brake system inspection delayed', correctiveAction: 'Remove unit from service and inspect brake assemblies', status: 'INVESTIGATING' },
  { id: 'inc-103', incidentId: 'INC-103', title: 'Worker fall near conveyor', mine: 'mine-bokaro', zone: 'Workshop 2', type: 'Worker Safety', severity: 'MEDIUM', date: '2026-10-02', description: 'Worker slipped while walking around conveyor panel', peopleAffected: 1, investigator: 'Shivam Das', rootCause: 'Ground surface wet and missing warning signage', correctiveAction: 'Mark unsafe walking path and install signage', status: 'RESOLVED' },
  { id: 'inc-104', incidentId: 'INC-104', title: 'Dust emission alarm', mine: 'mine-dhanbad', zone: 'Ore processing', type: 'Environment', severity: 'HIGH', date: '2026-09-30', description: 'Dust levels exceeded threshold in ore crushing zone.', peopleAffected: 4, investigator: 'Punit Saha', rootCause: 'Dust suppression pump underperforming', correctiveAction: 'Service suppression pumps and inspect filter media', status: 'ACTION_REQUIRED' },
  { id: 'inc-105', incidentId: 'INC-105', title: 'Electrical bus shutdown', mine: 'mine-neyveli', zone: 'Substation', type: 'Power', severity: 'MEDIUM', date: '2026-09-28', description: 'Partial shutdown triggered emergency backup system.', peopleAffected: 0, investigator: 'Vikram Reddy', rootCause: 'Busbar insulation degradation', correctiveAction: 'Replace insulation and test circuit integrity', status: 'RESOLVED' },
  { id: 'inc-106', incidentId: 'INC-106', title: 'Roof cracking alert', mine: 'mine-talcher', zone: 'Panel B', type: 'Geotechnical', severity: 'HIGH', date: '2026-09-26', description: 'Cave-in risk flagged by geologist survey.', peopleAffected: 6, investigator: 'Sunil Mohanty', rootCause: 'Unsupported roof segment after blasting', correctiveAction: 'Reinforce roof with additional support mesh', status: 'INVESTIGATING' },
  { id: 'inc-107', incidentId: 'INC-107', title: 'Overheat sensor on shovel', mine: 'mine-singrauli', zone: 'Pit East', type: 'Equipment', severity: 'HIGH', date: '2026-09-24', description: 'Hydraulic temperatures exceeded safe range.', peopleAffected: 1, investigator: 'Karthik Iyer', rootCause: 'Cooling system blockage', correctiveAction: 'Perform cooling system cleanout and thermal scan', status: 'RESOLVED' },
  { id: 'inc-108', incidentId: 'INC-108', title: 'Unplanned gas venting', mine: 'mine-korba', zone: 'Vent stack', type: 'Gas', severity: 'HIGH', date: '2026-09-21', description: 'Ventilation stack triggered alarm around night shift.', peopleAffected: 3, investigator: 'Alicia Morgan', rootCause: 'Ventilation inspection overdue', correctiveAction: 'Inspect vent stack and restore schedule compliance', status: 'CLOSED' },
  { id: 'inc-109', incidentId: 'INC-109', title: 'Worker PPE breach', mine: 'mine-bokaro', zone: 'Open Pit', type: 'Worker Safety', severity: 'MEDIUM', date: '2026-09-18', description: 'Three workers entered active zone without dust masks.', peopleAffected: 3, investigator: 'Shivam Das', rootCause: 'Supervisor oversight and missing PPE enforcement', correctiveAction: 'Counsel workers and enforce PPE observation audits', status: 'RESOLVED' },
  { id: 'inc-110', incidentId: 'INC-110', title: 'Compressed air leak', mine: 'mine-neyveli', zone: 'Service bay', type: 'Maintenance', severity: 'LOW', date: '2026-09-16', description: 'Minor leak identified during inspection.', peopleAffected: 0, investigator: 'Vikram Reddy', rootCause: 'Pipe joint wear', correctiveAction: 'Replace joint coupler and pressure test', status: 'CLOSED' },
];

export const demoAlerts: AlertRecord[] = [
  { id: 'alt-101', alertId: 'ALT-101', type: 'Critical Risk', severity: 'CRITICAL', mine: 'mine-korba', description: 'Mine safety score dropped below escalation threshold', time: '2026-10-07T08:35:00Z', status: 'NEW', assignedUser: 'Rohit Nair' },
  { id: 'alt-102', alertId: 'ALT-102', type: 'Gas Warning', severity: 'HIGH', mine: 'mine-korba', description: 'Methane concentration spike in the north corridor', time: '2026-10-07T08:10:00Z', status: 'ACKNOWLEDGED', assignedUser: 'Alicia Morgan' },
  { id: 'alt-103', alertId: 'ALT-103', type: 'Equipment Failure', severity: 'HIGH', mine: 'mine-singrauli', description: 'Excavator EX-118 has critical overheating trend', time: '2026-10-06T18:40:00Z', status: 'IN_PROGRESS', assignedUser: 'Suresh Patel' },
  { id: 'alt-104', alertId: 'ALT-104', type: 'Worker Safety', severity: 'MEDIUM', mine: 'mine-bokaro', description: 'Workers entered restricted zone without respirators', time: '2026-10-06T17:20:00Z', status: 'NEW', assignedUser: 'Shivam Das' },
  { id: 'alt-105', alertId: 'ALT-105', type: 'Compliance Expiry', severity: 'HIGH', mine: 'mine-dhanbad', description: 'Forklift safety certificate expires in 6 days', time: '2026-10-05T14:00:00Z', status: 'ACKNOWLEDGED', assignedUser: 'Anita Rao' },
  { id: 'alt-106', alertId: 'ALT-106', type: 'Incident', severity: 'MEDIUM', mine: 'mine-neyveli', description: 'Electrical bus shutdown triggered backup response', time: '2026-09-28T11:15:00Z', status: 'RESOLVED', assignedUser: 'Vikram Reddy' },
  { id: 'alt-107', alertId: 'ALT-107', type: 'Corrective Action Overdue', severity: 'HIGH', mine: 'mine-bokaro', description: 'Action BA-203 is overdue beyond required SLA', time: '2026-10-04T09:50:00Z', status: 'IN_PROGRESS', assignedUser: 'Shivam Das' },
  { id: 'alt-108', alertId: 'ALT-108', type: 'Risk Increase', severity: 'MEDIUM', mine: 'mine-talcher', description: 'Risk increased by 18% due to ventilation review', time: '2026-10-03T07:45:00Z', status: 'RESOLVED', assignedUser: 'Sunil Mohanty' },
  { id: 'alt-109', alertId: 'ALT-109', type: ' Gas Warning ', severity: 'CRITICAL', mine: 'mine-korba', description: 'Gas detector anomaly detected at Ventilation Shaft 3', time: '2026-10-05T03:10:00Z', status: 'NEW', assignedUser: 'Rohit Nair' },
  { id: 'alt-110', alertId: 'ALT-110', type: 'Equipment Failure', severity: 'HIGH', mine: 'mine-singrauli', description: 'Water pump capacity fell below minimum threshold', time: '2026-10-02T20:15:00Z', status: 'RESOLVED', assignedUser: 'Karthik Iyer' },
];

export const demoCompliance: ComplianceRecord[] = [
  { id: 'comp-101', documentId: 'DOC-101', type: 'Safety Certificate', number: 'SC-2026-09', mine: 'mine-korba', responsiblePerson: 'Rohit Nair', expiryDate: '2026-10-15', status: 'EXPIRING_SOON', daysRemaining: 8 },
  { id: 'comp-102', documentId: 'DOC-102', type: 'Electrical Inspection', number: 'EI-2026-11', mine: 'mine-singrauli', responsiblePerson: 'Karthik Iyer', expiryDate: '2026-10-09', status: 'EXPIRING_SOON', daysRemaining: 2 },
  { id: 'comp-103', documentId: 'DOC-103', type: 'Gas Detector Calibration', number: 'GC-2026-05', mine: 'mine-korba', responsiblePerson: 'Anita Rao', expiryDate: '2026-09-30', status: 'EXPIRED', daysRemaining: -7 },
  { id: 'comp-104', documentId: 'DOC-104', type: 'Training Record', number: 'TR-487', mine: 'mine-dhanbad', responsiblePerson: 'Punit Saha', expiryDate: '2026-11-05', status: 'VALID', daysRemaining: 29 },
  { id: 'comp-105', documentId: 'DOC-105', type: 'Insurance Policy', number: 'IN-2017-44', mine: 'mine-bokaro', responsiblePerson: 'Amit Choudhury', expiryDate: '2026-10-20', status: 'EXPIRING_SOON', daysRemaining: 13 },
  { id: 'comp-106', documentId: 'DOC-106', type: 'Ventilation Audit', number: 'VA-991', mine: 'mine-talcher', responsiblePerson: 'Sunil Mohanty', expiryDate: '2026-11-02', status: 'VALID', daysRemaining: 26 },
  { id: 'comp-107', documentId: 'DOC-107', type: 'Dust Sampling License', number: 'DS-778', mine: 'mine-neyveli', responsiblePerson: 'Vikram Reddy', expiryDate: '2026-09-20', status: 'EXPIRED', daysRemaining: -17 },
  { id: 'comp-108', documentId: 'DOC-108', type: 'Forklift Inspection', number: 'FI-650', mine: 'mine-singrauli', responsiblePerson: 'Shivam Das', expiryDate: '2026-10-18', status: 'VALID', daysRemaining: 11 },
  { id: 'comp-109', documentId: 'DOC-109', type: 'Refresher PPE Training', number: 'PPE-045', mine: 'mine-korba', responsiblePerson: 'Neha Kumar', expiryDate: '2026-10-28', status: 'VALID', daysRemaining: 21 },
  { id: 'comp-110', documentId: 'DOC-110', type: 'Permit to Work', number: 'PTW-532', mine: 'mine-bokaro', responsiblePerson: 'Dinesh Jha', expiryDate: '2026-09-27', status: 'EXPIRED', daysRemaining: -10 },
];

export const demoActions: ActionRecord[] = [
  { id: 'act-101', actionId: 'ACT-101', issue: 'Methane anomaly at Korba North', mine: 'mine-korba', priority: 'URGENT', assignedUser: 'Rohit Nair', dueDate: '2026-10-07', status: 'URGENT', evidence: 'Gas monitoring logs and camera footage', completionDate: null, verification: 'Pending' },
  { id: 'act-102', actionId: 'ACT-102', issue: 'Excavator EX-118 overheating', mine: 'mine-singrauli', priority: 'HIGH', assignedUser: 'Suresh Patel', dueDate: '2026-10-08', status: 'IN_PROGRESS', evidence: 'Thermal scan and maintenance notes', completionDate: null, verification: 'In review' },
  { id: 'act-103', actionId: 'ACT-103', issue: 'Dust suppression performance', mine: 'mine-dhanbad', priority: 'HIGH', assignedUser: 'Punit Saha', dueDate: '2026-10-05', status: 'OVERDUE', evidence: 'Air quality readings', completionDate: null, verification: 'Past due' },
  { id: 'act-104', actionId: 'ACT-104', issue: 'Roof support inspection', mine: 'mine-talcher', priority: 'URGENT', assignedUser: 'Sunil Mohanty', dueDate: '2026-10-03', status: 'VERIFIED', evidence: 'Survey and support installation photos', completionDate: '2026-10-03', verification: 'Approved by safety manager' },
  { id: 'act-105', actionId: 'ACT-105', issue: 'PPE compliance audit', mine: 'mine-bokaro', priority: 'MEDIUM', assignedUser: 'Shivam Das', dueDate: '2026-10-10', status: 'OPEN', evidence: 'Shift audit checklist', completionDate: null, verification: 'Not yet checked' },
  { id: 'act-106', actionId: 'ACT-106', issue: 'Ventilation balance review', mine: 'mine-korba', priority: 'HIGH', assignedUser: 'Anita Rao', dueDate: '2026-10-09', status: 'COMPLETED', evidence: 'Inspection report', completionDate: '2026-10-06', verification: 'Signed off' },
  { id: 'act-107', actionId: 'ACT-107', issue: 'Haul truck brake schedule', mine: 'mine-singrauli', priority: 'URGENT', assignedUser: 'Karthik Iyer', dueDate: '2026-10-06', status: 'VERIFIED', evidence: 'Brake inspection and service record', completionDate: '2026-10-06', verification: 'Approved' },
  { id: 'act-108', actionId: 'ACT-108', issue: 'Generator maintenance backlog', mine: 'mine-neyveli', priority: 'MEDIUM', assignedUser: 'Vikram Reddy', dueDate: '2026-10-12', status: 'OPEN', evidence: 'Maintenance backlog report', completionDate: null, verification: 'Pending' },
  { id: 'act-109', actionId: 'ACT-109', issue: 'Calibration of gas sensors', mine: 'mine-korba', priority: 'URGENT', assignedUser: 'Neha Kumar', dueDate: '2026-10-07', status: 'IN_PROGRESS', evidence: 'Calibration log and sensor health record', completionDate: null, verification: 'Awaiting signoff' },
  { id: 'act-110', actionId: 'ACT-110', issue: 'Electrical bus insulation replacement', mine: 'mine-neyveli', priority: 'HIGH', assignedUser: 'Vikram Reddy', dueDate: '2026-10-11', status: 'COMPLETED', evidence: 'Replacement invoice and test report', completionDate: '2026-10-05', verification: 'Verified' },
];

export const demoPredictions: PredictionRecord[] = [
  { id: 'pred-101', predictionId: 'PRED-101', mine: 'mine-korba', currentRisk: 82, predictedRisk: 91, riskLevel: 'CRITICAL', confidence: 94, timeWindow: 'Next 24 Hours', factors: ['Gas monitoring anomaly', 'Compliance violation', 'Maintenance delay', 'Increased incident frequency'] },
  { id: 'pred-102', predictionId: 'PRED-102', mine: 'mine-singrauli', currentRisk: 71, predictedRisk: 79, riskLevel: 'HIGH', confidence: 89, timeWindow: 'Next 48 Hours', factors: ['Vehicle brake issue', 'Ventilation stress', 'Increased route congestion'] },
  { id: 'pred-103', predictionId: 'PRED-103', mine: 'mine-bokaro', currentRisk: 65, predictedRisk: 73, riskLevel: 'HIGH', confidence: 86, timeWindow: 'Next 72 Hours', factors: ['Dust suppression lag', 'PPE compliance decline', 'Survey backlog'] },
];

export const demoNotifications: NotificationRecord[] = [
  { id: 'notif-101', notificationId: 'NOT-101', title: 'Critical risk escalation', message: 'Korba North risk increased beyond critical limit', category: 'Critical risk', priority: 'CRITICAL', isRead: false, createdAt: '2026-10-07T08:50:00Z', relatedEntity: 'mine-korba' },
  { id: 'notif-102', notificationId: 'NOT-102', title: 'Compliance review due', message: 'Gas detector calibration is expired', category: 'Compliance expiry', priority: 'HIGH', isRead: false, createdAt: '2026-10-07T07:40:00Z', relatedEntity: 'comp-103' },
  { id: 'notif-103', notificationId: 'NOT-103', title: 'Maintenance warning', message: 'Excavator EX-118 failure probability at 78%', category: 'Equipment warning', priority: 'HIGH', isRead: true, createdAt: '2026-10-06T18:45:00Z', relatedEntity: 'eq-111' },
  { id: 'notif-104', notificationId: 'NOT-104', title: 'Incident report', message: 'Methane concentration spike requires action', category: 'Incident', priority: 'CRITICAL', isRead: false, createdAt: '2026-10-05T08:20:00Z', relatedEntity: 'inc-101' },
  { id: 'notif-105', notificationId: 'NOT-105', title: 'Corrective action overdue', message: 'Dust suppression action is beyond SLA', category: 'Corrective action', priority: 'HIGH', isRead: true, createdAt: '2026-10-04T10:15:00Z', relatedEntity: 'act-103' },
  { id: 'notif-106', notificationId: 'NOT-106', title: 'Emergency response', message: 'Emergency mode started for Korba North gas alert', category: 'Emergency', priority: 'CRITICAL', isRead: false, createdAt: '2026-10-05T03:00:00Z', relatedEntity: 'emergency-101' },
];

export const demoAuditLogs: AuditLogRecord[] = [
  { id: 'audit-101', user: 'Alicia Morgan', action: 'Login', entity: 'Auth', time: '2026-10-07T07:00:00Z', previousValue: 'Logged out', newValue: 'Logged in' },
  { id: 'audit-102', user: 'Rohit Nair', action: 'Alert acknowledgement', entity: 'Alert', time: '2026-10-07T08:15:00Z', previousValue: 'NEW', newValue: 'ACKNOWLEDGED' },
  { id: 'audit-103', user: 'Suresh Patel', action: 'Update', entity: 'Mine', time: '2026-10-06T18:50:00Z', previousValue: 'Risk 69', newValue: 'Risk 71' },
  { id: 'audit-104', user: 'Anita Rao', action: 'Create', entity: 'ComplianceDocument', time: '2026-10-05T09:45:00Z', previousValue: '', newValue: 'Inspection created' },
  { id: 'audit-105', user: 'Shivam Das', action: 'Corrective action', entity: 'Action', time: '2026-10-04T17:00:00Z', previousValue: 'OPEN', newValue: 'IN_PROGRESS' },
];

export const demoEmergency: EmergencyRecord[] = [
  { id: 'emergency-101', emergencyId: 'EM-101', incident: 'Methane concentration spike', mine: 'mine-korba', zone: 'Coal seam 4', time: '2026-10-07T08:00:00Z', severity: 'CRITICAL', peopleAffected: 7, evacuationStatus: 'Initiated', responseTeam: 'Mine Rescue Team 2', incidentCommander: 'Alicia Morgan', safeZones: ['Control Room', 'Fresh Air Base', 'North Approach'], assemblyPoint: 'Main Gate Annex', status: 'ACTIVE' },
];

export const demoRecommendations: RecommendationRecord[] = [
  { id: 'rec-101', title: 'Restrict affected zone', priority: 'CRITICAL', reason: 'Gas anomaly and elevated methane concentration increase risk of ignition in the north corridor.', suggestedAction: 'Restrict access to Coal seam 4 until ventilation and calibration checks pass.', expectedImpact: 'Reduce ignition exposure and lower risk in 24 hours.' },
  { id: 'rec-102', title: 'Conduct additional safety inspection', priority: 'HIGH', reason: 'Equipment health score is degraded and overdue maintenance is increasing failure probability.', suggestedAction: 'Inspect the cooling systems and brake assemblies of selected units within 12 hours.', expectedImpact: 'Reduce failure probability and prevent unplanned downtime.' },
  { id: 'rec-103', title: 'Enforce PPE compliance', priority: 'HIGH', reason: 'Several workers are operating in high-risk zones without required PPE.', suggestedAction: 'Run PPE compliance audit and issue corrective notices to offending crews.', expectedImpact: 'Improve worker safety risk by lowering exposure to unsafe behavior.' },
  { id: 'rec-104', title: 'Review ventilation performance', priority: 'MEDIUM', reason: 'Ventilation performance is still below expected parameters after an alert spike.', suggestedAction: 'Inspect ventilation path and verify sensor calibration with the maintenance team.', expectedImpact: 'Stabilize air quality and reduce critical risk.' },
  { id: 'rec-105', title: 'Close permit backlog', priority: 'MEDIUM', reason: 'The permit-to-work backlog creates compliance risk and slow response times for urgent tasks.', suggestedAction: 'Prioritize permit review and clear all older tasks within the next 72 hours.', expectedImpact: 'Reduce operational and compliance risk exposure.' },
];

export const demoVisionCameras = [
  { id: 'CAM-001', name: 'Main Entry Camera', mine: 'mine-korba', zone: 'Zone A - Main Entry', status: 'ONLINE', lastActive: '2026-10-07T08:40:00Z', detectionMode: 'AI Vision Demo / Simulated Camera', cameraFeedLabel: 'SIMULATED CAMERA FEED' },
  { id: 'CAM-002', name: 'Haul Road Camera', mine: 'mine-korba', zone: 'Haul Road', status: 'DEMO MODE', lastActive: '2026-10-07T08:30:00Z', detectionMode: 'AI Vision Demo / Simulated Camera', cameraFeedLabel: 'SIMULATED CAMERA FEED' },
  { id: 'CAM-003', name: 'Blasting Area Camera', mine: 'mine-singrauli', zone: 'Blasting Area', status: 'WARNING', lastActive: '2026-10-07T07:55:00Z', detectionMode: 'AI Vision Demo / Simulated Camera', cameraFeedLabel: 'SIMULATED CAMERA FEED' },
];

export const demoVisionDetections = [
  { id: 'VIS-001', cameraId: 'CAM-001', camera: 'Main Entry Camera', mine: 'mine-korba', mineName: 'Korba North', zone: 'Zone A - Main Entry', workerId: 'W-102', workerName: 'Arun Kumar', faceDetected: true, faceMatch: 'Demo Face Detection', identificationConfidence: 96, safetyStatus: 'SAFE', ppeStatus: 'COMPLIANT', helmet: 'YES', vest: 'YES', respirator: 'MISSING', glasses: 'YES', gloves: 'YES', boots: 'YES', risk: 'LOW', status: 'SAFE', detectedAt: '2026-10-07T08:40:00Z', violationType: 'PPE_VIOLATION', violation: 'Respirator missing', restrictedZone: false, unknownPerson: false },
  { id: 'VIS-002', cameraId: 'CAM-001', camera: 'Main Entry Camera', mine: 'mine-korba', mineName: 'Korba North', zone: 'Zone A - Main Entry', workerId: 'W-118', workerName: 'Unknown', faceDetected: true, faceMatch: 'UNKNOWN PERSON', identificationConfidence: 42, safetyStatus: 'HIGH RISK', ppeStatus: 'UNKNOWN', helmet: 'NO', vest: 'NO', respirator: 'UNKNOWN', glasses: 'NO', gloves: 'NO', boots: 'NO', risk: 'HIGH', status: 'UNKNOWN_PERSON', detectedAt: '2026-10-07T08:38:00Z', violationType: 'UNKNOWN_PERSON', violation: 'Unknown person detected', restrictedZone: false, unknownPerson: true },
  { id: 'VIS-006', cameraId: 'CAM-001', camera: 'Main Entry Camera', mine: 'mine-korba', mineName: 'Korba North', zone: 'Zone A - Main Entry', workerId: 'W-101', workerName: 'Akhil Prasad', faceDetected: true, faceMatch: 'Demo Face Detection', identificationConfidence: 91, safetyStatus: 'HIGH RISK', ppeStatus: 'PPE VIOLATION', helmet: 'YES', vest: 'YES', respirator: 'YES', glasses: 'NO', gloves: 'YES', boots: 'YES', risk: 'HIGH', status: 'PPE_VIOLATION', detectedAt: '2026-10-07T08:37:00Z', violationType: 'PPE_VIOLATION', violation: 'Safety glasses missing', restrictedZone: false, unknownPerson: false },
  { id: 'VIS-007', cameraId: 'CAM-001', camera: 'Main Entry Camera', mine: 'mine-korba', mineName: 'Korba North', zone: 'Zone A - Main Entry', workerId: 'W-103', workerName: 'Sanjay Devi', faceDetected: true, faceMatch: 'Demo Face Detection', identificationConfidence: 89, safetyStatus: 'HIGH RISK', ppeStatus: 'PPE VIOLATION', helmet: 'YES', vest: 'NO', respirator: 'MISSING', glasses: 'YES', gloves: 'YES', boots: 'YES', risk: 'HIGH', status: 'PPE_VIOLATION', detectedAt: '2026-10-07T08:36:00Z', violationType: 'PPE_VIOLATION', violation: 'Safety vest and respirator missing', restrictedZone: false, unknownPerson: false },
  { id: 'VIS-003', cameraId: 'CAM-003', camera: 'Blasting Area Camera', mine: 'mine-singrauli', mineName: 'Singrauli Central', zone: 'Blasting Area', workerId: 'W-102', workerName: 'Arun Kumar', faceDetected: true, faceMatch: 'Demo Face Detection', identificationConfidence: 93, safetyStatus: 'HIGH RISK', ppeStatus: 'VIOLATION', helmet: 'YES', vest: 'YES', respirator: 'YES', glasses: 'YES', gloves: 'YES', boots: 'YES', risk: 'CRITICAL', status: 'RESTRICTED_ZONE', detectedAt: '2026-10-07T10:42:00Z', violationType: 'RESTRICTED_ZONE', violation: 'Restricted zone entry', restrictedZone: true, unknownPerson: false },
  { id: 'VIS-004', cameraId: 'CAM-002', camera: 'Haul Road Camera', mine: 'mine-korba', mineName: 'Korba North', zone: 'Haul Road', workerId: 'W-104', workerName: 'Ritu Sharma', faceDetected: true, faceMatch: 'Demo Face Detection', identificationConfidence: 92, safetyStatus: 'WARNING', ppeStatus: 'PPE VIOLATION', helmet: 'YES', vest: 'YES', respirator: 'MISSING', glasses: 'NO', gloves: 'YES', boots: 'YES', risk: 'HIGH', status: 'PPE_VIOLATION', detectedAt: '2026-10-07T08:20:00Z', violationType: 'PPE_VIOLATION', violation: 'Required PPE missing', restrictedZone: false, unknownPerson: false },
  { id: 'VIS-005', cameraId: 'CAM-001', camera: 'Main Entry Camera', mine: 'mine-korba', mineName: 'Korba North', zone: 'Zone A - Main Entry', workerId: 'W-110', workerName: 'Tania Roy', faceDetected: true, faceMatch: 'Demo Face Detection', identificationConfidence: 94, safetyStatus: 'SAFE', ppeStatus: 'COMPLIANT', helmet: 'YES', vest: 'YES', respirator: 'YES', glasses: 'YES', gloves: 'YES', boots: 'YES', risk: 'LOW', status: 'SAFE', detectedAt: '2026-10-07T08:05:00Z', violationType: 'WORKER_COUNT', violation: 'Worker count within safe range', restrictedZone: false, unknownPerson: false },
];

export const demoVisionEvents = [
  { id: 'EVT-101', camera: 'Main Entry Camera', mine: 'mine-korba', zone: 'Zone A - Main Entry', worker: 'W-102', eventType: 'FACE_DETECTED', confidence: 96, risk: 'LOW', time: '2026-10-07T08:40:00Z', status: 'RESOLVED' },
  { id: 'EVT-102', camera: 'Main Entry Camera', mine: 'mine-korba', zone: 'Zone A - Main Entry', worker: 'UNKNOWN', eventType: 'UNKNOWN_PERSON', confidence: 42, risk: 'HIGH', time: '2026-10-07T08:38:00Z', status: 'NEW' },
  { id: 'EVT-103', camera: 'Blasting Area Camera', mine: 'mine-singrauli', zone: 'Blasting Area', worker: 'W-102', eventType: 'RESTRICTED_ZONE', confidence: 93, risk: 'CRITICAL', time: '2026-10-07T10:42:00Z', status: 'IN_PROGRESS' },
  { id: 'EVT-104', camera: 'Haul Road Camera', mine: 'mine-korba', zone: 'Haul Road', worker: 'W-104', eventType: 'PPE_VIOLATION', confidence: 92, risk: 'HIGH', time: '2026-10-07T08:20:00Z', status: 'ACKNOWLEDGED' },
  { id: 'EVT-105', camera: 'Main Entry Camera', mine: 'mine-korba', zone: 'Zone A - Main Entry', worker: 'W-110', eventType: 'WORKER_COUNT', confidence: 94, risk: 'LOW', time: '2026-10-07T08:05:00Z', status: 'RESOLVED' },
];

export const demoVisionStatistics = {
  workersDetected: 24,
  knownWorkers: 22,
  unknownPersons: 2,
  safetyViolations: 3,
  highRiskDetections: 1,
  cameraStatus: 'ONLINE / DEMO MODE',
  latestDetection: 'W-102 • Zone A - Main Entry • 08:40',
};

export const riskTrend = [
  { day: 'Mon', risk: 59 },
  { day: 'Tue', risk: 63 },
  { day: 'Wed', risk: 67 },
  { day: 'Thu', risk: 62 },
  { day: 'Fri', risk: 69 },
  { day: 'Sat', risk: 73 },
  { day: 'Sun', risk: 78 },
];

export const incidentTrend = [
  { day: 'Jan', incidents: 6 },
  { day: 'Feb', incidents: 7 },
  { day: 'Mar', incidents: 5 },
  { day: 'Apr', incidents: 8 },
  { day: 'May', incidents: 9 },
  { day: 'Jun', incidents: 10 },
  { day: 'Jul', incidents: 7 },
];

export const complianceTrend = [
  { name: 'Jan', compliance: 84 },
  { name: 'Feb', compliance: 86 },
  { name: 'Mar', compliance: 88 },
  { name: 'Apr', compliance: 87 },
  { name: 'May', compliance: 90 },
  { name: 'Jun', compliance: 92 },
  { name: 'Jul', compliance: 91 },
];
