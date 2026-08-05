#!/bin/sh
echo "Stopping Docker Compose services..."
docker-compose down -v
echo "Services stopped!"
