import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TripRoute, TripRouteDocument } from '../schemas/trip-route.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class TripRouteRepository extends BaseMongoRepository<TripRouteDocument> {
  constructor(
    @InjectModel(TripRoute.name)
    private readonly tripRouteModel: Model<TripRouteDocument>,
  ) {
    super(tripRouteModel);
  }

  async findByTripId(tripId: string): Promise<TripRouteDocument[]> {
    return this.tripRouteModel.find({ tripId }).sort({ timestamp: 1 }).exec();
  }
}
