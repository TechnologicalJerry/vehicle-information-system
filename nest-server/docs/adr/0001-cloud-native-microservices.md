# ADR 0001: Cloud-Native Microservices Architecture

## Status
Accepted

## Context
The Vehicle Information System (VIS) requires high scalability, fault isolation, independent service deployment, and modular domain boundary separation across connected vehicle operations (telemetry, remote commands, OTA, driver behaviour, diagnostics, analytics).

## Decision
We adopt a NestJS Monorepo workspace architecture containing 17 microservice domains (`api-gateway`, `auth-service`, `user-service`, `fleet-service`, `vehicle-service`, `telemetry-service`, `location-service`, `trip-service`, `diagnostics-service`, `driver-behaviour-service`, `remote-command-service`, `ota-service`, `notification-service`, `analytics-service`, `reporting-service`, `audit-service`, `admin-service`) with Apache Kafka event streams and Redis caching.

## Consequences
- **Positive**: Independent domain scalability, zero service coupling, independent DB schemas, polyglot event bus.
- **Negative**: Increased deployment complexity managed via Helm and Kubernetes manifests.
