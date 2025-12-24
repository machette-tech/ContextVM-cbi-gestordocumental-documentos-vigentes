/**
 * Nostr Service - Handle Nostr relay communication
 */

import { SimplePool, getPublicKey, finalizeEvent, nip19 } from 'nostr-tools';
import type { NostrEvent } from 'nostr-tools';
import { logger } from '../utils/logger.js';

export class NostrService {
  private pool: SimplePool;
  private relayUrl: string;
  private privateKey: Uint8Array;
  private publicKey: string;
  private subscriptions: Map<string, any> = new Map();

  constructor() {
    this.relayUrl = process.env.RELAY_URL || 'ws://relay:7777';
    
    // Get or generate private key
    const privateKeyHex = process.env.NOSTR_PRIVATE_KEY;
    if (!privateKeyHex) {
      throw new Error('NOSTR_PRIVATE_KEY not configured');
    }
    
    this.privateKey = new Uint8Array(Buffer.from(privateKeyHex, 'hex'));
    this.publicKey = getPublicKey(this.privateKey);
    
    this.pool = new SimplePool();
    
    logger.info({ publicKey: this.publicKey }, 'Nostr service initialized');
  }

  /**
   * Connect to relay
   */
  async connect(): Promise<void> {
    try {
      // Test connection by fetching one event
      await this.pool.querySync([this.relayUrl], { kinds: [1], limit: 1 });
      logger.info({ relayUrl: this.relayUrl }, 'Connected to Nostr relay');
    } catch (error) {
      logger.error({ error, relayUrl: this.relayUrl }, 'Failed to connect to relay');
      throw error;
    }
  }

  /**
   * Publish event to relay
   */
  async publishEvent(event: Omit<NostrEvent, 'id' | 'sig'>): Promise<NostrEvent> {
    try {
      const signedEvent = finalizeEvent(event, this.privateKey);
      
      await Promise.any(
        this.pool.publish([this.relayUrl], signedEvent)
      );
      
      logger.info({ 
        eventId: signedEvent.id,
        kind: signedEvent.kind,
        tags: signedEvent.tags.length,
      }, 'Event published');
      
      return signedEvent;
    } catch (error) {
      logger.error({ error, event }, 'Failed to publish event');
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(
    filters: any[],
    onEvent: (event: NostrEvent) => void,
    subscriptionId?: string
  ): string {
    const id = subscriptionId || Math.random().toString(36).substring(7);
    
    const sub = this.pool.subscribeMany(
      [this.relayUrl],
      filters as any,
      {
        onevent: (event) => {
          logger.debug({ eventId: event.id, kind: event.kind }, 'Event received');
          onEvent(event);
        },
        oneose: () => {
          logger.debug({ subscriptionId: id }, 'Subscription EOSE');
        },
      }
    );
    
    this.subscriptions.set(id, sub);
    
    logger.info({ subscriptionId: id, filters }, 'Subscription created');
    
    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    const sub = this.subscriptions.get(subscriptionId);
    if (sub) {
      sub.close();
      this.subscriptions.delete(subscriptionId);
      logger.info({ subscriptionId }, 'Subscription closed');
    }
  }

  /**
   * Query events
   */
  async queryEvents(filters: any[]): Promise<NostrEvent[]> {
    try {
      const events = await this.pool.querySync([this.relayUrl], filters as any);
      logger.info({ count: events.length, filters }, 'Events queried');
      return events;
    } catch (error) {
      logger.error({ error, filters }, 'Failed to query events');
      throw error;
    }
  }

  /**
   * Disconnect from relay
   */
  async disconnect(): Promise<void> {
    // Close all subscriptions
    for (const [_id, sub] of this.subscriptions) {
      sub.close();
    }
    this.subscriptions.clear();
    
    // Close pool
    this.pool.close([this.relayUrl]);
    
    logger.info('Disconnected from Nostr relay');
  }

  /**
   * Get public key
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Get npub
   */
  getNpub(): string {
    return nip19.npubEncode(this.publicKey);
  }
}
