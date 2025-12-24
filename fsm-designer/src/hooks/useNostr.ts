import { useEffect, useState, useCallback } from 'react';
import { getNostrClient, type NostrConnectionStatus } from '../lib/nostr/client';
import type { EventTemplate, VerifiedEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';
import { logger } from '../lib/logger';

const RELAY_URL = import.meta.env.VITE_RELAY_URL || 'ws://localhost:3334';

/**
 * Hook for managing Nostr connection
 */
export function useNostr() {
  const [status, setStatus] = useState<NostrConnectionStatus>('disconnected');
  const [publicKey, setPublicKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const client = getNostrClient({ relayUrl: RELAY_URL });

  useEffect(() => {
    // Subscribe to status changes and set initial values
    const unsubscribe = client.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected') {
        setPublicKey(client.getPublicKey());
      }
    });
    
    // Trigger initial status
    const initialStatus = client.getStatus();
    if (initialStatus === 'connected') {
      setPublicKey(client.getPublicKey());
    }

    return unsubscribe;
  }, [client]);

  const connect = useCallback(async () => {
    try {
      setError(null);
      await client.connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      logger.error('Connection error:', err);
    }
  }, [client]);

  const disconnect = useCallback(async () => {
    try {
      await client.disconnect();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Disconnect failed';
      setError(message);
      logger.error('Disconnect error:', err);
    }
  }, [client]);

  const publish = useCallback(async (template: EventTemplate): Promise<VerifiedEvent | null> => {
    try {
      setError(null);
      const event = await client.publish(template);
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publish failed';
      setError(message);
      logger.error('Publish error:', err);
      return null;
    }
  }, [client]);

  const subscribe = useCallback((
    filters: Filter[],
    onEvent: (event: VerifiedEvent) => void
  ): (() => void) => {
    try {
      setError(null);
      return client.subscribe(filters, onEvent);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Subscribe failed';
      setError(message);
      logger.error('Subscribe error:', err);
      return () => {};
    }
  }, [client]);

  return {
    status,
    publicKey,
    error,
    connect,
    disconnect,
    publish,
    subscribe,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
  };
}

/**
 * Hook for subscribing to events
 */
export function useNostrSubscription(
  filters: Filter[],
  enabled: boolean = true
) {
  const [events, setEvents] = useState<VerifiedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { subscribe, isConnected } = useNostr();

  useEffect(() => {
    if (!enabled || !isConnected) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const eventSet = new Set<string>();

    if (mounted) {
      setLoading(true);
    }

    const unsubscribe = subscribe(filters, (event) => {
      if (!mounted) return;
      
      // Avoid duplicates
      if (!eventSet.has(event.id)) {
        eventSet.add(event.id);
        setEvents(prev => [...prev, event]);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
      setLoading(false);
    };
  }, [filters, enabled, isConnected, subscribe]);

  return {
    events,
    loading,
    clear: () => setEvents([])
  };
}
