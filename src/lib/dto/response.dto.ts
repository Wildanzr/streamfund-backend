import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDTO {
  @ApiProperty({
    description: 'Status of the response',
    required: true,
    example: true,
    type: Boolean,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message of the response',
    required: true,
    example: [
      'Ticket created successfully',
      ['Ticket created successfully', 'Ticket created successfully'],
    ],
  })
  @IsNotEmpty()
  message: string | string[];

  @ApiProperty({
    description: 'Data of the response',
    required: false,
    example: { id: 'uuid', name: 'John Doe' },
  })
  data?: Record<string, unknown>;

  @ApiProperty({
    description: 'Meta of the response',
    required: false,
    example: { count: 1, total: 1 },
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Status code of the response',
    required: true,
    example: 201,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  statusCode: number;
}
