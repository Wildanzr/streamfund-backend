import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NotifyGateway } from './notify.gateway';
import { ListenResultDTO } from './dto/listen.dto';

class Streamer {
  messages: ListenResultDTO[];

  constructor(
    public streamId: string,
    message: ListenResultDTO,
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

  async addMessage(message: ListenResultDTO) {
    this.messages.push(message);
  }

  sendThroughWebsocket(message: ListenResultDTO) {
    console.log(
      `Stream ${this.streamId}: ${message.amount} - ${message.symbol}`,
    );
    this.io.to(this.streamId).emit('support', message);
  }
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  private queue = new Map<string, Streamer>();
  private readonly client = createPublicClient({
    chain: baseSepolia,
    transport: http(
      `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ),
  });

  constructor(private readonly notifyGateway: NotifyGateway) {}

  watchContract() {
    this.logger.log('Watching for events...');
    this.client.watchEvent({
      address: '0x2530068079c3DE7833410675DaA301b110eBFDF4',
      events: [
        parseAbiItem(
          'event SupportReceived(address indexed streamer, address token, uint256 amount, string message)',
        ),
        parseAbiItem('event StreamerRegistered(address streamer)'),
        parseAbiItem(
          'event TokenAdded(address tokenAddress, address priceFeed, uint8 decimal, string symbol)',
        ),
        parseAbiItem('event TokenRemoved(address tokenAddress)'),
      ],
      onLogs: (logs) => {
        // make switch case for each event
        logs.forEach((log) => {
          switch (log.eventName) {
            case 'TokenAdded':
              const { decimal, priceFeed, symbol, tokenAddress } = log.args;
              this.logger.log('New token added');
              this.logger.log(`Token address: ${tokenAddress}`);
              this.logger.log(`Price feed: ${priceFeed}`);
              this.logger.log(`Decimal: ${decimal}`);
              this.logger.log(`Symbol: ${symbol}`);
              break;
            case 'TokenRemoved':
              const { tokenAddress: tknAddr } = log.args;
              this.logger.log(`Token ${tknAddr} removed`);
              break;
            case 'StreamerRegistered':
              const { streamer } = log.args;
              this.logger.log(`Streamer ${streamer} registered`);
              break;
            case 'SupportReceived':
              const { amount, message, streamer: to, token } = log.args;
              this.logger.log(`Support received by ${to}`);
              this.logger.log(`Amount: ${amount}`);
              this.logger.log(`Message: ${message}`);
              this.logger.log(`Token: ${token}`);
              this.addNotification(to, {
                amount: amount.toString(),
                from: '0x2530068079c3DE7833410675DaA301b110eBFDF4',
                symbol: token,
                to,
                message,
              });
              break;
            default:
              this.logger.log('Unknown event');
              break;
          }
        });
      },
    });
  }

  async addNotification(streamId: string, message: ListenResultDTO) {
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
      streamer.addMessage(message);
    }
  }
}
