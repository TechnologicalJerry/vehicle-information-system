export const KAFKA_TOPICS = {
  // User & Auth Events
  USER_REGISTERED: 'vis.user.registered',
  USER_LOCKED: 'vis.user.locked',
  PASSWORD_CHANGED: 'vis.user.password_changed',

  // Fleet Events
  FLEET_CREATED: 'vis.fleet.created',
  FLEET_UPDATED: 'vis.fleet.updated',
  FLEET_DELETED: 'vis.fleet.deleted',
  FLEET_ACTIVATED: 'vis.fleet.activated',
  FLEET_DEACTIVATED: 'vis.fleet.deactivated',

  // Vehicle Events
  VEHICLE_CREATED: 'vis.vehicle.created',
  VEHICLE_UPDATED: 'vis.vehicle.updated',
  VEHICLE_DELETED: 'vis.vehicle.deleted',
  VEHICLE_ASSIGNED: 'vis.vehicle.assigned',
  VEHICLE_TRANSFERRED: 'vis.vehicle.transferred',
  VEHICLE_STATUS_CHANGED: 'vis.vehicle.status.changed',
  VEHICLE_PAIRED: 'vis.vehicle.paired',
  VEHICLE_UNPAIRED: 'vis.vehicle.unpaired',

  // Telemetry Events
  TELEMETRY_RECEIVED: 'vis.telemetry.received',
  TELEMETRY_VALIDATED: 'vis.telemetry.validated',
  TELEMETRY_PROCESSED: 'vis.telemetry.processed',
  TELEMETRY_SAVED: 'vis.telemetry.saved',
  TELEMETRY_UPDATED: 'vis.telemetry.updated',
  TELEMETRY_FAILED: 'vis.telemetry.failed',

  // Location & Geofence Events
  LOCATION_UPDATED: 'vis.location.updated',
  LOCATION_CHANGED: 'vis.location.changed',
  GEOFENCE_ENTERED: 'vis.geofence.entered',
  GEOFENCE_EXITED: 'vis.geofence.exited',
  GEOFENCE_INSIDE: 'vis.geofence.inside',

  // Trip Events
  TRIP_STARTED: 'vis.trip.started',
  TRIP_UPDATED: 'vis.trip.updated',
  TRIP_COMPLETED: 'vis.trip.completed',
  TRIP_CANCELLED: 'vis.trip.cancelled',

  // Diagnostics Events
  DIAGNOSTIC_DETECTED: 'vis.diagnostic.detected',
  DIAGNOSTIC_RESOLVED: 'vis.diagnostic.resolved',
  MAINTENANCE_GENERATED: 'vis.maintenance.generated',
  VEHICLE_HEALTH_UPDATED: 'vis.vehicle.health.updated',

  // Driver Behaviour Events
  DRIVER_SCORE_UPDATED: 'vis.driver.score.updated',
  DRIVER_BEHAVIOUR_DETECTED: 'vis.driver.behaviour.detected',
  DRIVER_RISK_DETECTED: 'vis.driver.risk.detected',

  // Remote Command Events
  COMMAND_CREATED: 'vis.command.created',
  COMMAND_SENT: 'vis.command.sent',
  COMMAND_ACKNOWLEDGED: 'vis.command.acknowledged',
  COMMAND_COMPLETED: 'vis.command.completed',
  COMMAND_FAILED: 'vis.command.failed',

  // OTA Events
  OTA_STARTED: 'vis.ota.started',
  OTA_COMPLETED: 'vis.ota.completed',
  OTA_FAILED: 'vis.ota.failed',
  FIRMWARE_INSTALLED: 'vis.firmware.installed',

  // Notification Events
  NOTIFICATION_CREATED: 'vis.notification.created',
  NOTIFICATION_SENT: 'vis.notification.sent',
  NOTIFICATION_DELIVERED: 'vis.notification.delivered',
  NOTIFICATION_FAILED: 'vis.notification.failed',

  // Analytics Events
  ANALYTICS_UPDATED: 'vis.analytics.updated',
  DASHBOARD_UPDATED: 'vis.dashboard.updated',

  // Reporting Events
  REPORT_GENERATED: 'vis.report.generated',
  REPORT_FAILED: 'vis.report.failed',

  // Audit Events
  AUDIT_LOGGED: 'vis.audit.logged',

  // Admin Events
  ADMIN_SETTING_UPDATED: 'vis.admin.setting.updated',
  FEATURE_FLAG_UPDATED: 'vis.feature.flag.updated',
  API_KEY_CREATED: 'vis.api.key.created',
  WEBHOOK_EXECUTED: 'vis.webhook.executed',

  // Alert Events
  ALERT_TRIGGERED: 'vis.alert.triggered',
};

export interface FleetCreatedEvent {
  fleetId: string;
  fleetCode: string;
  fleetName: string;
  organizationId: string;
  managerId?: string;
  createdAt: string;
}

export interface VehicleCreatedEvent {
  vehicleId: string;
  vin: string;
  registrationNumber: string;
  fleetId?: string;
  manufacturer: string;
  model: string;
  modelYear: number;
  status: string;
  createdAt: string;
}

export interface VehicleAssignedEvent {
  vehicleId: string;
  driverId: string;
  assignedAt: string;
}

export interface VehicleStatusChangedEvent {
  vehicleId: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  changedAt: string;
}

export interface VehiclePairedEvent {
  vehicleId: string;
  pairingCode: string;
  pairedAt: string;
}

export interface TelemetryProcessedEvent {
  telemetryId: string;
  vehicleId: string;
  fleetId?: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  batteryLevel: number;
  fuelLevel: number;
  engineStatus: string;
  source: string;
  rpm?: number;
  coolantTemperature?: number;
  engineTemperature?: number;
  oilPressure?: number;
  batteryVoltage?: number;
  tyrePressureFrontLeft?: number;
  tyrePressureFrontRight?: number;
  tyrePressureRearLeft?: number;
  tyrePressureRearRight?: number;
  seatbeltStatus?: string;
  doorStatus?: string;
}

export interface GeofenceEventPayload {
  geofenceId: string;
  geofenceName: string;
  vehicleId: string;
  fleetId?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  eventType: 'ENTERED' | 'EXITED' | 'INSIDE';
}

export interface TripEventPayload {
  tripId: string;
  tripNumber: string;
  vehicleId: string;
  fleetId?: string;
  driverId?: string;
  startTime: string;
  endTime?: string;
  distance?: number;
  duration?: number;
  averageSpeed?: number;
  status: string;
}

export interface DtcEventPayload {
  dtcId: string;
  vehicleId: string;
  fleetId?: string;
  code: string;
  category: string;
  severity: string;
  title: string;
  status: string;
  detectedAt: string;
}

export interface DriverBehaviourEventPayload {
  vehicleId: string;
  driverId?: string;
  tripId?: string;
  eventType: string;
  severity: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export interface RemoteCommandEventPayload {
  commandId: string;
  vehicleId: string;
  commandType: string;
  status: string;
  correlationId: string;
  timestamp: string;
  errorMessage?: string;
}

export interface OtaEventPayload {
  campaignId: string;
  vehicleId: string;
  firmwareVersion: string;
  status: string;
  timestamp: string;
  failureReason?: string;
}

export interface NotificationEventPayload {
  notificationId: string;
  userId?: string;
  channel: string;
  category: string;
  title: string;
  status: string;
  timestamp: string;
}

export interface ReportEventPayload {
  reportId: string;
  reportName: string;
  reportType: string;
  exportFormat: string;
  status: string;
  timestamp: string;
}

export interface AuditEventPayload {
  auditId: string;
  service: string;
  entityType: string;
  entityId?: string;
  action: string;
  userId?: string;
  timestamp: string;
}
