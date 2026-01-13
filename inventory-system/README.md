# Inventory Management System (HS-WMS)

A lightweight warehouse management system for tracking customers, products, inventory, inbound stock, and shipments. The project is split into a FastAPI backend and a React + Vite frontend.

## Project Structure

```
inventory-system/
├─ backend/   # FastAPI + SQLModel API service
├─ frontend/  # React + TypeScript UI
└─ README.md  # This document
```

## Tech Stack

- **Backend**: FastAPI, SQLModel, SQLite, Uvicorn
- **Frontend**: React, TypeScript, Vite, React-Bootstrap, Axios

## Core Features

### Customer & Product Management
- Create/update/delete customers and products.
- Link products to specific customers for quick association.

### Inventory Management
- Add stock (inbound) with optional remarks.
- Update quantities with adjustment tracking.
- Set target stock and safety stock thresholds.
- Filter inventory by stock owner and view grouped SKUs.

### Shipment Management
- Create shipments and auto-decrease inventory.
- Batch shipment support.
- Update or delete shipments with inventory reconciliation.

### Inbound History
- Automatic inbound transaction log for stock-in and manual adjustments.

## Running the Project

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

- API base URL: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

- Web app: `http://localhost:5173`

### 3. Windows Quick Start (Optional)

If you are on Windows, you can use the helper script from the repository root:

```bat
start_app.bat
```

## API Overview

Key endpoints exposed by the backend:

- `GET /customers/` — list customers with linked products.
- `POST /customers/` — create a customer.
- `GET /products/` — list products.
- `POST /products/` — create a product.
- `GET /inventory/` — list inventory with customer/product details.
- `POST /inventory/` — stock in (creates inbound history).
- `PUT /inventory/{id}` — update quantities/thresholds.
- `GET /shipments/` — list shipments.
- `POST /shipments/` — create a shipment (decreases inventory).
- `POST /shipments/batch/` — create a batch shipment.
- `GET /inbound-history/` — list inbound transactions.

Refer to Swagger UI for the full request/response schema.

## Data Storage

The backend uses a local SQLite database stored at:

```
backend/database.db
```

This file is created automatically on first run.

## Development Notes

- The frontend expects the API at `http://localhost:8000`. Update `frontend/src/api.ts` if you need a different base URL.
- CORS is open for local development.
