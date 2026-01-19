# HS-WMS (Professional Inventory Management System)

A modern, full-stack Warehouse Management System (WMS) prototype designed for multi-customer inventory tracking, authorizing specific SKUs per customer, and handling complex outbound shipments.

## 🚀 Key Features

### 📊 Inventory & Warehouse Control
- **Customer-Specific SKUs**: Authorize which products (SKUs) each customer is allowed to stock and ship.
- **Dynamic Grouping**: View inventory stock grouped by Customer with a clean, high-contrast card UI.
- **Stock In (Inbound)**: Smart replenishment that appends to existing stock with automated transaction logging.
- **Inventory Health Alerts**: Set "Safety Stock" and "Target Stock" levels per item with visual warnings (Red highlight) for low stock.

### 📤 Advanced Outbound Management
- **One-Click Batch Shipment**: Process multiple SKUs in a single order (RMA Ticket).
- **Mixed-Source Fulfillment**: Allocate stock from different customer accounts within the same shipment (ideal for shared inventory or borrowing scenarios).
- **Auto-Sync Logic**: Changing the "Selling Customer" automatically pre-fills inventory sources for all order lines.
- **CRUD with Rollback**: Editing or deleting a shipment automatically restores or adjusts inventory levels accurately.

### 📥 Audit & Logs
- **Comprehensive Logs**: Track every movement (Inbound, Manual Adjustments, Set Qty) with detailed remarks and timestamps.
- **Search & Filter**: Multi-dimensional search across SKU, Customer, Date, and Remarks.

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Vite, React-Bootstrap.
- **Backend**: Python 3.13, FastAPI, SQLModel (SQLAlchemy + Pydantic).
- **Database**: SQLite with **Alembic** for professional schema migrations.

## 🏁 Getting Started

### 1. The Easy Way (Windows)
Simply double-click the **`start_app.bat`** file in the root directory. It will:
- Launch the Python Backend.
- Launch the React Frontend.
- Automatically open your browser to `http://localhost:5173`.

### 2. Manual Start

#### Backend
```powershell
cd inventory-system/backend
pip install -r requirements.txt
python main.py
```

#### Frontend
```powershell
cd inventory-system/frontend
npm install
npm run dev
```

## 🗄️ Database Migrations
This project uses **Alembic**. If you modify the models in `main.py`, follow these steps to preserve data:
1. Generate migration: `alembic revision --autogenerate -m "description"`
2. Apply changes: `alembic upgrade head`

## 📝 License
MIT