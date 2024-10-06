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
import { NotifyService } from './notify.service';
import { ListenDTO, WsReturnDTO } from './dto/listen.dto';

@WebSocketGateway()
export class NotifyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotifyGateway.name);
  // private readonly notifyService = new NotifyService();
  constructor(private readonly notifyService: NotifyService) {}

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: any, ...args: any[]) {
    const { sockets } = this.io.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
    const query = client.handshake.query;
    const streamkey = query['streamkey'];

    if (streamkey !== 'this-is-vey-secret') {
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

  handleDisconnect(client: any) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage('ping')
  handleMessage(client: Socket, data: any) {
    this.logger.log(`Message received from client id: ${client.id}`);
    const { address } = JSON.parse(data);
    client.join(address);

    return {
      event: 'pong',
      data,
    };
  }

  @SubscribeMessage('listen-support')
  async listenNotification(
    client: Socket,
    data: string,
  ): Promise<WsResponse<WsReturnDTO>> {
    const payload = JSON.parse(data) as ListenDTO;
    if (!payload.address) {
      return {
        event: 'error',
        data: {
          message: 'No address provided',
          data: {},
        },
      };
    }

    console.log('payload', payload);
    client.join(payload.address);

    return {
      event: 'support-init',
      data: {
        message: "You're now connected to the support channel",
        data: {
          address: payload.address,
        },
      },
    };
  }
}
