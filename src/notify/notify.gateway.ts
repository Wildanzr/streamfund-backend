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

@WebSocketGateway()
export class NotifyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotifyGateway.name);

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
  async listenNotification(client: Socket): Promise<WsResponse<WsReturnDTO>> {
    const query = client.handshake.query;
    const streamkey = query['streamkey'];
    console.log('streamkey', streamkey);

    if (!streamkey) {
      return {
        event: 'error',
        data: {
          message: 'No address provided',
          data: {},
        },
      };
    }

    client.join('0x20047D546F34DC8A58F8DA13fa22143B4fC5404a');

    return {
      event: 'support-init',
      data: {
        message: "You're now connected to the support channel",
        data: {
          address: '0x20047D546F34DC8A58F8DA13fa22143B4fC5404a',
        },
      },
    };
  }
}
