import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { DeepPartial } from 'typeorm/common/DeepPartial';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@Injectable()
export class CrudService<T> {
  constructor(private readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      return await this.repository.save(entity);
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        const regex =
          /.*a foreign key constraint fails \(`(.*)`\.(.*), CONSTRAINT `(.*)` FOREIGN KEY \(`(.*)`\) REFERENCES `(.*)` \(`(.*)`\)/;
        const matches = error.message.match(regex);
        if (matches) {
          const columnName = matches[4];
          const referencedTableName = matches[5];
          throw new BadRequestException(
            `No record found for ${columnName} column inside ${referencedTableName} table.`,
          );
        }
      } else {
        throw new BadRequestException(error.message);
      }
    }
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    try {
      return await this.repository.findOneOrFail(options);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async update(
    conditions: FindOptionsWhere<T>,
    data: QueryDeepPartialEntity<T>,
  ) {
    await this.repository.update(conditions, data);
  }

  async remove(conditions: FindOptionsWhere<T>): Promise<void> {
    await this.repository.softDelete(conditions);
  }
}
