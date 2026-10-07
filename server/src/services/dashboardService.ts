import {
  demoActions,
  demoAlerts,
  demoCompliance,
  demoEmergency,
  demoEquipment,
  demoIncidents,
  demoMines,
  demoNotifications,
  demoPredictions,
  demoRecommendations,
  demoVisionCameras,
  demoVisionDetections,
  demoVisionEvents,
  demoVisionStatistics,
  demoWorkers,
  incidentTrend,
  riskTrend,
  complianceTrend,
} from '../data/demoData';

export function buildDashboard() {
  const mines = demoMines;
  const alerts = demoAlerts;
  const actions = demoActions;
  const equipment = demoEquipment;
  const compliance = demoCompliance;
  const incidents = demoIncidents;

  const totalMines = mines.length;
  const lowRiskMines = mines.filter((mine) => mine.riskLevel === 'LOW').length;
  const mediumRiskMines = mines.filter((mine) => mine.riskLevel === 'MEDIUM').length;
  const highRiskMines = mines.filter((mine) => mine.riskLevel === 'HIGH').length;
  const criticalRiskMines = mines.filter((mine) => mine.riskLevel === 'CRITICAL').length;

  const totalWorkers = demoWorkers.length;
  const averageSafetyScore = Math.round(
    mines.reduce((sum, mine) => sum + mine.safetyScore, 0) / Math.max(mines.length, 1),
  );
  const activeAlerts = alerts.filter((alert) => alert.status !== 'RESOLVED').length;
  const pendingActions = actions.filter((action) => !['COMPLETED', 'VERIFIED'].includes(action.status)).length;
  const equipmentAtRisk = equipment.filter((item) => ['WARNING', 'MAINTENANCE', 'CRITICAL', 'OFFLINE'].includes(item.status)).length;
  const complianceRate = Math.round(
    compliance.reduce((sum, item) => sum + (item.status === 'VALID' ? 100 : item.status === 'EXPIRING_SOON' ? 75 : item.status === 'EXPIRED' ? 35 : 10), 0) / compliance.length,
  );

  const averageRisk = Math.round(mines.reduce((sum, mine) => sum + mine.riskScore, 0) / totalMines);

  return {
    summary: {
      totalMines,
      totalWorkers,
      averageSafetyScore,
      highRiskMines,
      criticalRiskMines,
      activeAlerts,
      pendingActions,
      equipmentAtRisk,
      complianceRate,
      averageRisk,
    },
    riskDistribution: {
      low: lowRiskMines,
      medium: mediumRiskMines,
      high: highRiskMines,
      critical: criticalRiskMines,
    },
    mineComparison: mines.map((mine) => ({
      name: mine.name,
      risk: mine.riskScore,
      safety: mine.safetyScore,
      compliance: mine.compliance,
    })),
    kpis: [
      { label: 'Total Mines', value: totalMines, trend: '+6.4%', description: 'Across active operation zones', icon: 'Building2' },
      { label: 'Active Workers', value: totalWorkers, trend: '+3.2%', description: 'Personnel on active shifts', icon: 'Users' },
      { label: 'Safety Score', value: `${averageSafetyScore}/100`, trend: '+2.1%', description: 'Average site safety score', icon: 'ShieldCheck' },
      { label: 'High Risk Mines', value: highRiskMines, trend: '-1.5%', description: 'Sites above threshold', icon: 'TriangleAlert' },
      { label: 'Critical Risk Mines', value: criticalRiskMines, trend: '+2.0%', description: 'Immediate escalation', icon: 'AlertTriangle' },
      { label: 'Active Alerts', value: activeAlerts, trend: '+8.7%', description: 'Alerts requiring attention', icon: 'BellRing' },
      { label: 'Pending Corrective Actions', value: pendingActions, trend: '-4.2%', description: 'Open remediation backlog', icon: 'ClipboardList' },
      { label: 'Equipment At Risk', value: equipmentAtRisk, trend: '+5.8%', description: 'Assets with warnings or failures', icon: 'Wrench' },
      { label: 'Compliance Rate', value: `${complianceRate}%`, trend: '+1.1%', description: 'Documented compliance', icon: 'BadgeCheck' },
    ],
    aiPrediction: demoPredictions[0],
    aiRecommendations: demoRecommendations,
    mines,
    workers: demoWorkers,
    equipment,
    incidents,
    alerts,
    compliance,
    actions,
    notifications: demoNotifications,
    auditLogs: demoAuditLogs,
    emergency: demoEmergency,
    predictions: demoPredictions,
    vision: {
      cameras: demoVisionCameras,
      detections: demoVisionDetections,
      events: demoVisionEvents,
      statistics: demoVisionStatistics,
    },
    riskTrend,
    incidentTrend,
    complianceTrend,
    safetyBreakdown: [
      { name: 'Compliance', value: 85 },
      { name: 'Equipment', value: 72 },
      { name: 'Workers', value: 80 },
      { name: 'Incidents', value: 74 },
      { name: 'Corrective Actions', value: 81 },
    ],
  };
}

const demoAuditLogs = [
  { id: 'audit-101', user: 'Alicia Morgan', action: 'Login', entity: 'Auth', time: '2026-10-07T07:00:00Z', previousValue: 'Logged out', newValue: 'Logged in' },
  { id: 'audit-102', user: 'Rohit Nair', action: 'Alert acknowledgement', entity: 'Alert', time: '2026-10-07T08:15:00Z', previousValue: 'NEW', newValue: 'ACKNOWLEDGED' },
  { id: 'audit-103', user: 'Suresh Patel', action: 'Update', entity: 'Mine', time: '2026-10-06T18:50:00Z', previousValue: 'Risk 69', newValue: 'Risk 71' },
  { id: 'audit-104', user: 'Anita Rao', action: 'Create', entity: 'ComplianceDocument', time: '2026-10-05T09:45:00Z', previousValue: '', newValue: 'Inspection created' },
  { id: 'audit-105', user: 'Shivam Das', action: 'Corrective action', entity: 'Action', time: '2026-10-04T17:00:00Z', previousValue: 'OPEN', newValue: 'IN_PROGRESS' },
];
