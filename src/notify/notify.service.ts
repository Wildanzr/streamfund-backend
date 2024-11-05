import { Injectable, Logger } from '@nestjs/common';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NotifyGateway } from './notify.gateway';
import { ContractsService } from 'src/contracts/contracts.service';
import { StreamService } from 'src/stream/stream.service';
import { EventSupportReceived, EventTokenAdded } from './dto/events.dto';
import { SupportDTO, SupportType } from './dto/listen.dto';
import { SupportNotificationQueue } from './support-notification-queue';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  private readonly baseClient = createPublicClient({
    chain: baseSepolia,
    transport: http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
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
      address: '0xcaFcAF4Aa0949dA2d3D3b303291c951301B75821',
      events: [
        parseAbiItem(
          'event SupportReceived(address indexed streamer, address from, address token, uint256 amount, string message)',
        ),
        parseAbiItem(
          'event LiveAdsReceived(address indexed streamer, address from, address token, uint256 amount, string message)',
        ),
        parseAbiItem(
          'event VideoSupportReceived( address indexed streamer, address from, bytes32 videoId, address token, uint256 amount, string message)',
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
                  type: SupportType.Normal,
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
              case 'VideoAdded':
                const { id, link, thumbnail, price } = log.args;
                this.logger.log('Video added');
                await this.contractService.whvideoAdded(
                  id,
                  link,
                  thumbnail,
                  Number(price),
                );
                break;
              case 'VideoRemoved':
                const { id: removedVideoId } = log.args;
                this.logger.log('Video removed');
                await this.contractService.whvideoRemoved(removedVideoId);
                break;
              case 'VideoSupportReceived':
                const {
                  amount: vAmount,
                  message: vMessage,
                  streamer: vStreamer,
                  from: vFrom,
                  token: vToken,
                  videoId,
                } = log.args;
                console.log(
                  'Video support received',
                  vAmount,
                  vFrom,
                  vMessage,
                  vStreamer,
                  vToken,
                  videoId,
                );
                const vTokenInfo =
                  await this.contractService.whgetTokenByAddress(vToken);
                const vMsgStream: SupportDTO = {
                  amount: Number(vAmount),
                  from: vFrom,
                  message: vMessage,
                  symbol: vTokenInfo.symbol,
                  decimals: vTokenInfo.decimal,
                  network: baseSepolia.name,
                  ref_id: videoId,
                  type: SupportType.Video,
                };
                this.supportNotificationQueue.addNotification(
                  vStreamer.toString(),
                  vMsgStream,
                );
                const vNewSupport: EventSupportReceived = {
                  amount: Number(vAmount),
                  from: vFrom,
                  message: vMessage,
                  token: vToken,
                  hash: log.transactionHash,
                  streamer: vStreamer.toString(),
                };
                await this.contractService.whsupportReceived(vNewSupport);
                break;
              case 'LiveAdsReceived':
                const {
                  amount: laAmount,
                  from: laFrom,
                  message: laMessage,
                  streamer: laStreamer,
                } = log.args;
                console.log(
                  'Live ads received',
                  laAmount,
                  laFrom,
                  laMessage,
                  laStreamer,
                );
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
