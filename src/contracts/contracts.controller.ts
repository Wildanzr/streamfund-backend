import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { SuccessResponseDTO } from 'src/lib/dto/response.dto';
import { RegenerateDTO } from './dto/regenerate.dto';
import { ApiOperation } from '@nestjs/swagger';
import { QueryStreamerDTO } from './dto/query.dto';
import { HmacguardGuard } from 'src/lib/guards/hmac.guard';

@Controller('contracts')
@UseGuards(HmacguardGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('/streamers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get streamer's details",
  })
  async getStreamer(
    @Query() query: QueryStreamerDTO,
  ): Promise<SuccessResponseDTO> {
    const data = await this.contractsService.getStreamerByAddress(query);
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

  @Get('/streamkey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get stream key',
  })
  async checkStreamKey(
    @Query('key') streamkey: string,
  ): Promise<SuccessResponseDTO> {
    const valid = await this.contractsService.checkStreamKey(streamkey);

    return {
      success: true,
      message: 'Stream key fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        valid,
      },
    };
  }

  @Get('/address/:address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get address',
  })
  async getAddress(
    @Param('address') address: string,
  ): Promise<SuccessResponseDTO> {
    const valid = await this.contractsService.checkAddress(address);

    return {
      success: true,
      message: 'Address fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        valid,
      },
    };
  }

  @Get('/tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all tokens',
  })
  async getTokens(): Promise<SuccessResponseDTO> {
    const tokens = await this.contractsService.getTokens();

    return {
      success: true,
      message: 'Tokens fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        tokens,
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
