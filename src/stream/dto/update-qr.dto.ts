import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class UpdateQRDTO {
  @ApiProperty({
    description: 'Quiet zone',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  quietZone: number;

  @ApiProperty({
    description: 'Background color',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  bgColor: string;

  @ApiProperty({
    description: 'Foreground color',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  fgColor: string;

  @ApiProperty({
    description: 'Level',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  level: string;

  @ApiProperty({
    description: 'Style',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  style: string;
}
