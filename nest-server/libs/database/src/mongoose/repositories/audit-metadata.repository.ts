import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditMetadata, AuditMetadataDocument } from '../schemas/audit-metadata.schema';
import { BaseMongoRepository } from '../base.repository';

@Injectable()
export class AuditMetadataRepository extends BaseMongoRepository<AuditMetadataDocument> {
  constructor(
    @InjectModel(AuditMetadata.name)
    private readonly auditMetaModel: Model<AuditMetadataDocument>,
  ) {
    super(auditMetaModel);
  }

  async findByAuditId(auditId: string): Promise<AuditMetadataDocument | null> {
    return this.auditMetaModel.findOne({ auditId }).exec();
  }
}
