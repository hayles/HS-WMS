# HS-WMS API Documentation

The backend is built with FastAPI and runs by default at `http://localhost:8000`. 
Interactive documentation (Swagger UI) is available at `/docs`.

## 👥 Customers
Manage warehouse owners/selling customers.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/customers/` | List all customers with their authorized products. |
| `POST` | `/customers/` | Create a new customer. |
| `PUT` | `/customers/{id}` | Update customer info. |
| `DELETE` | `/customers/{id}` | Remove a customer. |

## 🏷️ Products (SKUs)
Manage the global product catalog.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/products/` | List all available SKUs. |
| `POST` | `/products/` | Create a new SKU definition. |
| `PUT` | `/products/{id}` | Update SKU code or name. |
| `DELETE` | `/products/{id}` | Remove a product from catalog. |

## 🔗 Customer-Product Linking
Control which customers are allowed to stock specific SKUs.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/customers/{c_id}/products/{p_id}` | Link a SKU to a customer. |
| `DELETE` | `/customers/{c_id}/products/{p_id}` | Unlink a SKU. |
| `GET` | `/customers/{c_id}/products` | List SKUs authorized for this customer. |

## 📊 Inventory
Real-time stock levels and alerts.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/inventory/` | List all inventory records. |
| `POST` | `/inventory/` | **Stock In**: Add quantity to stock (auto-creates log). |
| `PUT` | `/inventory/{id}` | **Set Qty**: Manually override stock level (auto-creates adjustment log). |
| `DELETE` | `/inventory/{id}` | Delete an inventory line. |

## 📤 Shipments (Outbound)
Handling stock deduction and order tracking.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/shipments/batch/` | **Batch Ship**: Send multiple SKUs in one order. Supports mixed stock sources per line. |
| `GET` | `/shipments/` | View shipment history. |
| `PUT` | `/shipments/{id}` | Edit shipment (adjusts inventory delta automatically). |
| `DELETE` | `/shipments/{id}` | Delete shipment (rolls back stock to inventory). |

## 📥 Logs & Audit
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/inbound-history/` | View all stock movements (Inbound, Manual Adjustments). |

## 🛠️ Data Schemas

### Batch Shipment Item
```json
{
  "product_id": 1,
  "quantity": 10,
  "stock_source_customer_id": 2 
}
```
*(If `stock_source_customer_id` is null, it defaults to the selling customer).*
