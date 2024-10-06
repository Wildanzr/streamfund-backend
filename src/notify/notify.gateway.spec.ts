import { Test } from '@nestjs/testing';
import { NotifyGateway } from './notify.gateway';
import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';

async function createNestApp(...gateways: any): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    providers: gateways,
  }).compile();
  return testingModule.createNestApplication();
}

describe('NotifyGateway', () => {
  let gateway: NotifyGateway;
  let app: INestApplication;
  let ioClient: Socket;

  beforeAll(async () => {
    // Instantiate the app
    app = await createNestApp(NotifyGateway);
    // Get the gateway instance from the app instance
    gateway = app.get<NotifyGateway>(NotifyGateway);
    // Create a new client that will interact with the gateway
    ioClient = io('http://localhost:5111', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    app.listen(3000);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should emit "pong" on "ping"', async () => {
    ioClient.connect();
    ioClient.emit('ping', 'Hello world!');
    await new Promise<void>((resolve, reject) => {
      ioClient.on('connect', () => {
        console.log('connected');
      });
      ioClient.on('pong', (data) => {
        try {
          expect(data).toBe('Hello world!');
          resolve();
        } catch (ex) {
          reject(ex);
        }
      });
    });
    ioClient.disconnect();
  });
});
