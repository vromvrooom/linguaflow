#!/bin/bash
echo "Pulling latest code..."
git pull origin main
echo "Building and restarting containers..."
docker compose build --no-cache
docker compose up -d
echo "Running migrations..."
docker compose exec backend npx prisma migrate deploy
echo "Done! App running on http://194.28.84.152"
