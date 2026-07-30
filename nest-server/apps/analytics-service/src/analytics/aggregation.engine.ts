import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, AggregatedStatisticRepository } from '@app/database';
import { RedisService } from '@app/cache';

@Injectable()
export class AggregationEngine {
  private readonly logger = new Logger(AggregationEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly statRepository: AggregatedStatisticRepository,
    private readonly redisService: RedisService,
  ) {}

  async aggregateExecutiveDashboard(): Promise<Record<string, any>> {
    const [
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalFleets,
      totalTrips,
      totalDtcs,
      totalCommands,
      totalOtaDeployments,
    ] = await Promise.all([
      this.prisma.vehicle.count(),
      this.prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
      this.prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
      this.prisma.fleet.count(),
      this.prisma.trip.count(),
      this.prisma.dtc.count({ where: { status: 'ACTIVE' } }),
      this.prisma.remoteCommand.count(),
      this.prisma.otaDeployment.count(),
    ]);

    const utilizationRate =
      totalVehicles > 0 ? Number(((activeVehicles / totalVehicles) * 100).toFixed(2)) : 0.0;

    const metrics = {
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalFleets,
      totalTrips,
      activeDtcCount: totalDtcs,
      totalCommandsExecuted: totalCommands,
      totalOtaDeployments,
      fleetUtilizationPercentage: utilizationRate,
      calculatedAt: new Date().toISOString(),
    };

    await this.redisService.set('dashboard:overview', metrics, 300);
    return metrics;
  }

  async runScheduledRollup(period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'): Promise<void> {
    this.logger.log(`Running scheduled analytics aggregation rollup for period [${period}]`);

    const fleets = await this.prisma.fleet.findMany({ select: { id: true } });
    const now = new Date();
    const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const fleet of fleets) {
      const [vehicleCount, tripCount, activeDtcs] = await Promise.all([
        this.prisma.vehicle.count({ where: { fleetId: fleet.id } }),
        this.prisma.trip.count({ where: { fleetId: fleet.id } }),
        this.prisma.dtc.count({ where: { fleetId: fleet.id, status: 'ACTIVE' } }),
      ]);

      const aggregatedData = {
        vehicleCount,
        tripCount,
        activeDtcs,
        period,
        timestamp: now.toISOString(),
      };

      await this.statRepository.create({
        period,
        fleetId: fleet.id,
        aggregatedData,
        periodStart,
        periodEnd: now,
      } as any);
    }

    await this.aggregateExecutiveDashboard();
  }
}
