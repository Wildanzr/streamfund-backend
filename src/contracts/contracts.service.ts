import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { customNanoid } from 'src/lib/utils';
import {
  EventTokenAdded,
  EventSupportReceived,
} from 'src/notify/dto/events.dto';
import { Streamer, StreamerDocument } from 'src/schema/streamer.schema';
import { Support, SupportDocument } from 'src/schema/support.schema';
import { Token, TokenDocument } from 'src/schema/token.schema';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  constructor(
    @InjectModel(Streamer.name)
    private readonly streamerModel: Model<Streamer>,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
    @InjectModel(Support.name) private readonly supportModel: Model<Support>,
  ) {}

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
