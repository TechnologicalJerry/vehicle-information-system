#!/bin/sh
echo "Starting Docker Compose services..."
docker-compose up -d --build
echo "Services started successfully!"
