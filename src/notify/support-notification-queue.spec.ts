import { SupportType } from './dto/listen.dto';
import { SupportNotificationQueue } from './support-notification-queue';

const NOTIFICATION_SPACE_DELAY = 100;
const NORMAL_NOTIFICATION_DURATION = 180;

describe('Support Notification Queue', () => {
  it('should notify support', async () => {
    let notified = false;

    const mockStreamKey = '0x43434343434343434343';
    const queue = new SupportNotificationQueue();
    queue.setNotifyCallback((streamKey) => {
      if (streamKey == mockStreamKey) {
        notified = true;
      }
    });
    queue.addNotificationTest(mockStreamKey, {
      from: '0x343434343434343434343434',
      type: SupportType.Normal,
      amount: 10,
      decimals: 10.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 125);
    });

    expect(notified).toBe(true);
  });

  it('should notify 2 streamers soon', async () => {
    let notified1 = false;
    let notified2 = false;

    const mockStreamKey1 = '0x43434343434343434343';
    const mockStreamKey2 = '0x12121212121212121212';
    const queue = new SupportNotificationQueue();
    queue.setNotifyCallback((streamKey) => {
      if (streamKey == mockStreamKey1) {
        notified1 = true;
      } else if (streamKey == mockStreamKey2) {
        notified2 = true;
      }
    });
    queue.addNotificationTest(mockStreamKey1, {
      from: '0x343434343434343434343434',
      type: SupportType.Normal,
      amount: 10,
      decimals: 10.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });
    queue.addNotificationTest(mockStreamKey2, {
      from: '0x1212121212121212121212',
      type: SupportType.Normal,
      amount: 30,
      decimals: 30.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 250);
    });

    expect(notified1).toBe(true);
    expect(notified2).toBe(true);
  });

  it('should notify 2 normal notification for 1 streamer sequentially', async () => {
    const notified1 = [];

    const mockStreamKey1 = '0x43434343434343434343';
    const queue = new SupportNotificationQueue({
      normalNotificationDuration: NORMAL_NOTIFICATION_DURATION,
      notificationSpaceDelay: NOTIFICATION_SPACE_DELAY,
      adsNotificationDuration: undefined,
      videoNotificationDuration: undefined,
    });
    queue.setNotifyCallback((streamKey) => {
      if (streamKey == mockStreamKey1) {
        notified1.push(true);
      }
    });
    queue.addNotificationTest(mockStreamKey1, {
      from: '0x343434343434343434343434',
      type: SupportType.Normal,
      amount: 10,
      decimals: 10.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });
    queue.addNotificationTest(mockStreamKey1, {
      from: '0x1212121212121212121212',
      type: SupportType.Normal,
      amount: 30,
      decimals: 30.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 125);
    });

    expect(notified1.length).toBe(1);

    await new Promise<void>((resolve) => {
      setTimeout(
        () => {
          resolve();
        },
        125 + NORMAL_NOTIFICATION_DURATION + NOTIFICATION_SPACE_DELAY,
      );
    });

    expect(notified1.length).toBe(2);
  });

  it('should notify 2 normal notification for 1 streamer sequentially and 1 normal notification for other stream soon', async () => {
    const notified1 = [];
    const notified2 = [];

    const mockStreamKey1 = '0x43434343434343434343';
    const mockStreamKey2 = '0x12121212121212121212';
    const queue = new SupportNotificationQueue({
      normalNotificationDuration: NORMAL_NOTIFICATION_DURATION,
      notificationSpaceDelay: NOTIFICATION_SPACE_DELAY,
      adsNotificationDuration: undefined,
      videoNotificationDuration: undefined,
    });
    queue.setNotifyCallback((streamKey) => {
      if (streamKey == mockStreamKey1) {
        notified1.push(true);
      } else if (streamKey == mockStreamKey2) {
        notified2.push(true);
      }
    });
    queue.addNotificationTest(mockStreamKey1, {
      from: '0x343434343434343434343434',
      type: SupportType.Normal,
      amount: 10,
      decimals: 10.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });
    queue.addNotificationTest(mockStreamKey1, {
      from: '0x1212121212121212121212',
      type: SupportType.Normal,
      amount: 30,
      decimals: 30.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });

    queue.addNotificationTest(mockStreamKey2, {
      from: '0x2424242424242424242424',
      type: SupportType.Normal,
      amount: 90,
      decimals: 90.0,
      message: 'This is a notification test',
      network: 'BASE',
      ref_id: null,
      symbol: 'USDT',
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 125);
    });

    expect(notified1.length).toBe(1);
    expect(notified2.length).toBe(1);

    await new Promise<void>((resolve) => {
      setTimeout(
        () => {
          resolve();
        },
        125 + 125 + NORMAL_NOTIFICATION_DURATION + NOTIFICATION_SPACE_DELAY,
      );
    });

    expect(notified1.length).toBe(2);
    expect(notified2.length).toBe(1);
  });
});
