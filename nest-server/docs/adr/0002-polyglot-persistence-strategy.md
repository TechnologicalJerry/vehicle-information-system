# ADR 0002: Polyglot Persistence Strategy

## Status
Accepted

## Context
Connected vehicle systems handle two distinct data profiles:
1. Low-volume, highly relational transactional data (Users, Roles, Fleets, Vehicles, DTCs, Remote Commands, OTA Deployments).
2. High-volume, append-only time-series geospatial telemetry stream (GPS coordinates, speed, battery, fuel, OBD-II data).

## Decision
We implement Polyglot Persistence:
- **PostgreSQL + Prisma ORM**: Transactional relational data integrity.
- **MongoDB + Mongoose**: High-throughput time-series telemetry, location tracking, and audit metadata.
- **Redis**: In-memory state caching, rate limiting, and session revocation.

## Consequences
- **Positive**: Optimized query performance for telemetry writes alongside ACID safety for user and fleet operations.
- **Negative**: Requires managing database migrations for PostgreSQL and schema indices for MongoDB.
