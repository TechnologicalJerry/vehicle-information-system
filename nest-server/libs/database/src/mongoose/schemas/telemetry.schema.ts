import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TelemetryDocument = Telemetry & Document;

@Schema({ timestamps: true, collection: 'telemetry' })
export class Telemetry {
  @Prop({ required: true, index: true })
  vehicleId: string;

  @Prop({ index: true })
  fleetId: string;

  @Prop({ required: true, index: true, default: Date.now })
  timestamp: Date;

  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

  // GeoJSON Point location for 2dsphere indexing
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

  @Prop({ default: 0 })
  rpm: number;

  @Prop({ default: 0.0 })
  odometer: number;

  @Prop({ default: 100.0 })
  fuelLevel: number;

  @Prop({ default: 100.0 })
  batteryLevel: number;

  @Prop({ default: 400.0 })
  batteryVoltage: number;

  @Prop({ default: 90.0 })
  coolantTemperature: number;

  @Prop({ default: 95.0 })
  engineTemperature: number;

  @Prop({ default: 35.0 })
  oilPressure: number;

  @Prop({ default: 32.0 })
  tyrePressureFrontLeft: number;

  @Prop({ default: 32.0 })
  tyrePressureFrontRight: number;

  @Prop({ default: 32.0 })
  tyrePressureRearLeft: number;

  @Prop({ default: 32.0 })
  tyrePressureRearRight: number;

  @Prop({ default: 'OFF' })
  engineStatus: string;

  @Prop({ default: 'OFF' })
  ignitionStatus: string;

  @Prop({ default: 'P' })
  gear: string;

  @Prop({ default: 0.0 })
  acceleratorPosition: number;

  @Prop({ default: false })
  brakeStatus: boolean;

  @Prop({ default: 'CLOSED' })
  doorStatus: string;

  @Prop({ default: 'FASTENED' })
  seatbeltStatus: string;

  @Prop({ default: 'DISCONNECTED' })
  chargingStatus: string;

  @Prop({ default: -75 })
  signalStrength: number;

  @Prop({ default: 2.5 })
  gpsAccuracy: number;

  @Prop({ default: 'REST' })
  source: string;

  @Prop({ type: Object })
  rawPayload: Record<string, any>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);

// Compound Indexes for Time-Series performance
TelemetrySchema.index({ vehicleId: 1, timestamp: -1 });
TelemetrySchema.index({ fleetId: 1, timestamp: -1 });

// GeoSpatial Index for Proximity & Bounding Box queries
TelemetrySchema.index({ location: '2dsphere' });
