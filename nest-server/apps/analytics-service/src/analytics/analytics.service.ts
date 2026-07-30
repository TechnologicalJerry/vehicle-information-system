import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, AggregatedStatisticRepository } from '@app/database';
import { RedisService } from '@app/cache';
import { AggregationEngine } from './aggregation.engine';
import { AnalyticsQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly statRepository: AggregatedStatisticRepository,
    private readonly redisService: RedisService,
    private readonly aggregationEngine: AggregationEngine,
  ) {}

  async getDashboardOverview(): Promise<ApiResponseInterface> {
    const cached = await this.redisService.get<any>('dashboard:overview');
    if (cached) {
      return ResponseHelper.success(cached, 'Executive dashboard metrics fetched from Redis cache');
    }

    const metrics = await this.aggregationEngine.aggregateExecutiveDashboard();
    return ResponseHelper.success(metrics);
  }

  async getFleetAnalytics(
    fleetId: string,
    query: AnalyticsQueryDto,
  ): Promise<ApiResponseInterface> {
    const period = query.period || 'DAILY';
    const stats = await this.statRepository.findByPeriod(fleetId, period, 20);

    const [vehicleCount, activeVehicles, totalTrips, activeDtcs] = await Promise.all([
      this.prisma.vehicle.count({ where: { fleetId } }),
      this.prisma.vehicle.count({ where: { fleetId, status: 'ACTIVE' } }),
      this.prisma.trip.count({ where: { fleetId } }),
      this.prisma.dtc.count({ where: { fleetId, status: 'ACTIVE' } }),
    ]);

    const result = {
      fleetId,
      vehicleCount,
      activeVehicles,
      totalTrips,
      activeDtcs,
      periodStats: stats,
    };

    return ResponseHelper.success(result, 'Fleet analytics fetched successfully');
  }

  async getVehicleAnalytics(vehicleId: string): Promise<ApiResponseInterface> {
    const [vehicle, totalTrips, activeDtcs, healthScoreCached] = await Promise.all([
      this.prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      this.prisma.trip.count({ where: { vehicleId } }),
      this.prisma.dtc.count({ where: { vehicleId, status: 'ACTIVE' } }),
      this.redisService.get<any>(`vehicle:${vehicleId}:health`),
    ]);

    return ResponseHelper.success({
      vehicleId,
      vin: vehicle?.vin,
      model: vehicle?.model,
      softwareVersion: vehicle?.softwareVersion,
      firmwareVersion: vehicle?.firmwareVersion,
      odometer: vehicle?.odometer,
      totalTrips,
      activeDtcs,
      healthScore: healthScoreCached?.overallScore || 100,
      trend: healthScoreCached?.trend || 'STABLE',
    });
  }

  async getDriverAnalytics(driverId: string): Promise<ApiResponseInterface> {
    const [score, ranking] = await Promise.all([
      this.prisma.driverScore.findUnique({ where: { driverId } }),
      this.prisma.driverRanking.findFirst({
        where: { driverId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return ResponseHelper.success({
      driverId,
      overallScore: score?.overallScore || 100,
      safetyEventsCount: score?.safetyEventsCount || 0,
      currentRank: ranking?.rank || 1,
      rankingPeriod: ranking?.period || 'MONTHLY',
    });
  }

  async getTripAnalytics(): Promise<ApiResponseInterface> {
    const [totalTrips, completedTrips, cancelledTrips, aggregateStats] = await Promise.all([
      this.prisma.trip.count(),
      this.prisma.trip.count({ where: { tripStatus: 'COMPLETED' } }),
      this.prisma.trip.count({ where: { tripStatus: 'CANCELLED' } }),
      this.prisma.trip.aggregate({
        _sum: { distance: true, duration: true, fuelConsumed: true },
        _avg: { averageSpeed: true },
      }),
    ]);

    return ResponseHelper.success({
      totalTrips,
      completedTrips,
      cancelledTrips,
      totalDistanceKm: aggregateStats._sum.distance || 0,
      totalDurationSeconds: aggregateStats._sum.duration || 0,
      totalFuelConsumedLiters: aggregateStats._sum.fuelConsumed || 0,
      overallAverageSpeedKmh: Number((aggregateStats._avg.averageSpeed || 0).toFixed(2)),
    });
  }

  async getOtaAnalytics(): Promise<ApiResponseInterface> {
    const [totalCampaigns, totalDeployments, successful, failed] = await Promise.all([
      this.prisma.otaCampaign.count(),
      this.prisma.otaDeployment.count(),
      this.prisma.otaDeployment.count({ where: { deploymentStatus: 'COMPLETED' } }),
      this.prisma.otaDeployment.count({ where: { deploymentStatus: 'FAILED' } }),
    ]);

    const successRate =
      totalDeployments > 0 ? Number(((successful / totalDeployments) * 100).toFixed(2)) : 100.0;

    return ResponseHelper.success({
      totalCampaigns,
      totalDeployments,
      successful,
      failed,
      successRatePercentage: successRate,
    });
  }

  async getCommandAnalytics(): Promise<ApiResponseInterface> {
    const [totalCommands, completed, failed, timedOut] = await Promise.all([
      this.prisma.remoteCommand.count(),
      this.prisma.remoteCommand.count({ where: { status: 'COMPLETED' } }),
      this.prisma.remoteCommand.count({ where: { status: 'FAILED' } }),
      this.prisma.remoteCommand.count({ where: { status: 'TIMED_OUT' } }),
    ]);

    const successRate =
      totalCommands > 0 ? Number(((completed / totalCommands) * 100).toFixed(2)) : 100.0;

    return ResponseHelper.success({
      totalCommands,
      completed,
      failed,
      timedOut,
      successRatePercentage: successRate,
    });
  }
}
