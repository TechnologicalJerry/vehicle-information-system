import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiagnosticEvent, DiagnosticEventDocument } from '../schemas/diagnostic-event.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class DiagnosticEventRepository extends BaseMongoRepository<DiagnosticEventDocument> {
  constructor(
    @InjectModel(DiagnosticEvent.name)
    private readonly diagnosticEventModel: Model<DiagnosticEventDocument>,
  ) {
    super(diagnosticEventModel);
  }

  async findByVehicleId(vehicleId: string, limit = 100): Promise<DiagnosticEventDocument[]> {
    return this.diagnosticEventModel
      .find({ vehicleId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}
