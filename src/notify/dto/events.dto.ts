export class EventTokenAdded {
  tokenAddress: string;
  priceFeed: string;
  decimal: number;
  symbol: string;
}

export class EventTokenRemoved {
  tokenAddress: string;
}

export class EventStreamerRegistered {
  streamer: string;
}

export class EventSupportReceived {
  streamer: string;
  from: string;
  token: string;
  amount: number;
  message: string;
  hash: string;
}
