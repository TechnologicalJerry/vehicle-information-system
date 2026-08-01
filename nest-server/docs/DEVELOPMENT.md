# Development Guide - Vehicle Information System (VIS)

## Prerequisites
- Node.js 20 LTS
- Docker & Docker Compose
- PostgreSQL, MongoDB, Redis, Kafka, EMQX (or run via Docker Compose)

## Setup Steps
1. Clone repository and navigate to `nest-server`:
   ```bash
   cd nest-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```
5. Start infrastructure containers:
   ```bash
   npm run docker:up
   ```
6. Run NestJS application in development watch mode:
   ```bash
   npm run dev
   ```
7. Open API Documentation (Swagger):
   ```
   http://localhost:3000/docs
   ```
8. Verify Health Status:
   ```
   http://localhost:3000/api/v1/health
   ```
