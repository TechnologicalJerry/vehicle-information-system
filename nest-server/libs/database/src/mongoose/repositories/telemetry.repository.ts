import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Telemetry, TelemetryDocument } from '../schemas/telemetry.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class TelemetryRepository extends BaseMongoRepository<TelemetryDocument> {
  constructor(
    @InjectModel(Telemetry.name)
    private readonly telemetryModel: Model<TelemetryDocument>,
  ) {
    super(telemetryModel);
  }

  async findLatestByVehicleId(vehicleId: string): Promise<TelemetryDocument | null> {
    return this.telemetryModel.findOne({ vehicleId }).sort({ timestamp: -1 }).exec();
  }

  async findHistoryByVehicleId(
    vehicleId: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100,
  ): Promise<TelemetryDocument[]> {
    const query: any = { vehicleId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return this.telemetryModel.find(query).sort({ timestamp: -1 }).limit(limit).exec();
  }

  async findByBoundingBox(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<TelemetryDocument[]> {
    return this.telemetryModel
      .find({
        location: {
          $geoWithin: {
            $box: [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
          },
        },
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .exec();
  }
}
