import type { EventTemplate } from 'nostr-tools/pure';
import type { FSMState, FSMTransition, LEntity, SchemaField } from '../../types/fsm';
import { logger } from '../logger';

/**
 * Event kinds for ContextVM / AARPIA
 * Based on NIP-1 and custom kinds
 */
export const EventKinds = {
  // ContextVM FSM kinds (13xx range)
  FSM_DEFINITION: 1300,
  FSM_INSTANCE: 1301,
  TOKEN_TRANSITION: 1302,
  ENTITY_DEFINITION: 1303,
  
  // Standard kinds
  TEXT_NOTE: 1,
  METADATA: 0,
} as const;

/**
 * Create FSM Definition Event
 */
export function createFSMDefinitionEvent(
  entity: LEntity,
  states: FSMState[],
  transitions: FSMTransition[],
  inputs: SchemaField[],
  outputs: SchemaField[]
): EventTemplate {
  const content = JSON.stringify({
    entity,
    states,
    transitions,
    schemas: {
      inputs,
      outputs
    },
    version: '1.0.0',
    createdAt: new Date().toISOString()
  });

  const tags: string[][] = [
    ['L', 'contextvm'],  // Label namespace
    ['l', 'fsm-definition', 'contextvm'],  // Label value
    ['entity-type', entity.type],
    ['entity-name', entity.name],
  ];

  // Add token tag for root entities
  if (entity.type === 'root' && entity.token) {
    tags.push(['token', JSON.stringify(entity.token)]);
  }

  // Add relay tag for context entities
  if (entity.type === 'context' && entity.sourceRelay) {
    tags.push(['relay', entity.sourceRelay]);
  }

  // Add state tags
  states.forEach(state => {
    tags.push(['state', state.id, state.name, state.type]);
  });

  // Add transition tags
  transitions.forEach(transition => {
    tags.push(['transition', transition.from, transition.to, transition.action]);
  });

  return {
    kind: EventKinds.FSM_DEFINITION,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content
  };
}

/**
 * Create Entity Definition Event
 */
export function createEntityDefinitionEvent(entity: LEntity): EventTemplate {
  const content = JSON.stringify({
    ...entity,
    version: '1.0.0',
    createdAt: new Date().toISOString()
  });

  const tags: string[][] = [
    ['L', 'contextvm'],
    ['l', 'entity-definition', 'contextvm'],
    ['entity-type', entity.type],
    ['entity-name', entity.name],
  ];

  if (entity.type === 'root' && entity.token) {
    tags.push(['token', JSON.stringify(entity.token)]);
  }

  if (entity.type === 'context' && entity.sourceRelay) {
    tags.push(['relay', entity.sourceRelay]);
  }

  if (entity.type === 'local' && entity.role) {
    tags.push(['role', entity.role]);
  }

  return {
    kind: EventKinds.ENTITY_DEFINITION,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content
  };
}

/**
 * Create Token Transition Event
 */
export function createTokenTransitionEvent(
  tokenId: string,
  fromState: string,
  toState: string,
  event: string,
  data: Record<string, unknown>
): EventTemplate {
  const content = JSON.stringify({
    tokenId,
    fromState,
    toState,
    event,
    data,
    timestamp: new Date().toISOString()
  });

  const tags: string[][] = [
    ['L', 'contextvm'],
    ['l', 'token-transition', 'contextvm'],
    ['token', tokenId],
    ['from', fromState],
    ['to', toState],
    ['event', event],
  ];

  return {
    kind: EventKinds.TOKEN_TRANSITION,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content
  };
}

/**
 * Parse FSM Definition from Nostr event
 */
export function parseFSMDefinitionEvent(content: string) {
  try {
    const data = JSON.parse(content);
    return {
      entity: data.entity as LEntity,
      states: data.states as FSMState[],
      transitions: data.transitions as FSMTransition[],
      schemas: {
        inputs: data.schemas.inputs as SchemaField[],
        outputs: data.schemas.outputs as SchemaField[]
      },
      version: data.version,
      createdAt: data.createdAt
    };
  } catch (error) {
    logger.error('Failed to parse FSM definition:', error);
    return null;
  }
}

/**
 * Create filters for querying FSM definitions
 */
export function createFSMFilters(options?: {
  entityType?: string;
  entityName?: string;
  token?: string;
  limit?: number;
}) {
  const filters: Record<string, unknown> = {
    kinds: [EventKinds.FSM_DEFINITION],
    limit: options?.limit || 20
  };

  const tags: Record<string, string[]> = {};

  if (options?.entityType) {
    tags['entity-type'] = [options.entityType];
  }

  if (options?.entityName) {
    tags['entity-name'] = [options.entityName];
  }

  if (options?.token) {
    tags['token'] = [options.token];
  }

  if (Object.keys(tags).length > 0) {
    filters['#L'] = ['contextvm'];
    Object.assign(filters, tags);
  }

  return [filters];
}
