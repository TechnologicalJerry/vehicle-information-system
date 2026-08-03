import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationDocument } from '../schemas/location.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class LocationMongoRepository extends BaseMongoRepository<LocationDocument> {
  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
  ) {
    super(locationModel);
  }

  async findLatestByVehicleId(vehicleId: string): Promise<LocationDocument | null> {
    return this.locationModel.findOne({ vehicleId }).sort({ timestamp: -1 }).exec();
  }

  async findHistoryByVehicleId(
    vehicleId: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100,
  ): Promise<LocationDocument[]> {
    const query: any = { vehicleId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    return this.locationModel.find(query).sort({ timestamp: -1 }).limit(limit).exec();
  }
}
