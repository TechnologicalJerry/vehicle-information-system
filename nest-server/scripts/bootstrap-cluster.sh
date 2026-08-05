#!/bin/bash
set -e

echo "=== Bootstrapping Local Kubernetes Cluster for VIS ==="
kubectl apply -f k8s/namespaces.yaml
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/network-policies.yaml
kubectl apply -f k8s/pod-disruption-budget.yaml
kubectl apply -f k8s/deployments.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml

echo "=== VIS Kubernetes Cluster Bootstrapped Successfully ==="
