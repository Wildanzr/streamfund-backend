import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StreamService } from './stream.service';
import { HmacguardGuard } from 'src/lib/guards/hmac.guard';
import { ApiOperation } from '@nestjs/swagger';
import { QueryStreamkeyDTO } from './dto/query-stream-key.dto';
import { SuccessResponseDTO } from 'src/lib/dto/response.dto';
import { UpdateQRDTO } from './dto/update-qr.dto';

@Controller('stream')
@UseGuards(HmacguardGuard)
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('/qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get QR configuration',
  })
  async getQRConfig(
    @Query() query: QueryStreamkeyDTO,
  ): Promise<SuccessResponseDTO> {
    const config = await this.streamService.getQRConfig(query);

    return {
      success: true,
      message: 'QR configuration fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        config,
      },
    };
  }

  @Put('/qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update QR configuration',
  })
  async updateQRConfig(
    @Query() query: QueryStreamkeyDTO,
    @Body() body: UpdateQRDTO,
  ): Promise<SuccessResponseDTO> {
    const id = await this.streamService.updateQRConfig(query, body);

    return {
      success: true,
      message: 'QR configuration updated successfully',
      statusCode: HttpStatus.OK,
      data: {
        id,
      },
    };
  }
}
