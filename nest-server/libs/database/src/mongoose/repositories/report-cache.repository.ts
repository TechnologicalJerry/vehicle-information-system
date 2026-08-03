import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReportCache, ReportCacheDocument } from '../schemas/report-cache.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class ReportCacheRepository extends BaseMongoRepository<ReportCacheDocument> {
  constructor(
    @InjectModel(ReportCache.name)
    private readonly cacheModel: Model<ReportCacheDocument>,
  ) {
    super(cacheModel);
  }

  async findByReportId(reportId: string): Promise<ReportCacheDocument | null> {
    return this.cacheModel.findOne({ reportId }).exec();
  }
}
