# Inventory Management System

## Setup & Run

### 1. Backend (Python/FastAPI)
Open a terminal and run:
```bash
cd backend
# If you haven't installed requirements yet:
pip install -r requirements.txt

# Run the server
python main.py
```
The API will be available at `http://localhost:8000`.
Documentation is at `http://localhost:8000/docs`.

### 2. Frontend (React)
Open a **new** terminal window and run:
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## Features
- Dashboard with inventory table.
- Add new SKU.
- Edit existing SKU (quantity, names).
- Delete SKU.
- Search/Sort (Client-side via table, can be expanded).
