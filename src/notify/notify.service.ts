import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NotifyGateway } from './notify.gateway';
import { ListenResultDTO } from './dto/listen.dto';
import { EventSupportReceived, EventTokenAdded } from './dto/events.dto';
import { ContractsService } from 'src/contracts/contracts.service';

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

  constructor(
    private readonly notifyGateway: NotifyGateway,
    private readonly contractService: ContractsService,
  ) {}

  watchContract() {
    this.logger.log('Watching for events...');
    this.client.watchEvent({
      address: '0x538E2488c3189A9dd068523cbB94d1d4d0805456',
      events: [
        parseAbiItem(
          'event SupportReceived(address indexed streamer, address from, address token, uint256 amount, string message)',
        ),
        parseAbiItem('event StreamerRegistered(address streamer)'),
        parseAbiItem(
          'event TokenAdded(address tokenAddress, address priceFeed, uint8 decimal, string symbol)',
        ),
        parseAbiItem('event TokenRemoved(address tokenAddress)'),
      ],
      onLogs: (logs) => {
        // make switch case for each event
        logs.forEach(async (log) => {
          switch (log.eventName) {
            case 'TokenAdded':
              const {
                decimal,
                priceFeed,
                symbol,
                tokenAddress: addedTokenAddr,
              } = log.args;
              this.logger.log(`New token added: ${symbol}`);
              const newToken: EventTokenAdded = {
                tokenAddress: addedTokenAddr,
                priceFeed,
                decimal,
                symbol,
              };
              await this.contractService.whtokenAdded(newToken);
              break;
            case 'TokenRemoved':
              const { tokenAddress: removedTokenAddr } = log.args;
              this.logger.log(`Token ${removedTokenAddr} removed`);
              await this.contractService.whtokenRemoved(removedTokenAddr);
              break;
            case 'StreamerRegistered':
              const { streamer } = log.args;
              this.logger.log(`Streamer ${streamer} registered`);
              await this.contractService.whstreamerRegistered(streamer);
              break;
            case 'SupportReceived':
              const { amount, message, streamer: to, from, token } = log.args;
              this.logger.log(`Support received by ${to}`);
              this.addNotification(to, {
                amount: amount.toString(),
                from,
                symbol: token,
                to,
                message,
              });
              const newSupport: EventSupportReceived = {
                amount: Number(amount),
                from,
                message,
                token,
                hash: log.transactionHash,
                streamer: to,
              };
              await this.contractService.whsupportReceived(newSupport);
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
