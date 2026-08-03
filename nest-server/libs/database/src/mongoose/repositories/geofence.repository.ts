import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Geofence, GeofenceDocument } from '../schemas/geofence.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class GeofenceRepository extends BaseMongoRepository<GeofenceDocument> {
  constructor(
    @InjectModel(Geofence.name)
    private readonly geofenceModel: Model<GeofenceDocument>,
  ) {
    super(geofenceModel);
  }

  async findActiveByFleet(fleetId: string): Promise<GeofenceDocument[]> {
    return this.geofenceModel.find({ fleetId, active: true }).exec();
  }

  async findAllActive(): Promise<GeofenceDocument[]> {
    return this.geofenceModel.find({ active: true }).exec();
  }
}
