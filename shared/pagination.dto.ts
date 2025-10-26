import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsNumberString()
  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @IsNumberString()
  @ApiProperty({ required: false })
  @IsOptional()
  page_size?: number;
}
