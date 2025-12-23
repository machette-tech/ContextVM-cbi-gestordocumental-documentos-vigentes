/**
 * Entry Point - ContextVM CBI Gestor Documental Documentos Vigentes
 */

import 'dotenv/config';
import express from 'express';
import { createActor } from 'xstate';
import { documentoVigenteMachine } from './machines/documento-vigente.machine.js';
import { NostrService } from './services/nostr.service.js';
import { DatabaseService } from './services/database.service.js';
import { DocumentoService } from './services/documento.service.js';
import { logger } from './utils/logger.js';
import type { CrearDocumentoInput } from './types/documento.js';

const PORT = process.env.PORT || 3004;
const app = express();

app.use(express.json());

// Services
let nostrService: NostrService;
let dbService: DatabaseService;
let documentoService: DocumentoService;

/**
 * Initialize services
 */
async function initializeServices() {
  logger.info('🚀 Initializing services...');
  
  // Database
  dbService = new DatabaseService();
  await dbService.connect();
  logger.info('✅ Database connected');
  
  // Nostr
  nostrService = new NostrService();
  await nostrService.connect();
  logger.info('✅ Nostr relay connected');
  
  // Documento Service
  documentoService = new DocumentoService(nostrService, dbService);
  await documentoService.initialize();
  logger.info('✅ Documento service initialized');
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cbi-gestordocumental-documentos-vigentes',
    version: process.env.CONTEXT_VERSION || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * Create new documento
 */
app.post('/documentos', async (req, res) => {
  try {
    const input: CrearDocumentoInput = req.body;
    
    logger.info({ input }, 'Creating new documento');
    
    const result = await documentoService.crearDocumento(input);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error({ error }, 'Error creating documento');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Execute transition
 */
app.post('/documentos/:tokenId/transitions/:transition', async (req, res) => {
  try {
    const { tokenId, transition } = req.params;
    const input = req.body;
    
    logger.info({ tokenId, transition, input }, 'Executing transition');
    
    const result = await documentoService.ejecutarTransicion(tokenId, transition, input);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error({ error }, 'Error executing transition');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get documento by token_id
 */
app.get('/documentos/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    logger.info({ tokenId }, 'Getting documento');
    
    const documento = await documentoService.getDocumento(tokenId);
    
    if (documento) {
      res.json({ success: true, documento });
    } else {
      res.status(404).json({ success: false, error: 'Documento not found' });
    }
  } catch (error) {
    logger.error({ error }, 'Error getting documento');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List all documentos vigentes
 */
app.get('/documentos', async (req, res) => {
  try {
    const { categoria, formato, estado } = req.query;
    
    logger.info({ categoria, formato, estado }, 'Listing documentos');
    
    const documentos = await documentoService.listarDocumentos({
      categoria: categoria as string,
      formato: formato as string,
      estado: estado as string,
    });
    
    res.json({ success: true, documentos, count: documentos.length });
  } catch (error) {
    logger.error({ error }, 'Error listing documentos');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get metrics
 */
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await documentoService.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error({ error }, 'Error getting metrics');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Graceful shutdown
 */
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down gracefully...');
  
  if (nostrService) {
    await nostrService.disconnect();
  }
  
  if (dbService) {
    await dbService.disconnect();
  }
  
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/**
 * Start server
 */
async function start() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info({ port: PORT }, '🚀 ContextVM Server started');
      logger.info({ 
        namespace: process.env.CONTEXT_NAMESPACE,
        name: process.env.CONTEXT_NAME,
        version: process.env.CONTEXT_VERSION,
      }, 'Context information');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
