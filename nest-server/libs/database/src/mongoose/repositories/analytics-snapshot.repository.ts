import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsSnapshot, AnalyticsSnapshotDocument } from '../schemas/analytics-snapshot.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class AnalyticsSnapshotRepository extends BaseMongoRepository<AnalyticsSnapshotDocument> {
  constructor(
    @InjectModel(AnalyticsSnapshot.name)
    private readonly snapshotModel: Model<AnalyticsSnapshotDocument>,
  ) {
    super(snapshotModel);
  }

  async findByFleetId(fleetId: string, limit = 50): Promise<AnalyticsSnapshotDocument[]> {
    return this.snapshotModel.find({ fleetId }).sort({ timestamp: -1 }).limit(limit).exec();
  }
}
