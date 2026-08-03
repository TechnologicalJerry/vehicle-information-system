import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DashboardMetricDocument = DashboardMetric & Document;

@Schema({ timestamps: true, collection: 'dashboard_metrics' })
export class DashboardMetric {
  @Prop({ required: true, index: true })
  metricName: string;

  @Prop({ required: true, type: Number })
  value: number;

  @Prop({ type: Object, default: {} })
  dimensions: Record<string, any>;

  @Prop({ required: true, index: true, default: Date.now })
  recordedAt: Date;
}

export const DashboardMetricSchema = SchemaFactory.createForClass(DashboardMetric);

DashboardMetricSchema.index({ metricName: 1, recordedAt: -1 });
