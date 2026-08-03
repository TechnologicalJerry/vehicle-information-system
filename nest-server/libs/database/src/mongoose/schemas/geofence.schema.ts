import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GeofenceDocument = Geofence & Document;

@Schema({ timestamps: true, collection: 'geofences' })
export class Geofence {
  @Prop({ required: true, index: true })
  fleetId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['CIRCLE', 'POLYGON'], default: 'CIRCLE' })
  type: string;

  // Center point for CIRCLE type
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number], // [longitude, latitude]
  })
  center: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: 0.0 })
  radius: number; // In meters

  // Polygon boundary for POLYGON type
  @Prop({
    type: {
      type: String,
      enum: ['Polygon'],
    },
    coordinates: [[[Number]]], // Polygon LinearRing coordinates
  })
  polygon: {
    type: string;
    coordinates: number[][][];
  };

  @Prop({ default: true, index: true })
  active: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const GeofenceSchema = SchemaFactory.createForClass(Geofence);

GeofenceSchema.index({ fleetId: 1, active: 1 });
GeofenceSchema.index({ center: '2dsphere' });
GeofenceSchema.index({ polygon: '2dsphere' });
