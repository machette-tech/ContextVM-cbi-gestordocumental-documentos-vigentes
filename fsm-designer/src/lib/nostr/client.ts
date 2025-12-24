import { Relay } from 'nostr-tools/relay';
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import type { EventTemplate, VerifiedEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';
import { logger } from '../logger';

export type NostrConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NostrClientConfig {
  relayUrl: string;
  secretKey?: Uint8Array;
}

export class NostrClient {
  private relay: Relay | null;
  private secretKey: Uint8Array;
  private publicKey: string;
  private status: NostrConnectionStatus;
  private listeners: Set<(status: NostrConnectionStatus) => void>;

  constructor(private config: NostrClientConfig) {
    this.relay = null;
    this.status = 'disconnected';
    this.listeners = new Set();
    // Use provided secret key or generate a new one
    this.secretKey = config.secretKey || generateSecretKey();
    this.publicKey = getPublicKey(this.secretKey);
  }

  /**
   * Connect to Nostr relay
   */
  async connect(): Promise<void> {
    if (this.relay) {
      logger.warn('Already connected or connecting');
      return;
    }

    try {
      this.updateStatus('connecting');
      
      this.relay = await Relay.connect(this.config.relayUrl);
      
      logger.success(`Connected to relay: ${this.config.relayUrl}`);
      this.updateStatus('connected');
      
      // Note: Relay error handling is automatic in nostr-tools v2
    } catch (error) {
      logger.error('Failed to connect to relay:', error);
      this.updateStatus('error');
      throw error;
    }
  }

  /**
   * Disconnect from relay
   */
  async disconnect(): Promise<void> {
    if (this.relay) {
      await this.relay.close();
      this.relay = null;
      this.updateStatus('disconnected');
      logger.info('Disconnected from relay');
    }
  }

  /**
   * Publish an event to Nostr
   */
  async publish(template: EventTemplate): Promise<VerifiedEvent> {
    if (!this.relay) {
      throw new Error('Not connected to relay');
    }

    try {
      // Finalize and sign the event
      const signedEvent = finalizeEvent(template, this.secretKey);
      
      // Publish to relay
      await this.relay.publish(signedEvent);

      logger.success('Event published:', signedEvent.id);
      return signedEvent;
    } catch (error) {
      logger.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(
    filters: Filter[],
    onEvent: (event: VerifiedEvent) => void
  ): (() => void) {
    if (!this.relay) {
      throw new Error('Not connected to relay');
    }

    const sub = this.relay.subscribe(filters, {
      onevent(event) {
        onEvent(event as VerifiedEvent);
      },
      oneose() {
        logger.debug('End of stored events');
      }
    });

    // Return unsubscribe function
    return () => {
      sub.close();
    };
  }

  /**
   * Get connection status
   */
  getStatus(): NostrConnectionStatus {
    return this.status;
  }

  /**
   * Get public key
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Listen to status changes
   */
  onStatusChange(callback: (status: NostrConnectionStatus) => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(status: NostrConnectionStatus): void {
    this.status = status;
    this.listeners.forEach(callback => callback(status));
  }
}

// Singleton instance
let clientInstance: NostrClient | null = null;

/**
 * Get or create NostrClient instance
 */
export function getNostrClient(config?: NostrClientConfig): NostrClient {
  if (!clientInstance && config) {
    clientInstance = new NostrClient(config);
  }
  
  if (!clientInstance) {
    throw new Error('NostrClient not initialized. Provide config on first call.');
  }
  
  return clientInstance;
}

/**
 * Reset client instance (useful for testing)
 */
export function resetNostrClient(): void {
  clientInstance = null;
}
