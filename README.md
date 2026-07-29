# 🚗 Vehicle Information System (VIS)

> A production-grade, enterprise-scale, cloud-native Vehicle Information System built using **NestJS Microservices**, inspired by modern connected vehicle platforms such as **Tesla**, **FordPass**, **BMW ConnectedDrive**, and **Hyundai Bluelink**.

---

![NestJS](https://img.shields.io/badge/NestJS-Latest-E0234E?logo=nestjs)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)
![Kafka](https://img.shields.io/badge/Kafka-Latest-231F20?logo=apachekafka)
![Docker](https://img.shields.io/badge/Docker-Latest-2496ED?logo=docker)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Latest-326CE5?logo=kubernetes)

---

# 📖 Overview

Vehicle Information System (VIS) is a complete enterprise backend platform designed for managing connected vehicles, fleets, drivers, telemetry, diagnostics, analytics, remote vehicle control, OTA updates, multi-channel notifications, reporting, audit trails, platform governance, and real-time vehicle communication.

The project is intentionally designed as a **large-scale microservices architecture** (17 microservices in a NestJS Monorepo) demonstrating enterprise software engineering practices, cloud-native development, SRE practices, resilience engineering, and distributed system design.

This repository is intended for:

- Learning enterprise NestJS architecture
- Demonstrating scalable backend engineering
- Portfolio showcasing
- Preparing for senior/principal backend interviews
- Exploring event-driven microservices & cloud-native deployments

---

# 🎯 Project Goals

The primary goals of this project are:

- Build a production-ready backend using NestJS Monorepo
- Follow enterprise software engineering principles & Clean Architecture
- Implement scalable, fault-tolerant event-driven microservices
- Support millions of telemetry events with high-throughput ingestion
- Build real-time bi-directional vehicle communication via MQTT & WebSockets
- Showcase multi-stage Docker & production-grade Kubernetes/Helm deployment
- Implement enterprise security (JWT rotation, HMAC API keys, RBAC, Helmet, Rate Limiting)
- Maintain complete observability (OpenTelemetry, Prometheus, Grafana, AlertManager)
- Provide comprehensive operational documentation, ADRs & runbooks
- Maintain high test coverage (unit & end-to-end e2e testing)

---

# 🏗 Architecture

The system follows an **Event-Driven Microservices Architecture** with Apache Kafka and Polyglot Persistence (PostgreSQL, MongoDB, Redis).

```
                     +----------------------+
                     |     API Gateway      |
                     +----------+-----------+
                                |
           ----------------------------------------------------
           |        |         |         |        |             |
        Auth      User     Fleet    Vehicle  Telemetry     Others
           |        |         |         |        |
           ---------------------------------------
                        |
                     Kafka Event Bus (vis.*)
                        |
     -------------------------------------------------------------------------
     |        |         |          |             |             |             |
 Location   Trips   Diagnostics Analytics Notifications RemoteCommand       OTA
     |        |         |          |             |             |             |
  Reporting Audit     Admin     Resilience   Observability Kubernetes      Helm
```

---

# 🛠 Technology Stack

## Backend

- NestJS (Latest Stable)
- Node.js (LTS)
- TypeScript

## Databases

- PostgreSQL 16 (Relational & Transactional)
- MongoDB 7.0 (Time-Series & Telemetry Storage)
- Redis 7 (Caching, State Management, Session Revocation)

## Messaging & Communication

- Apache Kafka (KRaft Mode Event Streaming)
- MQTT (EMQX Broker 5.5 Bi-directional Vehicle Messaging)
- WebSockets (Socket.IO Real-time Telemetry Broadcasting)

## API & Gateway

- REST (API Gateway Uniform Prefix Routing)
- Swagger / OpenAPI 3.0 Documentation

## ORM / ODM

- Prisma ORM (PostgreSQL Schema & Migrations)
- Mongoose (MongoDB Aggregations & Collections)

## Authentication & Security

- Passport JWT & Local Strategy
- Refresh Token Rotation & Session Revocation
- Role-Based Access Control (RBAC) & Fine-Grained Permissions
- HMAC SHA-256 Request Signing & API Key Management
- Webhook Signatures & Secret Rotation
- Helmet, Rate Limiting, CORS & CSRF Hardening

## DevOps & Cloud-Native Infrastructure

- Multi-stage Docker Builds (`node:20-alpine`, Non-root runtime)
- Docker Compose (Development & Production Environments)
- Kubernetes Manifests (Deployments, Services, Ingress, HPA, PDB, NetworkPolicies)
- Helm Charts (`vis-chart` with values overrides)
- GitHub Actions CI/CD Pipeline

## Observability & Monitoring

- OpenTelemetry (Distributed Request Tracing)
- Prometheus (Metrics Collection & Scraping)
- Grafana (Executive Operations & Service Dashboards)
- AlertManager (Slack Incident Alerts)
- Pino Logger (Structured JSON Logging with Correlation IDs)

## Testing

- Jest (Unit Testing Suite)
- Supertest (End-to-End E2E Testing Suite)

---

# 🧩 Microservices Breakdown

| Service | Description | Status |
|:---|:---|:---:|
| **API Gateway** | Unified entry point, Swagger API documentation, global prefix routing & rate limiting | ✅ |
| **Auth Service** | Passport JWT/Local authentication, token rotation, password reset & session revocation | ✅ |
| **User Service** | User profile CRUD, soft deletion, and RBAC role assignments | ✅ |
| **Fleet Service** | Organization fleet management, fleet code uniqueness & manager assignments | ✅ |
| **Vehicle Service** | ISO 3779 VIN checksum validation, driver assignment, pairing workflow & status state machine | ✅ |
| **Telemetry Service** | High-throughput MQTT/Kafka ingestion, MongoDB time-series storage, WebSocket broadcasting & Redis cache | ✅ |
| **Location Service** | Real-time GPS location tracking, route history, Redis cache & Circle/Polygon geofencing engine | ✅ |
| **Trip Service** | Automatic trip detection engine (ignition ON/OFF & speed thresholds) & route points logging | ✅ |
| **Diagnostics Service** | DTC detection (`P0217`, `P0562`, `P0522`), Vehicle Health Score (0-100) & maintenance engine | ✅ |
| **Driver Behaviour Service**| Driving safety violation detection, Driver Safety Score (0-100) & daily/weekly/monthly rankings | ✅ |
| **Remote Command Service** | Idempotent vehicle control (Lock/Unlock, Start/Stop), priority command queue & MQTT ACKs | ✅ |
| **OTA Service** | SHA-256 firmware validation, model compatibility check, staged campaign rollout & auto-rollback engine | ✅ |
| **Notification Service** | Multi-channel delivery (Email, SMS, Push, In-App, Webhook), templates & quiet hours filtering | ✅ |
| **Analytics Service** | Business intelligence dashboard, time-series rollups, background cron jobs & Redis caching | ✅ |
| **Reporting Service** | Multi-format exporter engine (PDF, Excel `.xlsx`, CSV, JSON) & scheduled automated report generator | ✅ |
| **Audit Service** | Append-only immutable compliance & forensic audit trail, system-wide Kafka consumer & correlation tracking | ✅ |
| **Admin Service** | System settings management, feature flags with percentage rollout engine, HMAC API keys & webhooks | ✅ |

---

# 📦 Project Completion & Stage Roadmap

## ✅ Stage 1 — Enterprise Foundation
- NestJS Monorepo Workspace Structure
- API Gateway & Shared Core Libraries (`@app/common`, `@app/config`, `@app/logger`, `@app/database`, `@app/cache`, `@app/kafka`, `@app/mqtt`, `@app/dto`, `@app/events`, `@app/utilities`)
- Docker, PostgreSQL, MongoDB, Redis, Kafka, MQTT Setup
- Pino Structured Logging, Correlation ID Middleware, Swagger & Terminus Health Checks

## ✅ Stage 2 — Authentication & User Management
- Passport Local & JWT Authentication Strategies
- Refresh Token Rotation & Redis Session Revocation Blacklist
- Password Hashing (Bcrypt), Password Reset Tokens & Email Verification Tokens
- User Profile Management, Soft Deletes & Role-Based Access Control (RBAC)

## ✅ Stage 3 — Fleet & Vehicle Management
- Fleet CRUD, Organization Isolation, Fleet Code Generation & Manager Assignments
- Vehicle Lifecycle Management, ISO 3779 VIN Checksum Validation Engine
- Driver Assignment (enforcing single active driver rule) & Vehicle Ownership Transfers
- 6-Digit Vehicle Telemetry Pairing Code Workflow & Status State Machine

## ✅ Stage 4 — Telemetry Platform
- High-Throughput Telemetry Ingestion via REST, MQTT (`vehicle/{vehicleId}/telemetry`), and Kafka
- MongoDB Time-Series Storage with `2dsphere` Geospatial Indexing
- Redis Instant Vehicle State Cache (`vehicle:{vehicleId}:latest`)
- Socket.IO WebSocket Gateway (`telemetry` namespace) for Live Telemetry Broadcasting

## ✅ Stage 5 — Location & Trip Management
- Live GPS Location Tracking & Vehicle Location Cache (`vehicle:{vehicleId}:location`)
- Spatial Circle & Polygon Geofence Breach Detection Engine (`vis.geofence.entered`, `vis.geofence.exited`)
- Automatic Trip Detection Engine (start on ignition ON & speed > 5 km/h; end on ignition OFF or idle > 15 mins)
- MongoDB `trip_routes` Point-by-Point Path Storage & Trip Analytics

## ✅ Stage 6 — Diagnostics & Driver Behaviour Analytics
- Automotive Diagnostic Trouble Code (DTC) Detection Engine (`P0217`, `P0562`, `P0522`, `C0073`, `B0001`)
- Vehicle Health Score (0-100) Calculator & Predictive Maintenance Recommendation Engine
- Driver Safety Violation Detection (harsh braking, harsh acceleration, rapid cornering, overspeeding > 120 km/h, high RPM > 4000)
- Driver Safety Score (0-100) Calculator & Fleet Driver Safety Rankings (Daily, Weekly, Monthly)

## ✅ Stage 7 — Remote Commands & OTA Updates
- Idempotent Remote Vehicle Control Engine (Lock/Unlock, Start/Stop Engine, Climate Control, Charging, Immobilizer)
- Priority Command Queue (`HIGH`, `MEDIUM`, `LOW`) with Exponential Backoff Retries & Correlation Tracking
- Bi-Directional MQTT Command Dispatching (`vehicle/{vehicleId}/commands`) & ACK Handling (`vehicle/{vehicleId}/ack`)
- Firmware Release Management with SHA-256 Checksum Validation & Model Compatibility Verification
- Staged Campaign Fleet Rollout Engine (`IMMEDIATE`, `SCHEDULED`, `PERCENTAGE`, `FLEET`) & Automatic Rollback Engine

## ✅ Stage 8 — Notifications & Analytics
- Multi-Channel Notification Delivery Dispatcher (Email, SMS, Push, In-App, Webhook) with Exponential Retries
- Notification Template Engine with Dynamic Variable Interpolation (`{{userName}}`, `{{vin}}`, `{{dtcCode}}`) & Versioning
- User Notification Preferences & Quiet Hours Filtering Engine
- Executive Analytics Dashboard APIs (`/analytics/dashboard`) & MongoDB Time-Series Metric Snapshot Engine
- Background Scheduled Metric Rollup Jobs (`@nestjs/schedule` for Hourly, Daily, Weekly, Monthly rollups)

## ✅ Stage 9 — Reporting, Audit & Administration
- Enterprise Report Exporter Engine generating PDF, Excel (`.xlsx`), CSV, and JSON File Streams
- Automated Scheduled Report Generation via Cron Expressions (`@nestjs/schedule`) & Report Caching
- Append-Only Immutable Audit Service logging forensic compliance records for all system actions (`audit_logs`)
- Platform Administration Engine: System Settings, Feature Flags with Percentage Rollout Engine, HMAC SHA-256 API Keys & Outbound Webhooks

## ✅ Stage 10 — Production Hardening, Cloud-Native Infrastructure & Enterprise Deployment
- Multi-Stage Production Dockerfile (`node:20-alpine`) using Non-Root User Context (`nestjs:nodejs`) & Health Checks
- Production Docker Compose Setup (`docker-compose.prod.yml`) with Container Resource Limits & Health Dependencies
- Reusable Enterprise Resilience Library (`@app/resilience`) featuring Circuit Breaker, Exponential Retries & Graceful Shutdown Hooks
- Production Kubernetes Manifests in `k8s/` (Deployments, Services, Ingress with TLS, HPA, PDB, NetworkPolicies, ConfigMaps, Secrets)
- Production Helm Chart in `helm/vis-chart/` with Environment Overrides (`values-dev.yaml`, `values-prod.yaml`)
- Complete Observability Stack: Prometheus Metrics (`prometheus.yml`), AlertManager Slack Notifications (`alertmanager.yml`), Grafana Operations Dashboard (`vis-overview.json`), and OpenTelemetry Tracing
- GitHub Actions CI/CD Workflow (`.github/workflows/ci-cd.yml`) for Linting, Building, Unit & E2E Testing, and Container Building
- Disaster Recovery Scripts in `scripts/`: `backup-db.sh`, `restore-db.sh`, `bootstrap-cluster.sh`, and `health-check.sh`
- Environment Configurations: `.env.production`, `.env.staging`, `.env.test`, `.env.development`
- Enterprise Documentation: Operations Runbook (`docs/OPERATIONS_GUIDE.md`), Architecture Decision Records (`docs/adr/`), and Complete API Documentation

---

# 📂 Repository Structure

```
vehicle-information-system/
└── nest-server/
    ├── apps/                      # 17 Microservices Applications
    │   ├── api-gateway/
    │   ├── auth-service/
    │   ├── user-service/
    │   ├── fleet-service/
    │   ├── vehicle-service/
    │   ├── telemetry-service/
    │   ├── location-service/
    │   ├── trip-service/
    │   ├── diagnostics-service/
    │   ├── driver-behaviour-service/
    │   ├── remote-command-service/
    │   ├── ota-service/
    │   ├── notification-service/
    │   ├── analytics-service/
    │   ├── reporting-service/
    │   ├── audit-service/
    │   └── admin-service/
    ├── libs/                      # 13 Shared Enterprise Libraries
    │   ├── common/
    │   ├── config/
    │   ├── logger/
    │   ├── auth/
    │   ├── database/
    │   ├── cache/
    │   ├── kafka/
    │   ├── mqtt/
    │   ├── dto/
    │   ├── events/
    │   ├── utilities/
    │   ├── resilience/
    │   └── testing/
    ├── k8s/                       # Production Kubernetes Manifests
    ├── helm/                      # Production Helm Chart (`vis-chart`)
    ├── monitoring/                # Prometheus, Grafana, AlertManager & OpenTelemetry Configs
    ├── scripts/                   # Backup, Restore, Cluster Bootstrap & Health Check Scripts
    ├── docs/                      # Operations Runbook, ADRs & Architectural Documentation
    ├── Dockerfile                 # Multi-Stage Production Docker Build
    ├── docker-compose.yml         # Development Services Orchestration
    └── docker-compose.prod.yml    # Production Services Orchestration
```

---

# 🚀 Getting Started

### Prerequisites

- Node.js (v20 LTS)
- Docker & Docker Compose
- Git

### Installation & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/vehicle-information-system.git
cd vehicle-information-system/nest-server

# 2. Install dependencies
npm install

# 3. Start local infrastructure services (PostgreSQL, MongoDB, Redis, Kafka, EMQX MQTT)
docker compose up -d

# 4. Generate Prisma Client
npm run prisma:generate

# 5. Build Monorepo Workspace
npm run build

# 6. Run API Gateway
npm run start:dev api-gateway
```

### Running Tests & Linting

```bash
# Run unit test suite across all services and libraries
npm run test

# Run end-to-end (E2E) integration test suite
npm run test:e2e

# Run ESLint check
npm run lint
```

---

# 🗺 Stage Roadmap Checklist

- [x] **Stage 1**: Enterprise Foundation (Monorepo, API Gateway, Infrastructure, Pino, Health Checks)
- [x] **Stage 2**: Authentication & User Management (JWT, Rotation, RBAC, Sessions, User CRUD)
- [x] **Stage 3**: Fleet & Vehicle Management (VIN Validation, Driver Assignment, Pairing Code Workflow)
- [x] **Stage 4**: Telemetry Platform (MQTT, MongoDB Time-Series, Redis Cache, Socket.IO WebSockets)
- [x] **Stage 5**: Location & Trip Management (GPS Tracking, Geofences, Automatic Trip Detection Engine)
- [x] **Stage 6**: Diagnostics & Driver Behaviour Analytics (DTC Detector, Health Score, Driver Safety Score)
- [x] **Stage 7**: Remote Commands & OTA Updates (Priority Queue, Bi-directional MQTT, SHA-256 Rollouts)
- [x] **Stage 8**: Notifications & Analytics (Multi-Channel Dispatcher, Templates, BI Dashboards, Cron Rollups)
- [x] **Stage 9**: Reporting, Audit & Administration (PDF/Excel Exporter, Append-Only Audit, Feature Flags, API Keys)
- [x] **Stage 10**: Production Hardening, Cloud-Native Infrastructure & Enterprise Deployment (Docker, K8s, Helm, Prometheus/Grafana, Resilience, GitHub Actions)

---

# 📄 License

MIT License

---

# ⭐ Acknowledgements

This project is built as an enterprise learning project inspired by modern connected vehicle platforms (Tesla, FordPass, BMW ConnectedDrive, Hyundai Bluelink) and cloud-native software engineering practices.