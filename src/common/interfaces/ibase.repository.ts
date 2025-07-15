import { Attributes, CreationAttributes, Model, UpdateOptions, WhereOptions } from "sequelize";
import { IQueryFilter } from "./iqueryfilter.repository";

export interface IBaseRepository<T extends Model> {

  // Basic CRUD operations
  create(payload: CreationAttributes<T>): Promise<T>;
  find(query?: IQueryFilter<T>): Promise<T[]>;
  findOne(query: IQueryFilter<T>): Promise<T | null>;
  updateOne(
    query: Record<string, unknown>,
    payload: Partial<T>,
    options?: UpdateOptions
  ): Promise<[number]>;
  deleteOne(query: Record<string, unknown>): Promise<number>;

  // Utility methods
  count(query?: WhereOptions<T>): Promise<number>;

  // ID based operations
  findById(id: string | number): Promise<T | null>;
  updateById(
    id: Attributes<T>['id'],
    payload: Partial<CreationAttributes<T>>,
    options?: Omit<UpdateOptions<Attributes<T>>, 'where' | 'returning'>
  ): Promise<[affectedCount: number]>;
  deleteById(id: string | number): Promise<number>;

  // Bulk operations
  createMany(payloads: CreationAttributes<T>[]): Promise<T[]>;
  updateMany(
    query: WhereOptions<T>,
    payload: Partial<T>
  ): Promise<[number, T[]]>;
  deleteMany(query: WhereOptions<T>): Promise<number>;

  // Pagination helper
  findAndCountAll(query?: IQueryFilter<T>): Promise<{ rows: T[]; count: number }>;
}
