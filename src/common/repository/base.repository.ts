import { FindOptions, UpdateOptions, ModelStatic, WhereOptions, Attributes, BulkCreateOptions, CreationAttributes } from "sequelize";
import { Model } from "sequelize-typescript";


export abstract class BaseRepository<T extends Model<T>> {

  constructor(protected readonly model: ModelStatic<T>) {}

  async find(query?: FindOptions<Attributes<T>>): Promise<Attributes<T>[]> {
    return this.model.findAll(query);
  }

  async findOne(query: FindOptions<Attributes<T>>): Promise<Attributes<T> | null> {
    return this.model.findOne(query);
  }

  async findById(id: T['id']): Promise<Attributes<T> | null> {
    return this.model.findByPk(id);
  }

  async create(payload: CreationAttributes<T>): Promise<Attributes<T>> {
    return this.model.create(payload);
  }

  async createMany(
    payloads: CreationAttributes<T>[], 
    options?: BulkCreateOptions
  ): Promise<Attributes<T>[]> {
    return this.model.bulkCreate(payloads, options);
  }

  async update(
    query: WhereOptions<T>, 
    payload: Partial<Attributes<T>>,
    options: Omit<UpdateOptions<T>, 'where' | 'returning'> = {}
  ): Promise<[affectedCount: number, updatedItems?: T[]]> {
    const updateOptions: UpdateOptions<T> = {
      where: query,
      returning: true,
      ...options
    };
    return this.model.update(payload, updateOptions);
  }

  async deleteById(id: Attributes<T>['id']): Promise<number> {
    return await this.model.destroy({
      where: { id }
    });
  }

  async deleteOne(query: WhereOptions<T>): Promise<number> {
    const destroyOptions: WhereOptions = {
      where: query,
      limit: 1
    };
    return this.model.destroy(destroyOptions);
  }

  async deleteMany(query: WhereOptions<T>): Promise<number> {
    return await this.model.destroy({
      where: query
    });
  }

  async destroy(where: any): Promise<any> {
    return this.model.destroy({ where });
  }

  async deleteAll(): Promise<boolean> {
    try {
      const transaction = await this.model.sequelize!.transaction();
      try {
        await this.model.truncate({ transaction, cascade: true });
        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (err) {
      throw new Error(`Failed to truncate table: ${err.message}`);
    }
  }

  async findAndCountAll(query?: { offset: number, limit: number, order: any, where: any }): Promise<{ rows: T[]; count: number }> {
    if (!query) {
      const { rows, count }: { rows: Attributes<T>[], count: number } = await this.model.findAndCountAll();
      return { rows, count };
    }

    const { offset = 0, limit = 10, order, ...where } = query;
    
    const findOptions: FindOptions = {
      where,
      offset,
      limit,
    };

    if (order) {
      findOptions.order = Array.isArray(order) ? order : [[order.field, order.direction]];
    }

    const { rows, count }: { rows: Attributes<T>[], count: number } = await this.model.findAndCountAll(findOptions);
    return { rows, count };
  }

  async count(query?: WhereOptions<Attributes<T>>): Promise<number> {
    return await this.model.count({
      where: query ?? {}
    });
  }
}
