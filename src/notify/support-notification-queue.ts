import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupportDTO, SupportType } from './dto/listen.dto';

// delay antar notifikasi
const NOTIFICATION_SPACE_DELAY = 10000; // 10 detik
// durasi notifikasi normal
const NORMAL_NOTIFICATION_DURATION = 10000; // 10 detik
// durasi notifikasi video
const VIDEO_NOTIFICATION_DURATION = 10000; // 10 detik
// durasi notifikasi ads
const ADS_NOTIFICATION_DURATION = 30000; // 30 detik

@Injectable()
export class SupportNotificationQueue {
  private readonly logger = new Logger(SupportNotificationQueue.name);

  private mainQueues = new Map<string, SupportDTO[]>();
  private testQueues = new Map<string, SupportDTO[]>();
  private startedProcessors = new Map<string, boolean>();
  private notifyCallback:
    | ((streamKey: string, notification: SupportDTO) => void)
    | null = null;

  private notificationSpaceDelay;
  private normalNotificationDuration;
  private videoNotificationDuration;
  private adsNotificationDuration;

  constructor(
    @Inject('UNDEFINED')
    options: SupportNotificationQueueOptions | undefined = undefined,
  ) {
    if (options === undefined || options.notificationSpaceDelay === undefined) {
      this.notificationSpaceDelay = NOTIFICATION_SPACE_DELAY;
    } else {
      this.notificationSpaceDelay = options.notificationSpaceDelay;
    }

    if (
      options === undefined ||
      options.normalNotificationDuration === undefined
    ) {
      this.normalNotificationDuration = NORMAL_NOTIFICATION_DURATION;
    } else {
      this.normalNotificationDuration = options.normalNotificationDuration;
    }

    if (
      options === undefined ||
      options.videoNotificationDuration === undefined
    ) {
      this.videoNotificationDuration = VIDEO_NOTIFICATION_DURATION;
    } else {
      this.videoNotificationDuration = options.videoNotificationDuration;
    }

    if (
      options === undefined ||
      options.adsNotificationDuration === undefined
    ) {
      this.adsNotificationDuration = ADS_NOTIFICATION_DURATION;
    } else {
      this.adsNotificationDuration = options.adsNotificationDuration;
    }
  }

  private async startQueueProcessor(streamKey: string) {
    if (this.startedProcessors.has(streamKey)) {
      return;
    }
    this.startedProcessors.set(streamKey, true);

    // let caller finish it's job
    await this.delay(100); // 100 ms is estimation for caller to respond it's client with HTTP/200

    while (true) {
      let notification: SupportDTO;

      const testQueue = this.testQueues.get(streamKey);
      const mainQueue = this.mainQueues.get(streamKey);

      // get notification from queue
      if (testQueue && testQueue.length > 0) {
        notification = testQueue.shift();
      } else if (mainQueue && mainQueue.length > 0) {
        notification = mainQueue.shift();
      } else {
        this.testQueues.delete(streamKey);
        this.mainQueues.delete(streamKey);
        this.startedProcessors.delete(streamKey);
        return;
      }

      // notify
      this.notifyCallback?.(streamKey, notification);

      // delay for showing notification
      switch (notification.type) {
        case SupportType.Normal:
          await this.delay(this.normalNotificationDuration);
          break;
        case SupportType.Video:
          await this.delay(this.videoNotificationDuration);
          break;
        case SupportType.Ads:
          await this.delay(this.adsNotificationDuration);
          break;
      }

      // delay notification space
      await this.delay(this.notificationSpaceDelay);
    }
  }

  private async delay(duration: number) {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  addNotification(streamKey: string, notification: SupportDTO) {
    let mainQueue = this.mainQueues.get(streamKey);
    if (!mainQueue) {
      mainQueue = [];
      this.mainQueues.set(streamKey, mainQueue);
    }
    mainQueue.push(notification);
    this.startQueueProcessor(streamKey);
  }

  addNotificationTest(streamKey: string, notification: SupportDTO) {
    let testQueue = this.testQueues.get(streamKey);
    if (!testQueue) {
      testQueue = [];
      this.testQueues.set(streamKey, testQueue);
    }
    testQueue.push(notification);
    this.startQueueProcessor(streamKey);
  }

  setNotifyCallback(
    callback: (streamKey: string, notification: SupportDTO) => void,
  ) {
    this.notifyCallback = callback;
  }
}

export interface SupportNotificationQueueOptions {
  notificationSpaceDelay: number | undefined;
  normalNotificationDuration: number | undefined;
  videoNotificationDuration: number | undefined;
  adsNotificationDuration: number | undefined;
}
