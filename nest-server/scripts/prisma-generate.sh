#!/bin/sh
echo "Generating Prisma Client..."
npx prisma generate --schema=./libs/database/prisma/schema.prisma
