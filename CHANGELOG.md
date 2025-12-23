# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of CBI Gestor Documental Documentos Vigentes
- XState 5.0 FSM with 6 states and 6 transitions
- Event Sourcing over Nostr (kinds 5055/6055)
- PostgreSQL persistence with Event Sourcing tables
- REST API with Express
- Docker Compose multi-service setup
- FSM Designer web interface with React
- Complete test suite with Vitest
- Comprehensive documentation
- AARPIA logic implementation
- Health checks and metrics endpoints
- Database views for common queries
- Examples and integration guides

### States
- `registro`: Initial document registration
- `validacion`: Under validation
- `rechazado`: Rejected during validation
- `aprobado`: Approved, pending activation
- `vigente`: Active and valid
- `obsoleto`: Obsolete, replaced by newer version

### Transitions
- `VALIDAR`: registro → validacion
- `RECHAZAR`: validacion → rechazado
- `APROBAR`: validacion → aprobado
- `ACTIVAR`: aprobado → vigente
- `MARCAR_OBSOLETO`: vigente → obsoleto

### Categories
- LEGAL: Legal documents
- FISCAL: Tax-related documents
- TECNICO: Technical documentation
- OPERATIVO: Operational procedures
- CONTRACTUAL: Contracts
- CALIDAD: Quality management
- RRHH: Human resources
- OTRO: Other types

### Formats
- PDF, DOCX, XLSX, TXT, XML, JSON, HTML, OTRO

## [1.0.0] - 2024-12-23

### Added
- Initial release

[Unreleased]: https://github.com/machette-tech/ContextVM-cbi-gestordocumental-documentos-vigentes/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/machette-tech/ContextVM-cbi-gestordocumental-documentos-vigentes/releases/tag/v1.0.0
