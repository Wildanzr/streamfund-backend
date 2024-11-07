/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import {
  SupportDTO,
  SupportType,
  TestAlertDTO,
  WsReturnDTO,
} from './dto/listen.dto';
import { ContractsService } from 'src/contracts/contracts.service';
import { SupportNotificationQueue } from './support-notification-queue';
import { InjectModel } from '@nestjs/mongoose';
import { Video } from 'src/schema/video.schema';
import { Model } from 'mongoose';

@WebSocketGateway({ cors: true })
export class NotifyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotifyGateway.name);
  constructor(
    @InjectModel(Video.name) private readonly videoModel: Model<Video>,
    private readonly contractsService: ContractsService,
    queue: SupportNotificationQueue,
  ) {
    queue.setNotifyCallback((streamKey, msg) => {
      const payload: WsReturnDTO = {
        data: msg,
        message: 'Incoming support',
      };
      this.io.to(streamKey).emit('support', payload);
    });
  }

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleConnection(client: Socket, ...args: any[]) {
    const { sockets } = this.io.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
    const query = client.handshake.query;
    const streamKey = query['streamKey'] as string;

    if (!streamKey) {
      this.io.to(client.id).emit('auth', {
        success: false,
        message: 'No stream key provided',
      });
      client.disconnect();
      return;
    }

    const isExist = await this.contractsService.checkStreamKey(streamKey);
    if (!isExist) {
      this.io.to(client.id).emit('auth', {
        success: false,
        message: 'Invalid stream key',
      });
      client.disconnect();
    } else {
      const streamerAddress =
        await this.contractsService.getStreamerAddressByStreamkey(streamKey);
      this.io.to(client.id).emit('auth', {
        success: true,
        message: 'Authenticated',
      });
      client.join(streamerAddress);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
    client.disconnect();
  }

  @SubscribeMessage('ping')
  async handleMessage(
    client: Socket,
    _data: any,
  ): Promise<WsResponse<WsReturnDTO>> {
    this.logger.log(`Message received from client id: ${client.id}`);

    return {
      event: 'pong',
      data: {
        message: 'This is pong',
        data: {
          name: "I'm a server",
          age: 20,
        },
      },
    };
  }

  @SubscribeMessage('test')
  async handleTest(
    client: Socket,
    data: any,
  ): Promise<WsResponse<WsReturnDTO>> {
    this.logger.log(`Message received from client id: ${client.id}`);
    const parsed = JSON.parse(data) as TestAlertDTO;
    const video = await this.videoModel.findOne({});
    let message: SupportDTO | undefined;

    switch (parsed.type) {
      case SupportType.Normal:
        message = {
          from: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          amount: 12400000,
          decimals: 6,
          symbol: 'USDC',
          message:
            'This is a test message This is a test message This is a test message This is a test message This is a test message This is a test message',
          network: 'BASE',
          ref_id: null,
          type: SupportType.Normal,
        };
        break;
      case SupportType.Video:
        message = {
          from: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          amount: 12400000,
          decimals: 6,
          symbol: 'USDC',
          message:
            'This is a test message This is a test message This is a test message This is a test message This is a test message This is a test message',
          network: 'BASE',
          ref_id: video.video_id,
          type: SupportType.Video,
        };
        break;

      case SupportType.Ads:
        message = {
          from: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          amount: 12400000,
          decimals: 6,
          symbol: 'USDC',
          message:
            'This is a test message This is a test message This is a test message This is a test message This is a test message This is a test message',
          network: 'BASE',
          ref_id: null,
          type: SupportType.Ads,
        };
        break;
    }

    const msg: WsReturnDTO = {
      data: message,
      message: 'This is test message',
    };
    this.io.to(parsed.to).emit('support', msg);

    return {
      event: 'pong',
      data: {
        message: 'This is pong',
        data: {
          name: "I'm a server",
        },
      },
    };
  }

  @SubscribeMessage('reload')
  async handleReload(
    client: Socket,
    data: any,
  ): Promise<WsResponse<WsReturnDTO>> {
    this.logger.log(`Message received from client id: ${client.id}`);
    const parsed = JSON.parse(data) as TestAlertDTO;

    console.log('Reloading');
    this.io.to(parsed.to).emit('reload', {
      message: 'Requesting to reload',
      data: {
        name: "I'm a server",
      },
    });

    return {
      event: 'reload',
      data: {
        message: 'Requesting to reload',
        data: {
          name: "I'm a server",
        },
      },
    };
  }

  @SubscribeMessage('listen-support')
  async listenNotification(client: Socket): Promise<WsResponse<WsReturnDTO>> {
    const query = client.handshake.query;
    const streamkey = query['streamkey'] as string;
    const address =
      await this.contractsService.getStreamerAddressByStreamkey(streamkey);
    if (!address) {
      return {
        event: 'support-init',
        data: {
          message: 'Streamer not found',
          data: {},
        },
      };
    }
    client.join(address);

    return {
      event: 'support-init',
      data: {
        message: "You're now connected to the support channel",
        data: {
          address,
        },
      },
    };
  }
}
