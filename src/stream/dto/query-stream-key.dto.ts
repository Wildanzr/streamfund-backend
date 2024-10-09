import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class QueryStreamkeyDTO {
  @ApiProperty({
    description: 'Streamkey',
    required: true,
    example: '0x',
  })
  @IsNotEmpty()
  @IsString()
  streamkey: string;
}
