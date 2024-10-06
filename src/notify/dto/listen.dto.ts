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
  amount: string;
  symbol: string;
}

export class WsReturnDTO {
  message: string;
  data: Record<string, any>;
}
