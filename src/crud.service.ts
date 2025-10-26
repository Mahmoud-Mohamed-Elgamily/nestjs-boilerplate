import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from 'shared/pagination.dto';
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
          /CONSTRAINT `(.+?)` FOREIGN KEY \(`(.+?)`\) REFERENCES `(.+?)`/;
        const matches = error.message.match(regex);
        if (matches) {
          const columnName = matches[2];
          const referencedTableName = matches[3];
          throw new BadRequestException(
            `No record found for ${columnName} column inside ${referencedTableName} table.`,
          );
        }
      }
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    options: FindManyOptions<T> = {},
  ): Promise<{
    page: number;
    page_size: number;
    count: number;
    data: T[];
  }> {
    options.take = Math.min(30, +paginationDto.page_size || 30);
    options.skip = options.take * +paginationDto.page || 0;

    const result = await this.repository.findAndCount({
      ...options,
      loadEagerRelations: false,
    });

    return {
      page: +paginationDto.page || 0,
      page_size: options.take,
      count: result[1],
      data: result[0],
    };
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    try {
      return await this.repository.findOneOrFail(options);
    } catch (error) {
      throw new NotFoundException(
        `no ${error?.entityClass?.name || 'record'} found with given criteria`,
      );
    }
  }
  async findOneOrDefault(options: FindOneOptions<T>): Promise<T> {
    try {
      return await this.repository.findOne(options);
    } catch (error) {
      return null;
    }
  }

  async update(
    conditions: FindOptionsWhere<T>,
    data: QueryDeepPartialEntity<T>,
  ) {
    try {
      return await this.repository.update({ ...conditions }, data);
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

  async remove(conditions: FindOptionsWhere<T>): Promise<void> {
    await this.repository.softDelete(conditions);
  }

  async delete(conditions: FindOptionsWhere<T>): Promise<void> {
    await this.repository.delete(conditions);
  }
}
