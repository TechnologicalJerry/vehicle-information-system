import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditMetadataDocument = AuditMetadata & Document;

@Schema({ timestamps: true, collection: 'audit_metadata' })
export class AuditMetadata {
  @Prop({ required: true, index: true })
  auditId: string;

  @Prop({ index: true })
  correlationId: string;

  @Prop({ type: Object, default: {} })
  extendedContext: Record<string, any>;

  @Prop({ required: true, index: true, default: Date.now })
  recordedAt: Date;
}

export const AuditMetadataSchema = SchemaFactory.createForClass(AuditMetadata);

AuditMetadataSchema.index({ auditId: 1 });
AuditMetadataSchema.index({ correlationId: 1 });
