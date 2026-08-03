import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({ timestamps: true, collection: 'locations' })
export class Location {
  @Prop({ required: true, index: true })
  vehicleId: string;

  @Prop({ index: true })
  fleetId: string;

  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: 0.0 })
  altitude: number;

  @Prop({ default: 0.0 })
  heading: number;

  @Prop({ default: 0.0, index: true })
  speed: number;

  @Prop({ default: 2.5 })
  accuracy: number;

  @Prop({ required: true, index: true, default: Date.now })
  timestamp: Date;

  @Prop({ default: 'KAFKA' })
  source: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.index({ vehicleId: 1, timestamp: -1 });
LocationSchema.index({ fleetId: 1, timestamp: -1 });
LocationSchema.index({ location: '2dsphere' });
