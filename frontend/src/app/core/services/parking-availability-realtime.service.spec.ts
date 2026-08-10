import { TestBed } from '@angular/core/testing';
import {
  Client,
  IFrame,
  IMessage,
  ReconnectionTimeMode,
  StompConfig,
  StompSubscription,
} from '@stomp/stompjs';
import { ParkingAvailabilityEvent } from '../../models/parking-availability-event.model';
import {
  ParkingAvailabilityRealtimeService,
  STOMP_CLIENT_FACTORY,
  StompClientFactory,
} from './parking-availability-realtime.service';

class FakeStompClient {
  readonly activate = jasmine.createSpy('activate');
  readonly deactivate = jasmine.createSpy('deactivate').and.resolveTo();
  readonly subscriptions: Array<{
    destination: string;
    callback: (message: IMessage) => void;
    subscription: StompSubscription;
  }> = [];

  constructor(readonly config: StompConfig) {}

  subscribe(destination: string, callback: (message: IMessage) => void): StompSubscription {
    const subscription: StompSubscription = {
      id: `subscription-${this.subscriptions.length + 1}`,
      unsubscribe: jasmine.createSpy('unsubscribe'),
    };
    this.subscriptions.push({ destination, callback, subscription });
    return subscription;
  }

  connect(): void {
    this.config.onConnect?.({} as IFrame);
  }

  closeUnexpectedly(): void {
    this.config.onWebSocketClose?.({} as CloseEvent);
  }

  receive(body: string): void {
    const current = this.subscriptions.at(-1);
    if (!current) {
      throw new Error('The fake client has no active subscription.');
    }
    current.callback({ body } as IMessage);
  }
}

describe('ParkingAvailabilityRealtimeService', () => {
  let service: ParkingAvailabilityRealtimeService;
  let fakeClient: FakeStompClient;
  let factory: jasmine.Spy<StompClientFactory>;

  const validEvent: ParkingAvailabilityEvent = {
    eventId: '9195c9e9-2a3e-4c39-b457-b3aca12df75a',
    parkingId: 42,
    availableSlots: 7,
    totalSlots: 20,
    updatedAt: '2026-08-08T10:30:00Z',
    reason: 'BOOKING_CREATED',
  };

  beforeEach(() => {
    factory = jasmine.createSpy('stompClientFactory').and.callFake((config: StompConfig) => {
      fakeClient = new FakeStompClient(config);
      return fakeClient as unknown as Client;
    });

    TestBed.configureTestingModule({
      providers: [{ provide: STOMP_CLIENT_FACTORY, useValue: factory }],
    });
    service = TestBed.inject(ParkingAvailabilityRealtimeService);
  });

  it('configures and activates a native STOMP client once', () => {
    service.connect();
    service.connect();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(fakeClient.activate).toHaveBeenCalledTimes(1);
    expect(fakeClient.config.brokerURL).toBe('ws://localhost:8080/ws');
    expect(fakeClient.config.connectHeaders).toBeUndefined();
    expect(fakeClient.config.heartbeatIncoming).toBe(10_000);
    expect(fakeClient.config.heartbeatOutgoing).toBe(10_000);
    expect(fakeClient.config.reconnectDelay).toBe(1_000);
    expect(fakeClient.config.maxReconnectDelay).toBe(30_000);
    expect(fakeClient.config.reconnectTimeMode).toBe(ReconnectionTimeMode.EXPONENTIAL);
  });

  it('subscribes to the availability topic from onConnect', () => {
    const states: string[] = [];
    service.connectionState$.subscribe((state) => states.push(state));

    service.connect();
    fakeClient.connect();

    expect(fakeClient.subscriptions.length).toBe(1);
    expect(fakeClient.subscriptions[0].destination).toBe('/topic/parking-availability');
    expect(states).toEqual(['disconnected', 'connecting', 'connected']);
  });

  it('emits a valid availability event', () => {
    let received: ParkingAvailabilityEvent | undefined;
    service.availabilityEvents$.subscribe((event) => (received = event));
    service.connect();
    fakeClient.connect();

    fakeClient.receive(JSON.stringify(validEvent));

    expect(received).toEqual(validEvent);
  });

  it('drops malformed and schema-invalid messages without terminating the stream', () => {
    const warning = spyOn(console, 'warn');
    const received: ParkingAvailabilityEvent[] = [];
    service.availabilityEvents$.subscribe((event) => received.push(event));
    service.connect();
    fakeClient.connect();

    fakeClient.receive('{invalid-json');
    fakeClient.receive(JSON.stringify({ ...validEvent, availableSlots: 21 }));
    fakeClient.receive(JSON.stringify(validEvent));

    expect(warning).toHaveBeenCalledTimes(2);
    expect(warning.calls.allArgs()).toEqual([
      ['Ignoring invalid parking availability message.'],
      ['Ignoring invalid parking availability message.'],
    ]);
    expect(received).toEqual([validEvent]);
  });

  it('moves to reconnecting and resubscribes after reconnect', () => {
    const states: string[] = [];
    service.connectionState$.subscribe((state) => states.push(state));
    service.connect();
    fakeClient.connect();

    fakeClient.closeUnexpectedly();
    fakeClient.connect();

    expect(states).toEqual([
      'disconnected',
      'connecting',
      'connected',
      'reconnecting',
      'connected',
    ]);
    expect(fakeClient.subscriptions.length).toBe(2);
    expect(fakeClient.subscriptions[1].destination).toBe('/topic/parking-availability');
  });

  it('replaces a stale subscription when onConnect is called repeatedly', () => {
    service.connect();
    fakeClient.connect();
    const firstSubscription = fakeClient.subscriptions[0].subscription;

    fakeClient.connect();

    expect(firstSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(fakeClient.subscriptions.length).toBe(2);
  });

  it('unsubscribes and deactivates on disconnect', async () => {
    const states: string[] = [];
    service.connectionState$.subscribe((state) => states.push(state));
    service.connect();
    fakeClient.connect();
    const subscription = fakeClient.subscriptions[0].subscription;

    await service.disconnect();

    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(fakeClient.deactivate).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toBe('disconnected');
  });

  it('deactivates when Angular destroys the service', async () => {
    service.connect();
    fakeClient.connect();

    service.ngOnDestroy();
    await Promise.resolve();

    expect(fakeClient.deactivate).toHaveBeenCalledTimes(1);
  });
});
