# Vehicle Information System (VIS) — Production Enterprise Platform

An enterprise-grade, cloud-native connected vehicle platform built with **NestJS**, **TypeScript**, **PostgreSQL**, **MongoDB**, **Redis**, **Apache Kafka**, **MQTT (EMQX)**, **Docker**, **Kubernetes**, **Helm**, and **OpenTelemetry**.

Simulates real automotive platforms such as Tesla, FordPass, BMW ConnectedDrive, and Hyundai Bluelink.

---

## Workspace Architecture

```
nest-server/
├── apps/
│   ├── api-gateway/               # Swagger API Gateway & Prefix Router
│   ├── auth-service/              # Authentication, JWT Tokens & Sessions
│   ├── user-service/              # User Profile Management & RBAC Roles
│   ├── fleet-service/             # Organization Fleet Management
│   ├── vehicle-service/           # VIN Validation, Pairing & Vehicle Lifecycle
│   ├── telemetry-service/         # Telemetry Ingestion, MongoDB Time-Series & WebSockets
│   ├── location-service/          # Live Tracking, Geofences & Spatial Engine
│   ├── trip-service/              # Automatic Trip Detection & Route Logging
│   ├── diagnostics-service/       # DTC Detection & Vehicle Health Score (0-100)
│   ├── driver-behaviour-service/  # Driver Safety Score (0-100) & Safety Rankings
│   ├── remote-command-service/    # Idempotent Remote Controls & Priority Queue
│   ├── ota-service/               # SHA-256 Firmware Rollouts & Auto-Rollbacks
│   ├── notification-service/      # Multi-Channel Delivery (Email, SMS, Push, Webhooks)
│   ├── analytics-service/         # BI Dashboards & Scheduled Time-Series Aggregations
│   ├── reporting-service/         # Multi-Format Report Exporter (PDF, Excel, CSV, JSON)
│   ├── audit-service/             # Append-Only Forensic Audit Trail & Compliance
│   └── admin-service/             # System Settings, Feature Flags, API Keys & Webhooks
├── libs/
│   ├── common/                    # Shared Constants, Enums & Helpers
│   ├── config/                    # ConfigModule Wrapper & Environment Setup
│   ├── logger/                    # Pino Logger & Correlation ID Middleware
│   ├── auth/                      # Guards, JWT Strategies & RBAC Decorators
│   ├── database/                  # Prisma PostgreSQL Client & Mongoose MongoDB Schemas
│   ├── cache/                     # Redis Cache Module & Helpers
│   ├── kafka/                     # Kafka Event Producers & Consumer Wrappers
│   ├── mqtt/                      # EMQX MQTT Client Wrapper
│   ├── dto/                       # Shared DTOs with Validation Pipes
│   ├── events/                    # Event Definitions & Payload Interfaces
│   ├── utilities/                 # VIN Validator, UUID, Date Utilities
│   ├── resilience/                # Circuit Breaker, Exponential Retries & Graceful Shutdown
│   └── testing/                   # Shared Test Factories & Mocks
├── k8s/                           # Kubernetes Production Manifests
├── helm/                          # Production Helm Chart (`vis-chart`)
├── monitoring/                    # Prometheus, Grafana, AlertManager & OpenTelemetry Configs
├── scripts/                       # Backup, Restore, Bootstrap & Health Check Scripts
└── docs/                          # Architecture Docs, ADRs & Operations Runbook
```

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL, MongoDB, Redis, Kafka, and EMQX MQTT via Docker
docker-compose up -d

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Build Monorepo Workspace
npm run build

# 5. Run Unit & End-to-End Tests
npm run test
npm run test:e2e

# 6. Run API Gateway in dev mode
npm run start:dev api-gateway
```

---

## Production Deployment

### Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Kubernetes Helm Installation
```bash
helm upgrade --install vis ./helm/vis-chart -f ./helm/vis-chart/values-prod.yaml -n vis-production --create-namespace
```

---

## Verification & Quality Standards

- **Clean Monorepo Build**: `npm run build` (0 compilation errors)
- **ESLint Standard**: `npm run lint` (0 linting errors)
- **Unit Test Suite**: `npm run test` (100% passing)
- **End-to-End Test Suite**: `npm run test:e2e` (100% passing)
