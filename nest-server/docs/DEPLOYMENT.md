# Production Deployment Guide - Vehicle Information System (VIS)

## Container Deployment (Docker Compose)
To run the entire stack in production mode via Docker Compose:
```bash
docker-compose -f docker-compose.yml up -d --build
```

## Kubernetes Deployment
Deploy manifests to your Kubernetes cluster:
```bash
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
```

## Environment Checks
Ensure the following variables are configured in production environment:
- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL production cluster)
- `MONGODB_URI` (MongoDB replica set)
- `REDIS_HOST` & `REDIS_PORT`
- `KAFKA_BROKERS`
- `MQTT_URL`
