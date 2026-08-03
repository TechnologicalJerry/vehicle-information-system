import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalyticsSnapshotDocument = AnalyticsSnapshot & Document;

@Schema({ timestamps: true, collection: 'analytics_snapshots' })
export class AnalyticsSnapshot {
  @Prop({ required: true, index: true })
  snapshotType: string;

  @Prop({ index: true })
  fleetId: string;

  @Prop({ index: true })
  vehicleId: string;

  @Prop({ index: true })
  driverId: string;

  @Prop({ type: Object, default: {} })
  metrics: Record<string, any>;

  @Prop({ required: true, index: true, default: Date.now })
  timestamp: Date;
}

export const AnalyticsSnapshotSchema = SchemaFactory.createForClass(AnalyticsSnapshot);

AnalyticsSnapshotSchema.index({ fleetId: 1, timestamp: -1 });
AnalyticsSnapshotSchema.index({ vehicleId: 1, timestamp: -1 });
AnalyticsSnapshotSchema.index({ snapshotType: 1, timestamp: -1 });
