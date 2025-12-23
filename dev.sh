#!/bin/bash

# dev.sh - Script para iniciar servicios en modo desarrollo
# ContextVM: CBI Gestor Documental - Documentos Vigentes

set -e

echo "🚀 Iniciando ContextVM CBI Gestor Documental - Documentos Vigentes (DEV)"
echo "================================================================"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Cargar .env si existe
if [ -f .env ]; then
    echo -e "${BLUE}📝 Cargando variables de entorno...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado, usando valores por defecto${NC}"
    cp .env.example .env || true
fi

# Crear directorios necesarios
echo -e "${BLUE}📁 Creando directorios...${NC}"
mkdir -p postgres_data
mkdir -p relay-data
mkdir -p relay-config

# Crear configuración del relay si no existe
if [ ! -f relay-config/config.toml ]; then
    echo -e "${BLUE}⚙️  Creando configuración del relay...${NC}"
    cat > relay-config/config.toml <<EOF
[info]
relay_url = "wss://relay.cbi.gestordocumental.documentosvigentes.controller-ai.com"
name = "CBI Gestor Documental Documentos Vigentes Relay"
description = "Relay Nostr para gestión de documentos vigentes"
pubkey = ""
contact = "admin@controller-ai.com"

[database]
data_directory = "./db"
engine = "sqlite"

[network]
port = 3334
address = "0.0.0.0"

[limits]
messages_per_sec = 100
max_event_bytes = 262144
max_ws_message_bytes = 262144

[authorization]
pubkey_whitelist = []

[logging]
folder_path = "./logs"
level = "info"
EOF
fi

# Detener contenedores existentes
echo -e "${BLUE}🛑 Deteniendo contenedores existentes...${NC}"
docker-compose down || true

# Construir imágenes
echo -e "${BLUE}🏗️  Construyendo imágenes...${NC}"
docker-compose build --no-cache cbi-gestordocumental-documentos-vigentes-app || {
    echo "❌ Error construyendo la aplicación"
    exit 1
}

docker-compose build --no-cache cbi-gestordocumental-documentos-vigentes-fsm-designer || {
    echo "❌ Error construyendo FSM Designer"
    exit 1
}

# Iniciar servicios
echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
docker-compose up -d

# Esperar a que los servicios estén listos
echo -e "${BLUE}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 10

# Verificar salud de los servicios
echo -e "${BLUE}🏥 Verificando salud de servicios...${NC}"

check_service() {
    local service=$1
    local port=$2
    local name=$3
    
    if docker-compose ps | grep -q "$service.*Up"; then
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✅ $name: OK (puerto $port)${NC}"
        else
            echo -e "${YELLOW}⚠️  $name: Iniciando... (puerto $port)${NC}"
        fi
    else
        echo -e "❌ $name: ERROR"
        return 1
    fi
}

check_service "relay" 8085 "Nostr Relay"
check_service "postgres" 5435 "PostgreSQL"
check_service "app" 3004 "ContextVM App"
check_service "xstate" 4005 "XState Inspector"
check_service "fsm-designer" 4105 "FSM Designer"

echo ""
echo -e "${GREEN}✅ Servicios iniciados correctamente${NC}"
echo ""
echo "📊 URLs de acceso:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🎨 FSM Designer:${NC}"
echo "   Local:  http://localhost:4105"
echo "   SSL:    https://xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com"
echo ""
echo -e "${BLUE}🔍 XState Inspector:${NC}"
echo "   Local:  http://localhost:4005"
echo "   WS:     ws://localhost:4001"
echo "   UI:     http://localhost:8770"
echo ""
echo -e "${BLUE}🚀 ContextVM App:${NC}"
echo "   API:    http://localhost:3004"
echo "   Health: http://localhost:3004/health"
echo ""
echo -e "${BLUE}📡 Nostr Relay:${NC}"
echo "   Local:  ws://localhost:8085"
echo "   SSL:    wss://relay.cbi.gestordocumental.documentosvigentes.controller-ai.com"
echo ""
echo -e "${BLUE}🗄️  PostgreSQL:${NC}"
echo "   Host:   localhost:5435"
echo "   DB:     cbi_gestordocumental_documentos_vigentes_dev"
echo "   User:   contextvm"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Comandos útiles:"
echo "  docker-compose logs -f cbi-gestordocumental-documentos-vigentes-app"
echo "  docker-compose logs -f cbi-gestordocumental-documentos-vigentes-relay"
echo "  docker-compose ps"
echo "  docker-compose down"
echo ""
echo -e "${GREEN}🎉 ¡Entorno de desarrollo listo!${NC}"
