.PHONY: help build start stop restart logs test clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

start: ## Start all services
	./dev.sh

stop: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-app: ## Show logs from app service
	docker-compose logs -f app

logs-relay: ## Show logs from relay service
	docker-compose logs -f relay

test: ## Run tests
	cd cbi-gestordocumental-documentos-vigentes && npm test

test-watch: ## Run tests in watch mode
	cd cbi-gestordocumental-documentos-vigentes && npm run test:watch

clean: ## Clean up containers and volumes
	docker-compose down -v
	rm -rf cbi-gestordocumental-documentos-vigentes/dist
	rm -rf cbi-gestordocumental-documentos-vigentes/node_modules
	rm -rf fsm-designer/dist
	rm -rf fsm-designer/node_modules
	rm -rf postgres_data

install: ## Install dependencies
	cd cbi-gestordocumental-documentos-vigentes && npm install
	cd fsm-designer && npm install

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U contextvm -d contextvm_documentos

db-reset: ## Reset database
	docker-compose down -v postgres
	docker-compose up -d postgres
	sleep 5
	docker-compose exec postgres psql -U contextvm -d contextvm_documentos -f /docker-entrypoint-initdb.d/init-db.sql

relay-shell: ## Open relay shell
	docker-compose exec relay sh

app-shell: ## Open app shell
	docker-compose exec app sh

health: ## Check health of all services
	@echo "Checking service health..."
	@curl -s http://localhost:3004/health | jq || echo "App not responding"
	@curl -s http://localhost:4005/health | jq || echo "XState not responding"
	@curl -s http://localhost:4105 > /dev/null && echo "FSM Designer: OK" || echo "FSM Designer not responding"

metrics: ## Show application metrics
	@curl -s http://localhost:3004/metrics | jq

dev: ## Start development environment
	./dev.sh

prod: ## Build production images
	docker-compose -f docker-compose.yml build

push: ## Push images to registry
	docker-compose push
