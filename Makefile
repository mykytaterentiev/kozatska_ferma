.PHONY: setup dev-backend dev-frontend dev build

setup:
	@echo "Setting up backend..."
	cd backend && poetry install
	@echo "Setting up frontend..."
	cd frontend && npm install

dev-backend:
	cd backend && poetry run uvicorn app.main:app --reload --port 8000

dev-ml:
	cd backend && poetry run uvicorn app.ml.service:app --reload --port 8001

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Run 'make dev-backend', 'make dev-ml', and 'make dev-frontend' in separate terminals."

build:
	cd frontend && npm run build