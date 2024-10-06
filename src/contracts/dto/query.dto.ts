import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEthereumAddress,
  IsIn,
  IsOptional,
} from 'class-validator';

enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class QueryStreamerDTO {
  @ApiProperty({
    description: 'Address to regenerate',
    required: true,
    example: '0x',
  })
  @IsNotEmpty()
  @IsString()
  @IsEthereumAddress()
  q: string;

  @ApiProperty({
    description: 'Limit the number of support to fetch',
    required: true,
    example: 10,
    type: Number,
  })
  @IsNotEmpty()
  @IsIn(['10', '20', '50', '100'])
  limit: number;

  @ApiProperty({
    description: 'Page number to fetch support',
    required: true,
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsString()
  page: number;

  @ApiProperty({
    description: 'Sort order of the support',
    required: false,
    example: 'desc',
    type: String,
    enum: SortOrder,
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort: SortOrder;
}
