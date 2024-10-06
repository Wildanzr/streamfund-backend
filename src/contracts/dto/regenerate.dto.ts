import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEthereumAddress } from 'class-validator';

export class RegenerateDTO {
  @ApiProperty({
    description: 'Address to regenerate',
    required: true,
    example: '0x',
  })
  @IsNotEmpty()
  @IsString()
  @IsEthereumAddress()
  address: string;
}
