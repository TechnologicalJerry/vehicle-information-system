import { Module } from '@nestjs/common';
import { MongooseModule as NestMongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './mongoose-config.service';
import { Telemetry, TelemetrySchema } from './schemas/telemetry.schema';
import { Location, LocationSchema } from './schemas/location.schema';
import { Geofence, GeofenceSchema } from './schemas/geofence.schema';
import { TripRoute, TripRouteSchema } from './schemas/trip-route.schema';
import { DiagnosticEvent, DiagnosticEventSchema } from './schemas/diagnostic-event.schema';
import { BehaviourEvent, BehaviourEventSchema } from './schemas/behaviour-event.schema';
import { AnalyticsSnapshot, AnalyticsSnapshotSchema } from './schemas/analytics-snapshot.schema';
import { DashboardMetric, DashboardMetricSchema } from './schemas/dashboard-metric.schema';
import {
  AggregatedStatistic,
  AggregatedStatisticSchema,
} from './schemas/aggregated-statistic.schema';
import { ReportCache, ReportCacheSchema } from './schemas/report-cache.schema';
import { AuditMetadata, AuditMetadataSchema } from './schemas/audit-metadata.schema';
import { TelemetryRepository } from './repositories/telemetry.repository';
import { LocationMongoRepository } from './repositories/location-mongo.repository';
import { GeofenceRepository } from './repositories/geofence.repository';
import { TripRouteRepository } from './repositories/trip-route.repository';
import { DiagnosticEventRepository } from './repositories/diagnostic-event.repository';
import { BehaviourEventRepository } from './repositories/behaviour-event.repository';
import { AnalyticsSnapshotRepository } from './repositories/analytics-snapshot.repository';
import { DashboardMetricRepository } from './repositories/dashboard-metric.repository';
import { AggregatedStatisticRepository } from './repositories/aggregated-statistic.repository';
import { ReportCacheRepository } from './repositories/report-cache.repository';
import { AuditMetadataRepository } from './repositories/audit-metadata.repository';

@Module({
  imports: [
    NestMongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    NestMongooseModule.forFeature([
      { name: Telemetry.name, schema: TelemetrySchema },
      { name: Location.name, schema: LocationSchema },
      { name: Geofence.name, schema: GeofenceSchema },
      { name: TripRoute.name, schema: TripRouteSchema },
      { name: DiagnosticEvent.name, schema: DiagnosticEventSchema },
      { name: BehaviourEvent.name, schema: BehaviourEventSchema },
      { name: AnalyticsSnapshot.name, schema: AnalyticsSnapshotSchema },
      { name: DashboardMetric.name, schema: DashboardMetricSchema },
      { name: AggregatedStatistic.name, schema: AggregatedStatisticSchema },
      { name: ReportCache.name, schema: ReportCacheSchema },
      { name: AuditMetadata.name, schema: AuditMetadataSchema },
    ]),
  ],
  providers: [
    TelemetryRepository,
    LocationMongoRepository,
    GeofenceRepository,
    TripRouteRepository,
    DiagnosticEventRepository,
    BehaviourEventRepository,
    AnalyticsSnapshotRepository,
    DashboardMetricRepository,
    AggregatedStatisticRepository,
    ReportCacheRepository,
    AuditMetadataRepository,
  ],
  exports: [
    NestMongooseModule,
    TelemetryRepository,
    LocationMongoRepository,
    GeofenceRepository,
    TripRouteRepository,
    DiagnosticEventRepository,
    BehaviourEventRepository,
    AnalyticsSnapshotRepository,
    DashboardMetricRepository,
    AggregatedStatisticRepository,
    ReportCacheRepository,
    AuditMetadataRepository,
  ],
})
export class AppMongooseModule {}
