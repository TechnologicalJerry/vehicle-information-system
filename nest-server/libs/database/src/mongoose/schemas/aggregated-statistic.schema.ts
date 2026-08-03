import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AggregatedStatisticDocument = AggregatedStatistic & Document;

@Schema({ timestamps: true, collection: 'aggregated_statistics' })
export class AggregatedStatistic {
  @Prop({ required: true, index: true })
  period: string; // HOURLY, DAILY, WEEKLY, MONTHLY

  @Prop({ index: true })
  fleetId: string;

  @Prop({ type: Object, default: {} })
  aggregatedData: Record<string, any>;

  @Prop({ required: true, index: true })
  periodStart: Date;

  @Prop({ required: true, index: true })
  periodEnd: Date;
}

export const AggregatedStatisticSchema = SchemaFactory.createForClass(AggregatedStatistic);

AggregatedStatisticSchema.index({ fleetId: 1, period: 1, periodStart: -1 });
