# Architecture Documentation - Vehicle Information System (VIS)

## Overview
The Vehicle Information System (VIS) backend is designed as an enterprise-grade NestJS Monorepo workspace powering connected vehicle platforms (e.g. Tesla, FordPass, BMW ConnectedDrive).

## Microservices Overview
- **API Gateway (`apps/api-gateway`)**: Global prefix routing, Swagger documentation, Helmet headers, rate limiting, and Terminus health indicators.
- **Auth Service (`apps/auth-service`)**: User registration, Passport Local/JWT authentication, token rotation, Redis session revocation, password reset, and email verification.
- **User Service (`apps/user-service`)**: User CRUD operations, soft deletes, self-profile updates, and Role-Based Access Control (RBAC) role assignments.
- **Fleet Service (`apps/fleet-service`)**: Organization fleets management, fleet code unique constraint, fleet manager assignments, fleet statistics, and soft deletes.
- **Vehicle Service (`apps/vehicle-service`)**: Vehicle lifecycle management, ISO 3779 VIN checksum validation, driver assignment (enforcing single active driver), vehicle transfers, 6-digit telemetry pairing workflow, and status state machine.
- **Telemetry Service (`apps/telemetry-service`)**: High-throughput telemetry ingestion (REST / MQTT / Kafka), MongoDB time-series storage with `2dsphere` geospatial indexing, Redis instant state caching (`vehicle:{vehicleId}:latest`), Socket.IO WebSocket Gateway (`telemetry` namespace), Kafka event broadcasting, and statistical aggregation services.
- **Location Service (`apps/location-service`)**: Live vehicle location tracking, route history, Redis location cache (`vehicle:{vehicleId}:location`), and Circle/Polygon Geofencing spatial breach detection engine (`vis.geofence.entered`, `vis.geofence.exited`).
- **Trip Service (`apps/trip-service`)**: Automatic trip detection engine (start on ignition ON & speed > 5 km/h; end on ignition OFF or idle > 15 mins), trip route points logging in MongoDB (`trip_routes`), trip duration/distance calculations, and PostgreSQL `Trip` persistence.
- **Diagnostics Service (`apps/diagnostics-service`)**: Telemetry-driven Automotive DTC detection (`P0217`, `P0562`, `P0522`, `C0073`, `B0001`), Vehicle Health Score (0-100) calculator, maintenance recommendations engine, Redis health cache (`vehicle:{vehicleId}:health`), and MongoDB diagnostic event log.
- **Driver Behaviour Service (`apps/driver-behaviour-service`)**: Driver safety violation detection (harsh braking, harsh acceleration, rapid cornering, overspeed > 120 km/h, high RPM > 4000, seatbelt violations, door open while moving), Driver Safety Score (0-100) calculator, Redis score cache (`driver:{driverId}:score`), and fleet driver safety rankings (Daily, Weekly, Monthly).
- **Remote Command Service (`apps/remote-command-service`)**: Idempotent remote vehicle control (Lock/Unlock, Engine Start/Stop, Climate, Charging, Immobilizer), priority command queue engine (`HIGH`, `MEDIUM`, `LOW`), exponential backoff retry engine, and bi-directional MQTT message broker integration (`vehicle/{vehicleId}/commands`, `vehicle/{vehicleId}/ack`).
- **OTA Service (`apps/ota-service`)**: Firmware release management, SHA-256 integrity validation, model compatibility verification, staged fleet campaign rollouts (`IMMEDIATE`, `SCHEDULED`, `PERCENTAGE`, `FLEET`), deployment progress tracking (`PENDING` -> `DOWNLOADING` -> `INSTALLING` -> `REBOOTING` -> `VERIFYING` -> `COMPLETED`), and automatic firmware rollback engine.
- **Notification Service (`apps/notification-service`)**: Multi-channel notification delivery (Email, SMS, Push, In-App, Webhook), template rendering engine with variable placeholders and versioning, user notification preferences & quiet hours filtering, and automated event-driven triggers.
- **Analytics Service (`apps/analytics-service`)**: Business intelligence aggregation engine, executive dashboard APIs (`/analytics/dashboard`), MongoDB time-series snapshots (`analytics_snapshots`, `dashboard_metrics`, `aggregated_statistics`), background scheduled rollup cron jobs (`@nestjs/schedule` for Hourly, Daily, Weekly, Monthly rollups), and Redis dashboard caching (`dashboard:overview`).
- **Reporting Service (`apps/reporting-service`)**: Multi-format report exporter engine (PDF, Excel `.xlsx`, CSV, JSON), instant report generation & file stream export, automated scheduled report generation via Cron expressions (`@nestjs/schedule`), and MongoDB report cache (`report_cache`).
- **Audit Service (`apps/audit-service`)**: Append-only immutable compliance & forensic audit trail, system-wide Kafka event ingestion consumer (`vis.*`), correlation ID tracking, and MongoDB extended metadata snapshot store (`audit_metadata`).
- **Admin Service (`apps/admin-service`)**: Platform configuration & system settings management, feature flags with percentage rollout engine & Redis caching (`feature_flag:<key>`), HMAC SHA-256 API key lifecycle management (creation, rotation, revocation), and outbound webhook engine with cryptographic signatures.

## Event-Driven Pipeline
```
Telemetry Service (REST / MQTT / Kafka)
  ↓ Publishes `vis.telemetry.processed`
Kafka Event Bus (vis.*)
  ├─> Location Service -> Updates Redis location & checks Geofences
  ├─> Trip Service -> Evaluates automatic trip detection engine
  ├─> Diagnostics Service -> Evaluates DTC thresholds & Vehicle Health Score (0-100)
  ├─> Driver Behaviour Service -> Detects driving safety violations & Driver Safety Score (0-100)
  ├─> Remote Command Service -> Command execution ACKs & status updates over MQTT
  ├─> OTA Service -> Firmware rollout manifests & status ACKs over MQTT
  ├─> Notification Service -> Dispatches multi-channel alerts based on system events
  ├─> Analytics Service -> Ingests events into MongoDB time-series snapshots & executes scheduled aggregations
  ├─> Reporting Service -> Ingests data & executes scheduled automated reports
  ├─> Audit Service -> Logs append-only immutable audit trail for forensic compliance
  └─> Admin Service -> Dispatches outbound webhooks for subscribed system events
```

## Polyglot Persistence & Data Storage
- **PostgreSQL + Prisma ORM**: Relational schema storing Users, Roles, Permissions, UserRoles, RolePermissions, Sessions, RefreshTokens, VerificationTokens, PasswordResetTokens, Fleets, Vehicles, DriverAssignments, VehiclePairings, VehicleOwnershipHistories, VehicleStatusHistories, Trips, DTCs, MaintenanceRecommendations, DriverScores, DriverRankings, RemoteCommands, Firmwares, OtaCampaigns, OtaDeployments, Notifications, NotificationTemplates, NotificationPreferences, Reports, ReportSchedules, AuditLogs, SystemSettings, FeatureFlags, ApiKeys, Webhooks.
- **MongoDB + Mongoose**: High-throughput time-series `telemetry` collection, `locations` collection, `geofences` collection, `trip_routes` collection, `diagnostic_events` collection, `behaviour_events` collection, `analytics_snapshots` collection, `dashboard_metrics` collection, `aggregated_statistics` collection, `report_cache` collection, and `audit_metadata` collection.
- **Redis Cache**: Active session tracking, token revocation blacklist (`revoked_session:<sessionId>`), rate limiting counters, latest vehicle state (`vehicle:{vehicleId}:latest`), latest location (`vehicle:{vehicleId}:location`), active geofences (`vehicle:{vehicleId}:geofence:{geofenceId}`), vehicle health score (`vehicle:{vehicleId}:health`), driver safety score (`driver:{driverId}:score`), pending commands (`command:pending:<vehicleId>`), firmware metadata (`firmware:<version>`), executive dashboard metrics (`dashboard:overview`), feature flags (`feature_flag:<key>`), and system settings (`admin:system_settings`).
