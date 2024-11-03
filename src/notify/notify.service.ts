import { Injectable, Logger } from '@nestjs/common';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NotifyGateway } from './notify.gateway';
import { ContractsService } from 'src/contracts/contracts.service';
import { StreamService } from 'src/stream/stream.service';
import { EventSupportReceived, EventTokenAdded } from './dto/events.dto';
import { SupportDTO } from './dto/listen.dto';
import { SupportNotificationQueue } from './support-notification-queue';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  private readonly baseClient = createPublicClient({
    chain: baseSepolia,
    transport: http(
      `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ),
  });

  constructor(
    private readonly notifyGateway: NotifyGateway,
    private readonly contractService: ContractsService,
    private readonly streamService: StreamService,
    private readonly supportNotificationQueue: SupportNotificationQueue,
  ) {}

  // exclusive support
  // live ads

  watchContract() {
    this.logger.log('Watching for events...');
    this.baseClient.watchEvent({
      address: '0x63B02bDcA6e209ff0A8dab2E3B244820aE8013f1',
      events: [
        parseAbiItem(
          'event SupportReceived(address indexed streamer, address from, address token, uint256 amount, string message)',
        ),
        parseAbiItem(
          'event LiveAdsReceived(address indexed streamer, address from, address token, uint256 amount, string message)',
        ),
        parseAbiItem(
          'event VideoSupportReceived(address indexed streamer, address from, bytes32 videoId, uint256 amount, string message)',
        ),
        parseAbiItem('event StreamerRegistered(address streamer)'),
        parseAbiItem(
          'event StreamerUpdated(address streamer, uint256 liveAdsPrice)',
        ),
        parseAbiItem(
          'event TokenAdded(address tokenAddress, address priceFeed, uint256 decimal, string symbol)',
        ),
        parseAbiItem('event TokenRemoved(address tokenAddress)'),
        parseAbiItem(
          'event VideoAdded(bytes32 id, string link, string thumbnail, uint256 price)',
        ),
        parseAbiItem('event VideoRemoved(bytes32 id)'),
      ],
      onLogs: (logs) => {
        try {
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
                  decimal: Number(decimal),
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
                await this.streamService.initConfigs(streamer);
                await this.reloadUserPage(streamer);
                break;
              case 'StreamerUpdated':
                const { streamer: updatedStreamer, liveAdsPrice } = log.args;
                this.logger.log(`Streamer ${updatedStreamer} updated`);
                await this.contractService.whstreamerUpdated(
                  updatedStreamer,
                  Number(liveAdsPrice),
                );
                await this.reloadUserPage(updatedStreamer);
                break;
              case 'SupportReceived':
                const { amount, message, streamer: to, from, token } = log.args;
                this.logger.log(`Support received by ${to}`);
                const tokenInfo =
                  await this.contractService.whgetTokenByAddress(token);
                const msgStream: SupportDTO = {
                  amount: Number(amount),
                  from,
                  message,
                  symbol: tokenInfo.symbol,
                  decimals: tokenInfo.decimal,
                  network: baseSepolia.name,
                  ref_id: null,
                  type: 1,
                };
                this.supportNotificationQueue.addNotification(to, msgStream);
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
        } catch (error) {
          this.logger.error(error);
        }
      },
    });
  }

  async reloadUserPage(address: string) {
    this.notifyGateway.io.to(address).emit('reload');
  }
}
