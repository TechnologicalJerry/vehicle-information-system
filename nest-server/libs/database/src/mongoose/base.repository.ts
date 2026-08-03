import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class BaseMongoRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(doc: Partial<T>): Promise<T> {
    const createdEntity = new this.model(doc);
    return createdEntity.save() as unknown as Promise<T>;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async update(id: string, updateDto: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}
