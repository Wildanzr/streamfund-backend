import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NotifyGateway } from './notify.gateway';
import { ListenResultDTO } from './dto/listen.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Token, TokenDocument } from 'src/schema/token.schema';
import { Support, SupportDocument } from 'src/schema/support.schema';
import { EventSupportReceived, EventTokenAdded } from './dto/events.dto';
import {
  StreamerDocument,
  Streamer as MStreamer,
} from 'src/schema/streamer.schema';
import { customNanoid } from 'src/lib/utils';

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
    @InjectModel(MStreamer.name)
    private readonly streamerModel: Model<MStreamer>,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
    @InjectModel(Support.name) private readonly supportModel: Model<Support>,
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
              await this.tokenAdded(newToken);
              break;
            case 'TokenRemoved':
              const { tokenAddress: removedTokenAddr } = log.args;
              this.logger.log(`Token ${removedTokenAddr} removed`);
              await this.tokenRemoved(removedTokenAddr);
              break;
            case 'StreamerRegistered':
              const { streamer } = log.args;
              this.logger.log(`Streamer ${streamer} registered`);
              await this.streamerRegistered(streamer);
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
              await this.supportReceived(newSupport);
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

  // Token
  async tokenAdded(
    payload: EventTokenAdded,
    session: mongoose.ClientSession | null = null,
  ): Promise<TokenDocument> {
    try {
      const token = await this.tokenModel.create(
        [
          {
            address: payload.tokenAddress,
            feed: payload.priceFeed,
            decimal: payload.decimal,
            symbol: payload.symbol,
            logo: null,
          },
        ],
        { session },
      );
      this.logger.log('Successfully added token');
      return token[0];
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }

  async tokenRemoved(
    tokenAddress: string,
    session: mongoose.ClientSession | null = null,
  ): Promise<void> {
    try {
      await this.tokenModel.deleteOne({ address: tokenAddress }, { session });
      this.logger.log('Successfully removed token');
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }

  async getTokenByAddress(
    address: string,
    session: mongoose.ClientSession | null = null,
  ): Promise<TokenDocument | null> {
    try {
      const token = await this.tokenModel
        .findOne({ address })
        .session(session)
        .exec();
      return token;
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }

  // Streamer
  async streamerRegistered(
    address: string,
    session: mongoose.ClientSession | null = null,
  ): Promise<StreamerDocument> {
    try {
      const streamkey = customNanoid();
      const streamer = await this.streamerModel.create(
        [{ address, streamkey }],
        { session },
      );
      this.logger.log('Successfully registered streamer');
      return streamer[0];
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }

  // Support
  async supportReceived(
    payload: EventSupportReceived,
    session: mongoose.ClientSession | null = null,
  ): Promise<SupportDocument> {
    try {
      const token = await this.getTokenByAddress(payload.token, session);
      if (!token) {
        this.logger.error('Token not found');
        return null;
      }

      const support = await this.supportModel.create(
        [
          {
            amount: payload.amount,
            from: payload.from,
            message: payload.message,
            token: token._id,
            hash: payload.hash,
          },
        ],
        { session },
      );

      await this.streamerModel.updateOne(
        { address: payload.streamer },
        { $push: { supports: support[0]._id } },
        { session },
      );
      this.logger.log('Successfully added support');
      return support[0];
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }
}
