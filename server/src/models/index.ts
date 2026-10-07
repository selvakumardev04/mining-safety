import mongoose, { Schema, model, models } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'SAFETY_MANAGER', 'MINE_MANAGER', 'INSPECTOR', 'SUPERVISOR', 'WORKER', 'VIEWER'],
      default: 'VIEWER',
    },
    assignedMines: [{ type: String }],
    status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true },
);

const mineSchema = new Schema(
  {
    mineId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true },
    manager: { type: String, required: true },
    workerCount: { type: Number, required: true },
    riskScore: { type: Number, required: true },
    safetyScore: { type: Number, required: true },
    compliance: { type: Number, required: true },
    equipmentCount: { type: Number, required: true },
    lastInspection: { type: Date },
    nextInspection: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: true },
);

const workerSchema = new Schema(
  {
    workerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    mine: { type: String, required: true },
    department: { type: String, required: true },
    shift: { type: String, required: true },
    trainingStatus: { type: String, required: true },
    ppeStatus: { type: String, required: true },
    zone: { type: String, required: true },
    safetyStatus: { type: String, enum: ['SAFE', 'WARNING', 'HIGH_RISK'], default: 'SAFE' },
  },
  { timestamps: true },
);

const equipmentSchema = new Schema(
  {
    equipmentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    mine: { type: String, required: true },
    status: {
      type: String,
      enum: ['OPERATIONAL', 'WARNING', 'MAINTENANCE', 'CRITICAL', 'OFFLINE'],
      default: 'OPERATIONAL',
    },
    healthScore: { type: Number, required: true },
    temperature: { type: Number, required: true },
    vibration: { type: Number, required: true },
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    failureProbability: { type: Number, required: true },
  },
  { timestamps: true },
);

const incidentSchema = new Schema(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    mine: { type: String, required: true },
    zone: { type: String, required: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    peopleAffected: { type: Number, default: 0 },
    investigator: { type: String, required: true },
    rootCause: { type: String, default: '' },
    correctiveAction: { type: String, default: '' },
    status: {
      type: String,
      enum: ['REPORTED', 'INVESTIGATING', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED'],
      default: 'REPORTED',
    },
  },
  { timestamps: true },
);

const alertSchema = new Schema(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO'], default: 'INFO' },
    mine: { type: String, required: true },
    description: { type: String, required: true },
    time: { type: Date, required: true },
    status: {
      type: String,
      enum: ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'],
      default: 'NEW',
    },
    assignedUser: { type: String, default: 'Unassigned' },
  },
  { timestamps: true },
);

const complianceSchema = new Schema(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    number: { type: String, required: true },
    mine: { type: String, required: true },
    responsiblePerson: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['VALID', 'EXPIRING_SOON', 'EXPIRED', 'MISSING'],
      default: 'VALID',
    },
    daysRemaining: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const correctiveActionSchema = new Schema(
  {
    actionId: { type: String, required: true, unique: true, index: true },
    issue: { type: String, required: true },
    mine: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
    assignedUser: { type: String, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'URGENT', 'IN_PROGRESS', 'OVERDUE', 'COMPLETED', 'VERIFIED'],
      default: 'OPEN',
    },
    evidence: { type: String, default: '' },
    completionDate: { type: Date, default: null },
    verification: { type: String, default: '' },
  },
  { timestamps: true },
);

const predictionSchema = new Schema(
  {
    predictionId: { type: String, required: true, unique: true, index: true },
    mine: { type: String, required: true },
    currentRisk: { type: Number, required: true },
    predictedRisk: { type: Number, required: true },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    confidence: { type: Number, required: true },
    timeWindow: { type: String, required: true },
    factors: [{ type: String }],
    type: { type: String, default: 'AI Risk Engine / Predictive Demo Model' },
  },
  { timestamps: true },
);

const notificationSchema = new Schema(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    relatedEntity: { type: String, default: '' },
  },
  { timestamps: true },
);

const auditLogSchema = new Schema(
  {
    user: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    time: { type: Date, default: Date.now },
    previousValue: { type: String, default: '' },
    newValue: { type: String, default: '' },
  },
  { timestamps: true },
);

const emergencySchema = new Schema(
  {
    emergencyId: { type: String, required: true, unique: true, index: true },
    incident: { type: String, required: true },
    mine: { type: String, required: true },
    zone: { type: String, required: true },
    time: { type: Date, required: true },
    severity: { type: String, enum: ['HIGH', 'CRITICAL'], default: 'HIGH' },
    peopleAffected: { type: Number, default: 0 },
    evacuationStatus: { type: String, default: 'Pending' },
    responseTeam: { type: String, default: 'Not assigned' },
    incidentCommander: { type: String, default: 'Unassigned' },
    safeZones: [{ type: String }],
    assemblyPoint: { type: String, default: 'Assembly point' },
    status: { type: String, enum: ['ACTIVE', 'RESOLVED', 'CLOSED'], default: 'ACTIVE' },
  },
  { timestamps: true },
);

export const UserModel = models.User || model('User', userSchema);
export const MineModel = models.Mine || model('Mine', mineSchema);
export const WorkerModel = models.Worker || model('Worker', workerSchema);
export const EquipmentModel = models.Equipment || model('Equipment', equipmentSchema);
export const IncidentModel = models.Incident || model('Incident', incidentSchema);
export const AlertModel = models.Alert || model('Alert', alertSchema);
export const ComplianceDocumentModel = models.ComplianceDocument || model('ComplianceDocument', complianceSchema);
export const CorrectiveActionModel = models.CorrectiveAction || model('CorrectiveAction', correctiveActionSchema);
export const PredictionModel = models.Prediction || model('Prediction', predictionSchema);
export const NotificationModel = models.Notification || model('Notification', notificationSchema);
export const AuditLogModel = models.AuditLog || model('AuditLog', auditLogSchema);
export const EmergencyModel = models.Emergency || model('Emergency', emergencySchema);

export const connection = mongoose.connection;
