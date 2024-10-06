import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class NotifyService {
  private readonly connectedClients: Map<string, Socket> = new Map();
  private readonly logger = new Logger(NotifyService.name);

  handleConnection(socket: Socket): void {
    const clientId = socket.id;
    this.connectedClients.set(clientId, socket);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
    });

    // Handle other events and messages from the client
  }

  // Add more methods for handling events, messages, etc.
  handlePing(client: any, data: any) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);
  }
}
