import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';

export class ListenDTO {
  @IsNotEmpty()
  @IsString()
  @IsEthereumAddress()
  address: string;
}

export class ListenResultDTO {
  from: string;
  to: string;
  message: string;
  amount: string;
  symbol: string;
}

export class WsReturnDTO {
  message: string;
  data: Record<string, any>;
}

export class TestAlertDTO {
  to: string;
  type: SupportType;
}

export class SupportDTO {
  from: string;
  network: string;
  type: SupportType;
  amount: number;
  decimals: number;
  symbol: string;
  message: string;
  ref_id: string | null;
}

export enum SupportType {
  Unknown = 0,
  Normal = 1,
  Video = 2,
  Ads = 3,
}
