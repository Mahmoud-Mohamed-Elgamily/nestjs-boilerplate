import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class PaginatedResponse<T> {
  @ApiProperty()
  page: number;

  @ApiProperty()
  page_size: number;

  @ApiProperty()
  count: number;

  @ApiProperty({ type: 'array', isArray: true })
  data: T[];
}

export function getPaginatedResponseType<T>(itemType: Type<T>) {
  class PaginatedResponseClass extends PaginatedResponse<T> {
    @ApiProperty({ type: itemType, isArray: true })
    data: T[];
  }

  // Generate a unique name for the class
  const uniqueClassName = `PaginatedResponse${itemType.name}`;
  Object.defineProperty(PaginatedResponseClass, 'name', {
    value: uniqueClassName,
  });

  return PaginatedResponseClass;
}
