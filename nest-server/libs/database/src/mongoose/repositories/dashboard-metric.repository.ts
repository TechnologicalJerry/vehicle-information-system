import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DashboardMetric, DashboardMetricDocument } from '../schemas/dashboard-metric.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class DashboardMetricRepository extends BaseMongoRepository<DashboardMetricDocument> {
  constructor(
    @InjectModel(DashboardMetric.name)
    private readonly metricModel: Model<DashboardMetricDocument>,
  ) {
    super(metricModel);
  }

  async findLatestByName(metricName: string): Promise<DashboardMetricDocument | null> {
    return this.metricModel.findOne({ metricName }).sort({ recordedAt: -1 }).exec();
  }
}
