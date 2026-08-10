import { Inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import {
  Client,
  IMessage,
  ReconnectionTimeMode,
  StompConfig,
  StompSubscription,
} from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject, distinctUntilChanged } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PARKING_AVAILABILITY_REASONS,
  ParkingAvailabilityEvent,
  ParkingAvailabilityReason,
  RealtimeConnectionState,
} from '../../models/parking-availability-event.model';

export type StompClientFactory = (config: StompConfig) => Client;

export const STOMP_CLIENT_FACTORY = new InjectionToken<StompClientFactory>(
  'STOMP_CLIENT_FACTORY',
  { providedIn: 'root', factory: () => (config) => new Client(config) },
);

@Injectable({ providedIn: 'root' })
export class ParkingAvailabilityRealtimeService implements OnDestroy {
  private static readonly TOPIC = '/topic/parking-availability';
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly eventsSubject = new Subject<ParkingAvailabilityEvent>();
  private readonly stateSubject = new BehaviorSubject<RealtimeConnectionState>('disconnected');

  readonly availabilityEvents$: Observable<ParkingAvailabilityEvent> =
    this.eventsSubject.asObservable();
  readonly connectionState$: Observable<RealtimeConnectionState> = this.stateSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private client?: Client;
  private subscription?: StompSubscription;
  private connectionRequested = false;

  constructor(@Inject(STOMP_CLIENT_FACTORY) private readonly clientFactory: StompClientFactory) {}

  connect(): void {
    if (this.connectionRequested) {
      return;
    }

    this.connectionRequested = true;
    this.setState('connecting');

    const client = this.clientFactory({
      brokerURL: environment.webSocketUrl,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      reconnectDelay: 1_000,
      maxReconnectDelay: 30_000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      debug: () => undefined,
      onConnect: () => this.handleConnected(client),
      onWebSocketClose: () => this.handleConnectionLost(client),
      onWebSocketError: () => this.handleConnectionLost(client),
      onStompError: () => this.handleConnectionLost(client),
    });

    this.client = client;
    client.activate();
  }

  async disconnect(): Promise<void> {
    this.connectionRequested = false;
    this.unsubscribe();

    const client = this.client;
    this.client = undefined;

    try {
      await client?.deactivate();
    } finally {
      if (!this.connectionRequested) {
        this.setState('disconnected');
      }
    }
  }

  ngOnDestroy(): void {
    void this.disconnect().catch(() => {
      this.setState('disconnected');
    });
  }

  private handleConnected(client: Client): void {
    if (!this.connectionRequested || this.client !== client) {
      return;
    }

    this.unsubscribe();
    this.subscription = client.subscribe(
      ParkingAvailabilityRealtimeService.TOPIC,
      (message) => this.handleMessage(message),
    );
    this.setState('connected');
  }

  private handleConnectionLost(client: Client): void {
    if (this.client !== client) {
      return;
    }

    this.subscription = undefined;
    this.setState(this.connectionRequested ? 'reconnecting' : 'disconnected');
  }

  private handleMessage(message: IMessage): void {
    const event = this.parseEvent(message.body);
    if (!event) {
      console.warn('Ignoring invalid parking availability message.');
      return;
    }

    this.eventsSubject.next(event);
  }

  private parseEvent(body: string): ParkingAvailabilityEvent | null {
    try {
      const value: unknown = JSON.parse(body);
      if (!this.isAvailabilityEvent(value)) {
        return null;
      }
      return value;
    } catch {
      return null;
    }
  }

  private isAvailabilityEvent(value: unknown): value is ParkingAvailabilityEvent {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const event = value as Record<string, unknown>;
    const availableSlots = event['availableSlots'];
    const totalSlots = event['totalSlots'];

    return (
      typeof event['eventId'] === 'string' &&
      ParkingAvailabilityRealtimeService.UUID_PATTERN.test(event['eventId']) &&
      Number.isInteger(event['parkingId']) &&
      (event['parkingId'] as number) > 0 &&
      Number.isInteger(availableSlots) &&
      (availableSlots as number) >= 0 &&
      Number.isInteger(totalSlots) &&
      (totalSlots as number) >= 0 &&
      (availableSlots as number) <= (totalSlots as number) &&
      typeof event['updatedAt'] === 'string' &&
      !Number.isNaN(Date.parse(event['updatedAt'])) &&
      typeof event['reason'] === 'string' &&
      PARKING_AVAILABILITY_REASONS.includes(event['reason'] as ParkingAvailabilityReason)
    );
  }

  private unsubscribe(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }

  private setState(state: RealtimeConnectionState): void {
    this.stateSubject.next(state);
  }
}
