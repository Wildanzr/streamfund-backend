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
import { WsReturnDTO } from './dto/listen.dto';
import { ContractsService } from 'src/contracts/contracts.service';

@WebSocketGateway({ cors: true })
export class NotifyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotifyGateway.name);
  constructor(private readonly contractsService: ContractsService) {}

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
    const streamkey = query['streamkey'] as string;

    if (!streamkey) {
      this.io.to(client.id).emit('auth', {
        success: false,
        message: 'No stream key provided',
      });
      setTimeout(() => {
        client.disconnect();
      }, 1000);
    }

    const isExist = await this.contractsService.checkStreamKey(streamkey);
    if (!isExist) {
      this.io.to(client.id).emit('auth', {
        success: false,
        message: 'Invalid stream key',
      });
      setTimeout(() => {
        client.disconnect();
      }, 1000);
    } else {
      this.io.to(client.id).emit('auth', {
        success: true,
        message: 'Authenticated',
      });
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
    client.disconnect();
  }

  @SubscribeMessage('ping')
  handleMessage(client: Socket, data: any) {
    this.logger.log(`Message received from client id: ${client.id}`);

    return {
      event: 'pong',
      data,
    };
  }

  @SubscribeMessage('listen-support')
  async listenNotification(client: Socket): Promise<WsResponse<WsReturnDTO>> {
    const query = client.handshake.query;
    const streamkey = query['streamkey'] as string;
    const address =
      await this.contractsService.getStreamerAddressByStreamkey(streamkey);

    console.log('address', address);

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
