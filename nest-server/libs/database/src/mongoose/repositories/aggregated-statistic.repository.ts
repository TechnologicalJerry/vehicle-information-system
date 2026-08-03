import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AggregatedStatistic,
  AggregatedStatisticDocument,
} from '../schemas/aggregated-statistic.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class AggregatedStatisticRepository extends BaseMongoRepository<AggregatedStatisticDocument> {
  constructor(
    @InjectModel(AggregatedStatistic.name)
    private readonly statModel: Model<AggregatedStatisticDocument>,
  ) {
    super(statModel);
  }

  async findByPeriod(
    fleetId: string,
    period: string,
    limit = 20,
  ): Promise<AggregatedStatisticDocument[]> {
    return this.statModel.find({ fleetId, period }).sort({ periodStart: -1 }).limit(limit).exec();
  }
}
