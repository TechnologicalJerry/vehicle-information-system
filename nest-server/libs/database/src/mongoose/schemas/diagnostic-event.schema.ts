import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DiagnosticEventDocument = DiagnosticEvent & Document;

@Schema({ timestamps: true, collection: 'diagnostic_events' })
export class DiagnosticEvent {
  @Prop({ required: true, index: true })
  vehicleId: string;

  @Prop({ index: true })
  fleetId: string;

  @Prop({ required: true, index: true })
  code: string;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ required: true, index: true })
  severity: string;

  @Prop({ required: true, index: true, default: Date.now })
  timestamp: Date;

  @Prop()
  telemetryId: string;

  @Prop({ type: Object, default: {} })
  metrics: Record<string, any>;
}

export const DiagnosticEventSchema = SchemaFactory.createForClass(DiagnosticEvent);

DiagnosticEventSchema.index({ vehicleId: 1, timestamp: -1 });
DiagnosticEventSchema.index({ fleetId: 1, timestamp: -1 });
DiagnosticEventSchema.index({ code: 1, severity: 1 });
