import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { QRConfig } from 'src/schema/qr-config.schema';
import { QueryStreamkeyDTO } from './dto/query-stream-key.dto';
import { ContractsService } from 'src/contracts/contracts.service';
import { UpdateQRDTO } from './dto/update-qr.dto';
import { Streamer } from 'src/schema/streamer.schema';
import { MQConfig } from 'src/schema/mq-config.schema';
import { UpdateMQDTO } from './dto/update-mq.dto';

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  constructor(
    @InjectModel(QRConfig.name) private readonly qrConfigModel: Model<QRConfig>,
    @InjectModel(MQConfig.name) private readonly mqConfigModel: Model<MQConfig>,
    @InjectModel(Streamer.name)
    private readonly streamerModel: Model<Streamer>,
    private readonly contractService: ContractsService,
  ) {}

  async getQRConfig(query: QueryStreamkeyDTO) {
    try {
      const streamer = await this.streamerModel.findOne({
        streamkey: query.streamkey,
      });

      const qrConfig = await this.qrConfigModel
        .findOne({
          streamer: streamer._id,
        })
        .populate({
          path: 'streamer',
          select: '_id address',
        })
        .exec();

      return qrConfig;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  async updateQRConfig(
    query: QueryStreamkeyDTO,
    body: UpdateQRDTO,
  ): Promise<string | null> {
    try {
      const streamer = await this.streamerModel.findOne({
        streamkey: query.streamkey,
      });

      const qrConfig = await this.qrConfigModel.findOneAndUpdate(
        {
          streamer: streamer._id,
        },
        body,
        { new: true },
      );

      return qrConfig._id.toString();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  async getMQConfig(query: QueryStreamkeyDTO) {
    try {
      const streamer = await this.streamerModel.findOne({
        streamkey: query.streamkey,
      });

      const mqConfig = await this.mqConfigModel
        .findOne({
          streamer: streamer._id,
        })
        .populate({
          path: 'streamer',
          select: '_id address',
        })
        .exec();

      return mqConfig;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  async updateMQConfig(
    query: QueryStreamkeyDTO,
    body: UpdateMQDTO,
  ): Promise<string | null> {
    try {
      const streamer = await this.streamerModel.findOne({
        streamkey: query.streamkey,
      });

      const mqConfig = await this.mqConfigModel.findOneAndUpdate(
        {
          streamer: streamer._id,
        },
        body,
        { new: true },
      );

      return mqConfig._id.toString();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }

  // Initializer
  async initConfigs(
    address: string,
    session: mongoose.ClientSession | null = null,
  ) {
    try {
      const streamer = await this.streamerModel.findOne({
        address,
      });

      await this.mqConfigModel.create(
        [
          {
            backgroundColor: '#ffffff',
            font: 'font-play',
            textSize: '20',
            streamer: streamer._id,
            text: 'Hello World',
            textColor: '#000000',
          },
        ],
        { session },
      );

      await this.qrConfigModel.create(
        [
          {
            bgColor: '#ffffff',
            fgColor: '#000000',
            level: 'H',
            quietZone: 20,
            style: 'squares',
            streamer: streamer._id,
          },
        ],
        { session },
      );
      this.logger.log(`Config created for streamer ${streamer}`);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  }
}
