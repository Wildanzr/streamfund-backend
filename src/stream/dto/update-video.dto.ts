import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateVideoDTO {
  @ApiProperty({
    description: 'Background color',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  backgroundColor: string;

  @ApiProperty({
    description: 'Main text color',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  mainColor: string;

  @ApiProperty({
    description: 'Second text color',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  secondColor: string;

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
    description: 'Text effect',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  effect: string;
}
