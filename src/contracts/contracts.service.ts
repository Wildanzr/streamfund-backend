import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { RegenerateDTO } from './dto/regenerate.dto';
import { QueryStreamerDTO } from './dto/query.dto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  constructor(
    @InjectModel(Streamer.name)
    private readonly streamerModel: Model<Streamer>,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
    @InjectModel(Support.name) private readonly supportModel: Model<Support>,
  ) {}

  async getStreamerByAddress(
    query: QueryStreamerDTO,
  ): Promise<StreamerDocument | null> {
    try {
      await this.isStreamerExist(query.q);
      const { q, limit, page, sort = 'desc' } = query;
      const skipAmount = (page - 1) * limit;

      const sortOptions = {
        creted_at: sort === 'desc' ? 1 : -1,
      };
      const streamer = await this.streamerModel
        .findOne({
          address: q,
        })
        .select('_id address streamkey supports')
        .populate({
          path: 'supports',
          options: {
            sort: sortOptions,
            skip: skipAmount,
            limit,
          },
          populate: {
            path: 'token',
            select: '_id symbol logo decimal',
          },
        })
        .exec();

      return streamer;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  async regenerateStreamKey(body: RegenerateDTO): Promise<string> {
    try {
      await this.isStreamerExist(body.address);
      const newKey = customNanoid();
      await this.streamerModel.findOneAndUpdate(
        { address: body.address },
        { streamkey: newKey, updated_at: new Date() },
        { new: true },
      );
      return newKey;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  async getTokens(): Promise<TokenDocument[]> {
    try {
      const tokens = await this.tokenModel
        .find()
        .select('_id address symbol logo decimal')
        .exec();
      return tokens;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  async checkStreamKey(streamkey: string): Promise<boolean> {
    try {
      const streamer = await this.streamerModel
        .findOne({
          streamkey,
        })
        .select('_id')
        .exec();

      if (!streamer) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  async checkAddress(address: string): Promise<boolean> {
    try {
      const streamer = await this.streamerModel
        .findOne({
          address,
        })
        .select('_id')
        .exec();

      if (!streamer) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  async getStreamerAddressByStreamkey(streamkey: string): Promise<string> {
    try {
      const streamer = await this.streamerModel
        .findOne({
          streamkey,
        })
        .select('address')
        .exec();

      if (!streamer) {
        throw new NotFoundException('Streamer not found');
      }

      return streamer.address;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  // Private methods
  private async isStreamerExist(address: string): Promise<boolean> {
    try {
      const streamer = await this.streamerModel
        .findOne({
          address,
        })
        .select('_id')
        .exec();

      if (!streamer) {
        throw new NotFoundException('Streamer not found');
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  // Webhook methods
  async whtokenAdded(
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

  async whtokenRemoved(
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

  async whgetTokenByAddress(
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

  async whstreamerRegistered(
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

  async whstreamerUpdated(
    address: string,
    liveAdsPrice: number,
    session: mongoose.ClientSession | null = null,
  ): Promise<StreamerDocument> {
    try {
      const streamer = await this.streamerModel.findOneAndUpdate(
        { address },
        { liveAdsPrice },
        { session, new: true },
      );
      this.logger.log('Successfully updated streamer');
      return streamer;
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }

  async whsupportReceived(
    payload: EventSupportReceived,
    session: mongoose.ClientSession | null = null,
  ): Promise<SupportDocument> {
    try {
      const token = await this.whgetTokenByAddress(payload.token, session);
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
