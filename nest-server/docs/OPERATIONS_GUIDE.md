# VIS Operations Runbook & Incident Response Guide

## 1. System Overview
The Vehicle Information System (VIS) is a connected vehicle fleet telematics platform built on NestJS monorepo microservices, Apache Kafka, MQTT, PostgreSQL, MongoDB, and Redis.

## 2. Deployment Procedures
### Local Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Kubernetes Helm Chart
```bash
helm upgrade --install vis ./helm/vis-chart -f ./helm/vis-chart/values-prod.yaml -n vis-production --create-namespace
```

## 3. Monitoring & Alerting Runbook
- **Grafana Dashboard**: `http://localhost:3000/d/vis-overview`
- **Prometheus Metrics**: `http://localhost:9090`
- **AlertManager Alerts**: Integrated with `#vis-alerts-prod` Slack channel.

### Common Incident Response Playbooks
1. **High API Gateway Latency (> 500ms p95)**:
   - Check Redis connectivity (`redis-cli -a <password> ping`).
   - Verify PostgreSQL connection pool exhaustion (`SELECT count(*) FROM pg_stat_activity;`).
   - Trigger Horizontal Pod Autoscaler scale-up (`kubectl scale deployment vis-api-gateway --replicas=6 -n vis-production`).

2. **Telemetry Ingestion Lag / Kafka Consumer Backpressure**:
   - Check Kafka consumer group lag: `kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group telemetry-service-group`.
   - Scale telemetry pods to partition count.

3. **Database Backup & Recovery**:
   - Backup: `./scripts/backup-db.sh`
   - Restore: `./scripts/restore-db.sh <BACKUP_DIR>`
