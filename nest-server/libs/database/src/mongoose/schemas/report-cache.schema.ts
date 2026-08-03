import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportCacheDocument = ReportCache & Document;

@Schema({ timestamps: true, collection: 'report_cache' })
export class ReportCache {
  @Prop({ required: true, index: true })
  reportId: string;

  @Prop({ required: true, index: true })
  reportType: string;

  @Prop({ required: true })
  format: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({ required: true, index: true, default: Date.now })
  cachedAt: Date;
}

export const ReportCacheSchema = SchemaFactory.createForClass(ReportCache);

ReportCacheSchema.index({ reportId: 1 });
