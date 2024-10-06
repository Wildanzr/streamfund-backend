import { Injectable, Logger } from '@nestjs/common';
import { QueuemanagerService } from 'src/queuemanager/queuemanager.service';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';

@Injectable()
export class ListenerService {
  private readonly logger = new Logger(ListenerService.name);
  private readonly client = createPublicClient({
    chain: baseSepolia,
    transport: http(
      `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ),
  });

  constructor(private readonly queueService: QueuemanagerService) {}

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
              this.queueService.addNotification(to, {
                amount: Number(amount),
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
}
