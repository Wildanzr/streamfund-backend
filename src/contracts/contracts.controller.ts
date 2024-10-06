import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { SuccessResponseDTO } from 'src/lib/dto/response.dto';
import { RegenerateDTO } from './dto/regenerate.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('/streamers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get streamer's details",
  })
  async getStreamer(
    @Query('address') address: string,
  ): Promise<SuccessResponseDTO> {
    const data = await this.contractsService.getStreamerByAddress(address);
    const streamer = data ? [data] : [];

    return {
      success: true,
      message: 'Streamer fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        streamer,
      },
    };
  }

  @Post('/streamkey')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Regenerate stream key',
  })
  async regenerateStreamKey(
    @Body() body: RegenerateDTO,
  ): Promise<SuccessResponseDTO> {
    const streamkey = await this.contractsService.regenerateStreamKey(body);

    return {
      success: true,
      message: 'Stream key regenerated successfully',
      statusCode: HttpStatus.CREATED,
      data: {
        streamkey,
      },
    };
  }
}