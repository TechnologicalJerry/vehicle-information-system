import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BehaviourEvent, BehaviourEventDocument } from '../schemas/behaviour-event.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class BehaviourEventRepository extends BaseMongoRepository<BehaviourEventDocument> {
  constructor(
    @InjectModel(BehaviourEvent.name)
    private readonly behaviourEventModel: Model<BehaviourEventDocument>,
  ) {
    super(behaviourEventModel);
  }

  async findByDriverId(driverId: string, limit = 100): Promise<BehaviourEventDocument[]> {
    return this.behaviourEventModel.find({ driverId }).sort({ timestamp: -1 }).limit(limit).exec();
  }

  async findByVehicleId(vehicleId: string, limit = 100): Promise<BehaviourEventDocument[]> {
    return this.behaviourEventModel.find({ vehicleId }).sort({ timestamp: -1 }).limit(limit).exec();
  }
}
