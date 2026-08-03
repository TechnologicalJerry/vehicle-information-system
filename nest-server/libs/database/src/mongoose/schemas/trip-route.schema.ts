import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TripRouteDocument = TripRoute & Document;

@Schema({ timestamps: true, collection: 'trip_routes' })
export class TripRoute {
  @Prop({ required: true, index: true })
  tripId: string;

  @Prop({ required: true, index: true })
  vehicleId: string;

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
    coordinates: [Number], // [longitude, latitude]
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ required: true, index: true, default: Date.now })
  timestamp: Date;

  @Prop({ default: 0.0 })
  speed: number;

  @Prop({ default: 0.0 })
  heading: number;
}

export const TripRouteSchema = SchemaFactory.createForClass(TripRoute);

TripRouteSchema.index({ tripId: 1, timestamp: 1 });
TripRouteSchema.index({ vehicleId: 1, timestamp: -1 });
TripRouteSchema.index({ location: '2dsphere' });
