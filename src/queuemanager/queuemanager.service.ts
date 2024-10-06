import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { NotifyGateway } from 'src/notify/notify.gateway';

type Message = {
  amount: number;
  message: string;
};

class Streamer {
  messages: Message[];

  constructor(
    public streamId: string,
    message: Message,
    public queue: Map<string, Streamer>,
    private io: Server,
  ) {
    this.messages = [message];
    this.start();
  }

  async start() {
    while (this.messages.length > 0) {
      const msg = this.messages.shift();
      // Sending the message through websocket
      this.sendThroughWebsocket(msg!);
      // delay for 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    this.stop();
  }

  async stop() {
    const now = new Date();
    // display in mm dd, yyyy hh:mm:ss format
    console.log(
      `Stream ${this.streamId} ended at ${now.toLocaleString('en-US')}`,
    );
    this.queue.delete(this.streamId);
  }

  async addMessage(message: Message) {
    this.messages.push(message);
  }

  sendThroughWebsocket(message: Message) {
    console.log(
      `Stream ${this.streamId}: ${message.amount} - ${message.message}`,
    );
    this.io.to(this.streamId).emit('support', message);
  }
}

@Injectable()
export class QueuemanagerService {
  queue = new Map<string, Streamer>();

  constructor(private readonly notifyGateway: NotifyGateway) {}

  async addNotification(streamId: string, message: Message) {
    if (!this.queue.has(streamId)) {
      const streamer = new Streamer(
        streamId,
        message,
        this.queue,
        this.notifyGateway.io,
      );
      this.queue.set(streamId, streamer);
    } else {
      const streamer = this.queue.get(streamId);
      streamer?.addMessage(message);
    }
  }
}
