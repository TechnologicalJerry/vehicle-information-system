#!/bin/sh
echo "Setting up Vehicle Information System Backend Workspace..."
npm install
npm run prisma:generate
npm run build
echo "Setup complete!"
