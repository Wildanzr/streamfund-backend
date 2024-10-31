import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
import { UpdateMQDTO } from './dto/update-mq.dto';
import { UpdateAlertDTO } from './dto/update-alert.dto';
import { SupportNotificationQueue } from 'src/notify/support-notification-queue';
import { SupportType } from 'src/notify/dto/listen.dto';

@Controller('stream')
@UseGuards(HmacguardGuard)
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private notificationQueue: SupportNotificationQueue,
  ) { }

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

  @Get('/mq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get MQ configuration',
  })
  async getMQConfig(
    @Query() query: QueryStreamkeyDTO,
  ): Promise<SuccessResponseDTO> {
    const config = await this.streamService.getMQConfig(query);

    return {
      success: true,
      message: 'MQ configuration fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        config,
      },
    };
  }

  @Put('/mq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update MQ configuration',
  })
  async updateMQConfig(
    @Query() query: QueryStreamkeyDTO,
    @Body() body: UpdateMQDTO,
  ): Promise<SuccessResponseDTO> {
    const id = await this.streamService.updateMQConfig(query, body);

    return {
      success: true,
      message: 'MQ configuration updated successfully',
      statusCode: HttpStatus.OK,
      data: {
        id,
      },
    };
  }

  @Get('/alert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get alert configuration',
  })
  async getAlertConfig(
    @Query() query: QueryStreamkeyDTO,
  ): Promise<SuccessResponseDTO> {
    const config = await this.streamService.getAlertConfig(query);

    return {
      success: true,
      message: 'Alert configuration fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        config,
      },
    };
  }

  @Put('/alert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update alert configuration',
  })
  async updateAlertConfig(
    @Query() query: QueryStreamkeyDTO,
    @Body() body: UpdateAlertDTO,
  ): Promise<SuccessResponseDTO> {
    const id = await this.streamService.updateAlertConfig(query, body);

    return {
      success: true,
      message: 'Alert configuration updated successfully',
      statusCode: HttpStatus.OK,
      data: {
        id,
      },
    };
  }

  @Post('test-video')
  @HttpCode(HttpStatus.OK)
  async testVideoNotification(@Query() query: QueryStreamkeyDTO) {
    this.notificationQueue.addNotificationTest(query.streamkey, {
      from: '0x2424242424242424242424',
      type: SupportType.Video,
      amount: 100,
      decimals: 100.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });

    return {
      success: true,
      message: 'Video alert test has been queued',
      statusCode: HttpStatus.OK,
    };
  }
}
