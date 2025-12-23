-- Database initialization for CBI Gestor Documental Documentos Vigentes

-- Create extension for UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Nostr Events table (Event Sourcing)
CREATE TABLE IF NOT EXISTS nostr_events (
    id SERIAL PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    pubkey TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    kind INTEGER NOT NULL,
    content TEXT,
    tags JSONB,
    sig TEXT NOT NULL,
    raw_event JSONB NOT NULL,
    indexed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nostr_events_event_id ON nostr_events(event_id);
CREATE INDEX idx_nostr_events_kind ON nostr_events(kind);
CREATE INDEX idx_nostr_events_pubkey ON nostr_events(pubkey);
CREATE INDEX idx_nostr_events_created_at ON nostr_events(created_at DESC);
CREATE INDEX idx_nostr_events_tags ON nostr_events USING gin(tags);

-- Documentos Vigentes table (Current State Projection)
CREATE TABLE IF NOT EXISTS documentos_vigentes (
    id SERIAL PRIMARY KEY,
    token_id TEXT UNIQUE NOT NULL,
    
    -- Identificación
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL,
    formato TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    metadatos JSONB DEFAULT '{}',
    
    -- Datos básicos
    autor TEXT NOT NULL,
    organizacion TEXT,
    
    -- Estado FSM
    estado TEXT NOT NULL DEFAULT 'registro',
    
    -- Fechas y actores
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Validación
    fecha_validacion TIMESTAMP,
    validador TEXT,
    
    -- Aprobación
    fecha_aprobacion TIMESTAMP,
    aprobador TEXT,
    
    -- Vigencia
    fecha_vigencia TIMESTAMP,
    fecha_caducidad TIMESTAMP,
    
    -- Rechazo
    motivo_rechazo TEXT,
    rechazado_por TEXT,
    fecha_rechazo TIMESTAMP,
    
    -- Obsolescencia
    fecha_obsolescencia TIMESTAMP,
    sustituido_por TEXT,
    motivo_obsolescencia TEXT,
    
    -- Información adicional
    requisitos_legales JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    vigente_desde DATE,
    vigente_hasta DATE,
    ubicacion_fisica TEXT,
    
    -- Nostr reference
    nostr_event_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documentos_token_id ON documentos_vigentes(token_id);
CREATE INDEX idx_documentos_estado ON documentos_vigentes(estado);
CREATE INDEX idx_documentos_categoria ON documentos_vigentes(categoria);
CREATE INDEX idx_documentos_formato ON documentos_vigentes(formato);
CREATE INDEX idx_documentos_autor ON documentos_vigentes(autor);
CREATE INDEX idx_documentos_fecha_registro ON documentos_vigentes(fecha_registro DESC);
CREATE INDEX idx_documentos_fecha_vigencia ON documentos_vigentes(fecha_vigencia);
CREATE INDEX idx_documentos_tags ON documentos_vigentes USING gin(tags);

-- Event Log table (Audit Trail)
CREATE TABLE IF NOT EXISTS event_log (
    id SERIAL PRIMARY KEY,
    token_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    actor TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    nostr_event_id TEXT
);

CREATE INDEX idx_event_log_token_id ON event_log(token_id);
CREATE INDEX idx_event_log_timestamp ON event_log(timestamp DESC);
CREATE INDEX idx_event_log_event_type ON event_log(event_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_documentos_vigentes_updated_at
    BEFORE UPDATE ON documentos_vigentes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- View: Documentos actualmente vigentes
CREATE OR REPLACE VIEW documentos_actualmente_vigentes AS
SELECT 
    token_id,
    nombre,
    descripcion,
    categoria,
    formato,
    version,
    autor,
    organizacion,
    fecha_vigencia,
    fecha_caducidad,
    vigente_desde,
    vigente_hasta,
    tags
FROM documentos_vigentes
WHERE estado = 'vigente'
    AND (fecha_caducidad IS NULL OR fecha_caducidad > NOW())
ORDER BY fecha_vigencia DESC;

-- View: Documentos por aprobar
CREATE OR REPLACE VIEW documentos_por_aprobar AS
SELECT 
    token_id,
    nombre,
    descripcion,
    categoria,
    formato,
    autor,
    fecha_registro,
    fecha_validacion,
    validador
FROM documentos_vigentes
WHERE estado = 'validacion'
ORDER BY fecha_validacion ASC;

-- View: Documentos próximos a caducar (30 días)
CREATE OR REPLACE VIEW documentos_proximos_caducar AS
SELECT 
    token_id,
    nombre,
    categoria,
    fecha_vigencia,
    fecha_caducidad,
    (fecha_caducidad - NOW()) as dias_restantes
FROM documentos_vigentes
WHERE estado = 'vigente'
    AND fecha_caducidad IS NOT NULL
    AND fecha_caducidad > NOW()
    AND fecha_caducidad <= NOW() + INTERVAL '30 days'
ORDER BY fecha_caducidad ASC;

-- View: Estadísticas por categoría
CREATE OR REPLACE VIEW estadisticas_por_categoria AS
SELECT 
    categoria,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE estado = 'vigente') as vigentes,
    COUNT(*) FILTER (WHERE estado = 'obsoleto') as obsoletos,
    COUNT(*) FILTER (WHERE estado = 'validacion') as en_validacion,
    COUNT(*) FILTER (WHERE estado = 'rechazado') as rechazados
FROM documentos_vigentes
GROUP BY categoria
ORDER BY total DESC;

-- Insert initial seed data (optional)
-- This can be used for testing or initial setup

COMMENT ON TABLE nostr_events IS 'Event Sourcing: All Nostr events for audit trail';
COMMENT ON TABLE documentos_vigentes IS 'Current state projection of all documentos vigentes';
COMMENT ON TABLE event_log IS 'Audit log of all state transitions and events';

COMMENT ON COLUMN documentos_vigentes.token_id IS 'Unique identifier following AARPIA pattern: documento-vigente#estado#timestamp';
COMMENT ON COLUMN documentos_vigentes.estado IS 'FSM state: registro, validacion, rechazado, aprobado, vigente, obsoleto';
COMMENT ON COLUMN documentos_vigentes.categoria IS 'Category: LEGAL, FISCAL, TECNICO, OPERATIVO, CONTRACTUAL, CALIDAD, RRHH, OTRO';
COMMENT ON COLUMN documentos_vigentes.formato IS 'Format: PDF, DOCX, XLSX, TXT, XML, JSON, HTML, OTRO';
