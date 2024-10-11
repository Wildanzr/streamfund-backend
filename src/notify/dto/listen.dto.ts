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
}
export class SupportDTO {
  from: string;
  amount: number;
  decimals: number;
  symbol: string;
  message: string;
}
