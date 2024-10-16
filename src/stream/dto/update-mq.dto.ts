import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMQDTO {
  @ApiProperty({
    description: 'Background color',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  backgroundColor: string;

  @ApiProperty({
    description: 'Text color',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  textColor: string;

  @ApiProperty({
    description: 'Font family',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  font: string;

  @ApiProperty({
    description: 'Text size',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  textSize: string;

  @ApiProperty({
    description: 'Text',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  text: string;
}
