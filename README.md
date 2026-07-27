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

Vehicle Information System (VIS) is a complete enterprise backend platform designed for managing connected vehicles, fleets, drivers, telemetry, diagnostics, analytics, OTA updates, and real-time vehicle communication.

The project is intentionally designed as a **large-scale microservices architecture** to demonstrate enterprise software engineering practices, cloud-native development, and distributed system design.

This repository is intended for:

- Learning enterprise NestJS architecture
- Demonstrating scalable backend engineering
- Portfolio showcasing
- Preparing for senior backend interviews
- Exploring event-driven microservices

---

# 🎯 Project Goals

The primary goals of this project are:

- Build a production-ready backend using NestJS
- Follow enterprise software engineering principles
- Demonstrate Clean Architecture
- Implement scalable microservices
- Support millions of telemetry events
- Build real-time vehicle communication
- Showcase Docker & Kubernetes deployment
- Implement enterprise security
- Provide complete documentation
- Maintain high test coverage

---

# 🏗 Architecture

The system follows an **Event-Driven Microservices Architecture**.

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
                     Kafka
                        |
     ----------------------------------------------
     |        |         |          |             |
 Location   Trips   Diagnostics  Analytics  Notifications
```

---

# 🛠 Technology Stack

## Backend

- NestJS (Latest Stable)
- Node.js (LTS)
- TypeScript

## Databases

- PostgreSQL
- MongoDB
- Redis

## Messaging

- Apache Kafka
- MQTT

## API

- REST
- WebSockets
- Swagger

## ORM / ODM

- Prisma
- Mongoose

## Authentication

- JWT
- Passport
- RBAC
- OAuth2 (planned)

## DevOps

- Docker
- Docker Compose
- Kubernetes
- GitHub Actions

## Monitoring

- Prometheus
- Grafana
- OpenTelemetry

## Logging

- Pino

## Testing

- Jest
- Supertest

---

# 🧩 Microservices

| Service | Status |
|----------|--------|
| API Gateway | ✅ |
| Auth Service | ✅ |
| User Service | ✅ |
| Fleet Service | ✅ |
| Vehicle Service | ✅ |
| Telemetry Service | ✅ |
| Location Service | ✅ |
| Trip Service | ✅ |
| Diagnostics Service | ✅ |
| Driver Behaviour Service | ✅ |
| Remote Command Service | ⏳ |
| OTA Service | ⏳ |
| Notification Service | ⏳ |
| Analytics Service | ⏳ |
| Reporting Service | ⏳ |
| Audit Service | ⏳ |
| Admin Service | ⏳ |

---

# 📦 Current Project Progress

## ✅ Stage 1

Enterprise Foundation

- NestJS Monorepo
- API Gateway
- Shared Libraries
- Docker
- PostgreSQL
- MongoDB
- Redis
- Kafka
- MQTT
- Swagger
- Logging
- Health Checks

---

## ✅ Stage 2

Authentication & User Management

- JWT
- Refresh Tokens
- RBAC
- User Management
- Session Management
- Password Security

---

## ✅ Stage 3

Fleet & Vehicle Management

- Fleet CRUD
- Vehicle CRUD
- VIN Validation
- Driver Assignment
- Vehicle Pairing
- Vehicle Lifecycle

---

## ✅ Stage 4

Telemetry Platform

- MQTT Ingestion
- Kafka Events
- MongoDB Time-Series Storage
- Redis Cache
- WebSocket Broadcasting
- Real-Time APIs

---

## ✅ Stage 5

Location & Trip Management

- Live Tracking
- Route History
- Geofencing
- Trip Detection
- Trip Analytics

---

## ✅ Stage 6

Diagnostics & Driver Behaviour

- Vehicle Health
- DTC Management
- Maintenance Recommendations
- Driver Safety Score
- Driver Behaviour Detection

---

## ⏳ Remaining Stages

- Remote Commands
- OTA Updates
- Notifications
- Analytics
- Reporting
- Admin
- Production Deployment

---

# 📂 Project Structure

```
vehicle-information-system/

backend/
│
├── apps/
├── libs/
├── infrastructure/
├── docker/
├── kubernetes/
├── scripts/
└── docs/

frontend/ (Coming Soon)
```

---

# 🚀 Features

- Enterprise Authentication
- Fleet Management
- Vehicle Management
- Real-Time Telemetry
- GPS Tracking
- Trip Detection
- Driver Assignment
- Driver Behaviour Analytics
- Vehicle Diagnostics
- Health Scoring
- Kafka Event Streaming
- MQTT Communication
- Redis Caching
- WebSocket Updates
- Swagger Documentation
- Docker Support
- Kubernetes Ready
- Monitoring & Logging
- Production Security

---

# 🔐 Security

- JWT Authentication
- Refresh Tokens
- RBAC
- Request Validation
- Global Exception Handling
- Helmet
- Rate Limiting
- Password Hashing
- Environment Validation
- Secure Configuration

---

# 🧪 Testing

The project includes:

- Unit Tests
- Integration Tests
- Repository Tests
- Service Tests
- Controller Tests
- Kafka Tests
- MQTT Tests
- Performance Tests

Target Coverage:

> **80%+**

---

# 📈 Scalability

Designed to support:

- Millions of telemetry events
- Thousands of vehicles
- Horizontal scaling
- Event-driven communication
- Cloud-native deployment
- Independent service deployment
- Zero-downtime updates

---

# 📚 Documentation

Detailed documentation is available under:

```
docs/
```

Including:

- Architecture
- API Documentation
- ER Diagrams
- Sequence Diagrams
- Deployment Guides
- Development Guides
- Testing Guides

---

# 🚀 Getting Started

```bash
git clone https://github.com/your-username/vehicle-information-system.git

cd vehicle-information-system

docker compose up -d
```

After the services are running:

- Swagger
- Health Checks
- API Gateway
- Kafka
- PostgreSQL
- MongoDB
- Redis
- MQTT

will all be available.

---

# 🗺 Roadmap

- [x] Foundation
- [x] Authentication
- [x] Fleet Management
- [x] Vehicle Management
- [x] Telemetry
- [x] Location
- [x] Trips
- [x] Diagnostics
- [x] Driver Behaviour
- [ ] Remote Commands
- [ ] OTA Updates
- [ ] Notifications
- [ ] Analytics
- [ ] Reporting
- [ ] Admin
- [ ] Production Deployment

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome.

Please read the contribution guidelines before opening a pull request.

---

# 📄 License

MIT License

---

# ⭐ Acknowledgements

This project is built as an enterprise learning project inspired by modern connected vehicle platforms and cloud-native software engineering practices.

Its primary purpose is to demonstrate scalable backend architecture using NestJS Microservices.