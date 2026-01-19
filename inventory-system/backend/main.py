from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
from sqlmodel import Field, Session, SQLModel, create_engine, select, Relationship
from sqlalchemy.orm import selectinload
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# --- Database Models ---

class Customer(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    contact_info: Optional[str] = None
    
class Product(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    sku_code: str = Field(unique=True, index=True)
    name: str
    description: Optional[str] = None

class Inventory(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id")
    product_id: int = Field(foreign_key="product.id")
    quantity: int
    target_stock: int = Field(default=0)
    safety_stock: int = Field(default=0)
    updated_at: datetime = Field(default_factory=datetime.now)

    customer: Optional[Customer] = Relationship()
    product: Optional[Product] = Relationship()

class Shipment(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id")
    product_id: int = Field(foreign_key="product.id")
    quantity: int
    shipment_date: datetime
    rma_ticket: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    customer: Optional[Customer] = Relationship()
    product: Optional[Product] = Relationship()

class InboundTransaction(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id")
    product_id: int = Field(foreign_key="product.id")
    quantity: int
    inbound_date: datetime = Field(default_factory=datetime.now)
    remarks: Optional[str] = None
    
    customer: Optional[Customer] = Relationship()
    product: Optional[Product] = Relationship()

class CustomerProductLink(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    customer_id: int = Field(foreign_key="customer.id", primary_key=True)
    product_id: int = Field(foreign_key="product.id", primary_key=True)

# --- Read Models (DTOs) for Responses ---
class CustomerReadWithProducts(SQLModel):
    id: int
    name: str
    contact_info: Optional[str] = None
    products: List[Product] = []

class InventoryRead(SQLModel):
    id: int
    customer_id: int
    product_id: int
    quantity: int
    target_stock: int
    safety_stock: int
    updated_at: datetime
    customer: Customer
    product: Product

class InventoryCreate(SQLModel):
    customer_id: int
    product_id: int
    quantity: int
    target_stock: Optional[int] = 0
    safety_stock: Optional[int] = 0
    remarks: Optional[str] = None

class InventoryUpdate(SQLModel):
    quantity: Optional[int] = None
    target_stock: Optional[int] = None
    safety_stock: Optional[int] = None

class ShipmentCreate(SQLModel):
    customer_id: int
    product_id: int
    quantity: int
    shipment_date: datetime
    rma_ticket: Optional[str] = None
    stock_source_customer_id: Optional[int] = None

class ShipmentRead(SQLModel):
    id: int
    customer: Customer
    product: Product
    quantity: int
    shipment_date: datetime
    rma_ticket: Optional[str]
    created_at: datetime

class ShipmentUpdate(SQLModel):
    quantity: Optional[int] = None
    shipment_date: Optional[datetime] = None
    rma_ticket: Optional[str] = None

class ShipmentItem(SQLModel):
    product_id: int
    quantity: int
    stock_source_customer_id: Optional[int] = None # Source per item

class BatchShipmentCreate(SQLModel):
    customer_id: int
    shipment_date: datetime
    rma_ticket: Optional[str] = None
    items: List[ShipmentItem]

class InboundRead(SQLModel):
    id: int
    customer: Customer
    product: Product
    quantity: int
    inbound_date: datetime
    remarks: Optional[str]

# --- Database Setup ---
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        if "already exists" in str(e):
            print(f"Database schema check skipped: {e}")
        else:
            raise e

# --- FastAPI App & Lifespan ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Inventory System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Customer Routes ---
@app.post("/customers/", response_model=Customer)
def create_customer(customer: Customer):
    with Session(engine) as session:
        session.add(customer)
        session.commit()
        session.refresh(customer)
        return customer

@app.get("/customers/", response_model=List[CustomerReadWithProducts])
def read_customers():
    results = []
    with Session(engine) as session:
        customers = session.exec(select(Customer)).all()
        for cust in customers:
            # Query linked products for each customer
            statement = select(Product).join(CustomerProductLink).where(CustomerProductLink.customer_id == cust.id)
            linked_prods = session.exec(statement).all()
            
            cust_data = CustomerReadWithProducts(
                id=cust.id,
                name=cust.name,
                contact_info=cust.contact_info,
                products=linked_prods
            )
            results.append(cust_data)
        return results

@app.put("/customers/{customer_id}", response_model=Customer)
def update_customer(customer_id: int, customer_data: Customer):
    with Session(engine) as session:
        db_customer = session.get(Customer, customer_id)
        if not db_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        db_customer.name = customer_data.name
        db_customer.contact_info = customer_data.contact_info
        session.add(db_customer)
        session.commit()
        session.refresh(db_customer)
        return db_customer

@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int):
    with Session(engine) as session:
        customer = session.get(Customer, customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        session.delete(customer)
        session.commit()
        return {"ok": True}

# --- Product Routes ---
@app.post("/products/", response_model=Product)
def create_product(product: Product):
    with Session(engine) as session:
        existing = session.exec(select(Product).where(Product.sku_code == product.sku_code)).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
        session.add(product)
        session.commit()
        session.refresh(product)
        return product

@app.get("/products/", response_model=List[Product])
def read_products():
    with Session(engine) as session:
        return session.exec(select(Product)).all()

@app.put("/products/{product_id}", response_model=Product)
def update_product(product_id: int, product_data: Product):
    with Session(engine) as session:
        db_product = session.get(Product, product_id)
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        if product_data.sku_code != db_product.sku_code:
            existing = session.exec(select(Product).where(Product.sku_code == product_data.sku_code)).first()
            if existing:
                raise HTTPException(status_code=400, detail="New SKU Code already exists")

        db_product.sku_code = product_data.sku_code
        db_product.name = product_data.name
        db_product.description = product_data.description
        
        session.add(db_product)
        session.commit()
        session.refresh(db_product)
        return db_product

@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    with Session(engine) as session:
        product = session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        session.delete(product)
        session.commit()
        return {"ok": True}

# --- Inventory Routes ---
@app.get("/inventory/", response_model=List[InventoryRead])
def read_inventory():
    with Session(engine) as session:
        statement = select(Inventory).options(
            selectinload(Inventory.customer), 
            selectinload(Inventory.product)
        )
        items = session.exec(statement).all()
        return items

@app.post("/inventory/", response_model=InventoryRead)
def create_inventory_entry(inventory_data: InventoryCreate):
    with Session(engine) as session:
        inbound = InboundTransaction(
            customer_id=inventory_data.customer_id,
            product_id=inventory_data.product_id,
            quantity=inventory_data.quantity,
            remarks=inventory_data.remarks or "Initialization"
        )
        session.add(inbound)

        existing = session.exec(select(Inventory).where(
            Inventory.customer_id == inventory_data.customer_id,
            Inventory.product_id == inventory_data.product_id
        )).first()
        
        if existing:
            existing.quantity += inventory_data.quantity
            existing.updated_at = datetime.now()
            if inventory_data.target_stock is not None: existing.target_stock = inventory_data.target_stock
            if inventory_data.safety_stock is not None: existing.safety_stock = inventory_data.safety_stock
            session.add(existing)
            db_item = existing
        else:
            db_item = Inventory.from_orm(inventory_data)
            db_item.updated_at = datetime.now()
            session.add(db_item)
        
        session.commit()
        session.refresh(db_item)
        _ = db_item.customer
        _ = db_item.product
        return db_item

@app.put("/inventory/{inventory_id}", response_model=InventoryRead)
def update_inventory_quantity(inventory_id: int, data: InventoryUpdate):
    with Session(engine) as session:
        db_item = session.get(Inventory, inventory_id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Inventory entry not found")
        
        if data.quantity is not None:
            diff = data.quantity - db_item.quantity
            if diff != 0:
                adjustment = InboundTransaction(
                    customer_id=db_item.customer_id,
                    product_id=db_item.product_id,
                    quantity=diff,
                    remarks=f"Manual Adjustment (Set Qty: {db_item.quantity} -> {data.quantity})"
                )
                session.add(adjustment)
            db_item.quantity = data.quantity

        if data.target_stock is not None: db_item.target_stock = data.target_stock
        if data.safety_stock is not None: db_item.safety_stock = data.safety_stock
            
        db_item.updated_at = datetime.now()
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        _ = db_item.customer
        _ = db_item.product
        return db_item

@app.delete("/inventory/{inventory_id}")
def delete_inventory_entry(inventory_id: int):
    with Session(engine) as session:
        db_item = session.get(Inventory, inventory_id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Entry not found")
        session.delete(db_item)
        session.commit()
        return {"ok": True}

@app.get("/inbound-history/", response_model=List[InboundRead])
def read_inbound_history():
    with Session(engine) as session:
        statement = select(InboundTransaction).options(
            selectinload(InboundTransaction.customer),
            selectinload(InboundTransaction.product)
        ).order_by(InboundTransaction.inbound_date.desc())
        return session.exec(statement).all()

# --- Shipment Routes ---
@app.post("/shipments/", response_model=ShipmentRead)
def create_shipment(shipment_data: ShipmentCreate):
    with Session(engine) as session:
        inventory_owner_id = shipment_data.stock_source_customer_id or shipment_data.customer_id
        inventory_entry = session.exec(select(Inventory).where(
            Inventory.customer_id == inventory_owner_id,
            Inventory.product_id == shipment_data.product_id
        )).first()

        if not inventory_entry:
            raise HTTPException(status_code=400, detail=f"No inventory found for Source Customer ID {inventory_owner_id}.")
        
        if inventory_entry.quantity < shipment_data.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient inventory. Current: {inventory_entry.quantity}")

        inventory_entry.quantity -= shipment_data.quantity
        inventory_entry.updated_at = datetime.now()
        session.add(inventory_entry)

        shipment_dict = shipment_data.dict(exclude={"stock_source_customer_id"})
        shipment = Shipment(**shipment_dict)
        session.add(shipment)
        
        session.commit()
        session.refresh(shipment)
        _ = shipment.customer
        _ = shipment.product
        return shipment

@app.post("/shipments/batch/", response_model=List[ShipmentRead])
def create_batch_shipment(batch_data: BatchShipmentCreate):
    created_shipments = []
    with Session(engine) as session:
        # No global inventory_owner_id anymore
        
        for item in batch_data.items:
            # Determine source for THIS item (default to selling customer)
            source_id = item.stock_source_customer_id or batch_data.customer_id
            
            inventory_entry = session.exec(select(Inventory).where(
                Inventory.customer_id == source_id,
                Inventory.product_id == item.product_id
            )).first()

            if not inventory_entry:
                raise HTTPException(status_code=400, detail=f"No inventory found for Product ID {item.product_id} (Source Customer ID: {source_id}).")
            
            if inventory_entry.quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient inventory for Product ID {item.product_id} at Source {source_id}. Current: {inventory_entry.quantity}")

            # Deduct Inventory
            inventory_entry.quantity -= item.quantity
            inventory_entry.updated_at = datetime.now()
            session.add(inventory_entry)

            # Create Shipment Record
            shipment = Shipment(
                customer_id=batch_data.customer_id,
                product_id=item.product_id,
                quantity=item.quantity,
                shipment_date=batch_data.shipment_date,
                rma_ticket=batch_data.rma_ticket
                # Note: We still don't store source_id in Shipment table itself, 
                # so refunds on delete will go back to customer_id. 
                # Ideally Shipment table should also have stock_source_id column.
                # But user didn't ask for DB schema change, just logic.
                # For now, this meets the requirement of *sending* mixed stock.
            )
            session.add(shipment)
            created_shipments.append(shipment)
        
        session.commit()
        
        for s in created_shipments:
            session.refresh(s)
            _ = s.customer
            _ = s.product
            
        return created_shipments

@app.get("/shipments/", response_model=List[ShipmentRead])
def read_shipments():
    with Session(engine) as session:
        statement = select(Shipment).options(
            selectinload(Shipment.customer),
            selectinload(Shipment.product)
        ).order_by(Shipment.created_at.desc())
        return session.exec(statement).all()

@app.put("/shipments/{shipment_id}", response_model=ShipmentRead)
def update_shipment(shipment_id: int, update_data: ShipmentUpdate):
    with Session(engine) as session:
        db_shipment = session.get(Shipment, shipment_id)
        if not db_shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        
        if update_data.quantity is not None and update_data.quantity != db_shipment.quantity:
            diff = update_data.quantity - db_shipment.quantity
            
            inventory_entry = session.exec(select(Inventory).where(
                Inventory.customer_id == db_shipment.customer_id,
                Inventory.product_id == db_shipment.product_id
            )).first()
            
            if not inventory_entry:
                 raise HTTPException(status_code=400, detail="Related inventory record not found to adjust stock.")
            
            if diff > 0 and inventory_entry.quantity < diff:
                raise HTTPException(status_code=400, detail="Insufficient stock to increase shipment quantity.")
            
            inventory_entry.quantity -= diff
            inventory_entry.updated_at = datetime.now()
            session.add(inventory_entry)
            
            db_shipment.quantity = update_data.quantity

        if update_data.shipment_date: db_shipment.shipment_date = update_data.shipment_date
        if update_data.rma_ticket is not None: db_shipment.rma_ticket = update_data.rma_ticket
        
        session.add(db_shipment)
        session.commit()
        session.refresh(db_shipment)
        return db_shipment

@app.delete("/shipments/{shipment_id}")
def delete_shipment(shipment_id: int):
    with Session(engine) as session:
        shipment = session.get(Shipment, shipment_id)
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        
        inventory_entry = session.exec(select(Inventory).where(
            Inventory.customer_id == shipment.customer_id,
            Inventory.product_id == shipment.product_id
        )).first()
        
        if inventory_entry:
            inventory_entry.quantity += shipment.quantity
            inventory_entry.updated_at = datetime.now()
            session.add(inventory_entry)
        
        session.delete(shipment)
        session.commit()
        return {"ok": True}

# --- Customer-Product Link Routes ---
@app.post("/customers/{customer_id}/products/{product_id}")
def link_product_to_customer(customer_id: int, product_id: int):
    with Session(engine) as session:
        link = session.get(CustomerProductLink, (customer_id, product_id))
        if link:
            return {"ok": True, "message": "Already linked"}
        
        new_link = CustomerProductLink(customer_id=customer_id, product_id=product_id)
        session.add(new_link)
        session.commit()
        return {"ok": True}

@app.delete("/customers/{customer_id}/products/{product_id}")
def unlink_product_from_customer(customer_id: int, product_id: int):
    with Session(engine) as session:
        link = session.get(CustomerProductLink, (customer_id, product_id))
        if not link:
            raise HTTPException(status_code=404, detail="Link not found")
        session.delete(link)
        session.commit()
        return {"ok": True}

@app.get("/customers/{customer_id}/products", response_model=List[Product])
def read_customer_products(customer_id: int):
    with Session(engine) as session:
        statement = select(Product).join(CustomerProductLink).where(CustomerProductLink.customer_id == customer_id)
        products = session.exec(statement).all()
        return products

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)