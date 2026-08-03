import { PrismaClient, RoleEnum, PermissionEnum } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_PERMISSIONS_MAP: Record<RoleEnum, PermissionEnum[]> = {
  [RoleEnum.SUPER_ADMIN]: Object.values(PermissionEnum),
  [RoleEnum.ADMIN]: Object.values(PermissionEnum),
  [RoleEnum.FLEET_MANAGER]: [
    PermissionEnum.FLEET_MANAGEMENT,
    PermissionEnum.VEHICLE_MANAGEMENT,
    PermissionEnum.TELEMETRY,
    PermissionEnum.TRIPS,
    PermissionEnum.DIAGNOSTICS,
    PermissionEnum.REPORTS,
    PermissionEnum.NOTIFICATIONS,
    PermissionEnum.ANALYTICS,
  ],
  [RoleEnum.OPERATOR]: [
    PermissionEnum.VEHICLE_MANAGEMENT,
    PermissionEnum.TELEMETRY,
    PermissionEnum.TRIPS,
    PermissionEnum.DIAGNOSTICS,
    PermissionEnum.REPORTS,
    PermissionEnum.NOTIFICATIONS,
    PermissionEnum.ANALYTICS,
  ],
  [RoleEnum.DRIVER]: [PermissionEnum.TELEMETRY, PermissionEnum.TRIPS, PermissionEnum.NOTIFICATIONS],
  [RoleEnum.READ_ONLY_USER]: [
    PermissionEnum.FLEET_MANAGEMENT,
    PermissionEnum.VEHICLE_MANAGEMENT,
    PermissionEnum.TELEMETRY,
    PermissionEnum.TRIPS,
    PermissionEnum.REPORTS,
    PermissionEnum.NOTIFICATIONS,
    PermissionEnum.ANALYTICS,
  ],
};

async function main() {
  console.log('Seeding system roles and permissions...');

  // 1. Create Permissions
  for (const permissionName of Object.values(PermissionEnum)) {
    await prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: {
        name: permissionName,
        description: `Permission to access ${permissionName.toLowerCase().replace('_', ' ')} domain`,
      },
    });
  }

  // 2. Create Roles & RolePermissions
  for (const roleName of Object.values(RoleEnum)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `System role for ${roleName}`,
      },
    });

    const assignedPermissions = ROLE_PERMISSIONS_MAP[roleName] || [];
    for (const permName of assignedPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  console.log('Role and Permission seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
