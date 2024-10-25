import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia, scrollSepolia, sepolia } from 'viem/chains';
import { NotifyGateway } from './notify.gateway';
import { SupportDTO, WsReturnDTO } from './dto/listen.dto';
import { EventSupportReceived, EventTokenAdded } from './dto/events.dto';
import { ContractsService } from 'src/contracts/contracts.service';
import { StreamService } from 'src/stream/stream.service';

class Streamer {
  messages: SupportDTO[];

  constructor(
    public streamId: string,
    message: SupportDTO,
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
      // delay for 20 seconds
      await new Promise((resolve) => setTimeout(resolve, 20000));
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

  async addMessage(message: SupportDTO) {
    this.messages.push(message);
  }

  sendThroughWebsocket(message: SupportDTO) {
    console.log(
      `Stream ${this.streamId}: ${message.amount} - ${message.symbol}`,
    );

    const msg: WsReturnDTO = {
      data: message,
      message: 'You have received a support',
    };
    this.io.to(this.streamId).emit('support', msg);
  }
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  private queue = new Map<string, Streamer>();
  private readonly baseClient = createPublicClient({
    chain: baseSepolia,
    transport: http(
      `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ),
  });
  private readonly scrollClient = createPublicClient({
    chain: scrollSepolia,
    transport: http(
      `https://scroll-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ),
  });
  private readonly sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ),
  });

  constructor(
    private readonly notifyGateway: NotifyGateway,
    private readonly contractService: ContractsService,
    private readonly streamService: StreamService,
  ) {}

  watchContract() {
    this.logger.log('Watching for events...');
    this.baseClient.watchEvent({
      address: '0xc180A51b23b245B3340bE4311C6b4a9dB908FEa9',
      events: [
        parseAbiItem('event Greeting(string greeting)'),
      ],
      onLogs: (logs) => {
        // make switch case for each event
        try {
          logs.forEach(async (log) => {
            switch (log.eventName) {
              case 'Greeting':
                const {
                  greeting
                } = log.args;
                this.logger.log(`Greeting on chain base received: ${greeting}`);
                break;
              default:
                this.logger.log('Unknown event');
                break;
            }
          });
        } catch (error) {
          this.logger.error(error);
        }
      },
    });

    this.scrollClient.watchEvent({
      address: '0x12526230d6b9fd74bab1238a2fb5e3f0d763b213',
      events: [
        parseAbiItem('event Greeting(string greeting)'),
      ],
      onLogs: (logs) => {
        // make switch case for each event
        try {
          logs.forEach(async (log) => {
            switch (log.eventName) {
              case 'Greeting':
                const {
                  greeting
                } = log.args;
                this.logger.log(`Greeting on chain scroll received: ${greeting}`);
                break;
              default:
                this.logger.log('Unknown event');
                break;
            }
          });
        } catch (error) {
          this.logger.error(error);
        }
      },
    });

    this.sepoliaClient.watchEvent({
      address: '0x5A074f27025D4a7968A431e7aB1eAc402bbDD5D3',
      events: [
        parseAbiItem('event Greeting(string greeting)'),
      ],
      onLogs: (logs) => {
        // make switch case for each event
        try {
          logs.forEach(async (log) => {
            switch (log.eventName) {
              case 'Greeting':
                const {
                  greeting
                } = log.args;
                this.logger.log(`Greeting on chain sepolia received: ${greeting}`);
                break;
              default:
                this.logger.log('Unknown event');
                break;
            }
          });
        } catch (error) {
          this.logger.error(error);
        }
      },

    });
  }

  async addNotification(streamId: string, message: SupportDTO) {
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

  async reloadUserPage(address: string) {
    this.notifyGateway.io.to(address).emit('reload');
  }
}
