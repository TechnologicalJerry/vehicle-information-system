import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BehaviourEventDocument = BehaviourEvent & Document;

@Schema({ timestamps: true, collection: 'behaviour_events' })
export class BehaviourEvent {
  @Prop({ required: true, index: true })
  vehicleId: string;

  @Prop({ index: true })
  driverId: string;

  @Prop({ index: true })
  tripId: string;

  @Prop({ required: true, index: true })
  eventType: string;

  @Prop({ required: true, default: 'MEDIUM' })
  severity: string;

  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

  @Prop({ default: 0.0 })
  speed: number;

  @Prop({ required: true, index: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const BehaviourEventSchema = SchemaFactory.createForClass(BehaviourEvent);

BehaviourEventSchema.index({ driverId: 1, timestamp: -1 });
BehaviourEventSchema.index({ vehicleId: 1, timestamp: -1 });
BehaviourEventSchema.index({ eventType: 1 });
